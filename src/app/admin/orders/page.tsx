import { createClient } from '@/lib/supabase-server'
import AdminOrdersClient from '@/components/admin/AdminOrdersClient'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, user:profiles(full_name, email), items:order_items(id, quantity, price, product:products(name, images))')
    .order('created_at', { ascending: false })

  return <AdminOrdersClient orders={(orders as never) ?? []} />
}
