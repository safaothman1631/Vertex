export default function CheckoutLoading() {
  return (
    <div className="resp-page-padding" style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        {/* Header skeleton */}
        <div style={{ marginBottom: 40 }}>
          <div className="skeleton" style={{ width: 140, height: 14, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: 280, height: 28 }} />
        </div>

        <div className="resp-grid-sidebar">
          {/* Left: Shipping form skeleton */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: 32,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
              <div className="skeleton" style={{ width: 140, height: 18 }} />
            </div>
            <div className="resp-grid-2col">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ gridColumn: i === 4 ? '1 / -1' : undefined }}>
                  <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: '100%', height: 42, borderRadius: 10 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order summary skeleton */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: 32,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
              <div className="skeleton" style={{ width: 120, height: 18 }} />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 160, height: 14 }} />
                <div className="skeleton" style={{ width: 60, height: 14 }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
              <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
