import { ProductGridSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero skeleton */}
      <div style={{
        height: 320,
        borderRadius: 20,
        background: 'var(--bg2)',
        marginBottom: 40,
        animation: 'anim-skeleton 1.5s ease-in-out infinite',
      }} />
      {/* Product grid skeleton */}
      <ProductGridSkeleton count={8} />
    </div>
  )
}
