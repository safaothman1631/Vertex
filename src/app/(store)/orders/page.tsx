import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Order } from '@/types'
import OrdersClient from '@/components/shop/OrdersClient'
import OrdersPageHeader from '@/components/shop/OrdersPageHeader'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

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
    <div className="max-w-4xl mx-auto px-4 py-10">
      <OrdersPageHeader />
      <OrdersClient orders={orders as Order[] | null} />
    </div>
  )
}
