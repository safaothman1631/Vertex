'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, GripVertical } from 'lucide-react'
import type { Category } from '@/types'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminCategoriesClient({
  categories: initial,
  productCounts,
}: {
  categories: Category[]
  productCounts: Record<string, number>
}) {
  const [categories, setCategories] = useState<Category[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Category>>({ name: '', slug: '', icon: '', sort_order: 0 })
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const modalRef = useRef<HTMLDivElement>(null)

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
  }

  async function handleDelete(id: string, name: string) {
    const count = productCounts[name] ?? 0
    if (count > 0) {
      alert(`Cannot delete "${name}" — ${count} product(s) use this category. Reassign them first.`)
      return
    }
    if (!confirm(`Delete category "${name}"?`)) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">{categories.length} categories</p>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['Order', 'Name', 'Slug', 'Products', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>No categories yet</td></tr>
            ) : categories.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)' }}>
                    <GripVertical size={14} style={{ opacity: .4 }} />
                    {c.sort_order}
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td>
                  <code style={{ fontSize: '.78rem', color: 'var(--text2)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>{c.slug}</code>
                </td>
                <td style={{ color: 'var(--text2)' }}>{productCounts[c.name] ?? 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => openEdit(c)} title="Edit" style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} title="Delete" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
        {categories.map(c => (
          <div key={c.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{c.name}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'monospace', marginTop: 2 }}>{c.slug}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(c)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(c.id, c.name)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="admin-badge admin-badge-blue">{productCounts[c.name] ?? 0} products</span>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Order: {c.sort_order}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            <div className="admin-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Name</label>
                <input
                  type="text"
                  value={editing.name ?? ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value, slug: toSlug(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. Barcode Scanners"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Slug</label>
                <input
                  type="text"
                  value={editing.slug ?? ''}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  placeholder="barcode-scanners"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Sort Order</label>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 11 }}>
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
