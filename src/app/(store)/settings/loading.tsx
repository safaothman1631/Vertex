export default function SettingsLoading() {
  return (
    <div className="resp-page-padding" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ height: 36, width: 240, background: 'var(--border)', borderRadius: 10, marginBottom: 32 }} />

      {/* Section cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 14, padding: 24, marginBottom: 20,
        }}>
          <div style={{ height: 18, width: 140, background: 'var(--border)', borderRadius: 6, marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j}>
                <div style={{ height: 12, width: 80, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 40, background: 'var(--border)', borderRadius: 8 }} />
              </div>
            ))}
          </div>
          <div style={{ height: 40, width: 130, background: 'var(--border)', borderRadius: 8, marginTop: 20 }} />
        </div>
      ))}
    </div>
  )
}
