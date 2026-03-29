import { createClient } from '@/lib/supabase-server'
import AdminCategoriesClient from '@/components/admin/AdminCategoriesClient'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('category'),
  ])

  // Count products per category
  const countMap: Record<string, number> = {}
  for (const p of products ?? []) {
    const c = p.category
    if (c) countMap[c] = (countMap[c] ?? 0) + 1
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Categories</h1>
      </div>
      <AdminCategoriesClient categories={categories ?? []} productCounts={countMap} />
    </div>
  )
}
