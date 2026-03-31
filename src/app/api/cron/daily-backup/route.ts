import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { safeCompare } from '@/lib/safe-compare'

const TABLES = [
  'brands', 'categories', 'profiles', 'products', 'coupons',
  'orders', 'order_items', 'cart_items', 'wishlist', 'reviews',
  'notifications', 'contact_messages', 'user_addresses', 'inventory_log',
  'trash', 'promotions', 'system_logs',
]

const BUCKET = 'backups'
const KEEP_DAYS = 30

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!safeCompare(token, process.env.CRON_SECRET ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10) // YYYY-MM-DD

  // 1. Export all tables
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

  const totalRows = Object.values(backup).reduce((sum, rows) => sum + rows.length, 0)

  const payload = JSON.stringify({
    version: '1.0',
    created_at: now.toISOString(),
    source: 'cron',
    tables: backup,
    errors: errors.length > 0 ? errors : undefined,
  })

  // 2. Upload to Supabase Storage
  const fileName = `daily/${dateStr}.json`
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(fileName, payload, {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) {
    await admin.from('system_logs').insert({
      level: 'error',
      source: 'cron',
      message: 'Daily backup failed - storage upload error',
      details: { error: uploadError.message, date: dateStr },
    })
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // 3. Delete backups older than KEEP_DAYS
  const cutoff = new Date(now.getTime() - KEEP_DAYS * 24 * 60 * 60 * 1000)
  const { data: files } = await admin.storage.from(BUCKET).list('daily')
  if (files) {
    const oldFiles = files
      .filter((f) => {
        const fileDate = f.name.replace('.json', '')
        return new Date(fileDate) < cutoff
      })
      .map((f) => `daily/${f.name}`)

    if (oldFiles.length > 0) {
      await admin.storage.from(BUCKET).remove(oldFiles)
    }
  }

  // 4. Log success
  await admin.from('system_logs').insert({
    level: 'info',
    source: 'cron',
    message: `Daily backup saved: ${fileName}`,
    details: {
      date: dateStr,
      tables: Object.keys(backup).length,
      total_rows: totalRows,
      errors,
    },
  })

  return NextResponse.json({
    ok: true,
    file: fileName,
    tables: Object.keys(backup).length,
    total_rows: totalRows,
    errors: errors.length > 0 ? errors : undefined,
  })
}
