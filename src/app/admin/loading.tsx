export default function AdminLoading() {
  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Page header skeleton */}
      <div className="admin-page-head" style={{ marginBottom: 24 }}>
        <div style={{ height: 28, width: 180, background: 'var(--border)', borderRadius: 8 }} />
      </div>

      {/* Stats cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="admin-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ height: 14, width: 90, background: 'var(--border)', borderRadius: 6 }} />
              <div style={{ height: 32, width: 32, background: 'var(--border)', borderRadius: 8 }} />
            </div>
            <div style={{ height: 28, width: 80, background: 'var(--border)', borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="admin-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <div style={{ height: 20, width: 140, background: 'var(--border)', borderRadius: 6 }} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16 }}>
            <div style={{ height: 14, flex: 2, background: 'var(--border)', borderRadius: 6 }} />
            <div style={{ height: 14, flex: 1, background: 'var(--border)', borderRadius: 6 }} />
            <div style={{ height: 14, flex: 1, background: 'var(--border)', borderRadius: 6 }} />
            <div style={{ height: 22, width: 70, background: 'var(--border)', borderRadius: 20 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
