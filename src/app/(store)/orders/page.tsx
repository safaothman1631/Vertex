import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Order } from '@/types'
import OrdersClient from '@/components/shop/OrdersClient'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px' }}>
      <OrdersClient orders={orders as Order[] | null} userId={user.id} />
    </div>
  )
}
