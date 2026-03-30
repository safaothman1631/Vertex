import { createClient } from '@/lib/supabase-server'
import AdminTrashClient from '@/components/admin/AdminTrashClient'
import type { TrashItem } from '@/types'

export default async function AdminTrashPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('trash')
    .select('*')
    .order('deleted_at', { ascending: false })

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Trash</h1>
      </div>
      <AdminTrashClient items={(items as TrashItem[]) || []} />
    </div>
  )
}
