import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-server'
import { sendBackInStockEmail } from '@/lib/email'

/**
 * POST /api/stock-alert
 * Called when a product goes from out-of-stock → in-stock.
 * Notifies all subscribed users (in-app + email + SMS).
 *
 * Body: { productId }
 * Auth: admin session
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { productId } = await request.json()
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  const admin = createAdminClient()

  // Get product info
  const { data: product } = await admin.from('products').select('id, name').eq('id', productId).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Get all unnotified subscribers
  const { data: subs } = await admin
    .from('stock_subscribers')
    .select('id, user_id, profiles(email, phone, notify_email, notify_stock, notify_sms)')
    .eq('product_id', productId)
    .eq('notified', false)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 })
  }

  let count = 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  for (const sub of subs) {
    const profile = sub.profiles as unknown as {
      email: string; phone: string | null
      notify_email: boolean; notify_stock: boolean; notify_sms: boolean
    } | null
    if (!profile) continue

    // In-app notification
    await admin.from('notifications').insert({
      user_id: sub.user_id,
      title: `${product.name} is back in stock!`,
      body: 'An item you were watching is available again.',
      type: 'info',
    })

    // Email
    if (profile.notify_email && profile.notify_stock && profile.email) {
      await sendBackInStockEmail(profile.email, product.name, product.id)
    }

    // SMS
    if (profile.notify_sms && profile.phone) {
      fetch(`${appUrl}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-notify-secret': process.env.CRON_SECRET || '__dev__' },
        body: JSON.stringify({
          to: profile.phone,
          message: `Vertex: ${product.name} is back in stock! Shop now: ${appUrl}/products/${product.id}`,
        }),
      }).catch(() => {})
    }

    // Mark as notified
    await admin.from('stock_subscribers').update({ notified: true }).eq('id', sub.id)
    count++
  }

  return NextResponse.json({ ok: true, notified: count })
}

/**
 * POST /api/stock-alert/subscribe
 * User subscribes to be notified when a product returns to stock.
 */
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })

  const { productId } = await request.json()
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 })

  const { error } = await supabase.from('stock_subscribers').upsert(
    { user_id: user.id, product_id: productId, notified: false },
    { onConflict: 'user_id,product_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
