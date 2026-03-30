'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, ArrowRight, ChevronLeft, ChevronRight, Flame, Zap, Gift, Percent } from 'lucide-react'
import type { Promotion } from '@/types'

interface Props {
  promotions: Promotion[]
}

const ICONS = [Flame, Zap, Gift, Percent]
const INTERVAL = 6000

export default function PromoBar({ promotions }: Props) {
  const [visible, setVisible] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [progressKey, setProgressKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef(0)

  const bars = promotions.filter(p => p.position === 'bar')

  const goTo = useCallback((idx: number) => {
    if (isTransitioning || bars.length <= 1) return
    const newIdx = ((idx % bars.length) + bars.length) % bars.length
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveIdx(newIdx)
      setProgressKey(k => k + 1)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 200)
  }, [isTransitioning, bars.length])

  const next = useCallback(() => goTo(activeIdx + 1), [goTo, activeIdx])
  const prev = useCallback(() => goTo(activeIdx - 1), [goTo, activeIdx])

  useEffect(() => {
    if (bars.length <= 1) return
    timerRef.current = setInterval(next, INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [bars.length, next])

  if (!visible || bars.length === 0) return null

  const promo = bars[activeIdx]
  const Icon = ICONS[activeIdx % ICONS.length]

  return (
    <div
      className="promo-bar"
      role="banner"
      aria-label="Promotional offer"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
      }}
    >
      {/* Aurora top accent */}
      <span className="promo-bar-accent" aria-hidden="true" />

      <div className="promo-bar-inner">
        {/* Left: nav arrows */}
        {bars.length > 1 && (
          <button className="promo-bar-arrow" onClick={prev} aria-label="Previous">
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
        )}

        {/* Center: content */}
        <div className={`promo-bar-content${isTransitioning ? ' promo-bar-fade' : ''}`}>
          {promo.badge_text && (
            <span className="promo-bar-pill">
              <Icon size={12} strokeWidth={2.5} />
              {promo.badge_text}
            </span>
          )}

          <span className="promo-bar-text">{promo.title}</span>

          {promo.link_url && (
            <Link href={promo.link_url} className="promo-bar-cta">
              Shop Now <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          )}
        </div>

        {/* Right: nav arrow + close */}
        {bars.length > 1 && (
          <button className="promo-bar-arrow" onClick={next} aria-label="Next">
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        )}

        <button className="promo-bar-close" onClick={() => setVisible(false)} aria-label="Dismiss">
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Progress bar (auto-rotate timer) */}
      {bars.length > 1 && (
        <span key={progressKey} className="promo-bar-progress" />
      )}
    </div>
  )
}
