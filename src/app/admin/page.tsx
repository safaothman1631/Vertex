import { createClient } from '@/lib/supabase-server'
import { Package, ShoppingBag, Users, MessageSquare } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { count: msgCount },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('orders').select('id, total, status, created_at, user:profiles(full_name)').order('created_at', { ascending: false }).limit(8),
  ])

  const stats = [
    { label: 'Total Products', value: productCount ?? 0, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
    { label: 'Total Orders', value: orderCount ?? 0, icon: ShoppingBag, color: '#22c55e', bg: 'rgba(34,197,94,.12)' },
    { label: 'Registered Users', value: userCount ?? 0, icon: Users, color: '#38bdf8', bg: 'rgba(56,189,248,.12)' },
    { label: 'Unread Messages', value: msgCount ?? 0, icon: MessageSquare, color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  ]

  const STATUS_CLASS: Record<string, string> = {
    pending: 'admin-badge-yellow',
    processing: 'admin-badge-blue',
    shipped: 'admin-badge-purple',
    delivered: 'admin-badge-green',
    cancelled: 'admin-badge-red',
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Welcome back — here&apos;s what&apos;s happening today</p>
        </div>
        <span style={{ fontSize: '.82rem', color: 'var(--text2)', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 8 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="admin-stat-card" style={{ '--stat-color': color } as React.CSSProperties}>
            <div className="admin-stat-top">
              <div style={{ flex: 1 }} />
              <div className="admin-stat-icon" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div>
              <div className="admin-stat-val">{value}</div>
              <div className="admin-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="admin-card">
        <div className="admin-card-head">
          <span className="admin-card-title">Recent Orders</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!recentOrders || recentOrders.length === 0) ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>No orders yet</td></tr>
            ) : (
              (recentOrders as Record<string, unknown>[]).map((o) => (
                <tr key={o.id as string}>
                  <td><code style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{(o.id as string).slice(0, 8)}…</code></td>
                  <td style={{ fontWeight: 600 }}>{(o.user as { full_name: string } | null)?.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 700 }}>${(o.total as number).toFixed(2)}</td>
                  <td><span className={`admin-badge ${STATUS_CLASS[o.status as string] ?? 'admin-badge-yellow'}`}>{o.status as string}</span></td>
                  <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>{new Date(o.created_at as string).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


