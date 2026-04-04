import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import ProductsGrid from '@/components/shop/ProductsGrid'
import type { Product } from '@/types'

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our full collection of professional POS equipment — barcode scanners, receipt printers, terminals, cash drawers, and accessories.',
  alternates: { canonical: '/products' },
}

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, brand, model, category, price, old_price, description, specs, images, rating, review_count, in_stock, is_new, is_hot, created_at')
    .eq('hidden', false)
    .order('created_at', { ascending: false })

  const visible = (products ?? []) as Product[]

  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Loading…</div>}>
      <ProductsGrid products={visible as Product[]} />
    </Suspense>
  )
}
