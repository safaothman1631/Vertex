'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [done, setDone] = useState(false)

  return (
    <div
      key={pathname}
      style={done ? {} : { animation: 'pageEnter 0.4s cubic-bezier(0.22,1,0.36,1) both' }}
      onAnimationEnd={() => setDone(true)}
    >
      {children}
    </div>
  )
}
