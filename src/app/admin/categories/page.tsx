import { createClient } from '@/lib/supabase-server'
import AdminCategoriesClient from '@/components/admin/AdminCategoriesClient'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('id, name, model, price, images, in_stock, category').order('name'),
  ])

  const countMap: Record<string, number> = {}
  const productsByCategory: Record<string, { id: string; name: string; model: string; price: number; images: string[]; in_stock: boolean }[]> = {}
  for (const p of products ?? []) {
    const c = p.category
    if (c) {
      countMap[c] = (countMap[c] ?? 0) + 1
      if (!productsByCategory[c]) productsByCategory[c] = []
      productsByCategory[c].push(p)
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Categories</h1>
      </div>
      <AdminCategoriesClient categories={categories ?? []} productCounts={countMap} productsByCategory={productsByCategory} />
    </div>
  )
}
