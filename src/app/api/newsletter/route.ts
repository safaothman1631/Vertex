import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'

const limiter = createRateLimiter({ window: 60_000, max: 10 })

export async function POST(request: Request) {
  const ip = getClientIP(request)
  if (!limiter.check(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name  = typeof body.name  === 'string' ? body.name.trim().slice(0, 100)  : null

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRe.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('newsletter_subscribers').upsert({
      email,
      name: name || null,
      user_id: user?.id ?? null,
      subscribed: true,
    }, {
      onConflict: 'email',
      ignoreDuplicates: false,
    })

    if (error) {
      // If already subscribed, still return success
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already subscribed!' })
      }
      return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
