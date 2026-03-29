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
    const items: { productId: string; quantity: number }[] = body.items
    const shippingAddress: unknown = body.shippingAddress

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

    // Create order in DB first
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total,
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

    let session: import('stripe').Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
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
