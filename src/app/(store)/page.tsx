'use client'
import Link from 'next/link'
import { useState, useMemo, useEffect, useRef } from 'react'
import ProductCard from '@/components/shop/ProductCard'
import BrandDrawer from '@/components/shop/BrandDrawer'
import { PRODUCTS, CATEGORIES, BRAND_FILTERS } from '@/data/products'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/contexts/locale'
import { createClient } from '@/lib/supabase-client'

const PER_PAGE = 10

const BRANDS_TICKER = [
  'Honeywell', 'Zebra', 'Ingenico', 'Verifone', 'PAX Technology',
  'Square', 'Epson', 'Star Micronics', 'ID Tech', 'Bixolon',
  'Clover', 'Toast', 'NCR', 'Lightspeed', 'Revel Systems',
]

const BRAND_CARDS = [
  { name: 'Honeywell',      logo: 'honeywell.svg', catKey: 'scanners-mobility',  c1: '#ff4d00', c2: '#c03200' },
  { name: 'Zebra',          logo: 'zebra.svg',     catKey: 'labels-mobility',    c1: '#1a1aaa', c2: '#0d0d55' },
  { name: 'Ingenico',       logo: 'ingenico.svg',  catKey: 'payment-terminals',  c1: '#e30613', c2: '#8b0008' },
  { name: 'Verifone',       logo: 'verifone.svg',  catKey: 'pos-terminals',      c1: '#007dc5', c2: '#004d88' },
  { name: 'PAX',            logo: 'pax.svg',       catKey: 'smart-terminals',    c1: '#00a859', c2: '#006633' },
  { name: 'Epson',          logo: 'epson.svg',     catKey: 'printers-scanners',  c1: '#003087', c2: '#001a55' },
  { name: 'Star Micronics', logo: 'star.svg',      catKey: 'receipt-printers',   c1: '#c0392b', c2: '#7d1f17' },
  { name: 'Square',         logo: 'square.svg',    catKey: 'pos-systems',        c1: '#1a1a2e', c2: '#0a0a15' },
]

const STATS = [
  { num: '200K+', labelKey: 'customers' as const },
  { num: '500+', labelKey: 'products' as const },
  { num: '50+', labelKey: 'brands' as const },
  { num: '24/7', labelKey: 'support' as const },
]

