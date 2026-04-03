import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/shop/SettingsClient'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings, addresses, and preferences.',
  robots: { index: false },
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, addressesRes, ordersRes, notifCountRes, notifsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('orders').select('id, total, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <SettingsClient
      user={user}
      profile={profileRes.data}
      addresses={addressesRes.data ?? []}
      recentOrders={ordersRes.data ?? []}
      unreadNotifications={notifCountRes.count ?? 0}
      notifications={notifsRes.data ?? []}
    />
  )
}
