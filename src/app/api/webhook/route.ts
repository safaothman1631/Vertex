import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'
import { sendOrderConfirmation } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id

    if (orderId) {
      const supabase = createAdminClient()
      // Idempotency: only update if still pending
      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', orderId)
        .eq('status', 'pending')
        .select('id, user_id, total')
        .single()

      if (updatedOrder) {
        // Fetch order items with product names
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('quantity, price, product_id, products(name)')
          .eq('order_id', orderId)

        const items = (orderItems ?? []).map((oi: any) => ({
          name: Array.isArray(oi.products) ? oi.products[0]?.name ?? 'Product' : oi.products?.name ?? 'Product',
          quantity: oi.quantity,
          price: oi.price,
        }))

        // Fetch user profile for prefs + email
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, phone, notify_email, notify_order, notify_sms')
          .eq('id', updatedOrder.user_id)
          .single()

        // In-app notification
        await supabase.from('notifications').insert({
          user_id: updatedOrder.user_id,
          title: `Order #${orderId.slice(0, 8).toUpperCase()} Confirmed`,
          body: `Your payment was received. We're processing your order ($${updatedOrder.total}).`,
          type: 'order',
        })

        // Email notification (if enabled)
        if (profile?.notify_email && profile?.notify_order && profile?.email) {
          await sendOrderConfirmation(
            profile.email,
            orderId,
            items,
            updatedOrder.total,
          )
        }

        // SMS notification (if enabled + has phone)
        if (profile?.notify_sms && profile?.phone) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
          fetch(`${appUrl}/api/sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-notify-secret': process.env.CRON_SECRET || '__dev__',
            },
            body: JSON.stringify({
              to: profile.phone,
              message: `Vertex: Order #${orderId.slice(0, 8).toUpperCase()} confirmed! Total: $${updatedOrder.total}. Track at ${appUrl}/orders`,
            }),
          }).catch(() => {})
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
