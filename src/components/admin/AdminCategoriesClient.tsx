'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, GripVertical, Eye, Package } from 'lucide-react'
import ImageUploader from './ImageUploader'
import AdminSearch from './AdminSearch'
import AdminPagination from './AdminPagination'
import { useT } from '@/contexts/locale'
import type { Category } from '@/types'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

interface CategoryProduct {
  id: string
  name: string
  model: string
  price: number
  images: string[]
  in_stock: boolean
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminCategoriesClient({
  categories: initial,
  productCounts,
  productsByCategory,
}: {
  categories: Category[]
  productCounts: Record<string, number>
  productsByCategory: Record<string, CategoryProduct[]>
}) {
  const router = useRouter()
  const t = useT()
  const [categories, setCategories] = useState<Category[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Category>>({ name: '', slug: '', icon: '', sort_order: 0 })
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [viewCategory, setViewCategory] = useState<Category | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<CategoryProduct[]>([])
  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const { confirm, confirmProps } = useConfirm()

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return categories
    const q = searchQ.toLowerCase()
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }, [categories, searchQ])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  // Sync when server re-fetches (after router.refresh)
  useEffect(() => { setCategories(initial) }, [initial])

  useEffect(() => { setPage(1) }, [searchQ])

  function openCategoryProducts(c: Category) {
    setViewCategory(c)
    setCategoryProducts(productsByCategory[c.slug] ?? [])
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
    setEditing({ name: '', slug: '', icon: '', sort_order: (categories.length + 1) * 10 })
    setIsEdit(false)
    setShowForm(true)
  }

  function openEdit(c: Category) {
    setEditing({ ...c })
    setIsEdit(true)
    setShowForm(true)
  }

