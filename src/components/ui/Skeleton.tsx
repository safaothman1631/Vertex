'use client'

export function Skeleton({ width, height, radius = 10, style }: { width?: string | number; height?: string | number; radius?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height: height ?? 20,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--bg3) 25%, var(--bg4) 50%, var(--bg3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite ease-in-out',
        ...style,
      }}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <Skeleton height={200} radius={0} />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={12} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Skeleton width={80} height={14} />
          <Skeleton width={50} height={14} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <Skeleton width={70} height={24} />
          <Skeleton width={90} height={36} radius={8} />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: 20,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function OrderSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Skeleton width={100} height={14} />
            <Skeleton width={80} height={14} />
          </div>
          <Skeleton width="60%" height={12} />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, padding: '14px 16px' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${Math.random() * 30 + 40}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  )
}
