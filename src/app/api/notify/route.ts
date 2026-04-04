import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase-server'
import { sendOrderConfirmation, sendOrderStatusEmail, sendPromoEmail, sendBackInStockEmail, sendWishlistAlertEmail } from '@/lib/email'

/**
 * POST /api/notify
 * Central notification dispatcher — creates in-app notification + sends email/SMS
 * based on user preferences.
 *
 * Body: { userId, type, title, body, meta? }
 * type: 'order_confirmed' | 'order_status' | 'promo' | 'stock' | 'wishlist' | 'info' | 'system'
 *
 * Auth: either x-notify-secret header (server-to-server) OR admin session cookie
 */
export async function POST(request: Request) {
  const secret = request.headers.get('x-notify-secret')
  const isServerCall = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET.trim()

  // If not server-to-server, verify the caller is an admin
  if (!isServerCall) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, type, title, body: msgBody, meta } = await request.json()
  if (!userId || !type || !title) {
    return NextResponse.json({ error: 'Missing userId, type, or title' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch user profile (email, phone, notification prefs)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone, notify_email, notify_order, notify_promo, notify_wishlist, notify_stock, notify_sms, newsletter')
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const results: { inApp: boolean; email: boolean; sms: boolean } = {
    inApp: false,
    email: false,
    sms: false,
  }

  // ── 1. Always create in-app notification ──────────────
  const notifType = ['order_confirmed', 'order_status'].includes(type) ? 'order'
    : type === 'promo' ? 'promo'
    : type === 'system' ? 'system'
    : 'info'

  const { error: notifErr } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body: msgBody ?? '',
    type: notifType,
  })
  results.inApp = !notifErr

  // ── 2. Email (if user enabled the relevant pref) ──────
  const shouldEmail = (() => {
    if (!profile.notify_email) return false
    switch (type) {
      case 'order_confirmed':
      case 'order_status':
        return profile.notify_order
      case 'promo':
        return profile.notify_promo
      case 'stock':
        return profile.notify_stock
      case 'wishlist':
        return profile.notify_wishlist
      default:
        return true // info / system always email if notify_email is on
    }
  })()

  if (shouldEmail && profile.email) {
    try {
      switch (type) {
        case 'order_confirmed':
          await sendOrderConfirmation(
            profile.email,
            meta?.orderId ?? '',
            meta?.items ?? [],
            meta?.total ?? 0,
          )
          results.email = true
          break
        case 'order_status':
          await sendOrderStatusEmail(
            profile.email,
            meta?.orderId ?? '',
            meta?.status ?? '',
          )
          results.email = true
          break
        case 'promo':
          await sendPromoEmail(profile.email, title, msgBody ?? '')
          results.email = true
          break
        case 'stock':
          await sendBackInStockEmail(
            profile.email,
            meta?.productName ?? '',
            meta?.productId ?? '',
          )
          results.email = true
          break
        case 'wishlist':
          await sendWishlistAlertEmail(
            profile.email,
            meta?.productName ?? '',
            meta?.productId ?? '',
            meta?.oldPrice ?? 0,
            meta?.newPrice ?? 0,
          )
          results.email = true
          break
        default:
          // Generic email for info/system
          await sendPromoEmail(profile.email, title, msgBody ?? '')
          results.email = true
      }
    } catch (err) {
      console.error('[notify] email error:', err)
    }
  }

  // ── 3. SMS (if user enabled + has phone number) ───────
  if (profile.notify_sms && profile.phone) {
    try {
      const smsText = `Vertex: ${title}${msgBody ? ' — ' + msgBody.slice(0, 120) : ''}`
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const smsRes = await fetch(`${appUrl}/api/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-notify-secret': process.env.CRON_SECRET?.trim() || '',
        },
        body: JSON.stringify({ to: profile.phone, message: smsText }),
      })
      results.sms = smsRes.ok
    } catch (err) {
      console.error('[notify] sms error:', err)
    }
  }

  return NextResponse.json({ ok: true, results })
}
