import AdminBackupClient from '@/components/admin/AdminBackupClient'

export const dynamic = 'force-dynamic'

export default function AdminBackupPage() {
  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Backup & Restore</h1>
      </div>
      <AdminBackupClient />
    </div>
  )
}
