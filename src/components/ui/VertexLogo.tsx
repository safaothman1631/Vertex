'use client'

/**
 * Vertex geometric V mark — inline SVG for crisp rendering at any size.
 * Two-tone split-V with aurora gradient arms + precision diamond at vertex.
 */
export function VertexMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vm-l" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="vm-r" x1="1" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <path d="M 16,20 L 190,310 L 104,20 Z" fill="url(#vm-l)" />
      <path d="M 384,20 L 210,310 L 296,20 Z" fill="url(#vm-r)" />
      <path d="M 200,340 L 190,310 L 200,298 L 210,310 Z" fill="#C4B5FD" />
    </svg>
  )
}
