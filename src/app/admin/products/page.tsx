import { createClient } from '@/lib/supabase-server'
import AdminProductsClient from '@/components/admin/AdminProductsClient'
import type { Product } from '@/types'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }, { data: brands }] = await Promise.all([
    supabase.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    supabase.from('categories').select('name, slug').order('sort_order', { ascending: true }),
    supabase.from('brands').select('name').order('name', { ascending: true }),
  ])

  const catNames = (categories ?? []).map((c: { name: string; slug: string }) => c.name)
  const brandNames = (brands ?? []).map((b: { name: string }) => b.name)

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Products</h1>
      </div>
      <AdminProductsClient products={(products as Product[]) || []} dbCategories={catNames} dbBrands={brandNames} />
    </div>
  )
}
