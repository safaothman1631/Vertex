'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}

export default function FadeIn({ children, delay = 0, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReduced(true)
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.08 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: reduced ? 'none' : `opacity 0.5s cubic-bezier(.21,1.02,.73,1) ${delay}ms, transform 0.5s cubic-bezier(.21,1.02,.73,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
