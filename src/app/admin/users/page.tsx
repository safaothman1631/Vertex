import { createClient } from '@/lib/supabase-server'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Users</h1>
        <span style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{users?.length ?? 0} registered</span>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              {['Name', 'Email', 'Role', 'Joined'].map((h) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(!users || users.length === 0) ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>No users yet</td></tr>
            ) : (
              (users as Record<string, unknown>[]).map((u) => (
                <tr key={u.id as string}>
                  <td style={{ fontWeight: 600 }}>{(u.full_name as string) ?? '—'}</td>
                  <td style={{ color: 'var(--text2)' }}>{u.email as string}</td>
                  <td>
                    <span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-purple' : 'admin-badge-blue'}`}>
                      {u.role as string}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>
                    {new Date(u.created_at as string).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