  async function handleSave() {
    if (!editing.name?.trim()) return
    setLoading(true)
    const slug = editing.slug?.trim() || toSlug(editing.name!)
    const payload = {
      name: editing.name!.trim(),
      slug,
      icon: editing.icon ?? '',
      sort_order: editing.sort_order ?? 0,
    }

    if (isEdit && editing.id) {
      const { data } = await supabase.from('categories').update(payload).eq('id', editing.id).select().single()
      if (data) setCategories(prev => prev.map(c => c.id === editing.id ? data : c))
    } else {
      const { data } = await supabase.from('categories').insert(payload).select().single()
      if (data) setCategories(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
    }
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    const slug = toSlug(name)
    const count = productCounts[slug] ?? 0
    if (count > 0) {
      alert(t.admin.cantDeleteCategory)
      return
    }
    const ok = await confirm({ message: t.admin.moveCategoryToTrash, title: t.admin.delete })
    if (!ok) return
    const category = categories.find(c => c.id === id)
    if (category) {
      await supabase.from('trash').insert({ table_name: 'categories', record_id: id, record_data: category })
    }
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    router.refresh()
  }

  async function handleReorder(fromId: string, toId: string) {
    const fromIdx = categories.findIndex(c => c.id === fromId)
    const toIdx = categories.findIndex(c => c.id === toId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
    const reordered = [...categories]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    for (let i = 0; i < reordered.length; i++) {
      reordered[i] = { ...reordered[i], sort_order: i }
    }
    setCategories(reordered)
    for (const cat of reordered) {
      await supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', cat.id)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">{filtered.length} {t.admin.categories}</p>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> {t.admin.addCategory}
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
              {[t.admin.sortOrder, t.admin.name, t.admin.slug, t.admin.productCount, t.admin.actions].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>{t.admin.noCategories}</td></tr>
            ) : paginated.map(c => (
              <tr
                key={c.id}
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragOver={(e) => { e.preventDefault(); setDropTargetId(c.id) }}
                onDrop={() => { if (dragId && dragId !== c.id) handleReorder(dragId, c.id); setDragId(null); setDropTargetId(null) }}
                onDragEnd={() => { setDragId(null); setDropTargetId(null) }}
                style={{ opacity: dragId === c.id ? 0.5 : 1, borderTop: dropTargetId === c.id && dragId !== c.id ? '2px solid var(--accent)' : undefined, transition: 'opacity .15s' }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)' }}>
                    <GripVertical size={14} style={{ cursor: 'grab', color: 'var(--text3)', padding: '0 4px' }} />
                    {c.sort_order}
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td>
                  <code style={{ fontSize: '.78rem', color: 'var(--text2)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>{c.slug}</code>
                </td>
                <td>
                  <button onClick={() => openCategoryProducts(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: (productCounts[c.slug] ?? 0) > 0 ? 'var(--accent)' : 'var(--text2)', fontWeight: 700, padding: 0, fontSize: '.9rem' }}>
                    {productCounts[c.slug] ?? 0}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => openCategoryProducts(c)} title={t.admin.viewProducts} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Eye size={14} />
                    </button>
                    <button onClick={() => openEdit(c)} title={t.admin.edit} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} title={t.admin.delete} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
        {paginated.map(c => (
          <div
            key={c.id}
            className="admin-product-card"
            draggable
            onDragStart={() => setDragId(c.id)}
            onDragOver={(e) => { e.preventDefault(); setDropTargetId(c.id) }}
            onDrop={() => { if (dragId && dragId !== c.id) handleReorder(dragId, c.id); setDragId(null); setDropTargetId(null) }}
            onDragEnd={() => { setDragId(null); setDropTargetId(null) }}
            style={{ opacity: dragId === c.id ? 0.5 : 1, borderTop: dropTargetId === c.id && dragId !== c.id ? '2px solid var(--accent)' : undefined, transition: 'opacity .15s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <GripVertical size={16} style={{ cursor: 'grab', color: 'var(--text3)', padding: '0 4px', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{c.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'monospace', marginTop: 2 }}>{c.slug}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(c)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(c.id, c.name)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => openCategoryProducts(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span className="admin-badge admin-badge-blue" style={{ cursor: 'pointer' }}>{productCounts[c.slug] ?? 0} {t.admin.products}</span>
              </button>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{t.admin.sortOrder}: {c.sort_order}</span>
            </div>
          </div>
        ))}
      </div>

      <AdminPagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {/* Category Products Modal */}
      {viewCategory && (
        <div onClick={() => setViewCategory(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '1.8rem' }}>{viewCategory.icon || '📦'}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{viewCategory.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'monospace' }}>{viewCategory.slug}</div>
                </div>
              </div>
              <button onClick={() => setViewCategory(null)} title={t.admin.close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
              {categoryProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
                  <Package size={40} style={{ opacity: .3, marginBottom: 12 }} />
                  <p>{t.admin.noProducts}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {categoryProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'contain', padding: 4 }} sizes="48px" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📦</div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{p.model}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '.85rem' }}>${p.price}</span>
                        {p.in_stock
                          ? <span className="admin-badge admin-badge-green">{t.admin.inStock}</span>
                          : <span className="admin-badge admin-badge-red">{t.admin.outOfStock}</span>
                        }
                      </div>
                      <Link href={`/products/${p.id}`} target="_blank" style={{ color: 'var(--text2)', flexShrink: 0, textDecoration: 'none' }} title={t.admin.viewInShop}>
                        <Eye size={15} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text2)', textAlign: 'right' }}>
              {categoryProducts.length} {t.admin.productCount}
            </div>
          </div>
        </div>
      )}

      {/* Edit/New Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? t.admin.editCategory : t.admin.newCategory}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            <div className="admin-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.categoryName}</label>
                <input
                  type="text"
                  value={editing.name ?? ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value, slug: toSlug(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. Barcode Scanners"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.slug}</label>
                <input
                  type="text"
                  value={editing.slug ?? ''}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  placeholder="barcode-scanners"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>{t.admin.sortOrder}</label>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {/* Category Icon Upload */}
              <div style={{ gridColumn: '1/-1' }}>
                <ImageUploader
                  value={editing.icon ? [editing.icon] : []}
                  onChange={(urls) => setEditing({ ...editing, icon: urls[0] ?? '' })}
                  folder="categories"
                  multiple={false}
                  label="Icon"
                />
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
      <ConfirmModal {...confirmProps} />
    </div>
  )
}
