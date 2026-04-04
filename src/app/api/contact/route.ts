import { NextResponse } from 'next/server'
import { createRateLimiter, getClientIP } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase-server'

// 5 contact messages per 15 minutes per IP
const contactLimiter = createRateLimiter({ window: 15 * 60_000, max: 5 })

function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()
}

export async function POST(request: Request) {
  const ip = getClientIP(request)
  if (!contactLimiter.check(ip)) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait a few minutes.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, email, subject, message, hp } = body as Record<string, unknown>

  // Honeypot check
  if (hp) {
    return NextResponse.json({ ok: true }) // Silently succeed for bots
  }

  // Validate types
  if (
    typeof name !== 'string' || typeof email !== 'string' ||
    typeof subject !== 'string' || typeof message !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Validate lengths
  if (name.length > 200 || subject.length > 300 || message.length > 5000) {
    return NextResponse.json({ error: 'Please shorten your input' }, { status: 400 })
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Validate required fields
  if (!name.trim() || !subject.trim() || !message.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const sanitized = {
    name: sanitize(name),
    email: email.trim().toLowerCase(),
    subject: sanitize(subject),
    message: sanitize(message),
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert(sanitized)

  if (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
