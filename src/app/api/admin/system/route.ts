import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()

  // Gather all metrics in parallel
  const [
    { count: userCount },
    { count: productCount },
    { count: orderCount },
    { count: brandCount },
    { count: categoryCount },
    { count: reviewCount },
    { count: couponCount },
    { count: notifCount },
    { count: trashCount },
    { count: contactCount },
    { count: promoCount },
    { data: recentErrors },
    { count: errorCount24h },
    { data: allLogs },
    { count: adminCount },
    { data: recentOrders },
    { data: outOfStock },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('products').select('*', { count: 'exact', head: true }),
    admin.from('orders').select('*', { count: 'exact', head: true }),
    admin.from('brands').select('*', { count: 'exact', head: true }),
    admin.from('categories').select('*', { count: 'exact', head: true }),
    admin.from('reviews').select('*', { count: 'exact', head: true }),
    admin.from('coupons').select('*', { count: 'exact', head: true }),
    admin.from('notifications').select('*', { count: 'exact', head: true }),
    admin.from('trash').select('*', { count: 'exact', head: true }),
    admin.from('contact_messages').select('*', { count: 'exact', head: true }),
    admin.from('promotions').select('*', { count: 'exact', head: true }),
    admin.from('system_logs').select('id, level, source, message, created_at').eq('level', 'error').order('created_at', { ascending: false }).limit(5),
    admin.from('system_logs').select('*', { count: 'exact', head: true }).eq('level', 'error').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    admin.from('system_logs').select('id, level, source, message, created_at').order('created_at', { ascending: false }).limit(50),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    admin.from('orders').select('id, created_at').order('created_at', { ascending: false }).limit(1),
    admin.from('products').select('*', { count: 'exact', head: true }).eq('in_stock', false),
  ])

  const tableCounts: Record<string, number> = {
    profiles: userCount ?? 0,
    products: productCount ?? 0,
    orders: orderCount ?? 0,
    brands: brandCount ?? 0,
    categories: categoryCount ?? 0,
    reviews: reviewCount ?? 0,
    coupons: couponCount ?? 0,
    notifications: notifCount ?? 0,
    trash: trashCount ?? 0,
    contact_messages: contactCount ?? 0,
    promotions: promoCount ?? 0,
  }

  const totalRows = Object.values(tableCounts).reduce((a, b) => a + b, 0)

  // Health scores (0-100)
  const errCount24 = errorCount24h ?? 0
  const dbHealth = errCount24 === 0 ? 100 : errCount24 < 3 ? 80 : errCount24 < 10 ? 50 : 20
  const securityHealth = (adminCount ?? 0) <= 3 ? 100 : (adminCount ?? 0) <= 5 ? 80 : 60
  const storageHealth = totalRows < 10000 ? 100 : totalRows < 50000 ? 80 : 60
  const performanceHealth = errCount24 === 0 ? 95 : 70
  const overallHealth = Math.round((dbHealth + securityHealth + storageHealth + performanceHealth) / 4)

  // Sanitize log messages — strip file paths and internal identifiers
  function sanitizeLog(log: { message?: string; [k: string]: unknown }) {
    return {
      ...log,
      message: (log.message ?? '').replace(/[A-Z]:\\[^\s,;)]+/gi, '[path]').replace(/\/[a-z0-9_./]+\.[a-z]{1,4}/gi, '[path]'),
    }
  }

  return NextResponse.json({
    tableCounts,
    totalRows,
    health: {
      database: dbHealth,
      security: securityHealth,
      storage: storageHealth,
      performance: performanceHealth,
      overall: overallHealth,
    },
    errors24h: errCount24,
    recentErrors: (recentErrors ?? []).map(sanitizeLog),
    logs: (allLogs ?? []).map(sanitizeLog),
    adminCount: adminCount ?? 0,
    outOfStockCount: outOfStock ?? 0,
    lastOrderAt: recentOrders?.[0]?.created_at ?? null,
  })
}
