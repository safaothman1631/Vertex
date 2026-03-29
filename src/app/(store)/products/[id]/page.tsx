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

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  // Fetch related products (same category, exclude current, limit 4)
  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category)
    .eq('hidden', false)
    .neq('id', product.id)
    .limit(4)

  return <ProductDetailClient product={product} relatedProducts={related ?? []} />
}

