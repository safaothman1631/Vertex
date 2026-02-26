import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'
import type { CartItem, ShippingAddress } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(request: Request) {
  try {
    const { items, shippingAddress }: { items: CartItem[]; shippingAddress: ShippingAddress } =
      await request.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('[checkout] auth error:', authError.message)
      return NextResponse.json({ error: 'Auth error: ' + authError.message }, { status: 401 })
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized – please log in first' }, { status: 401 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const lineItems = items.map(({ product, quantity }) => {
      // Build absolute image URL — product may have `img` (string) or `images` (array)
      const imgPath = (product as unknown as { img?: string }).img ?? product.images?.[0]
      const absoluteImages: string[] = imgPath
        ? [imgPath.startsWith('http') ? imgPath : `${appUrl}${imgPath}`]
        : []

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            ...(absoluteImages.length > 0 ? { images: absoluteImages } : {}),
            description: product.brand ?? undefined,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity,
      }
    })

    const total = items.reduce((acc, { product, quantity }) => acc + product.price * quantity, 0)

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

    if (orderError) {
      console.error('[checkout] order insert error:', orderError.message, orderError.details)
      return NextResponse.json({ error: 'DB error: ' + orderError.message }, { status: 500 })
    }
    if (!order) throw new Error('Failed to create order – no data returned')

    // Insert order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        quantity,
        price: product.price,
      }))
    )
    if (itemsError) {
      console.error('[checkout] order_items insert error:', itemsError.message)
      // Don't block checkout for this – Stripe is more important
    }

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
      throw new Error('Stripe: ' + msg)
    }

    // Update order with stripe session id
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    )
  }
}
