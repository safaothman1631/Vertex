import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// PATCH /api/admin/tracking  — admin: update order tracking info
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const orderId        = typeof body.order_id         === 'string' ? body.order_id         : null
    const trackingNumber = typeof body.tracking_number  === 'string' ? body.tracking_number.trim()  : null
    const carrier        = typeof body.carrier          === 'string' ? body.carrier.trim()           : null
    const status         = typeof body.status           === 'string' ? body.status                   : null

    if (!orderId) return NextResponse.json({ error: 'order_id is required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (trackingNumber !== null) updates.tracking_number = trackingNumber || null
    if (carrier !== null) updates.carrier = carrier || null
    if (status && ['pending','processing','shipped','delivered','cancelled'].includes(status)) {
      updates.status = status
      // Auto-add tracking if status → shipped
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
