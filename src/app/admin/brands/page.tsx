import { createClient } from '@/lib/supabase-server'
import AdminBrandsClient from '@/components/admin/AdminBrandsClient'

export default async function AdminBrandsPage() {
  const supabase = await createClient()

  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from('brands').select('*').order('name'),
    supabase.from('products').select('id, name, model, price, images, in_stock, brand').order('name'),
  ])

  const countMap: Record<string, number> = {}
  const productsByBrand: Record<string, { id: string; name: string; model: string; price: number; images: string[]; in_stock: boolean }[]> = {}
  for (const p of products ?? []) {
    const b = p.brand
    if (b) {
      countMap[b] = (countMap[b] ?? 0) + 1
      if (!productsByBrand[b]) productsByBrand[b] = []
      productsByBrand[b].push(p)
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Brands</h1>
      </div>
      <AdminBrandsClient brands={brands ?? []} productCounts={countMap} productsByBrand={productsByBrand} />
    </div>
  )
}
