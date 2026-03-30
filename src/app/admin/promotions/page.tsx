import { createClient } from '@/lib/supabase-server'
import AdminPromotionsClient from '@/components/admin/AdminPromotionsClient'

export default async function AdminPromotionsPage() {
  const supabase = await createClient()
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Promotions</h1>
      </div>
      <AdminPromotionsClient promotions={promotions ?? []} />
    </div>
  )
}
