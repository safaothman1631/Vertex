import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

// Tables in FK-safe insert order (parents first)
const TABLE_ORDER = [
  'brands', 'categories', 'profiles', 'products', 'coupons',
  'orders', 'order_items', 'cart_items', 'wishlist', 'reviews',
  'notifications', 'contact_messages', 'user_addresses', 'inventory_log',
  'trash', 'promotions', 'system_logs',
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { version?: string; tables?: Record<string, unknown[]> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.version || !body.tables || typeof body.tables !== 'object') {
    return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 })
  }

  const admin = createAdminClient()
  const results: { table: string; inserted: number; error?: string }[] = []

  for (const table of TABLE_ORDER) {
    const rows = body.tables[table]
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      results.push({ table, inserted: 0 })
      continue
    }

    const { error } = await admin.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
    if (error) {
      results.push({ table, inserted: 0, error: error.message })
    } else {
      results.push({ table, inserted: rows.length })
    }
  }

  // Log the restore event
  await admin.from('system_logs').insert({
    level: 'info',
    source: 'manual',
    message: 'Database restored from backup',
    details: {
      admin_id: user.id,
      results,
    },
  })

  return NextResponse.json({
    message: 'Restore complete',
    results,
  })
}
