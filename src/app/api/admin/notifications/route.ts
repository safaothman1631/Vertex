import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

// 5 broadcast notifications per hour
const broadcastLimiter = createRateLimiter({ window: 60 * 60_000, max: 5 })

export async function POST(request: NextRequest) {
  // Rate limit broadcasts
  const ip = getClientIP(request)
  if (!broadcastLimiter.check(ip)) {
    return NextResponse.json(
      { error: 'Too many broadcast notifications. Wait before sending more.' },
      { status: 429 },
    )
  }

  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, message, type, target } = body

  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
  }

  const validTypes = ['info', 'promo', 'system']
  const nType = validTypes.includes(type) ? type : 'info'

  const admin = createAdminClient()

  // Get target users
  let query = admin.from('profiles').select('id')
  if (target === 'admins') {
    query = query.eq('role', 'admin')
  } else if (target === 'users') {
    query = query.eq('role', 'user')
  }
  // else 'all' — no filter

  const { data: users, error: usersErr } = await query
  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No users found for target' }, { status: 404 })
  }

  // Bulk insert notifications
  const rows = users.map(u => ({
    user_id: u.id,
    title: title.trim().slice(0, 200),
    body: message.trim().slice(0, 2000),
    type: nType,
    is_read: false,
  }))

  const { error: insertErr } = await admin.from('notifications').insert(rows)
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  // Log to system_logs
  await admin.from('system_logs').insert({
    level: 'info',
    source: 'manual',
    message: `Broadcast notification sent: "${title.trim()}"`,
    details: { type: nType, target, recipientCount: users.length, sentBy: user.id },
  })

  return NextResponse.json({ success: true, sent: users.length })
}
