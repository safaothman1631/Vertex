import { createClient } from '@/lib/supabase-server'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, user:profiles(full_name, email), items:order_items(quantity, price, product:products(name))')
    .order('created_at', { ascending: false })

  const STATUS_BADGE: Record<string, string> = {
    pending: 'admin-badge-yellow', processing: 'admin-badge-blue',
    shipped: 'admin-badge-purple', delivered: 'admin-badge-green', cancelled: 'admin-badge-red',
  }

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-page-title">Orders</h1>
        <span style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{orders?.length ?? 0} total</span>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!orders || orders.length === 0) ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>No orders yet</td></tr>
            ) : (
              (orders as Record<string, unknown>[]).map((o) => {
                const user = o.user as { full_name: string; email: string } | null
                const items = o.items as { quantity: number }[]
                return (
                  <tr key={o.id as string}>
                    <td><code style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{(o.id as string).slice(0, 8)}…</code></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user?.full_name ?? '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{user?.email}</div>
                    </td>
                    <td style={{ color: 'var(--text2)' }}>{items?.length ?? 0} item(s)</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>${(o.total as number).toFixed(2)}</td>
                    <td><span className={`admin-badge ${STATUS_BADGE[o.status as string] ?? 'admin-badge-yellow'}`}>{o.status as string}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>{new Date(o.created_at as string).toLocaleDateString()}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
