import { createClient } from '@/lib/supabase-server'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const analyticsFrom = new Date()
  analyticsFrom.setDate(analyticsFrom.getDate() - 90)
  const analyticsFromStr = analyticsFrom.toISOString()

  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { count: msgCount },
    { count: outOfStockCount },
    { data: recentOrders },
    { data: allOrders },
    { data: outOfStockProducts },
    { data: recentMessages },
    { count: brandCount },
    { count: categoryCount },
    { data: ordersWithItems },
    { count: reviewCount },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('in_stock', false),
    supabase.from('orders').select('id, total, status, created_at, user:profiles(full_name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('orders').select('total, status, created_at').gte('created_at', analyticsFromStr),
    supabase.from('products').select('id, name, brand, model').eq('in_stock', false).limit(6),
    supabase.from('contact_messages').select('id, name, subject, created_at').eq('is_read', false).order('created_at', { ascending: false }).limit(4),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total, status, created_at, items:order_items(quantity, price, product:products(name, brand))').gte('created_at', analyticsFromStr).order('created_at', { ascending: false }).limit(500),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ])

  const totalRevenue = (allOrders ?? []).reduce((s, o) => s + (o.total ?? 0), 0)
  const statusCounts: Record<string, number> = {}
  for (const o of allOrders ?? []) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1
  }
  const totalOrdersForBar = orderCount ?? 1

  // ── Analytics: Revenue by day (last 7 days)
  const now = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const revenueByDay: Record<string, number> = {}
  const ordersByDay: Record<string, number> = {}
  for (const day of last7) { revenueByDay[day] = 0; ordersByDay[day] = 0 }
  for (const o of allOrders ?? []) {
    const day = (o.created_at as string).slice(0, 10)
    if (revenueByDay[day] !== undefined) {
      revenueByDay[day] += o.total ?? 0
      ordersByDay[day] += 1
    }
  }
  const maxRevDay = Math.max(...Object.values(revenueByDay), 1)

  // ── Average order value
  const completedOrders = (allOrders ?? []).filter(o => o.status !== 'cancelled')
  const avgOrderValue = completedOrders.length > 0 ? completedOrders.reduce((s, o) => s + (o.total ?? 0), 0) / completedOrders.length : 0

  // ── Top products by quantity sold
  const productSales: Record<string, { name: string; brand: string; qty: number; revenue: number }> = {}
  for (const order of ordersWithItems ?? []) {
    if ((order as { status: string }).status === 'cancelled') continue
    for (const item of (order as { items: unknown[] }).items ?? []) {
      const it = item as { quantity: number; price: number; product: { name: string; brand: string } | { name: string; brand: string }[] | null }
      const prod = Array.isArray(it.product) ? it.product[0] : it.product
      if (!prod) continue
      const key = prod.name
      if (!productSales[key]) productSales[key] = { name: prod.name, brand: prod.brand, qty: 0, revenue: 0 }
      productSales[key].qty += it.quantity
      productSales[key].revenue += it.quantity * it.price
    }
  }
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5)

  return (
    <AdminDashboardClient
      productCount={productCount ?? 0}
      orderCount={orderCount ?? 0}
      userCount={userCount ?? 0}
      msgCount={msgCount ?? 0}
      outOfStockCount={outOfStockCount ?? 0}
      brandCount={brandCount ?? 0}
      categoryCount={categoryCount ?? 0}
      reviewCount={reviewCount ?? 0}
      totalRevenue={totalRevenue}
      avgOrderValue={avgOrderValue}
      statusCounts={statusCounts}
      recentOrders={(recentOrders ?? []).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        total: o.total as number,
        status: o.status as string,
        created_at: o.created_at as string,
        userName: (o.user as { full_name: string } | null)?.full_name ?? null,
      }))}
      outOfStockProducts={(outOfStockProducts ?? []) as { id: string; name: string; brand: string; model: string }[]}
      recentMessages={(recentMessages ?? []) as { id: string; name: string; subject: string; created_at: string }[]}
      revenueByDay={revenueByDay}
      ordersByDay={ordersByDay}
      last7={last7}
      maxRevDay={maxRevDay}
      topProducts={topProducts}
    />
  )
}

