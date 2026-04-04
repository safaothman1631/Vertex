import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/shop/ProductDetailClient'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('name, brand, description, images, price').eq('id', id).single()
  if (!product) return { title: 'Product Not Found' }

  const title = `${product.brand} ${product.name}`
  const description = product.description?.slice(0, 160) || `Shop ${title} at Vertex — professional POS equipment.`
  const image = product.images?.[0]

  return {
    title,
    description,
    alternates: { canonical: `/products/${id}` },
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image, width: 800, height: 800, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: reviews }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('reviews').select('*, user:profiles(full_name)').eq('product_id', id).order('created_at', { ascending: false }),
  ])

  if (!product) notFound()

  // Fetch related products (same category, exclude current, limit 4)
  const { data: relatedRaw } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .neq('id', product.id)
    .limit(8)

  const related = (relatedRaw ?? []).filter((p: { hidden?: boolean }) => !p.hidden).slice(0, 4)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vertex-pos.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    description: product.description || undefined,
    image: product.images?.[0] || undefined,
    brand: { '@type': 'Brand', name: product.brand },
    sku: product.model || product.id,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${id}`,
      priceCurrency: 'USD',
      price: product.price,
      availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.rating > 0 && product.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.review_count,
      },
    } : {}),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${siteUrl}/products` },
      { '@type': 'ListItem', position: 3, name: `${product.brand} ${product.name}`, item: `${siteUrl}/products/${id}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductDetailClient product={product} relatedProducts={related} reviews={reviews ?? []} />
    </>
  )
}

