export default function Loading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header skeleton */}
      <div style={{ height: 32, width: 200, background: 'var(--border)', borderRadius: 8, marginBottom: 24 }} />

      {/* Filters skeleton */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 36, width: 80 + i * 10, background: 'var(--border)', borderRadius: 20 }} />
        ))}
      </div>

      {/* Product grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--card)' }}>
            <div style={{ aspectRatio: '1', background: 'var(--border)' }} />
            <div style={{ padding: 16 }}>
              <div style={{ height: 14, width: '60%', background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 18, width: '80%', background: 'var(--border)', borderRadius: 6, marginBottom: 12 }} />
              <div style={{ height: 20, width: '40%', background: 'var(--border)', borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
