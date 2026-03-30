import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import HomeClient from '@/components/shop/HomeClient'
import type { Product, Promotion } from '@/types'

export const metadata: Metadata = {
  title: 'Vertex — Professional POS Equipment',
  description: 'Discover barcode scanners, POS terminals, receipt printers, cash drawers, and premium POS equipment trusted by businesses worldwide.',
  alternates: { canonical: '/' },
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+'
  return n > 0 ? n + '+' : '0'
}

export default async function Home() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()

  const [
    { data: products },
    { count: customerCount },
    { count: orderCount },
    { data: brands },
    { data: reviewsRaw },
    { data: todayOrders },
    { data: yesterdayOrders },
    { count: totalReviewCount },
    { data: allReviewRatings },
    { data: terminalProducts },
    { data: activePromos },
  ] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*').order('name', { ascending: true }),
    supabase.from('reviews').select('id, rating, comment, created_at, profiles!reviews_user_id_fkey(full_name), products!reviews_product_id_fkey(name, brand)').neq('comment', '').order('created_at', { ascending: false }).limit(24),
    supabase.from('orders').select('total, status').gte('created_at', todayStart).neq('status', 'cancelled'),
    supabase.from('orders').select('total, status').gte('created_at', yesterdayStart).lt('created_at', todayStart).neq('status', 'cancelled'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('rating'),
    supabase.from('products').select('name, model, price, brand').eq('in_stock', true).eq('hidden', false).limit(3),
    supabase.from('promotions').select('*').eq('is_active', true).lte('starts_at', new Date().toISOString()).or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`).order('sort_order'),
  ])

  const visible = ((products as Product[]) ?? []).filter(p => !p.hidden)
  const visibleCount = visible.length

  const statsData = {
    customers: fmtCount(customerCount ?? 0),
    products: fmtCount(visibleCount),
    brands: fmtCount((brands ?? []).length),
    orders: fmtCount(orderCount ?? 0),
    support: '24/7',
  }

  // ── Hero dynamic data ──
  const todayRevenue = (todayOrders ?? []).reduce((s, o) => s + ((o as { total: number }).total ?? 0), 0)
  const yesterdayRevenue = (yesterdayOrders ?? []).reduce((s, o) => s + ((o as { total: number }).total ?? 0), 0)
  const revPctChange = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
    : todayRevenue > 0 ? 100 : 0

  const ratings = (allReviewRatings ?? []).map(r => (r as { rating: number }).rating)
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
    : '0'
  const reviewCountNum = totalReviewCount ?? 0

  const termItems = ((terminalProducts ?? []) as { name: string; model: string; price: number; brand: string }[]).map(p => ({
    name: `${p.brand} ${p.model ?? ''}`.trim() || p.name,
    sku: `#${(p.model ?? p.name.slice(0, 8)).replace(/\s+/g, '-').toUpperCase()}`,
    price: p.price,
  }))
  const termTotal = termItems.reduce((s, i) => s + i.price, 0)

  const heroData = {
    todayRevenue,
    revPctChange,
    avgRating,
    reviewCount: fmtCount(reviewCountNum),
    terminalItems: termItems,
    terminalTotal: termTotal,
  }

  const dbBrands = (brands ?? []).map((b: { name: string; logo: string | null; category_key: string | null; color1: string | null; color2: string | null }) => ({
    name: b.name,
    logo: b.logo ?? '',
    catKey: b.category_key ?? '',
    c1: b.color1 ?? '#6366f1',
    c2: b.color2 ?? '#4f46e5',
  }))

  type RawProfile = { full_name: string | null }
  type RawProduct = { name: string; brand: string }
  type RawReview = {
    id: string; rating: number; comment: string; created_at: string;
    profiles: RawProfile | RawProfile[] | null;
    products: RawProduct | RawProduct[] | null;
  }
  const reviews = ((reviewsRaw ?? []) as unknown as RawReview[])
    .map(r => {
      const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
      const prod = Array.isArray(r.products) ? r.products[0] : r.products
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer_name: prof?.full_name ?? 'Customer',
        avatar_url: null,
        product_name: prod?.name ?? '',
        product_brand: prod?.brand ?? '',
      }
    })
    .filter(r => r.comment.trim().length > 10)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Vertex',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com',
        description: 'Professional POS equipment supplier — barcode scanners, receipt printers, terminals, and accessories.',
      },
      {
        '@type': 'WebSite',
        name: 'Vertex',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com'}/products?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HomeClient products={visible} statsData={statsData} dbBrands={dbBrands} reviews={reviews} heroData={heroData} promotions={(activePromos as Promotion[]) ?? []} />
    </>
  )
}
