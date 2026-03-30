export default function Loading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Image skeleton */}
        <div style={{ aspectRatio: '1', background: 'var(--border)', borderRadius: 16 }} />

        {/* Details skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
          <div style={{ height: 16, width: '40%', background: 'var(--border)', borderRadius: 6 }} />
          <div style={{ height: 28, width: '70%', background: 'var(--border)', borderRadius: 8 }} />
          <div style={{ height: 20, width: '30%', background: 'var(--border)', borderRadius: 6 }} />
          <div style={{ height: 80, width: '100%', background: 'var(--border)', borderRadius: 8, marginTop: 8 }} />
          <div style={{ height: 48, width: '50%', background: 'var(--border)', borderRadius: 12, marginTop: 16 }} />
        </div>
      </div>
    </div>
  )
}
