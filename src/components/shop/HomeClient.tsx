'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useMemo, useEffect, useRef } from 'react'
import BrandDrawer from '@/components/shop/BrandDrawer'
import WishlistButton from '@/components/shop/WishlistButton'
import FadeIn from '@/components/ui/FadeIn'
import { useToast } from '@/components/ui/Toast'
import { ChevronLeft, ChevronRight, ShoppingCart, Mail, Phone, MapPin } from 'lucide-react'
import { useT } from '@/contexts/locale'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase-client'
import type { Product } from '@/types'

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

interface StatsData {
  customers: string
  products: string
  brands: string
  orders: string
  support: string
}

const DEFAULT_STATS: StatsData = { customers: '—', products: '—', brands: '—', orders: '—', support: '24/7' }

const STATS_KEYS: Array<keyof StatsData> = ['customers', 'products', 'brands', 'support']

export default function HomeClient({ products, statsData = DEFAULT_STATS }: { products: Product[]; statsData?: StatsData }) {
  const [selectedBrand, setSelectedBrand] = useState<typeof BRAND_CARDS[0] | null>(null)
  const [activeCat, setActiveCat] = useState('all')
  const [activeBrand, setActiveBrand] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)
  const [addedId, setAddedId] = useState<string | null>(null)
  const prodsTopRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const addItem = useCartStore((s) => s.addItem)
  const toast = useToast()
  const supabase = createClient()
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactHp, setContactHp] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const [contactError, setContactError] = useState('')

  useEffect(() => { setPage(1) }, [activeCat, activeBrand, search, sort])

  // Derive category list from real DB products
  const CATS = useMemo(() => {
    const used = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()
    return [{ key: 'all', label: 'All' }, ...used.map(c => ({ key: c, label: c }))]
  }, [products])

  // Derive brand filter list from real DB products
  const BRANDS = useMemo(() => {
    const used = Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort()
    return [{ key: 'all', label: 'All' }, ...used.map(b => ({ key: b.toLowerCase(), label: b }))]
  }, [products])

  // Brand product counts computed from props (no extra fetch needed)
  const liveCounts = useMemo(() => {
    const map: Record<string, number> = {}
    products.forEach(p => { if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1 })
    return map
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const catOk = activeCat === 'all' || p.category === activeCat
      const brandOk = activeBrand === 'all' || p.brand.toLowerCase() === activeBrand.toLowerCase()
      const q = search.toLowerCase()
      const searchOk = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.model || '').toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      return catOk && brandOk && searchOk
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating)
    else if (sort === 'newest') list = [...list].filter(p => p.is_new).concat(list.filter(p => !p.is_new))
    return list
  }, [products, activeCat, activeBrand, search, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function goToPage(n: number) {
    setPage(n)
    prodsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleAddToCart(p: Product) {
    addItem(p)
    setAddedId(p.id)
    toast(`${p.name} added to cart`, 'success')
    setTimeout(() => setAddedId(null), 1400)
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (contactHp) return
    setContactLoading(true)
    setContactError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      setContactError('Please enter a valid email address')
      setContactLoading(false)
      return
    }
    if (contactForm.name.length > 200 || contactForm.subject.length > 300 || contactForm.message.length > 5000) {
      setContactError('Please shorten your input')
      setContactLoading(false)
      return
    }
    const { error } = await supabase.from('contact_messages').insert(contactForm)
    if (error) {
      setContactError('Failed to send message. Please try again.')
    } else {
      setContactSuccess(true)
      setContactForm({ name: '', email: '', subject: '', message: '' })
    }
    setContactLoading(false)
  }

  const drawerProducts = useMemo(() =>
    selectedBrand ? products.filter(p => p.brand.toLowerCase() === selectedBrand.name.toLowerCase()) : []
  , [products, selectedBrand])

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
                {STATS_KEYS.slice(0, 3).map((key) => (
                  <div key={key} className="hero-stat">
                    <strong>{statsData[key]}</strong>
                    <span>{t.stats[key as keyof typeof t.stats]}</span>
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
          <FadeIn>
          <div className="section-header">
            <h2 className="section-title">{t.brands.sectionTitle} <span className="gradient-text">{t.brands.sectionTitleHighlight}</span></h2>
            <p className="section-sub">{t.brands.sectionSub}</p>
          </div>
          </FadeIn>
          <div className="brands-grid">
            {BRAND_CARDS.map((b, i) => (
              <FadeIn key={b.name} delay={i * 80}>
              <div
                className="brand-card"
                onClick={() => setSelectedBrand(b)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedBrand(b))}
                role="button"
                tabIndex={0}
                aria-label={`${b.name} - ${t.brandCats[b.catKey as keyof typeof t.brandCats]}`}
                style={{ cursor: 'pointer' }}
              >
                <div className="brand-banner" style={{ background: `linear-gradient(135deg, ${b.c1}, ${b.c2})` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/brands/${b.logo}`} alt={b.name} className="brand-logo-img" />
                  <div className="brand-banner-shine" />
                </div>
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
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL PRODUCTS ── */}
      <section id="products" className="section" style={{ background: 'var(--bg1)' }}>
        <div className="container" ref={prodsTopRef}>
          <FadeIn>
          <div className="section-header">
            <h2 className="section-title">{t.productsSection.sectionTitle} <span className="gradient-text">{t.productsSection.sectionTitleHighlight}</span></h2>
            <p className="section-sub">{t.productsSection.sectionSub}</p>
          </div>
          </FadeIn>

          {/* ── TOOLBAR ── */}
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

            {/* Row 2: category pills */}
            <div className="tb-pills" style={{ marginBottom: 8 }}>
              {CATS.filter(c => c.key === 'all' || products.some(p => p.category === c.key)).map(c => (
                <button
                  key={c.key}
                  className={`tb-pill${activeCat === c.key ? ' active' : ''}`}
                  onClick={() => setActiveCat(c.key)}
                >{t.cats[c.key as keyof typeof t.cats] ?? c.label}</button>
              ))}
            </div>

            {/* Row 3: brand pills */}
            <div className="tb-pills">
              {BRANDS.map(b => (
                <button
                  key={b.key}
                  className={`tb-pill${activeBrand === b.key ? ' brand-active' : ''}`}
                  onClick={() => setActiveBrand(b.key)}
                >{b.key === 'all' ? t.brandFilters.all : b.label}</button>
              ))}
            </div>

            {/* Row 4: results count + clear */}
            {(activeCat !== 'all' || activeBrand !== 'all' || search) && (
              <div className="tb-results-row" style={{ marginTop: 10 }}>
                <span>{filtered.length} {filtered.length !== 1 ? t.productsSection.results : t.productsSection.result}</span>
                <button className="tb-clear" onClick={() => { setActiveCat('all'); setActiveBrand('all'); setSearch('') }}>{t.productsSection.clear}</button>
              </div>
            )}
          </div>

          {/* ── GRID ── */}
          {paginated.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.productsSection.noProducts}</p>
              <p style={{ marginTop: 8 }}>{t.productsSection.noProductsSub}</p>
            </div>
          ) : (
            <div className="prods-grid">
              {paginated.map((p) => {
                const img = p.images?.[0]
                const isAdded = addedId === p.id
                return (
                  <div key={p.id} className="prod-card">
                    {/* Badges */}
                    <div className="prod-badges">
                      {p.is_hot && <span className="badge-hot">{t.productCard.hot}</span>}
                      {p.is_new && <span className="badge-new">{t.productCard.new}</span>}
                      {!p.in_stock && <span className="badge-out">Out of Stock</span>}
                    </div>

                    {/* Image */}
                    <Link href={`/products/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                      <div className="prod-img" style={{ position: 'relative', background: '#fff' }}>
                        {img ? (
                          <Image src={img} alt={p.name} fill style={{ objectFit: 'contain', padding: 12 }} sizes="280px" />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '3.5rem' }}>📦</div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="prod-body">
                      <div className="prod-brand">{p.brand}</div>
                      <Link href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
                        <h3 className="prod-name">{p.name}</h3>
                      </Link>
                      <div className="prod-rating">
                        <span className="stars">{'★'.repeat(Math.round(p.rating))}</span>
                        <span className="rnum">{p.rating}</span>
                        <span className="rcnt">({p.review_count.toLocaleString()})</span>
                      </div>
                      <div className="prod-price">
                        <span className="pm">${p.price.toFixed(2)}</span>
                        {p.old_price && <span className="po">${p.old_price.toFixed(2)}</span>}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="prod-footer">
                      <div onClick={(e) => e.preventDefault()}>
                        <WishlistButton productId={p.id} size={16} />
                      </div>
                      <button
                        className="btn-cart"
                        disabled={!p.in_stock}
                        onClick={() => p.in_stock && handleAddToCart(p)}
                        style={
                          !p.in_stock
                            ? { opacity: 0.45, cursor: 'not-allowed', fontSize: '.75rem' }
                            : isAdded
                            ? { background: 'rgba(16,185,129,.15)', color: '#10b981', boxShadow: 'none' }
                            : {}
                        }
                      >
                        {!p.in_stock
                          ? 'Out of Stock'
                          : isAdded
                          ? t.productCard.added
                          : <><ShoppingCart size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />{t.productCard.addToCart}</>
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── PAGINATION ── */}
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
        </div>
      </section>

      {/* ── BRAND DRAWER ── */}
      <BrandDrawer
        brand={selectedBrand}
        products={drawerProducts}
        onClose={() => setSelectedBrand(null)}
      />

      {/* ── CONTACT SECTION ── */}
      <section id="contact" className="section" style={{ background: 'var(--bg0)' }}>
        <div className="container" style={{ maxWidth: 1100 }}>
          <FadeIn>
            <div className="section-header">
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Support</p>
              <h2 className="section-title">{t.contact.title.split(' ')[0]} <span className="gradient-text">{t.contact.title.split(' ').slice(1).join(' ')}</span></h2>
              <p className="section-sub">Have a question about our products? Our team is ready to help you find the perfect POS solution.</p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: 48, alignItems: 'start' }}>
            {/* Left — contact info */}
            <FadeIn>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { icon: Mail, label: 'Email', value: 'safaothman1631@gmail.com', sub: 'We reply within 24 hours' },
                  { icon: Phone, label: 'Phone', value: '+964 750 529 9118 / +964 750 870 6750', sub: 'Mon-Fri, 9am-6pm' },
                  { icon: MapPin, label: 'Address', value: 'سوڵتان مزەفەر فەرعی جیهانی کامیرە بینای ئیپسۆن', sub: 'Visit us anytime' },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '20px 24px',
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(99,102,241,.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 2 }}>{label}</div>
                      <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '.9rem', marginBottom: 2 }}>{value}</div>
                      <div style={{ color: 'var(--text2)', fontSize: '.82rem' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            {/* Right — form */}
            <FadeIn delay={100}>
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '36px 40px',
              }}>
                {contactSuccess ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>{t.contact.sent}</h3>
                    <p style={{ color: 'var(--text2)' }}>{t.contact.sub}</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{t.contact.title}</h3>

                    {/* Honeypot */}
                    <div style={{ position: 'absolute', left: -9999, opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                      <input tabIndex={-1} autoComplete="off" value={contactHp} onChange={e => setContactHp(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {(['name', 'email'] as const).map((key) => (
                        <div key={key}>
                          <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{key === 'name' ? t.contact.name : t.contact.email}</label>
                          <input
                            type={key === 'email' ? 'email' : 'text'}
                            required
                            placeholder={key === 'name' ? t.contact.namePlaceholder : t.contact.emailPlaceholder}
                            value={contactForm[key]}
                            onChange={(e) => setContactForm({ ...contactForm, [key]: e.target.value })}
                            style={{
                              width: '100%', padding: '10px 14px', borderRadius: 10,
                              background: 'var(--bg3)', border: '1px solid var(--border)',
                              color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{t.contact.message}</label>
                      <input
                        type="text"
                        required
                        placeholder={t.contact.messagePlaceholder}
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{t.contact.message}</label>
                      <textarea
                        required
                        rows={5}
                        placeholder={t.contact.messagePlaceholder}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                          resize: 'vertical', fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {contactError && <p style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{contactError}</p>}

                    <button
                      type="submit"
                      disabled={contactLoading}
                      style={{
                        padding: '14px', borderRadius: 12, fontWeight: 800,
                        fontSize: '1rem', background: 'var(--gradient)',
                        color: '#fff', border: 'none',
                        cursor: contactLoading ? 'not-allowed' : 'pointer',
                        opacity: contactLoading ? 0.6 : 1, transition: 'opacity .2s',
                      }}
                    >
                      {contactLoading ? t.contact.sending : t.contact.send + ' ✉'}
                    </button>
                  </form>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="stats-strip">
        <div className="container">
          <FadeIn>
          <div className="stats-inner">
            {STATS_KEYS.map((key) => (
              <div key={key} className="stat-item">
                <strong>{statsData[key]}</strong>
                <span>{t.stats[key as keyof typeof t.stats]}</span>
              </div>
            ))}
          </div>
          </FadeIn>
        </div>
      </section>
    </main>
  )
}
