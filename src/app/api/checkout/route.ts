import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'
import type { ShippingAddress } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

function isValidShippingAddress(a: unknown): a is ShippingAddress {
  if (!a || typeof a !== 'object') return false
  const o = a as Record<string, unknown>
  return typeof o.name === 'string' && o.name.length > 0 && o.name.length <= 200
    && typeof o.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)
    && typeof o.address === 'string' && o.address.length > 0
    && typeof o.city === 'string' && o.city.length > 0
    && typeof o.country === 'string' && o.country.length > 0
    && typeof o.zip === 'string'
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Coupon validation mode
    if (body.validateCoupon) {
      const code = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : ''
      const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0
      if (!code) return NextResponse.json({ error: 'Enter a coupon code' }, { status: 400 })

      const supabase = await createClient()
      const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code).eq('active', true).single()
      if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return NextResponse.json({ error: 'Coupon fully used' }, { status: 400 })
      if (coupon.min_order > 0 && subtotal < coupon.min_order) return NextResponse.json({ error: `Minimum order $${coupon.min_order.toFixed(2)}` }, { status: 400 })

      return NextResponse.json({ code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value })
    }

    const items: { productId: string; quantity: number }[] = body.items
    const shippingAddress: unknown = body.shippingAddress
    const couponCode: string | undefined = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : undefined

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!isValidShippingAddress(shippingAddress)) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Please log in to continue' }, { status: 401 })
    }

    // Fetch prices from DB — never trust client prices
    const productIds = items.map(i => i.productId)
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .select('id, name, brand, price, images, in_stock')
      .in('id', productIds)

    if (prodErr || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ error: 'Failed to load products' }, { status: 400 })
    }

    const productMap = new Map(dbProducts.map(p => [p.id, p]))

    // Validate all products exist and are in stock
    for (const { productId, quantity } of items) {
      const p = productMap.get(productId)
      if (!p) return NextResponse.json({ error: `Product not found` }, { status: 400 })
      if (!p.in_stock) return NextResponse.json({ error: `${p.name} is out of stock` }, { status: 400 })
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const lineItems = items.map(({ productId, quantity }) => {
      const p = productMap.get(productId)!
      const imgPath = p.images?.[0]
      const absoluteImages: string[] = imgPath
        ? [imgPath.startsWith('http') ? imgPath : `${appUrl}${imgPath}`]
        : []

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: p.name,
            ...(absoluteImages.length > 0 ? { images: absoluteImages } : {}),
            description: p.brand ?? undefined,
          },
          unit_amount: Math.round(p.price * 100),
        },
        quantity,
      }
    })

    const total = items.reduce((acc, { productId, quantity }) => {
      const p = productMap.get(productId)!
      return acc + p.price * quantity
    }, 0)

    // Apply coupon discount if provided
    let discount = 0
    let appliedCouponId: string | null = null
    if (couponCode) {
      const { data: coupon } = await supabase.from('coupons').select('*').eq('code', couponCode).eq('active', true).single()
      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) >= new Date()
        const notMaxed = !coupon.max_uses || coupon.used_count < coupon.max_uses
        const meetsMin = !coupon.min_order || total >= coupon.min_order
        if (notExpired && notMaxed && meetsMin) {
          discount = coupon.discount_type === 'percent'
            ? total * coupon.discount_value / 100
            : coupon.discount_value
          discount = Math.min(discount, total)
          appliedCouponId = coupon.id
        }
      }
    }
    const finalTotal = Math.max(0, total - discount)

    // Create order in DB first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total: finalTotal,
        status: 'pending',
        shipping_address: shippingAddress,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[checkout] order insert error:', orderError?.message)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items with DB prices
    await supabase.from('order_items').insert(
      items.map(({ productId, quantity }) => ({
        order_id: order.id,
        product_id: productId,
        quantity,
        price: productMap.get(productId)!.price,
      }))
    )

    // Increment coupon used_count
    if (appliedCouponId) {
      await supabase.rpc('increment_coupon_used', { coupon_id: appliedCouponId }).catch(() => {
        // Fallback: direct update
        supabase.from('coupons').update({ used_count: discount > 0 ? 1 : 0 }).eq('id', appliedCouponId)
      })
    }

    let session: import('stripe').Stripe.Checkout.Session
    try {
      // Create Stripe coupon if discount applied
      let discounts: { coupon: string }[] = []
      if (discount > 0 && couponCode) {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(discount * 100),
          currency: 'usd',
          name: `Coupon ${couponCode}`,
          max_redemptions: 1,
        })
        discounts = [{ coupon: stripeCoupon.id }]
      }

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        ...(discounts.length > 0 ? { discounts } : {}),
        mode: 'payment',
        customer_email: shippingAddress.email,
        success_url: `${appUrl}/checkout/success?order_id=${order.id}`,
        cancel_url: `${appUrl}/cart`,
        metadata: { order_id: order.id },
      })
    } catch (stripeErr: unknown) {
      const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
      console.error('[checkout] Stripe error:', msg)
      return NextResponse.json({ error: 'Payment service unavailable' }, { status: 500 })
    }

    // Update order with stripe session id
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
