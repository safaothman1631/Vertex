'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Promotion } from '@/types'

interface Props {
  promotions: Promotion[]
}

export default function PromoBar({ promotions }: Props) {
  const [visible, setVisible] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const bars = promotions.filter(p => p.position === 'bar')

  const goTo = (idx: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setActiveIdx((idx + bars.length) % bars.length)
      setAnimating(false)
    }, 220)
  }

  useEffect(() => {
    if (bars.length <= 1) return
    timerRef.current = setInterval(() => goTo(activeIdx + 1), 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars.length, activeIdx])

  if (!visible || bars.length === 0) return null

  const promo = bars[activeIdx]

  return (
    <div className="pb-wrap" role="banner" aria-label="Promotional offer">
      {/* Animated aurora background orbs */}
      <div className="pb-orb pb-orb-l" aria-hidden="true" />
      <div className="pb-orb pb-orb-r" aria-hidden="true" />
      {/* Shimmer sweep */}
      <div className="pb-shimmer" aria-hidden="true" />

      {/* Nav prev */}
      {bars.length > 1 && (
        <button className="pb-nav" onClick={() => goTo(activeIdx - 1)} aria-label="Previous offer">
          <ChevronLeft size={14} strokeWidth={2} />
        </button>
      )}

      {/* Content */}
      <a
        href={promo.link_url || '#'}
        className={`pb-content${animating ? ' pb-fade' : ''}`}
        onClick={e => { if (!promo.link_url) e.preventDefault() }}
        tabIndex={0}
      >
        <span className="pb-spark" aria-hidden="true">
          <Sparkles size={14} strokeWidth={1.8} />
        </span>

        {promo.badge_text && (
          <span className="pb-badge">{promo.badge_text}</span>
        )}

        <span className="pb-divider" aria-hidden="true" />

        <span className="pb-title">{promo.title}</span>

        {promo.description && (
          <span className="pb-desc">{promo.description}</span>
        )}

        {promo.link_url && (
          <span className="pb-cta">
            Shop Now
            <ArrowRight size={13} strokeWidth={2} />
          </span>
        )}
      </a>

      {/* Dots */}
      {bars.length > 1 && (
        <div className="pb-dots" aria-hidden="true">
          {bars.map((_, i) => (
            <button key={i} className={`pb-dot${i === activeIdx ? ' on' : ''}`} onClick={() => goTo(i)} tabIndex={-1} />
          ))}
        </div>
      )}

      {/* Nav next */}
      {bars.length > 1 && (
        <button className="pb-nav" onClick={() => goTo(activeIdx + 1)} aria-label="Next offer">
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      )}

      {/* Close */}
      <button className="pb-close" onClick={() => setVisible(false)} aria-label="Dismiss">
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  )
}
