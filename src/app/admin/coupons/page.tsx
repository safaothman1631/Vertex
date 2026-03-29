import { createClient } from '@/lib/supabase-server'
import AdminCouponsClient from '@/components/admin/AdminCouponsClient'

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Coupons</h1>
      </div>
      <AdminCouponsClient coupons={coupons ?? []} />
    </div>
  )
}