export default function Home() {
  const [selectedBrand, setSelectedBrand] = useState<typeof BRAND_CARDS[0] | null>(null)
  const [activeCat, setActiveCat] = useState('all')
  const [activeBrand, setActiveBrand] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({})
  const prodsTopRef = useRef<HTMLDivElement>(null)
  const t = useT()

  useEffect(() => { setPage(1) }, [activeCat, activeBrand, search, sort])

  // Fetch real brand counts from Supabase
  useEffect(() => {
    const supabase = createClient()
    supabase.from('products').select('brand').then(({ data }) => {
      if (!data) return
      const map: Record<string, number> = {}
      data.forEach((row: { brand: string }) => { const b = row.brand || ''; map[b] = (map[b] || 0) + 1 })
      setLiveCounts(map)
    })
  }, [])

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      const catOk = activeCat === 'all' || p.cat === activeCat
      const brandOk = activeBrand === 'all' || p.brandKey === activeBrand
      const q = search.toLowerCase()
      const searchOk = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      return catOk && brandOk && searchOk
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.priceNum - b.priceNum)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.priceNum - a.priceNum)
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sort === 'newest') list = [...list].filter((p) => p.isNew).concat(list.filter((p) => !p.isNew))
    return list
  }, [activeCat, activeBrand, search, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function goToPage(p: number) {
    setPage(p)
    prodsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="container">
          <div className="hero-inner">
            {/* Left */}
            <div className="hero-content">
              <div className="hero-badge">
                <span className="pulse-dot" />
                {t.hero.badge}
              </div>
              <h1 className="hero-title">
                {t.hero.titleLine1}<br />
                {t.hero.titleLine2}<br />
                <span className="gradient-text">{t.hero.titleHighlight}</span>
              </h1>
              <p className="hero-desc">
                {t.hero.desc}
              </p>
              <div className="hero-actions">
                <Link href="/products" className="btn btn-primary">{t.hero.shopNow}</Link>
                <Link href="#brands" className="btn btn-ghost">{t.hero.browseBrands}</Link>
              </div>
              <div className="hero-stats">
                {STATS.slice(0, 3).map((s) => (
                  <div key={s.labelKey} className="hero-stat">
                    <strong>{s.num}</strong>
                    <span>{t.stats[s.labelKey]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — POS Screen mockup */}
            <div className="hero-visual">
              <div className="pos-screen">
                <div className="pos-header">
                  <span>Vertex Terminal</span>
                  <span style={{ color: 'var(--green)', fontSize: 11 }}>{t.hero.terminalLive}</span>
                </div>
                <div className="pos-items">
                  {[
                    { name: 'Honeywell 1950g', sku: '#HW-1950', price: '$149.00' },
                    { name: 'Zebra ZD421', sku: '#ZB-ZD421', price: '$289.00' },
                    { name: 'Epson TM-T88VI', sku: '#EP-T88VI', price: '$199.00' },
                  ].map((item) => (
                    <div key={item.sku} className="pos-item">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                        <div className="pos-sku">{item.sku}</div>
                      </div>
                      <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{item.price}</div>
                    </div>
                  ))}
                </div>
                <div className="pos-total">
                  <span>{t.hero.total}</span>
                  <span>$637.00</span>
                </div>
                <button className="pos-btn">{t.hero.processPayment}</button>
                <div className="pos-pay-methods">
                  <span>{t.hero.payCard}</span>
                  <span>{t.hero.payNfc}</span>
                  <span>{t.hero.payCash}</span>
                </div>
              </div>

              <div className="float-card fc1">
                <div style={{ color: 'var(--green)', fontWeight: 800, fontSize: 20 }}>+$12,450</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{t.hero.todaySales}</div>
                <div style={{ fontSize: 11, marginTop: 2, color: 'var(--green)' }}>{t.hero.vsYesterday}</div>
              </div>
              <div className="float-card fc2">
                <div style={{ fontWeight: 800, fontSize: 18 }}>★ 4.9/5</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{t.hero.customerRating}</div>
                <div style={{ fontSize: 11, marginTop: 2, opacity: 0.6 }}>2,400+ {t.hero.reviews}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRANDS TICKER ── */}
      <div className="brands-ticker">
        <div className="ticker-track">
          {[...BRANDS_TICKER, ...BRANDS_TICKER].map((b, i) => (
            <span key={i} className="ticker-item">{b}</span>
          ))}
        </div>
      </div>

      {/* ── BRANDS SECTION ── */}
      <section id="brands" className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.brands.sectionTitle} <span className="gradient-text">{t.brands.sectionTitleHighlight}</span></h2>
            <p className="section-sub">{t.brands.sectionSub}</p>
          </div>
          <div className="brands-grid">
            {BRAND_CARDS.map((b) => (
              <div
                key={b.name}
                className="brand-card"
                onClick={() => setSelectedBrand(b)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedBrand(b))}
                role="button"
                tabIndex={0}
                aria-label={`${b.name} - ${t.brandCats[b.catKey as keyof typeof t.brandCats]}`}
                style={{ cursor: 'pointer' }}
              >
                {/* Colored banner with SVG logo */}
                <div
                  className="brand-banner"
                  style={{ background: `linear-gradient(135deg, ${b.c1}, ${b.c2})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/brands/${b.logo}`}
                    alt={b.name}
                    className="brand-logo-img"
                  />
                  <div className="brand-banner-shine" />
                </div>

                {/* Info */}
                <div className="brand-card-body">
                  <div className="brand-card-name">{b.name}</div>
                  <div className="brand-card-cat">{t.brandCats[b.catKey as keyof typeof t.brandCats]}</div>
                  <div className="brand-card-footer">
                    <span className="brand-count">
                      {liveCounts[b.name] != null
                        ? `${liveCounts[b.name]} ${liveCounts[b.name] === 1 ? t.brands.product : t.brands.products}`
                        : t.brands.loading}
                    </span>
                    <span className="brand-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL PRODUCTS ── */}
      <section id="products" className="section" style={{ background: 'var(--bg1)' }}>
        <div className="container" ref={prodsTopRef}>
          <div className="section-header">
            <h2 className="section-title">{t.productsSection.sectionTitle} <span className="gradient-text">{t.productsSection.sectionTitleHighlight}</span></h2>
            <p className="section-sub">{t.productsSection.sectionSub}</p>
          </div>

          {/* ── COMPACT TOOLBAR ── */}
          <div style={{ marginBottom: 24 }}>

            {/* Row 1: search + sort */}
            <div className="tb-row">
              <div className="tb-search-wrap">
                <span className="tb-search-icon">🔍</span>
                <input
                  type="text"
                  className="tb-search"
                  placeholder={t.productsSection.searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="tb-search-clear" onClick={() => setSearch('')}>✕</button>
                )}
              </div>
              <select className="tb-sort" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="default">{t.productsSection.sortDefault}</option>
                <option value="price-asc">{t.productsSection.sortPriceAsc}</option>
                <option value="price-desc">{t.productsSection.sortPriceDesc}</option>
                <option value="rating">{t.productsSection.sortRating}</option>
                <option value="newest">{t.productsSection.sortNewest}</option>
              </select>
            </div>

            {/* Row 2: category pills — single scrollable row */}
            <div className="tb-pills" style={{ marginBottom: 8 }}>
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  className={`tb-pill${activeCat === c.key ? ' active' : ''}`}
                  onClick={() => setActiveCat(c.key)}
                >{t.cats[c.label as keyof typeof t.cats] ?? c.label}</button>
              ))}
            </div>

            {/* Row 3: brand pills — single scrollable row */}
            <div className="tb-pills">
              {BRAND_FILTERS.map(b => (
                <button
                  key={b.key}
                  className={`tb-pill${activeBrand === b.key ? ' brand-active' : ''}`}
                  onClick={() => setActiveBrand(b.key)}
                >{b.key === 'all' ? t.brandFilters.all : b.label}</button>
              ))}
            </div>

            {/* Row 4: results count + clear — only when active */}
            {(activeCat !== 'all' || activeBrand !== 'all' || search) && (
              <div className="tb-results-row" style={{ marginTop: 10 }}>
                <span>{filtered.length} {filtered.length !== 1 ? t.productsSection.results : t.productsSection.result}</span>
                <button className="tb-clear" onClick={() => { setActiveCat('all'); setActiveBrand('all'); setSearch('') }}>{t.productsSection.clear}</button>
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="prods-grid">
            {paginated.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48 }}>
              <span style={{ fontSize: '.8rem', color: 'var(--text2)', marginRight: 4 }}>
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
                  ? <span key={`e${i}`} style={{ color: 'var(--text3)', padding: '0 2px' }}>…</span>
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

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.productsSection.noProducts}</p>
              <p style={{ marginTop: 8 }}>{t.productsSection.noProductsSub}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── BRAND DRAWER ── */}
      <BrandDrawer
        brand={selectedBrand}
        products={selectedBrand
          ? PRODUCTS.filter(p => p.brand.toLowerCase() === selectedBrand.name.toLowerCase())
          : []
        }
        onClose={() => setSelectedBrand(null)}
      />

      {/* ── STATS STRIP ── */}
      <section className="stats-strip">
        <div className="container">
          <div className="stats-inner">
            {STATS.map((s) => (
              <div key={s.labelKey} className="stat-item">
                <strong>{s.num}</strong>
                <span>{t.stats[s.labelKey]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

