import { createClient } from '@/lib/supabase-server'
import AdminProductsClient from '@/components/admin/AdminProductsClient'
import type { Product } from '@/types'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('name').order('sort_order', { ascending: true }),
  ])

  const catNames = (categories ?? []).map((c: { name: string }) => c.name)

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Products</h1>
      </div>
      <AdminProductsClient products={(products as Product[]) || []} dbCategories={catNames} />
    </div>
  )
}
