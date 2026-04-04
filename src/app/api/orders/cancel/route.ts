import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

// 10 cancellations per 15 minutes per IP
const cancelLimiter = createRateLimiter({ window: 15 * 60_000, max: 10 })

export async function POST(request: Request) {
  const ip = getClientIP(request)
  if (!cancelLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await request.json()
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  // Verify order belongs to user and is pending
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (order.status !== 'pending') return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 })

  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (updateErr) return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })

  return NextResponse.json({ success: true })
}
