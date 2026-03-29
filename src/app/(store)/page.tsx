import { createClient } from '@/lib/supabase-server'
import HomeClient from '@/components/shop/HomeClient'
import type { Product } from '@/types'

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+'
  return n > 0 ? n + '+' : '0'
}

export default async function Home() {
  const supabase = await createClient()

  const [{ data: products }, { count: customerCount }, { count: orderCount }, { data: brandsData }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('brand'),
  ])

  const visible = ((products as Product[]) ?? []).filter(p => !p.hidden)
  const visibleCount = visible.length
  const distinctBrands = new Set((brandsData ?? []).map((r: { brand: string }) => r.brand).filter(Boolean)).size

  const statsData = {
    customers: fmtCount(customerCount ?? 0),
    products: fmtCount(visibleCount),
    brands: fmtCount(distinctBrands),
    orders: fmtCount(orderCount ?? 0),
    support: '24/7',
  }

  return <HomeClient products={visible} statsData={statsData} />
}
