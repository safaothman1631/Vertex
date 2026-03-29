import { createClient } from '@/lib/supabase-server'
import AdminBrandsClient from '@/components/admin/AdminBrandsClient'

export default async function AdminBrandsPage() {
  const supabase = await createClient()

  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from('brands').select('*').order('name'),
    supabase.from('products').select('brand'),
  ])

  const countMap: Record<string, number> = {}
  for (const p of products ?? []) {
    const b = p.brand
    if (b) countMap[b] = (countMap[b] ?? 0) + 1
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Brands</h1>
      </div>
      <AdminBrandsClient brands={brands ?? []} productCounts={countMap} />
    </div>
  )
}
