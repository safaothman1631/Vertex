export default function ContactLoading() {
  return (
    <div className="resp-page-padding" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ height: 36, width: 200, background: 'var(--border)', borderRadius: 10, marginBottom: 12 }} />
      <div style={{ height: 14, width: 280, background: 'var(--border)', borderRadius: 6, marginBottom: 32 }} />
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ height: 12, width: 60, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: i === 2 ? 120 : 42, background: 'var(--border)', borderRadius: 8 }} />
          </div>
        ))}
        <div style={{ height: 44, width: 110, background: 'var(--border)', borderRadius: 8 }} />
      </div>
    </div>
  )
}
