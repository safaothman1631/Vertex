'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProductData } from '@/data/products'
import { useT } from '@/contexts/locale'

interface Props {
  product: ProductData
  onClose: () => void
  onAddToCart: () => void
}

export default function QuickView({ product: p, onClose, onAddToCart }: Props) {
  const [mounted, setMounted] = useState(false)
  const t = useT()

  useEffect(() => {
    setMounted(true)
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const artStyle = { '--pa1': p.pa1, '--pa2': p.pa2 } as React.CSSProperties

  if (!mounted) return null

  return createPortal(
    <div className="qv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="qv-modal">
        <button className="qv-close" onClick={onClose}>✕</button>

        <div className="qv-inner">
          {/* Left — image */}
          <div className="qv-img-wrap">
            {p.img ? (
              <img
                src={p.img}
                alt={p.name}
                className="qv-prod-img"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.style.display = 'none'
                  if (t.nextElementSibling) (t.nextElementSibling as HTMLElement).style.display = 'flex'
                }}
              />
            ) : null}
            <div
              className="prod-art qv-art-fallback"
              style={{ ...artStyle, display: p.img ? 'none' : 'flex' }}
            >
              <span className="prod-art-type">{p.artType}</span>
              <span className="prod-art-brand">{p.artBrand}</span>
              <span className="prod-art-name">{p.name}</span>
            </div>
          </div>

          {/* Right — info */}
          <div className="qv-info">
            <div className="prod-brand">{p.brand}</div>
            <h2 className="qv-title">{p.name}</h2>
            <code className="qv-model">{p.model}</code>

            <div className="prod-rating" style={{ margin: '8px 0' }}>
              <span className="stars">{'★'.repeat(Math.round(p.rating))}</span>
              <span className="rnum">{p.rating}</span>
              <span className="rcnt">({p.reviews.toLocaleString()} {t.quickView.reviews})</span>
            </div>

            <div className="prod-price" style={{ margin: '12px 0' }}>
              <span className="pm" style={{ fontSize: '1.6rem' }}>{p.price}</span>
            </div>

            <p style={{ color: 'var(--text2)', lineHeight: 1.7, fontSize: '.95rem', marginBottom: 16 }}>
              {p.desc}
            </p>

            <h4 className="qv-specs-title">{t.quickView.specs}</h4>
            <ul className="qv-specs-list">
              {p.specs.map((s, i) => (
                <li key={i} className="qv-spec-item">✓ {s}</li>
              ))}
            </ul>

            <div className="qv-actions">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => { onAddToCart(); onClose() }}
              >
                {t.quickView.addToCart}
              </button>
              <button className="btn btn-outline" onClick={onClose}>{t.quickView.close}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  , document.body)
}
