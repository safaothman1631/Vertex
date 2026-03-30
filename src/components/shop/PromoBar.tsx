'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ArrowRight, ChevronLeft, ChevronRight, Flame, Zap, Gift, Percent } from 'lucide-react'
import type { Promotion } from '@/types'

interface Props {
  promotions: Promotion[]
}

const PROMO_ICONS = [Flame, Zap, Gift, Percent]

export default function PromoBar({ promotions }: Props) {
  const [visible, setVisible] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartX = useRef(0)

  const bars = promotions.filter(p => p.position === 'bar')

  const goTo = useCallback((idx: number, dir?: 'next' | 'prev') => {
    if (isTransitioning || bars.length <= 1) return
    const newIdx = ((idx % bars.length) + bars.length) % bars.length
    setDirection(dir || (idx > activeIdx ? 'next' : 'prev'))
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveIdx(newIdx)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 300)
  }, [isTransitioning, bars.length, activeIdx])

  const next = useCallback(() => goTo(activeIdx + 1, 'next'), [goTo, activeIdx])
  const prev = useCallback(() => goTo(activeIdx - 1, 'prev'), [goTo, activeIdx])

  useEffect(() => {
    if (bars.length <= 1) return
    timerRef.current = setInterval(next, 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [bars.length, next])

  if (!visible || bars.length === 0) return null

  const promo = bars[activeIdx]
  const Icon = PROMO_ICONS[activeIdx % PROMO_ICONS.length]
  const hasImage = !!promo.image_url

  return (
    <section
      className="promo-banner"
      role="banner"
      aria-label="Promotional offer"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
      }}
    >
      {/* Decorative mesh gradient background */}
      <div className="promo-mesh" aria-hidden="true" />
      <div className="promo-grain" aria-hidden="true" />

      {/* Close */}
      <button className="promo-close" onClick={() => setVisible(false)} aria-label="Dismiss">
        <X size={16} strokeWidth={2} />
      </button>

      <div className="promo-inner container">
        {/* Text side */}
        <div className={`promo-text-side${isTransitioning ? ` promo-slide-out-${direction}` : ' promo-slide-in'}`}>
          {promo.badge_text && (
            <div className="promo-pill">
              <Icon size={14} strokeWidth={2.2} />
              <span>{promo.badge_text}</span>
            </div>
          )}

          <h2 className="promo-heading">{promo.title}</h2>

          {promo.description && (
            <p className="promo-subtext">{promo.description}</p>
          )}

          {promo.link_url && (
            <Link href={promo.link_url} className="promo-action">
              <span>Shop Now</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
          )}
        </div>

        {/* Image / Visual side */}
        <div className={`promo-visual${isTransitioning ? ' promo-visual-fade' : ''}`}>
          {hasImage ? (
            <div className="promo-img-wrap">
              <Image
                src={promo.image_url}
                alt={promo.title}
                width={400}
                height={280}
                className="promo-img"
                priority
              />
            </div>
          ) : (
            <div className="promo-icon-display">
              <div className="promo-icon-glow" />
              <Icon size={64} strokeWidth={1.2} />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {bars.length > 1 && (
        <div className="promo-nav-row">
          <button className="promo-arrow" onClick={prev} aria-label="Previous">
            <ChevronLeft size={18} strokeWidth={2} />
          </button>

          <div className="promo-indicators">
            {bars.map((_, i) => (
              <button
                key={i}
                className={`promo-ind${i === activeIdx ? ' active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Promotion ${i + 1}`}
              >
                {i === activeIdx && <span className="promo-ind-fill" />}
              </button>
            ))}
          </div>

          <button className="promo-arrow" onClick={next} aria-label="Next">
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      )}
    </section>
  )
}
