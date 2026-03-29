'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

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
}: {
  brands: Brand[]
  productCounts: Record<string, number>
}) {
  const [brands, setBrands] = useState<Brand[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Brand>>({ name: '', logo: '', color1: '#6366f1', color2: '#4338ca', category_key: '' })
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
  }

  async function handleDelete(id: string, name: string) {
    const count = productCounts[name] ?? 0
    if (count > 0) {
      alert(`Cannot delete "${name}" — ${count} product(s) use this brand.`)
      return
    }
    if (!confirm(`Delete brand "${name}"?`)) return
    await supabase.from('brands').delete().eq('id', id)
    setBrands(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">{brands.length} brands</p>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> Add Brand
        </button>
      </div>

      {/* Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['Color', 'Name', 'Logo', 'Category Key', 'Products', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>No brands yet</td></tr>
            ) : brands.map(b => (
              <tr key={b.id}>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: b.color1, border: '1px solid var(--border)' }} />
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: b.color2, border: '1px solid var(--border)' }} />
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>{b.name}</td>
                <td>
                  <code style={{ fontSize: '.78rem', color: 'var(--text2)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 4 }}>{b.logo || '—'}</code>
                </td>
                <td style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{b.category_key || '—'}</td>
                <td style={{ color: 'var(--text2)' }}>{productCounts[b.name] ?? 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => openEdit(b)} title="Edit" style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(b.id, b.name)} title="Delete" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
        {brands.map(b => (
          <div key={b.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${b.color1}, ${b.color2})`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{b.name}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text2)', fontFamily: 'monospace', marginTop: 2 }}>{b.logo || 'no logo'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(b)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(b.id, b.name)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="admin-badge admin-badge-blue">{productCounts[b.name] ?? 0} products</span>
              {b.category_key && <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{b.category_key}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? 'Edit Brand' : 'New Brand'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            {/* Preview banner */}
            <div style={{ height: 60, borderRadius: 12, background: `linear-gradient(135deg, ${editing.color1 ?? '#6366f1'}, ${editing.color2 ?? '#4338ca'})`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{editing.name || 'Brand Preview'}</span>
            </div>

            <div className="admin-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Brand Name</label>
                <input
                  type="text"
                  value={editing.name ?? ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="e.g. Honeywell"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Logo File</label>
                <input
                  type="text"
                  value={editing.logo ?? ''}
                  onChange={e => setEditing({ ...editing, logo: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  placeholder="honeywell.svg"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Category Key</label>
                <input
                  type="text"
                  value={editing.category_key ?? ''}
                  onChange={e => setEditing({ ...editing, category_key: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="scanners-mobility"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Color 1</label>
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
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Color 2</label>
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
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Brand'}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
