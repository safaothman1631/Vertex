'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type { Product } from '@/types'

const EMPTY_PRODUCT: Partial<Product> = {
  name: '', brand: '', model: '', category: 'scanners',
  price: 0, old_price: null, description: '', specs: [],
  images: [], rating: 4.5, review_count: 0,
  in_stock: true, is_new: false, is_hot: false,
}

export default function AdminProductsClient({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY_PRODUCT)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              {['Name', 'Brand', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>No products yet</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td style={{ maxWidth: '220px' }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'monospace' }}>{p.model}</div>
                </td>
                <td>{p.brand}</td>
                <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>${p.price.toFixed(2)}</td>
                <td>
                  {p.in_stock
                    ? <span className="admin-badge admin-badge-green">In Stock</span>
                    : <span className="admin-badge admin-badge-red">Out</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {([
                { key: 'name', label: 'Product Name', span: 2 },
                { key: 'brand', label: 'Brand' },
                { key: 'model', label: 'Model' },
                { key: 'category', label: 'Category' },
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
