'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, Eye, Package } from 'lucide-react'
import ImageUploader from './ImageUploader'
import AdminSearch from './AdminSearch'
import AdminPagination from './AdminPagination'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'

interface BrandProduct {
  id: string
  name: string
  model: string
  price: number
  images: string[]
  in_stock: boolean
}

interface Brand {
  id: string
  name: string
  logo: string
  color1: string
  color2: string
  category_key: string
  created_at: string
}

export default function AdminBrandsClient({
  brands: initial,
  productCounts,
  productsByBrand,
}: {
  brands: Brand[]
  productCounts: Record<string, number>
  productsByBrand: Record<string, BrandProduct[]>
}) {
  const router = useRouter()
  const t = useT()
  const { formatPrice } = usePreferences()
  const [brands, setBrands] = useState<Brand[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Brand>>({ name: '', logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewBrand, setViewBrand] = useState<Brand | null>(null)
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([])
  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return brands
    const q = searchQ.toLowerCase()
    return brands.filter(b => b.name.toLowerCase().includes(q) || (b.category_key ?? '').toLowerCase().includes(q))
  }, [brands, searchQ])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  // Sync when server re-fetches (after router.refresh)
  useEffect(() => { setBrands(initial) }, [initial])

  useEffect(() => { setPage(1) }, [searchQ])

  function openBrandProducts(b: Brand) {
    setViewBrand(b)
    setBrandProducts(productsByBrand[b.name] ?? [])
  }

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden'
      if (modalRef.current) modalRef.current.scrollTop = 0
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showForm])

  function openNew() {
    setEditing({ name: '', logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
    setIsEdit(false)
    setShowForm(true)
  }

  function openEdit(b: Brand) {
    setEditing({ ...b })
    setIsEdit(true)
    setShowForm(true)
  }

  async function handleSave() {
    if (!editing.name?.trim()) return
    setLoading(true)
    const payload = {
      name: editing.name!.trim(),
      logo: editing.logo ?? '',
      color1: editing.color1 ?? '#6366f1',
      color2: editing.color2 ?? '#4338ca',
      category_key: editing.category_key ?? '',
    }
    if (isEdit && editing.id) {
      const { data } = await supabase.from('brands').update(payload).eq('id', editing.id).select().single()
      if (data) setBrands(prev => prev.map(b => b.id === editing.id ? data : b))
    } else {
      const { data } = await supabase.from('brands').insert(payload).select().single()
      if (data) setBrands(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    }
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    const count = productCounts[name] ?? 0
    if (count > 0) {
      alert(t.admin.cantDeleteBrand)
      return
    }
    if (!confirm(t.admin.moveBrandToTrash)) return
    const brand = brands.find(b => b.id === id)
    if (brand) {
      await supabase.from('trash').insert({ table_name: 'brands', record_id: id, record_data: brand })
    }
    await supabase.from('brands').delete().eq('id', id)
    setBrands(prev => prev.filter(b => b.id !== id))
    router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">{filtered.length} {t.admin.brands}</p>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> {t.admin.addBrand}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AdminSearch value={searchQ} onChange={setSearchQ} placeholder={`${t.admin.search}…`} />
      </div>

      {/* Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {[t.admin.color1, t.admin.name, t.admin.logo, t.admin.categoryKey, t.admin.productCount, t.admin.actions].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>{t.admin.noBrands}</td></tr>
            ) : paginated.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: b.color1, border: '1px solid var(--border)' }} />
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: b.color2, border: '1px solid var(--border)' }} />
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>{b.name}</td>
                <td>
                  {b.logo ? (
                    <div style={{ width: 32, height: 32, borderRadius: 6, overflow: 'hidden', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logo.startsWith('http') ? b.logo : `/images/brands/${b.logo}`} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text2)', fontSize: '.8rem' }}>—</span>
                  )}
                </td>
                <td style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{b.category_key || '—'}</td>
                <td>
                  <button
                    onClick={() => openBrandProducts(b)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: (productCounts[b.name] ?? 0) > 0 ? 'var(--primary)' : 'var(--text2)', fontWeight: 700 }}
                    title={`View ${productCounts[b.name] ?? 0} products`}
                  >
                    {productCounts[b.name] ?? 0}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => openBrandProducts(b)} title={t.admin.viewProducts} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Eye size={14} />
                    </button>
                    <button onClick={() => openEdit(b)} title={t.admin.edit} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(b.id, b.name)} title={t.admin.delete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="admin-mobile-cards">
        {paginated.map(b => (
          <div key={b.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${b.color1}, ${b.color2})`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{b.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'monospace', marginTop: 2 }}>{b.logo ? t.admin.logoAdded : t.admin.noLogo}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(b)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(b.id, b.name)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => openBrandProducts(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span className="admin-badge admin-badge-blue" style={{ cursor: 'pointer' }}>{productCounts[b.name] ?? 0} {t.admin.products}</span>
              </button>
              {b.category_key && <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{b.category_key}</span>}
            </div>
          </div>
        ))}
      </div>

      <AdminPagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? t.admin.editBrand : t.admin.newBrand}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            {/* Preview banner */}
            <div style={{ height: 60, borderRadius: 12, background: `linear-gradient(135deg, ${editing.color1 ?? '#6366f1'}, ${editing.color2 ?? '#4338ca'})`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{editing.name || t.admin.brandPreview}</span>
            </div>

            <div className="admin-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.brandName}</label>
                <input
                  type="text"
                  value={editing.name ?? ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. Honeywell"
                />
              </div>
              <div>
                <ImageUploader
                  value={editing.logo ? [editing.logo] : []}
                  onChange={(urls) => setEditing({ ...editing, logo: urls[0] ?? '' })}
                  folder="brands"
                  multiple={false}
                  label="Logo"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.categoryKey}</label>
                <input
                  type="text"
                  value={editing.category_key ?? ''}
                  onChange={e => setEditing({ ...editing, category_key: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="scanners-mobility"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.color1}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={editing.color1 ?? '#6366f1'}
                    onChange={e => setEditing({ ...editing, color1: e.target.value })}
                    style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={editing.color1 ?? '#6366f1'}
                    onChange={e => setEditing({ ...editing, color1: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.color2}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={editing.color2 ?? '#4338ca'}
                    onChange={e => setEditing({ ...editing, color2: e.target.value })}
                    style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <input
                    type="text"
                    value={editing.color2 ?? '#4338ca'}
                    onChange={e => setEditing({ ...editing, color2: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 11 }}>
                {loading ? t.admin.loading : isEdit ? t.admin.saveChanges : t.admin.create}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">{t.admin.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Brand Products Modal */}
      {viewBrand && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setViewBrand(null) }}
        >
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${viewBrand.color1}, ${viewBrand.color2})`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>{viewBrand.name}</h2>
                <p style={{ color: 'var(--text2)', fontSize: '.82rem', margin: 0 }}>{brandProducts.length} {t.admin.productCount}</p>
              </div>
              <Link
                href={`/admin/products`}
                style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: 'rgba(99,102,241,.1)' }}
              >
                {t.admin.viewProducts} →
              </Link>
              <button onClick={() => setViewBrand(null)} title={t.admin.close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
              {brandProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
                  <Package size={40} style={{ opacity: .3, marginBottom: 12 }} />
                  <p>{t.admin.noProducts}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {brandProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      {/* Thumbnail */}
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'contain', padding: 4 }} sizes="48px" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📦</div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{p.model}</div>
                      </div>
                      {/* Price */}
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '.92rem', flexShrink: 0 }}>{formatPrice(p.price)}</span>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {p.in_stock
                          ? <span className="admin-badge admin-badge-green">{t.admin.inStock}</span>
                          : <span className="admin-badge admin-badge-red">{t.admin.outOfStock}</span>
                        }
                      </div>
                      {/* View link */}
                      <Link href={`/products/${p.id}`} target="_blank" style={{ color: 'var(--text2)', flexShrink: 0, textDecoration: 'none' }} title={t.admin.viewInShop}>
                        <Eye size={15} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
