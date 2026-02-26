import { Suspense } from 'react'
import { createClient } from '@/lib/supabase-server'
import ProductsGrid from '@/components/shop/ProductsGrid'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>Loading…</div>}>
      <ProductsGrid products={products ?? []} />
    </Suspense>
  )
}
