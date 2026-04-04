import { createClient, createAdminClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

// 3 account deletions per hour per IP
const accountLimiter = createRateLimiter({ window: 60 * 60_000, max: 3 })

export async function DELETE(request: NextRequest) {
  const ip = getClientIP(request)
  if (!accountLimiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Require password confirmation to prevent CSRF / accidental deletion ──
  let password: string
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  if (!password || password.length < 1) {
    return NextResponse.json({ error: 'Password required to delete account' }, { status: 400 })
  }

  // Verify password is correct by attempting sign-in
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password,
  })
  if (authError) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Delete user via admin API (cascades to profiles, addresses, etc. via FK)
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
