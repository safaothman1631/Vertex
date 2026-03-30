'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Product } from '@/types'
import { useT } from '@/contexts/locale'

interface Props {
  product: Product
  onClose: () => void
  onAddToCart: () => void
}

export default function QuickView({ product: p, onClose, onAddToCart }: Props) {
  const [mounted, setMounted] = useState(false)
  const t = useT()
  const img = p.images?.[0]

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

  if (!mounted) return null

  return createPortal(
    <div className="qv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} role="presentation">
      <div className="qv-modal" role="dialog" aria-modal="true" aria-label={p.name}>
        <button className="qv-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="qv-inner">
          {/* Left — image */}
          <div className="qv-img-wrap">
            {img ? (
              <img
                src={img}
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
              className="qv-art-fallback"
              style={{ display: img ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', width: '100%', height: '100%' }}
            >
              📦
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
              <span className="rcnt">({p.review_count.toLocaleString()} {t.quickView.reviews})</span>
            </div>

            <div className="prod-price" style={{ margin: '12px 0' }}>
              <span className="pm" style={{ fontSize: '1.6rem' }}>${p.price.toFixed(2)}</span>
              {p.old_price && <span className="po">${p.old_price.toFixed(2)}</span>}
            </div>

            {!p.in_stock && (
              <div style={{ display: 'inline-block', background: 'rgba(249,115,22,.12)', color: '#f97316', fontWeight: 700, fontSize: '.8rem', padding: '5px 12px', borderRadius: 20, marginBottom: 12 }}>
                Out of Stock
              </div>
            )}

            <p style={{ color: 'var(--text2)', lineHeight: 1.7, fontSize: '.95rem', marginBottom: 16 }}>
              {p.description}
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
                style={{ flex: 1, opacity: p.in_stock ? 1 : 0.5, cursor: p.in_stock ? 'pointer' : 'not-allowed' }}
                onClick={() => { if (p.in_stock) { onAddToCart(); onClose() } }}
              >
                {p.in_stock ? t.quickView.addToCart : 'Out of Stock'}
              </button>
              <button className="btn btn-outline" onClick={onClose}>{t.quickView.close}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  , document.body)
}
