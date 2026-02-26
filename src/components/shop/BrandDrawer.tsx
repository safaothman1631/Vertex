'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ShoppingCart, Star } from 'lucide-react'
import type { ProductData } from '@/data/products'
import { useCartStore } from '@/store/cart'
import QuickView from './QuickView'
import { useT } from '@/contexts/locale'

interface BrandCard {
  name: string
  logo: string
  catKey: string
  c1: string
  c2: string
}

interface Props {
  brand: BrandCard | null
  products: ProductData[]
  onClose: () => void
}

export default function BrandDrawer({ brand, products, onClose }: Props) {
  const t = useT()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [qvProduct, setQvProduct] = useState<ProductData | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  /* ── mount guard (SSR) ── */
  useEffect(() => { setMounted(true) }, [])

  /* ── open animation ── */
  useEffect(() => {
    if (brand) {
      setClosing(false)
      // tiny delay so CSS transition triggers
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [brand])

  /* ── keyboard close ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function close() {
    setClosing(true)
    setVisible(false)
    setTimeout(onClose, 420)
  }

  function handleAddToCart(p: ProductData) {
    addItem({
      id: p.id, name: p.name, brand: p.brand, model: p.model,
      category: p.category, price: p.priceNum, old_price: null,
      description: p.desc, specs: p.specs,
      images: p.img ? [p.img] : [],
      rating: p.rating, review_count: p.reviews,
      in_stock: true, is_new: p.isNew, is_hot: p.isHot, created_at: '',
    })
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1400)
  }

  if (!brand && !closing) return null
  if (!mounted) return null

  const bannerBg = `linear-gradient(135deg, ${brand?.c1 ?? '#6366f1'}, ${brand?.c2 ?? '#312e81'})`

  return createPortal(
    <>
      {/* ── BACKDROP ── */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.38s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      />

      {/* ── PANEL ── */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 9001,
          maxHeight: '90vh',
          background: 'var(--bg1)',
          borderRadius: '28px 28px 0 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.8)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(100%) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.38s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── BRAND HEADER (drag handle baked in) ── */}
        <div style={{ position: 'relative', background: bannerBg, padding: '0 24px 24px', flexShrink: 0 }}>
          {/* shine overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(120deg, rgba(255,255,255,0.13) 0%, transparent 55%)',
          }} />

          {/* drag handle row */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 18px', position: 'relative' }}>
            <div style={{ width: 44, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.30)' }} />
          </div>

          {/* logo + name  |  count + close */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {/* LEFT: logo only */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/brands/${brand?.logo}`}
                alt={brand?.name}
                style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </div>

            {/* RIGHT: product count + close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{
                background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)',
                borderRadius: 20, padding: '5px 13px',
                fontSize: '.78rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
              }}>
                {products.length} {t.brandDrawer.products}
              </div>
              <button
                onClick={close}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(6px)',
                  border: 'none', cursor: 'pointer', color: '#fff',
                  transition: 'background .2s, transform .3s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,.28)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1) rotate(90deg)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.18)'; (e.currentTarget as HTMLButtonElement).style.transform = '' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── PRODUCTS ── */}
        <div
          style={{ overflowY: 'auto', padding: '28px 28px 40px', flex: 1 }}
          // prevent touches from accidentally closing via backdrop
          onClick={e => e.stopPropagation()}
        >
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
              <p style={{ fontWeight: 700 }}>{t.brandDrawer.noProducts}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
              {products.map((p, i) => (
                <BrandProductCard
                  key={p.id}
                  p={p}
                  index={i}
                  isAdded={addedId === p.id}
                  visible={visible}
                  onAdd={() => handleAddToCart(p)}
                  onQuickView={() => setQvProduct(p)}
                  brandC1={brand?.c1 ?? '#6366f1'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QuickView */}
      {qvProduct && (
        <QuickView
          product={qvProduct}
          onClose={() => setQvProduct(null)}
          onAddToCart={() => { handleAddToCart(qvProduct); setQvProduct(null) }}
        />
      )}
    </>,
    document.body
  )
}

/* ──────────────────────────────────────────────
   Single product card inside the drawer
────────────────────────────────────────────── */
function BrandProductCard({
  p, index, isAdded, visible, onAdd, onQuickView, brandC1,
}: {
  p: ProductData
  index: number
  isAdded: boolean
  visible: boolean
  onAdd: () => void
  onQuickView: () => void
  brandC1: string
}) {
  const t = useT()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hovered ? brandC1 + '55' : 'var(--border)'}`,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        /* stagger slide-up */
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.4s ease ${0.08 + index * 0.055}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${0.08 + index * 0.055}s, border-color 0.2s, box-shadow 0.2s`,
        boxShadow: hovered ? `0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px ${brandC1}33` : 'none',
      }}
      onClick={onQuickView}
    >
      {/* image */}
      <div style={{ position: 'relative', height: 160, background: '#fff', flexShrink: 0, overflow: 'hidden' }}>
        {p.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.img}
            alt={p.name}
            style={{
              width: '100%', height: '100%', objectFit: 'contain', padding: 16,
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '3rem',
            background: `linear-gradient(135deg, ${p.pa1}, ${p.pa2})`,
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', opacity: 0.9 }}>{p.artType}</span>
          </div>
        )}

        {/* badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {p.isHot && <span style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '.58rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>{t.productCard.hot}</span>}
          {p.isNew && <span style={{ background: 'var(--gradient)', color: '#fff', fontSize: '.58rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>{t.productCard.new}</span>}
        </div>

        {/* quick-view hint */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.42)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.22s',
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '.8rem', background: 'rgba(0,0,0,.5)', padding: '7px 16px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{t.productCard.quickView}</span>
        </div>
      </div>

      {/* info */}
      <div style={{ padding: '14px 16px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: '.66rem', fontWeight: 800, color: brandC1, textTransform: 'uppercase', letterSpacing: '.08em' }}>{p.brand}</div>
        <div style={{ fontSize: '.87rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</div>
        <div style={{ fontSize: '.73rem', color: 'var(--text3)' }}>{t.productCard.model}: {p.model}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={10} fill={s <= Math.round(p.rating) ? '#f59e0b' : 'none'} stroke={s <= Math.round(p.rating) ? '#f59e0b' : 'var(--border)'} />
          ))}
          <span style={{ fontSize: '.66rem', color: 'var(--text3)', marginLeft: 3 }}>({p.reviews})</span>
        </div>
        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)', marginTop: 4 }}>{p.price}</div>
      </div>

      {/* add to cart */}
      <div style={{ padding: '4px 14px 14px' }} onClick={e => { e.stopPropagation(); onAdd() }}>
        <button style={{
          width: '100%', padding: '9px', borderRadius: 11, fontWeight: 700, fontSize: '.8rem',
          cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          background: isAdded ? 'rgba(16,185,129,.15)' : `linear-gradient(135deg, ${brandC1}, ${brandC1}cc)`,
          color: isAdded ? '#10b981' : '#fff',
          transition: 'all .22s',
          boxShadow: isAdded ? 'none' : `0 4px 14px ${brandC1}44`,
        }}>
          {isAdded ? t.productCard.added : <><ShoppingCart size={12} /> {t.productCard.addToCart}</>}
        </button>
      </div>
    </div>
  )
}
