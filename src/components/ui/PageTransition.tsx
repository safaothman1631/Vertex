'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [done, setDone] = useState(false)
  const prevPath = useRef(pathname)
  const isInitial = useRef(true)

  // Reset animation state on route change
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setDone(false)
      prevPath.current = pathname
      isInitial.current = false
    }
  }, [pathname])

  // Skip animation for users who prefer reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true)
    }
  }, [])

  const animation = done
    ? undefined
    : isInitial.current
      ? 'page-enter 0.5s cubic-bezier(0.16,1,0.3,1) both'
      : 'page-enter 0.4s cubic-bezier(0.16,1,0.3,1) both'

  return (
    <div
      key={pathname}
      style={animation ? { animation } : undefined}
      onAnimationEnd={() => setDone(true)}
    >
      {children}
    </div>
  )
}
