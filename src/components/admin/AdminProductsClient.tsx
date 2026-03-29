'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ImageOff } from 'lucide-react'
import Image from 'next/image'
import type { Product } from '@/types'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const EMPTY_PRODUCT: Partial<Product> = {
  name: '', brand: '', model: '', category: '',
  price: 0, old_price: null, description: '', specs: [],
  images: [], rating: 4.5, review_count: 0,
  in_stock: true, is_new: false, is_hot: false, hidden: false,
}

export default function AdminProductsClient({ products: initial, dbCategories = [], dbBrands = [] }: { products: Product[]; dbCategories?: string[]; dbBrands?: string[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY_PRODUCT)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [newBrand, setNewBrand] = useState('')
  const [showNewBrand, setShowNewBrand] = useState(false)
  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden'
      // Scroll modal content to top
      if (modalRef.current) modalRef.current.scrollTop = 0
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showForm])

  // All unique categories
  const allCats = useMemo(() => {
    const fromProducts = products.map(p => p.category).filter(Boolean)
    return Array.from(new Set([...dbCategories, ...fromProducts])).sort()
  }, [products, dbCategories])

  // All unique brands
  const allBrands = useMemo(() => {
    const fromProducts = products.map(p => p.brand).filter(Boolean)
    return Array.from(new Set([...dbBrands, ...fromProducts])).sort()
  }, [products, dbBrands])

  function openNew() {
    setEditing(EMPTY_PRODUCT)
    setIsEdit(false)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing({ ...p })
    setIsEdit(true)
    setShowForm(true)
  }

  async function handleSave() {
    setLoading(true)
    if (isEdit && editing.id) {
      const { id, created_at, ...rest } = editing as Product
      const { data } = await supabase.from('products').update(rest).eq('id', id).select().single()
      if (data) setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
    } else {
      const { created_at, id, ...rest } = editing as Product
      const { data } = await supabase.from('products').insert(rest).select().single()
      if (data) setProducts((prev) => [data, ...prev])
    }
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  async function handleToggle(id: string, field: 'hidden' | 'in_stock', current: boolean) {
    await supabase.from('products').update({ [field]: !current }).eq('id', id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: !current } : p))

    // Log inventory change when in_stock toggled
    if (field === 'in_stock') {
      await supabase.from('inventory_log').insert({
        product_id: id,
        change: current ? -1 : 1,
        reason: current ? 'Marked out of stock' : 'Marked in stock',
      })
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Desktop Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['Name', 'Brand', 'Category', 'Price', 'Status', 'Actions'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>No products yet</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td style={{ maxWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      {p.images?.[0] ? (
                        <Image src={p.images[0]} alt={p.name} width={38} height={38} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      ) : (
                        <ImageOff size={16} style={{ color: 'var(--text2)', opacity: 0.4 }} />
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'monospace' }}>{p.model}</div>
                    </div>
                  </div>
                </td>
                <td>{p.brand}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>${p.price.toFixed(2)}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <button onClick={() => handleToggle(p.id, 'in_stock', p.in_stock)} title={p.in_stock ? 'Mark out of stock' : 'Mark in stock'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {p.in_stock
                        ? <span className="admin-badge admin-badge-green">In Stock</span>
                        : <span className="admin-badge admin-badge-red">Out of Stock</span>
                      }
                    </button>
                    {p.hidden && <span className="admin-badge admin-badge-purple">Hidden</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => handleToggle(p.id, 'hidden', p.hidden)} title={p.hidden ? 'Show in shop' : 'Hide from shop'} style={{ color: p.hidden ? '#a855f7' : 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {p.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => openEdit(p)} title="Edit" style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} title="Delete" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>No products yet</div>
        ) : products.map((p) => (
          <div key={p.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    <ImageOff size={18} style={{ color: 'var(--text2)', opacity: 0.4 }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'monospace', marginTop: 2 }}>{p.brand} · {p.model}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button onClick={() => handleToggle(p.id, 'hidden', p.hidden)} title={p.hidden ? 'Show in shop' : 'Hide from shop'} style={{ color: p.hidden ? '#a855f7' : 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {p.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(p)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(p.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1rem' }}>${p.price.toFixed(2)}</span>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)', textTransform: 'capitalize', background: 'var(--bg3)', borderRadius: 6, padding: '2px 8px' }}>{p.category}</span>
              <button onClick={() => handleToggle(p.id, 'in_stock', p.in_stock)} title={p.in_stock ? 'Mark out of stock' : 'Mark in stock'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {p.in_stock
                  ? <span className="admin-badge admin-badge-green">In Stock</span>
                  : <span className="admin-badge admin-badge-red">Out of Stock</span>
                }
              </button>
              {p.is_new && <span className="admin-badge admin-badge-blue">New</span>}
              {p.is_hot && <span className="admin-badge admin-badge-yellow">Hot</span>}
              {p.hidden && <span className="admin-badge admin-badge-purple">Hidden</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            <div className="admin-form-grid">
              {([
                { key: 'name', label: 'Product Name', span: 2 },
                { key: 'model', label: 'Model' },
                { key: 'price', label: 'Price ($)', type: 'number' },
                { key: 'old_price', label: 'Old Price ($)', type: 'number' },
                { key: 'description', label: 'Description', span: 2, textarea: true },
                { key: 'specs', label: 'Specs (one per line)', span: 2, textarea: true, isArray: true },
                { key: 'images', label: 'Image URLs (one per line)', span: 2, textarea: true, isArray: true },
              ] as { key: keyof Product; label: string; span?: number; type?: string; textarea?: boolean; isArray?: boolean }[]).map(
                ({ key, label, span, type, textarea, isArray }) => (
                  <div key={key} style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>{label}</label>
                    {textarea ? (
                      <textarea
                        rows={3}
                        value={isArray ? (editing[key] as string[] | undefined)?.join('\n') ?? '' : (editing[key] as string) ?? ''}
                        onChange={(e) => setEditing({ ...editing, [key]: isArray ? e.target.value.split('\n').filter(Boolean) : e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                    ) : (
                      <input
                        type={type || 'text'}
                        value={editing[key] as string | number ?? ''}
                        onChange={(e) => setEditing({ ...editing, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                )
              )}

              {/* Brand dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>Brand</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={editing.brand ?? ''}
                    onChange={e => setEditing({ ...editing, brand: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewBrand(v => !v)} className="admin-btn admin-btn-ghost" title="Add new brand">
                    <Plus size={15} />
                  </button>
                </div>
                {showNewBrand && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="New brand name…"
                      value={newBrand}
                      onChange={e => setNewBrand(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none' }}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && newBrand.trim()) {
                        const t = newBrand.trim()
                        await supabase.from('brands').insert({ name: t, logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
                        setEditing({ ...editing, brand: t })
                        setNewBrand('')
                        setShowNewBrand(false)
                        router.refresh()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newBrand.trim()) {
                          const t = newBrand.trim()
                          await supabase.from('brands').insert({ name: t, logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
                          setEditing({ ...editing, brand: t })
                          setNewBrand('')
                          setShowNewBrand(false)
                          router.refresh()
                        }
                      }}
                      className="admin-btn admin-btn-primary"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Category dropdown */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>Category</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={editing.category ?? ''}
                    onChange={e => setEditing({ ...editing, category: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCat(v => !v)}
                    className="admin-btn admin-btn-ghost"
                    title="Add new category"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {showNewCat && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="New category name…"
                      value={newCat}
                      onChange={e => setNewCat(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none' }}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && newCat.trim()) {
                          const trimmed = newCat.trim()
                          await supabase.from('categories').insert({ name: trimmed, slug: toSlug(trimmed), icon: '', sort_order: 999 })
                          setEditing({ ...editing, category: trimmed })
                          setNewCat('')
                          setShowNewCat(false)
                          router.refresh()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (newCat.trim()) {
                          const trimmed = newCat.trim()
                          await supabase.from('categories').insert({ name: trimmed, slug: toSlug(trimmed), icon: '', sort_order: 999 })
                          setEditing({ ...editing, category: trimmed })
                          setNewCat('')
                          setShowNewCat(false)
                          router.refresh()
                        }
                      }}
                      className="admin-btn admin-btn-primary"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {(['in_stock', 'is_new', 'is_hot'] as const).map((k) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.88rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                  <input
                    type="checkbox"
                    checked={editing[k] as boolean ?? false}
                    onChange={(e) => setEditing({ ...editing, [k]: e.target.checked })}
                    style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                  />
                  {k.replace('_', ' ')}
                </label>
              ))}
              <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: `1.5px solid ${editing.hidden ? '#a855f7' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: editing.hidden ? 'rgba(168,85,247,.08)' : 'transparent', cursor: 'pointer', transition: 'border-color .2s, background .2s' }}>
                <input
                  type="checkbox"
                  checked={editing.hidden ?? false}
                  onChange={(e) => setEditing({ ...editing, hidden: e.target.checked })}
                  style={{ accentColor: '#a855f7', width: '16px', height: '16px', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: editing.hidden ? '#a855f7' : 'var(--text)' }}>
                    {editing.hidden ? 'Hidden from shop' : 'Visible in shop'}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginTop: 2 }}>When hidden, this product won&apos;t appear to customers</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
