export default function WishlistLoading() {
  return (
    <div className="resp-page-padding" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ height: 36, width: 200, background: 'var(--border)', borderRadius: 10, marginBottom: 16 }} />
        <div style={{ height: 14, width: 300, background: 'var(--border)', borderRadius: 6 }} />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ height: 180, background: 'var(--border)' }} />
            <div style={{ padding: 16 }}>
              <div style={{ height: 12, width: '45%', background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 16, width: '75%', background: 'var(--border)', borderRadius: 6, marginBottom: 6 }} />
              <div style={{ height: 20, width: '35%', background: 'var(--border)', borderRadius: 6, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ height: 36, flex: 1, background: 'var(--border)', borderRadius: 8 }} />
                <div style={{ height: 36, width: 36, background: 'var(--border)', borderRadius: 8 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
