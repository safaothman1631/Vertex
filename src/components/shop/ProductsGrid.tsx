'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShoppingCart, Star, Search, ChevronLeft, ChevronRight, X, ArrowUpDown } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import WishlistButton from './WishlistButton'
import type { Product } from '@/types'
import { useT } from '@/contexts/locale'

const PER_PAGE = 10

const CATS = [
  { key: 'all', label: 'All', icon: '' },
  { key: 'Barcode Scanners', label: 'Barcode Scanners', icon: '' },
  { key: 'POS Terminals', label: 'POS Terminals', icon: '' },
  { key: 'Printers', label: 'Printers', icon: '' },
  { key: 'Mobile Computers', label: 'Mobile Computers', icon: '' },
]

export default function ProductsGrid({ products }: { products: Product[] }) {
  const t = useT()
  const searchParams = useSearchParams()
  const router = useRouter()
  const brandParam = searchParams.get('brand') ?? 'all'

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [activeCat, setActiveCat] = useState('all')
  const [activeBrand, setActiveBrand] = useState(brandParam)
  const [page, setPage] = useState(1)
  const [addedId, setAddedId] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const addItem = useCartStore((s) => s.addItem)

  // Sync brand from URL whenever it changes
  useEffect(() => {
    setActiveBrand(brandParam)
    setPage(1)
  }, [brandParam])

  useEffect(() => { setPage(1) }, [search, sort, activeCat, activeBrand])

  function clearBrand() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('brand')
    router.replace(`/products${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.toLowerCase()
      const catOk = activeCat === 'all' || p.category === activeCat
      const brandOk = activeBrand === 'all' || p.brand.toLowerCase() === activeBrand.toLowerCase()
      const searchOk = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.model ?? '').toLowerCase().includes(q)
      return catOk && brandOk && searchOk
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sort === 'newest') list = [...list].sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0))
    return list
  }, [products, search, sort, activeCat, activeBrand])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function goToPage(p: number) {
    setPage(p)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleAddToCart(p: Product) {
    addItem(p, 1)
    setAddedId(p.id)
    setTimeout(() => setAddedId(null), 1400)
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length }
    products.forEach(p => {
      if (p.category) map[p.category] = (map[p.category] ?? 0) + 1
    })
    return map
  }, [products])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', padding: '32px 0 80px' }}>
      <div className="container" ref={topRef}>

        {/* ── COMPACT TOOLBAR ── */}
        <div style={{ marginBottom: 28 }}>

          {/* Row 1: title + count */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-.02em' }}>
              {activeBrand !== 'all'
                ? <><span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{activeBrand}</span> {t.productsSection.sectionTitleHighlight}</>
                : <>{t.productsSection.sectionTitle} <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.productsSection.sectionTitleHighlight}</span></>
              }
            </h1>
            <span style={{ fontSize: '.8rem', color: 'var(--text3)', fontWeight: 600 }}>
              {filtered.length} {t.productsSection.results}
            </span>
          </div>

          {/* Row 2: search + sort */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {/* search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.productsSection.searchPlaceholder}
                style={{
                  width: '100%', padding: '9px 32px 9px 32px',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--text)', fontSize: '.85rem',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 2 }}>
                  <X size={13} />
                </button>
              )}
            </div>

            {/* sort */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ArrowUpDown size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  padding: '9px 12px 9px 28px',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 12, color: 'var(--text)', fontSize: '.82rem',
                  outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
                }}
              >
                <option value="default">{t.productsSection.sortDefault}</option>
                <option value="price-asc">{t.productsSection.sortPriceAsc}</option>
                <option value="price-desc">{t.productsSection.sortPriceDesc}</option>
                <option value="rating">{t.productsSection.sortRating}</option>
                <option value="newest">{t.productsSection.sortNewest}</option>
              </select>
            </div>
          </div>

          {/* Row 3: category pills + optional brand chip — single scrollable row */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
            {CATS.filter(c => c.key === 'all' || (counts[c.key] ?? 0) > 0).map(c => {
              const active = activeCat === c.key
              return (
                <button key={c.key} onClick={() => setActiveCat(c.key)} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 40,
                  fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', transition: 'all .18s',
                  background: active ? 'var(--primary)' : 'var(--bg2)',
                  color: active ? '#fff' : 'var(--text3)',
                  border: active ? 'none' : '1px solid var(--border)',
                  boxShadow: active ? '0 3px 10px rgba(99,102,241,.35)' : 'none',
                }}>
                  {t.cats[c.key as keyof typeof t.cats] ?? c.label}
                </button>
              )
            })}

            {/* brand chip */}
            {activeBrand !== 'all' && (
              <div style={{
                flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 10px 6px 14px', borderRadius: 40,
                background: 'rgba(99,102,241,.18)', border: '1px solid rgba(99,102,241,.4)',
                color: 'var(--primary2)', fontWeight: 700, fontSize: '.78rem',
              }}>
                {activeBrand}
                <button onClick={clearBrand} style={{
                  background: 'rgba(99,102,241,.3)', border: 'none', borderRadius: '50%',
                  width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--primary2)', padding: 0,
                }}>
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: 12 }}></p>
            <p style={{ color: 'var(--text2)', fontWeight: 700 }}>{t.productsSection.noProducts}</p>
            <p style={{ color: 'var(--text3)', fontSize: '.85rem', marginTop: 6 }}>{t.productsSection.noProductsSub}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {paginated.map(p => {
              const img = (p as { img?: string }).img ?? p.images?.[0]
              const isAdded = addedId === p.id
              return (
                <div key={p.id}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s, border-color .22s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,.35)'; el.style.borderColor = 'rgba(99,102,241,.3)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = ''; el.style.borderColor = 'var(--border)' }}
                >
                  {/* Image */}
                  <Link href={`/products/${p.id}`} style={{ display: 'block', position: 'relative', height: 200, background: '#fff', flexShrink: 0, textDecoration: 'none' }}>
                    {img ? (
                      <Image src={img} alt={p.name} fill style={{ objectFit: 'contain', padding: 16 }} sizes="280px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}></div>
                    )}
                    <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4 }}>
                      {p.is_hot && <span style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>{t.productCard.hot}</span>}
                      {p.is_new && <span style={{ background: 'var(--gradient)', color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20 }}>{t.productCard.new}</span>}
                    </div>
                    <div style={{ position: 'absolute', top: 8, right: 8 }} onClick={e => e.preventDefault()}>
                      <WishlistButton productId={p.id} size={14} />
                    </div>
                  </Link>

                  {/* Info */}
                  <div style={{ padding: '14px 16px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <p style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{p.brand}</p>
                    <Link href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '.88rem', fontWeight: 700, lineHeight: 1.35, color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h3>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= Math.round(p.rating) ? '#f59e0b' : 'none'} stroke={s <= Math.round(p.rating) ? '#f59e0b' : 'var(--border)'} />)}
                      <span style={{ fontSize: '.68rem', color: 'var(--text3)', marginLeft: 3 }}>({p.review_count})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)' }}>${p.price.toFixed(2)}</span>
                      {p.old_price && <>
                        <span style={{ fontSize: '.75rem', textDecoration: 'line-through', color: 'var(--text3)' }}>${p.old_price.toFixed(2)}</span>
                        <span style={{ fontSize: '.62rem', fontWeight: 800, background: 'rgba(16,185,129,.12)', color: '#10b981', borderRadius: 6, padding: '2px 6px' }}>-{Math.round((1 - p.price / p.old_price) * 100)}%</span>
                      </>}
                    </div>
                  </div>

                  {/* Add to cart */}
                  <div style={{ padding: '6px 16px 16px' }}>
                    <button onClick={() => handleAddToCart(p)} style={{
                      width: '100%', padding: '10px', borderRadius: 11, fontWeight: 700, fontSize: '.82rem',
                      cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      transition: 'all .2s',
                      background: isAdded ? 'rgba(16,185,129,.15)' : 'var(--primary)',
                      color: isAdded ? '#10b981' : '#fff',
                      boxShadow: isAdded ? 'none' : '0 4px 12px rgba(99,102,241,.28)',
                    }}>
                      {isAdded ? t.productCard.added : <><ShoppingCart size={13} /> {t.productCard.addToCart}</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <span style={{ fontSize: '.8rem', color: 'var(--text3)', marginRight: 4 }}>
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} {t.productsSection.of} {filtered.length}
            </span>
            <button onClick={() => goToPage(page - 1)} disabled={page === 1}
              style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: page === 1 ? 'transparent' : 'var(--bg2)', color: page === 1 ? 'var(--text3)' : 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | 'e')[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('e')
                acc.push(n); return acc
              }, [])
              .map((item, i) => item === 'e'
                ? <span key={`e${i}`} style={{ color: 'var(--text3)', padding: '0 2px' }}></span>
                : <button key={item} onClick={() => goToPage(item as number)} style={{
                    width: 38, height: 38, borderRadius: 10, fontWeight: 700, fontSize: '.85rem',
                    cursor: 'pointer', border: 'none', transition: 'all .2s',
                    background: page === item ? 'var(--primary)' : 'var(--bg2)',
                    color: page === item ? '#fff' : 'var(--text)',
                    boxShadow: page === item ? '0 4px 12px rgba(99,102,241,.35)' : 'none',
                  }}>{item}</button>
              )}
            <button onClick={() => goToPage(page + 1)} disabled={page === totalPages}
              style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: page === totalPages ? 'transparent' : 'var(--bg2)', color: page === totalPages ? 'var(--text3)' : 'var(--text)', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
