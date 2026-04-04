'use client'

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur' | 'flip' | 'rotate'

interface ScrollRevealProps {
  children: ReactNode
  /** Direction the element animates from (default: 'up') */
  direction?: RevealDirection
  /** Delay in ms before this element starts animating */
  delay?: number
  /** Custom transition duration in ms */
  duration?: number
  /** Stagger index for grid items (each index adds 80ms delay) */
  stagger?: number
  /** Only animate once (default: true) */
  once?: boolean
  /** Viewport threshold 0-1 (default: 0.12) */
  threshold?: number
  /** Additional className */
  className?: string
  /** HTML tag to render (default: 'div') */
  as?: keyof HTMLElementTagNameMap
  /** Inline styles */
  style?: CSSProperties
}

const directionClassMap: Record<RevealDirection, string> = {
  up: 'reveal reveal-up',
  down: 'reveal reveal-down',
  left: 'reveal reveal-left',
  right: 'reveal reveal-right',
  scale: 'reveal reveal-scale',
  blur: 'reveal reveal-blur',
  flip: 'reveal reveal-flip',
  rotate: 'reveal reveal-rotate',
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration,
  stagger,
  once = true,
  threshold = 0.12,
  className = '',
  as: Tag = 'div',
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          if (once) observer.unobserve(el)
        } else if (!once) {
          el.classList.remove('is-visible')
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once, threshold])

  const revealClass = directionClassMap[direction]
  const combinedClass = `${revealClass} ${className}`.trim()

  const combinedStyle: CSSProperties = {
    ...style,
    ...(delay > 0 ? { transitionDelay: `${delay}ms` } : {}),
    ...(duration ? { transitionDuration: `${duration}ms` } : {}),
    ...(stagger !== undefined ? { '--stagger-i': stagger } as CSSProperties : {}),
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={combinedClass}
      style={Object.keys(combinedStyle).length > 0 ? combinedStyle : undefined}
    >
      {children}
    </div>
  )
}

/**
 * Hook that applies stagger indices to children for grid animations.
 * Use with the .stagger-children parent class.
 */
export function useStaggerReveal(containerRef: React.RefObject<HTMLElement | null>, options?: { threshold?: number; once?: boolean }) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      container.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'))
      return
    }

    const children = container.querySelectorAll('.reveal')
    children.forEach((child, i) => {
      (child as HTMLElement).style.setProperty('--stagger-i', String(i))
    })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          children.forEach(child => child.classList.add('is-visible'))
          if (options?.once !== false) observer.unobserve(container)
        }
      },
      { threshold: options?.threshold ?? 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, options?.threshold, options?.once])
}
