import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

const TABLES = [
  'brands', 'categories', 'profiles', 'products', 'coupons',
  'orders', 'order_items', 'cart_items', 'wishlist', 'reviews',
  'notifications', 'contact_messages', 'user_addresses', 'inventory_log',
  'trash', 'promotions', 'system_logs',
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  const backup: Record<string, unknown[]> = {}
  const errors: string[] = []

  const results = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await admin.from(table).select('*')
      return { table, data, error }
    })
  )

  for (const { table, data, error } of results) {
    if (error) {
      errors.push(`${table}: ${error.message}`)
    } else {
      backup[table] = data ?? []
    }
  }

  // Log the backup event
  await admin.from('system_logs').insert({
    level: 'info',
    source: 'manual',
    message: 'Database backup downloaded',
    details: {
      admin_id: user.id,
      tables: Object.keys(backup).length,
      total_rows: Object.values(backup).reduce((sum, rows) => sum + rows.length, 0),
      errors,
    },
  })

  const payload = {
    version: '1.0',
    created_at: new Date().toISOString(),
    created_by: user.id,
    tables: backup,
    errors: errors.length > 0 ? errors : undefined,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="vertex-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
