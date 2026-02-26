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

  return <ProductDetailClient product={product} />
}

