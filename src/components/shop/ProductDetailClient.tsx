'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import { useT } from '@/contexts/locale'
import type { Product } from '@/types'

export default function ProductDetailClient({ product }: { product: Product }) {
  const t = useT()

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
          <div style={{
            position: 'relative', height: 360, borderRadius: 20, overflow: 'hidden',
            background: '#fff', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                style={{ objectFit: 'contain', padding: 24 }}
                sizes="560px"
                priority
              />
            ) : (
              <div style={{ fontSize: '5rem' }}>📦</div>
            )}
          </div>

          {/* Thumbnail row */}
          {(product.images?.length ?? 0) > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              {product.images?.slice(1).map((img, i) => (
                <div key={i} style={{
                  position: 'relative', width: 80, height: 80, borderRadius: 10,
                  background: '#fff', overflow: 'hidden', border: '1px solid var(--border)',
                  flexShrink: 0,
                }}>
                  <Image src={img} alt="" fill style={{ objectFit: 'contain', padding: 6 }} sizes="80px" />
                </div>
              ))}
            </div>
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

          {/* Add to cart */}
          <AddToCartButton product={product} />

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
    </div>
  )
}
