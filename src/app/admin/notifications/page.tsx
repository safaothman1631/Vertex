import { createClient } from '@/lib/supabase-server'
import AdminNotificationsClient from '@/components/admin/AdminNotificationsClient'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
  const supabase = await createClient()

  const [{ data: notifications }, { count: userCount }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  // Group by title+body+created round to minute to show "broadcasts"
  const broadcasts: { title: string; body: string; type: string; created_at: string; recipientCount: number; readCount: number }[] = []
  const seen = new Set<string>()

  for (const n of notifications ?? []) {
    const key = `${n.title}|||${n.body}|||${n.created_at.slice(0, 16)}`
    if (seen.has(key)) {
      const b = broadcasts.find(b => `${b.title}|||${b.body}|||${b.created_at.slice(0, 16)}` === key)
      if (b) {
        b.recipientCount++
        if (n.is_read) b.readCount++
      }
    } else {
      seen.add(key)
      broadcasts.push({
        title: n.title,
        body: n.body,
        type: n.type,
        created_at: n.created_at,
        recipientCount: 1,
        readCount: n.is_read ? 1 : 0,
      })
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Notifications</h1>
      </div>
      <AdminNotificationsClient broadcasts={broadcasts} totalUsers={userCount ?? 0} />
    </div>
  )
}
