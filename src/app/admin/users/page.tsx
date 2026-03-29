import { createClient } from '@/lib/supabase-server'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // fetch profiles + order count per user
  const [{ data: users }, { data: orderCounts }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('user_id'),
  ])

  const countMap = (orderCounts ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.user_id] = (acc[o.user_id] ?? 0) + 1
    return acc
  }, {})

  const usersWithOrders = (users ?? []).map(u => ({ ...u, order_count: countMap[u.id] ?? 0 }))

  return <AdminUsersClient users={usersWithOrders as never} />
}
