export default function OrdersLoading() {
  return (
    <div className="resp-page-padding" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}>
          <div style={{ height: 40, width: 220, background: 'var(--border)', borderRadius: 10 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[90, 70, 110, 80].map((w, i) => (
              <div key={i} style={{ height: 32, width: w, background: 'var(--border)', borderRadius: 20 }} />
            ))}
          </div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 56, flex: 1, background: 'var(--border)', borderRadius: 12 }} />
          ))}
        </div>
      </div>

      {/* Order cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 20, marginBottom: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ height: 16, width: 160, background: 'var(--border)', borderRadius: 6 }} />
            <div style={{ height: 24, width: 80, background: 'var(--border)', borderRadius: 20 }} />
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[80, 100, 70].map((w, j) => (
              <div key={j} style={{ height: 14, width: w, background: 'var(--border)', borderRadius: 6 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
