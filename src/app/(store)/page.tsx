import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import HomeClient from '@/components/shop/HomeClient'
import type { Product } from '@/types'

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

  const [{ data: products }, { count: customerCount }, { count: orderCount }, { data: brands }, { data: reviewsRaw }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*').order('name', { ascending: true }),
    supabase.from('reviews').select('id, rating, comment, created_at, profiles!reviews_user_id_fkey(full_name), products!reviews_product_id_fkey(name, brand)').neq('comment', '').order('created_at', { ascending: false }).limit(24),
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
      <HomeClient products={visible} statsData={statsData} dbBrands={dbBrands} reviews={reviews} />
    </>
  )
}
