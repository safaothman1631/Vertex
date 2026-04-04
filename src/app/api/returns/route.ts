import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const limiter = createRateLimiter({ window: 60_000, max: 10 })

const RETURN_REASONS_ALLOWED = [
  'Defective / Not Working',
  'Wrong Item Received',
  'Item Not as Described',
  'Changed My Mind',
  'Better Price Found',
  'Arrived Too Late',
  'Damaged Packaging',
  'Missing Parts / Accessories',
  'Other',
]

// GET /api/returns  — list user's own return requests
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { data, error } = await supabase
    .from('return_requests')
    .select('*, order:orders(id, total, status, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load returns' }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/returns  — submit a return request
export async function POST(request: Request) {
  const ip = getClientIP(request)
  if (!limiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

    const body = await request.json()
    const orderId     = typeof body.order_id    === 'string' ? body.order_id    : null
    const reason      = typeof body.reason      === 'string' ? body.reason.trim()  : ''
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 1000) : ''
    const images: string[] = Array.isArray(body.images)
      ? body.images.filter((u: unknown) => typeof u === 'string').slice(0, 5)
      : []

    if (!orderId)  return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    if (!RETURN_REASONS_ALLOWED.includes(reason)) return NextResponse.json({ error: 'Invalid reason' }, { status: 400 })

    // Verify the order belongs to this user and is delivered
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, stripe_session_id, total, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status !== 'delivered') return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 })

    // Check no existing pending/approved return for this order
    const { data: existing } = await supabase
      .from('return_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Return request already exists for this order' }, { status: 409 })

    const { data, error } = await supabase.from('return_requests').insert({
      order_id: orderId,
      user_id: user.id,
      reason,
      description,
      images,
      status: 'pending',
    }).select().single()

    if (error) return NextResponse.json({ error: 'Failed to submit return' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/returns  — admin: approve/reject + optionally issue Stripe refund
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const returnId    = typeof body.id          === 'string' ? body.id          : null
    const status      = typeof body.status      === 'string' ? body.status      : null
    const adminNote   = typeof body.admin_note  === 'string' ? body.admin_note.trim().slice(0, 500) : null
    const refundAmount = typeof body.refund_amount === 'number' ? body.refund_amount : null

    if (!returnId || !['approved', 'rejected', 'refunded'].includes(status ?? '')) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // If refunding, issue Stripe refund
    if (status === 'refunded' && refundAmount && refundAmount > 0) {
      const { data: ret } = await supabase
        .from('return_requests')
        .select('order:orders(stripe_session_id, total)')
        .eq('id', returnId)
        .single()

      const order = (ret as Record<string, unknown>)?.order as { stripe_session_id: string | null; total: number } | null

      if (order?.stripe_session_id) {
        // Get the payment intent from the checkout session
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        if (session.payment_intent) {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            amount: Math.round(refundAmount * 100),
          })
        }
      }
    }

    const { data, error } = await supabase
      .from('return_requests')
      .update({ status, admin_note: adminNote, refund_amount: refundAmount })
      .eq('id', returnId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
