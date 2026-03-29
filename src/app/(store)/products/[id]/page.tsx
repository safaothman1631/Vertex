import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/shop/ProductDetailClient'

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

  return <ProductDetailClient product={product} relatedProducts={related} reviews={reviews ?? []} />
}

