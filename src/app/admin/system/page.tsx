import { createClient } from '@/lib/supabase-server'
import AdminSystemClient from '@/components/admin/AdminSystemClient'

export const dynamic = 'force-dynamic'

export default async function AdminSystemPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">System Health</h1>
      </div>
      <AdminSystemClient initialLogs={logs ?? []} />
    </div>
  )
}
