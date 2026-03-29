'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, CheckCircle, XCircle, ArrowLeft, ZoomIn, Minus, Plus } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import Lightbox from '@/components/ui/Lightbox'
import { useT } from '@/contexts/locale'
import type { Product } from '@/types'

export default function ProductDetailClient({ product, relatedProducts = [] }: { product: Product; relatedProducts?: Product[] }) {
  const t = useT()
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [qty, setQty] = useState(1)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Back link */}
      <Link
        href="/products"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32,
          color: 'var(--text2)', fontSize: '.88rem', fontWeight: 600,
          textDecoration: 'none', transition: 'color .2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}
      >
        <ArrowLeft size={15} />
        {t.productDetail.backToProducts}
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

        {/* ── Image gallery ── */}
        <div>
          <div
            onClick={() => product.images?.length && setLightboxOpen(true)}
            style={{
              position: 'relative', height: 360, borderRadius: 20, overflow: 'hidden',
              background: '#fff', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: product.images?.length ? 'zoom-in' : 'default',
            }}
          >
            {product.images?.[activeImg] ? (
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                style={{ objectFit: 'contain', padding: 24 }}
                sizes="560px"
                priority
              />
            ) : (
              <div style={{ fontSize: '5rem' }}>📦</div>
            )}
            {product.images?.length ? (
              <div style={{
                position: 'absolute', bottom: 12, right: 12,
                background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
                color: '#fff', fontSize: '.75rem', fontWeight: 600,
              }}>
                <ZoomIn size={13} /> Click to zoom
              </div>
            ) : null}
          </div>

          {/* Thumbnail row — clickable */}
          {(product.images?.length ?? 0) > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    position: 'relative', width: 80, height: 80, borderRadius: 10,
                    background: '#fff', overflow: 'hidden',
                    border: i === activeImg ? '2px solid var(--primary)' : '1px solid var(--border)',
                    flexShrink: 0, cursor: 'pointer', padding: 0,
                    boxShadow: i === activeImg ? '0 0 0 3px rgba(99,102,241,.2)' : 'none',
                    transition: 'all .2s ease',
                  }}
                >
                  <Image src={img} alt="" fill style={{ objectFit: 'contain', padding: 6 }} sizes="80px" />
                </button>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightboxOpen && product.images?.length && (
            <Lightbox images={product.images} startIndex={activeImg} onClose={() => setLightboxOpen(false)} />
          )}
        </div>

        {/* ── Details ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* Brand */}
          <p style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            {product.brand}
          </p>

          {/* Name */}
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: 10 }}>
            {product.name}
          </h1>

          {/* Model */}
          <p style={{ fontSize: '.82rem', color: 'var(--text3)', fontFamily: 'monospace', marginBottom: 16 }}>
            {t.productDetail.model}: {product.model}
          </p>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                stroke={s <= Math.round(product.rating) ? '#f59e0b' : 'var(--border)'}
              />
            ))}
            <span style={{ fontSize: '.82rem', color: 'var(--text2)', marginLeft: 4 }}>
              {product.rating} ({product.review_count} {t.productDetail.reviews})
            </span>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 900, color: 'var(--primary)' }}>
              ${product.price.toFixed(2)}
            </span>
            {product.old_price && (
              <>
                <span style={{ fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text3)' }}>
                  ${product.old_price.toFixed(2)}
                </span>
                <span style={{ fontSize: '.78rem', fontWeight: 800, background: 'rgba(16,185,129,.12)', color: '#10b981', borderRadius: 6, padding: '3px 8px' }}>
                  -{Math.round((1 - product.price / product.old_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            {product.in_stock ? (
              <>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '.88rem', color: '#10b981', fontWeight: 600 }}>{t.productDetail.inStock}</span>
              </>
            ) : (
              <>
                <XCircle size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '.88rem', color: '#ef4444', fontWeight: 600 }}>{t.productDetail.outOfStock}</span>
              </>
            )}
          </div>

          {/* Description */}
          <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: 'var(--text2)', marginBottom: 28 }}>
            {product.description}
          </p>

          {/* Quantity selector */}
          {product.in_stock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text2)' }}>{t.productDetail.quantity ?? 'Quantity'}:</span>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-main)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                >
                  <Minus size={15} />
                </button>
                <span
                  style={{
                    width: 44, textAlign: 'center', fontSize: '.95rem', fontWeight: 700,
                    borderInline: '1px solid var(--border)', lineHeight: '38px',
                  }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  style={{
                    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-main)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} quantity={qty} />

          {/* Specs */}
          {(product.specs?.length ?? 0) > 0 && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)', marginBottom: 14 }}>
                {t.productDetail.keySpecs}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.specs?.map((spec, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      fontSize: '.88rem', color: 'var(--text2)',
                      background: 'var(--bg2)', borderRadius: 10,
                      border: '1px solid var(--border)', padding: '10px 14px',
                    }}
                  >
                    <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '.8rem', marginTop: 1, flexShrink: 0 }}>✓</span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: 24 }}>
            {t.productDetail.relatedProducts ?? 'Related Products'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                style={{
                  textDecoration: 'none', color: 'inherit',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{ position: 'relative', height: 160, background: '#fff' }}>
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'contain', padding: 12 }} sizes="240px" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem' }}>📦</div>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</p>
                  <h3 style={{ fontSize: '.85rem', fontWeight: 700, lineHeight: 1.3, margin: '4px 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 900, color: 'var(--primary)' }}>${p.price.toFixed(2)}</span>
                    {p.old_price && <span style={{ fontSize: '.78rem', textDecoration: 'line-through', color: 'var(--text3)' }}>${p.old_price.toFixed(2)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
