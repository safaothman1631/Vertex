'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ImageOff, Download, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { exportProducts } from '@/lib/csv-export'
import Image from 'next/image'
import ImageUploader from './ImageUploader'
import AdminSearch from './AdminSearch'
import AdminPagination from './AdminPagination'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'
import type { Product } from '@/types'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const EMPTY_PRODUCT: Partial<Product> = {
  name: '', brand: '', model: '', category: '',
  price: 0, old_price: null, description: '', specs: [],
  images: [], rating: 4.5, review_count: 0,
  in_stock: true, is_new: false, is_hot: false, hidden: false, sort_order: 0,
}

export default function AdminProductsClient({ products: initial, dbCategories = [], dbBrands = [] }: { products: Product[]; dbCategories?: string[]; dbBrands?: string[] }) {
  const router = useRouter()
  const t = useT()
  const { formatPrice } = usePreferences()
  const { confirm, confirmProps } = useConfirm()
  const [products, setProducts] = useState<Product[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY_PRODUCT)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [newBrand, setNewBrand] = useState('')
  const [showNewBrand, setShowNewBrand] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [searchQ, setSearchQ] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStock, setFilterStock] = useState<'' | 'in' | 'out'>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingSortId, setEditingSortId] = useState<string | null>(null)
  const [editingSortVal, setEditingSortVal] = useState('')
  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)

  // Fix duplicate sort_order values on mount
  useEffect(() => {
    const orders = initial.map(p => p.sort_order ?? 0)
    const hasDupes = new Set(orders).size !== orders.length
    if (!hasDupes) return
    const sorted = [...initial].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const fixed = sorted.map((p, i) => ({ ...p, sort_order: i }))
    setProducts(fixed)
    // Persist
    Promise.all(fixed.map(p => supabase.from('products').update({ sort_order: p.sort_order }).eq('id', p.id)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Filtered products
  const filtered = useMemo(() => {
    let list = products
    if (searchQ) {
      const q = searchQ.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.model?.toLowerCase().includes(q))
    }
    if (filterCat) list = list.filter(p => p.category === filterCat)
    if (filterBrand) list = list.filter(p => p.brand === filterBrand)
    if (filterStock === 'in') list = list.filter(p => p.in_stock)
    if (filterStock === 'out') list = list.filter(p => !p.in_stock)
    return list
  }, [products, searchQ, filterCat, filterBrand, filterStock])

  // Paginated slice
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [searchQ, filterCat, filterBrand, filterStock])

  function openNew() {
    setEditing(EMPTY_PRODUCT)
    setIsEdit(false)
    setFormErrors({})
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing({ ...p })
    setIsEdit(true)
    setFormErrors({})
    setShowForm(true)
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}
    if (!editing.name?.trim()) errors.name = t.admin.fieldRequired
    if (!editing.price || editing.price <= 0) errors.price = t.admin.fieldRequired
    if (!editing.category?.trim()) errors.category = t.admin.fieldRequired
    if (!editing.brand?.trim()) errors.brand = t.admin.fieldRequired
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!validateForm()) return
    setLoading(true)
    if (isEdit && editing.id) {
      const prevProduct = products.find(p => p.id === editing.id)
      const { id, created_at, ...rest } = editing as Product
      const { data } = await supabase.from('products').update(rest).eq('id', id).select().single()
      if (data) {
        setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
        // Trigger back-in-stock notifications if restocked
        if (!prevProduct?.in_stock && data.in_stock) {
          fetch('/api/stock-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id }),
          }).catch(() => {})
        }
      }
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
    const ok = await confirm({ message: 'Move this product to trash?', title: 'Delete Product' })
    if (!ok) return
    const product = products.find(p => p.id === id)
    if (product) {
      await supabase.from('trash').insert({ table_name: 'products', record_id: id, record_data: product })
    }
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
      // Trigger back-in-stock notifications when restocked
      if (!current) {
        fetch('/api/stock-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: id }),
        }).catch(() => {})
      }
    }
  }

  async function handleSortOrder(id: string, direction: 'up' | 'down') {
    const idx = products.findIndex(p => p.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= products.length) return

    let current = products
    const allSame = current.length > 1 && current.every(p => (p.sort_order ?? 0) === (current[0].sort_order ?? 0))
    if (allSame) {
      await Promise.all(current.map((p, i) =>
        supabase.from('products').update({ sort_order: i }).eq('id', p.id)
      ))
      current = current.map((p, i) => ({ ...p, sort_order: i }))
    }

    const a = current[idx]
    const b = current[swapIdx]
    await Promise.all([
      supabase.from('products').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('products').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    setProducts(() => {
      const next = [...current]
      next[idx] = { ...a, sort_order: b.sort_order }
      next[swapIdx] = { ...b, sort_order: a.sort_order }
      next.sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0))
      return next
    })
  }

  // Inline sort_order edit
  async function handleSortOrderEdit(id: string, val: string) {
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 0) { setEditingSortId(null); return }
    setEditingSortId(null)
    await supabase.from('products').update({ sort_order: num }).eq('id', id)
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, sort_order: num } : p)
      next.sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0))
      return next
    })
  }

  // Drag-and-drop reorder
  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4'
    }
  }
  function handleDragEnd(e: React.DragEvent) {
    setDragId(null)
    setDragOverId(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== dragOverId) setDragOverId(id)
  }
  async function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const fromIdx = products.findIndex(p => p.id === dragId)
    const toIdx = products.findIndex(p => p.id === targetId)
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); setDragOverId(null); return }
    const next = [...products]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    const updated = next.map((p, i) => ({ ...p, sort_order: i }))
    setProducts(updated)
    setDragId(null)
    setDragOverId(null)
    // Persist only changed sort_orders
    const changes = updated.filter(p => {
      const orig = products.find(o => o.id === p.id)
      return orig && orig.sort_order !== p.sort_order
    })
    await Promise.all(changes.map(p =>
      supabase.from('products').update({ sort_order: p.sort_order }).eq('id', p.id)
    ))
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paginated.map(p => p.id)))
  }

  async function bulkDelete() {
    const ok = await confirm({ message: `Move ${selectedIds.size} product(s) to trash?`, title: 'Bulk Delete' })
    if (!ok) return
    setBulkLoading(true)
    const ids = Array.from(selectedIds)
    const toTrash = products.filter(p => ids.includes(p.id))
    for (const p of toTrash) {
      await supabase.from('trash').insert({ table_name: 'products', record_id: p.id, record_data: p })
    }
    await supabase.from('products').delete().in('id', ids)
    setProducts(prev => prev.filter(p => !ids.includes(p.id)))
    setSelectedIds(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  async function bulkToggle(field: 'hidden' | 'in_stock', value: boolean) {
    setBulkLoading(true)
    const ids = Array.from(selectedIds)
    await supabase.from('products').update({ [field]: value }).in('id', ids)
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, [field]: value } : p))
    setSelectedIds(new Set())
    setBulkLoading(false)
    router.refresh()
  }

  return (
    <div>
      {/* Search & Filter Toolbar */}
      <div className="admin-filter-toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <AdminSearch value={searchQ} onChange={setSearchQ} placeholder={t.admin.search + '...'} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem', padding: '7px 10px' }}>
          <option value="">{t.admin.category}: {t.admin.filter}</option>
          {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem', padding: '7px 10px' }}>
          <option value="">{t.admin.brand}: {t.admin.filter}</option>
          {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterStock} onChange={e => setFilterStock(e.target.value as '' | 'in' | 'out')} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem', padding: '7px 10px' }}>
          <option value="">{t.admin.inStock} / {t.admin.outOfStock}</option>
          <option value="in">{t.admin.inStock}</option>
          <option value="out">{t.admin.outOfStock}</option>
        </select>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: 12, flexWrap: 'wrap' }}>
        {/* Bulk Actions */}
        {selectedIds.size > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--primary)' }}>{selectedIds.size} {t.admin.selected}</span>
            <button onClick={bulkDelete} disabled={bulkLoading} className="admin-btn" style={{ fontSize: '.78rem', padding: '6px 14px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: 'var(--danger)' }}>
              <Trash2 size={13} /> {t.admin.delete}
            </button>
            <button onClick={() => bulkToggle('hidden', true)} disabled={bulkLoading} className="admin-btn" style={{ fontSize: '.78rem', padding: '6px 14px', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.3)', color: '#a855f7' }}>
              <EyeOff size={13} /> {t.admin.hide}
            </button>
            <button onClick={() => bulkToggle('hidden', false)} disabled={bulkLoading} className="admin-btn" style={{ fontSize: '.78rem', padding: '6px 14px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', color: '#22c55e' }}>
              <Eye size={13} /> {t.admin.show}
            </button>
            <button onClick={() => bulkToggle('in_stock', false)} disabled={bulkLoading} className="admin-btn" style={{ fontSize: '.78rem', padding: '6px 14px', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', color: '#f59e0b' }}>
              {t.admin.outOfStock}
            </button>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}><X size={16} /></button>
          </div>
        ) : <div />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportProducts(filtered)} className="admin-btn admin-btn-ghost" title="Export CSV">
            <Download size={15} /> CSV
          </button>
          <button onClick={openNew} className="admin-btn admin-btn-primary">
            <Plus size={15} /> {t.admin.addProductBtn}
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={paginated.length > 0 && selectedIds.size === paginated.length} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
              </th>
              {[t.admin.name, t.admin.brand, t.admin.category, t.admin.price, '#', t.admin.status, t.admin.actions].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>{t.admin.noProducts}</td></tr>
            ) : paginated.map((p) => (
              <tr
                key={p.id}
                draggable
                onDragStart={e => handleDragStart(e, p.id)}
                onDragEnd={handleDragEnd}
                onDragOver={e => handleDragOver(e, p.id)}
                onDrop={e => handleDrop(e, p.id)}
                style={{
                  background: dragOverId === p.id && dragId !== p.id ? 'rgba(99,102,241,.12)' : selectedIds.has(p.id) ? 'rgba(99,102,241,.06)' : undefined,
                  borderTop: dragOverId === p.id && dragId !== p.id ? '2px solid var(--primary)' : undefined,
                  transition: 'background .15s',
                }}
              >
                <td>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
                </td>
                <td style={{ maxWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ cursor: 'grab', color: 'var(--text3)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <GripVertical size={16} />
                    </div>
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
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{formatPrice(p.price)}</td>
                <td>
                  {editingSortId === p.id ? (
                    <input
                      type="number"
                      min={0}
                      autoFocus
                      value={editingSortVal}
                      onChange={e => setEditingSortVal(e.target.value)}
                      onBlur={() => handleSortOrderEdit(p.id, editingSortVal)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSortOrderEdit(p.id, editingSortVal); if (e.key === 'Escape') setEditingSortId(null) }}
                      style={{ width: 48, fontSize: '.75rem', fontFamily: 'monospace', textAlign: 'center', padding: '2px 4px', border: '1px solid var(--primary)', borderRadius: 4, outline: 'none', background: 'var(--bg2)', color: 'var(--text)' }}
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingSortId(p.id); setEditingSortVal(String(p.sort_order ?? 0)) }}
                      style={{ fontSize: '.75rem', fontFamily: 'monospace', color: 'var(--text2)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, border: '1px solid transparent' }}
                      title="Click to edit"
                    >{p.sort_order ?? 0}</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                    <button onClick={() => handleToggle(p.id, 'in_stock', p.in_stock)} title={p.in_stock ? t.admin.markOutOfStock : t.admin.markInStock} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {p.in_stock
                        ? <span className="admin-badge admin-badge-green">{t.admin.inStock}</span>
                        : <span className="admin-badge admin-badge-red">{t.admin.outOfStock}</span>
                      }
                    </button>
                    {p.hidden && <span className="admin-badge admin-badge-purple">{t.admin.hidden}</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => handleToggle(p.id, 'hidden', p.hidden)} title={p.hidden ? t.admin.show : t.admin.hide} style={{ color: p.hidden ? '#a855f7' : 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                      {p.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => openEdit(p)} title={t.admin.edit} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} title={t.admin.delete} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
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
        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>{t.admin.noProducts}</div>
        ) : paginated.map((p) => (
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
                <button onClick={() => handleToggle(p.id, 'hidden', p.hidden)} title={p.hidden ? t.admin.show : t.admin.hide} style={{ color: p.hidden ? '#a855f7' : 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {p.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(p)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1rem' }}>{formatPrice(p.price)}</span>
              {editingSortId === p.id ? (
                <input
                  type="number"
                  min={0}
                  autoFocus
                  value={editingSortVal}
                  onChange={e => setEditingSortVal(e.target.value)}
                  onBlur={() => handleSortOrderEdit(p.id, editingSortVal)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSortOrderEdit(p.id, editingSortVal); if (e.key === 'Escape') setEditingSortId(null) }}
                  style={{ width: 48, fontSize: '.7rem', fontFamily: 'monospace', textAlign: 'center', padding: '2px 4px', border: '1px solid var(--primary)', borderRadius: 6, outline: 'none', background: 'var(--bg2)', color: 'var(--text)' }}
                />
              ) : (
                <span
                  onClick={() => { setEditingSortId(p.id); setEditingSortVal(String(p.sort_order ?? 0)) }}
                  style={{ fontSize: '.7rem', color: 'var(--text2)', fontFamily: 'monospace', background: 'var(--bg3)', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                  title="Click to edit"
                >#{p.sort_order ?? 0}</span>
              )}
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => handleSortOrder(p.id, 'up')} title={t.admin.moveUp} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text2)' }}><ArrowUp size={13} /></button>
                <button onClick={() => handleSortOrder(p.id, 'down')} title={t.admin.moveDown} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text2)' }}><ArrowDown size={13} /></button>
              </div>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)', textTransform: 'capitalize', background: 'var(--bg3)', borderRadius: 6, padding: '2px 8px' }}>{p.category}</span>
              <button onClick={() => handleToggle(p.id, 'in_stock', p.in_stock)} title={p.in_stock ? t.admin.markOutOfStock : t.admin.markInStock} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {p.in_stock
                  ? <span className="admin-badge admin-badge-green">{t.admin.inStock}</span>
                  : <span className="admin-badge admin-badge-red">{t.admin.outOfStock}</span>
                }
              </button>
              {p.is_new && <span className="admin-badge admin-badge-blue">{t.admin.isNew}</span>}
              {p.is_hot && <span className="admin-badge admin-badge-yellow">{t.admin.isHot}</span>}
              {p.hidden && <span className="admin-badge admin-badge-purple">{t.admin.hidden}</span>}
            </div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <AdminPagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={v => { setPerPage(v); setPage(1) }} />
      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div ref={modalRef} className="admin-modal-inner" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? t.admin.editProduct : t.admin.newProduct}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            <div className="admin-form-grid">
              {([
                { key: 'name', label: t.admin.productName, span: 2 },
                { key: 'model', label: t.admin.model },
                { key: 'price', label: t.admin.priceField, type: 'number' },
                { key: 'old_price', label: t.admin.oldPrice, type: 'number' },
                { key: 'description', label: t.admin.description, span: 2, textarea: true },
                { key: 'specs', label: t.admin.specs, span: 2, textarea: true, isArray: true },
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
                    {(key === 'name' || key === 'price') && formErrors[key] && (
                      <div style={{ color: 'var(--danger)', fontSize: '.75rem', marginTop: 4 }}>{formErrors[key]}</div>
                    )}
                  </div>
                )
              )}

              {/* Product Images Upload */}
              <div style={{ gridColumn: '1 / -1' }}>
                <ImageUploader
                  value={editing.images ?? []}
                  onChange={(urls) => setEditing({ ...editing, images: urls })}
                  folder="products"
                  multiple
                  maxFiles={10}
                  label={t.admin.images}
                />
              </div>

              {/* Brand dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>{t.admin.brand}</label>
                {formErrors.brand && <div style={{ color: 'var(--danger)', fontSize: '.75rem', marginBottom: 4 }}>{formErrors.brand}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={editing.brand ?? ''}
                    onChange={e => setEditing({ ...editing, brand: e.target.value })}
                    style={{ flex: 1, padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewBrand(v => !v)} className="admin-btn admin-btn-ghost" title={t.admin.addNewBrand}>
                    <Plus size={15} />
                  </button>
                </div>
                {showNewBrand && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder={t.admin.newBrandName}
                      value={newBrand}
                      onChange={e => setNewBrand(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', background: 'var(--bg3)', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none' }}
                    onKeyDown={async e => {
                      if (e.key === 'Enter' && newBrand.trim()) {
                        const val = newBrand.trim()
                        await supabase.from('brands').insert({ name: val, logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
                        setEditing({ ...editing, brand: val })
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
                          const val = newBrand.trim()
                          await supabase.from('brands').insert({ name: val, logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
                          setEditing({ ...editing, brand: val })
                          setNewBrand('')
                          setShowNewBrand(false)
                          router.refresh()
                        }
                      }}
                      className="admin-btn admin-btn-primary"
                    >
                      {t.admin.createBrand}
                    </button>
                  </div>
                )}
              </div>

              {/* Category dropdown */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>{t.admin.category}</label>
                {formErrors.category && <div style={{ color: 'var(--danger)', fontSize: '.75rem', marginBottom: 4 }}>{formErrors.category}</div>}
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
                    title={t.admin.add}
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
                      {t.admin.add}
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
                  {({ in_stock: t.admin.inStock, is_new: t.admin.isNew, is_hot: t.admin.isHot })[k]}
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
                    {editing.hidden ? t.admin.hidden : t.admin.show}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginTop: 2 }}>When hidden, this product won&apos;t appear to customers</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px' }}>
                {loading ? t.admin.loading : isEdit ? t.admin.saveChanges : t.admin.create}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">{t.admin.cancel}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal {...confirmProps} />
    </div>
  )
}
