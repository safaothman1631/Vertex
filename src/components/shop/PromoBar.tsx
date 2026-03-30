'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Tag, Zap, ArrowRight } from 'lucide-react'
import type { Promotion } from '@/types'

interface Props {
  promotions: Promotion[]
}

export default function PromoBar({ promotions }: Props) {
  const [visible, setVisible] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const bars = promotions.filter(p => p.position === 'bar')

  useEffect(() => {
    if (bars.length <= 1) return
    timerRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % bars.length)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [bars.length])

  if (!visible || bars.length === 0) return null

  const promo = bars[activeIdx]

  return (
    <div className="promo-bar-modern" role="banner" aria-label="Promotional offer">
      {/* Shimmer overlay */}
      <div className="promo-bar-shimmer" aria-hidden="true" />

      {/* Left: dots indicator */}
      {bars.length > 1 && (
        <div className="promo-bar-dots" aria-hidden="true">
          {bars.map((_, i) => (
            <button
              key={i}
              className={`promo-bar-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => setActiveIdx(i)}
              tabIndex={-1}
            />
          ))}
        </div>
      )}

      {/* Center content */}
      <a
        href={promo.link_url || '#'}
        className="promo-bar-content"
        onClick={e => { if (!promo.link_url) e.preventDefault() }}
      >
        <span className="promo-bar-icon" aria-hidden="true">
          <Zap size={13} strokeWidth={2.5} />
        </span>

        {promo.badge_text && (
          <span className="promo-bar-badge">
            <Tag size={10} strokeWidth={2.5} />
            {promo.badge_text}
          </span>
        )}

        <span className="promo-bar-title">{promo.title}</span>

        {promo.description && (
          <span className="promo-bar-desc">{promo.description}</span>
        )}

        {promo.link_url && (
          <span className="promo-bar-cta">
            Shop Now <ArrowRight size={12} strokeWidth={2.5} />
          </span>
        )}
      </a>

      {/* Close */}
      <button
        className="promo-bar-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss promotion"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  )
}
