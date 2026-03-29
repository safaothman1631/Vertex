'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, Copy, Check } from 'lucide-react'
import type { Coupon } from '@/types'

const EMPTY: Partial<Coupon> = {
  code: '', discount_type: 'percent', discount_value: 0,
  min_order: 0, max_uses: null, active: true, expires_at: null,
}

export default function AdminCouponsClient({ coupons: initial }: { coupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Coupon>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
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
    setEditing(EMPTY)
    setIsEdit(false)
    setShowForm(true)
  }

  function openEdit(c: Coupon) {
    setEditing({ ...c })
    setIsEdit(true)
    setShowForm(true)
  }

  async function handleSave() {
    if (!editing.code?.trim()) return
    setLoading(true)
    const payload = {
      code: editing.code!.trim().toUpperCase(),
      discount_type: editing.discount_type ?? 'percent',
      discount_value: editing.discount_value ?? 0,
      min_order: editing.min_order ?? 0,
      max_uses: editing.max_uses || null,
      active: editing.active ?? true,
      expires_at: editing.expires_at || null,
    }
    if (isEdit && editing.id) {
      const { data } = await supabase.from('coupons').update(payload).eq('id', editing.id).select().single()
      if (data) setCoupons(prev => prev.map(c => c.id === editing.id ? data : c))
    } else {
      const { data } = await supabase.from('coupons').insert(payload).select().single()
      if (data) setCoupons(prev => [data, ...prev])
    }
    setShowForm(false)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  async function toggleActive(c: Coupon) {
    const { data } = await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id).select().single()
    if (data) setCoupons(prev => prev.map(x => x.id === c.id ? data : x))
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function isExpired(c: Coupon) {
    return c.expires_at ? new Date(c.expires_at) < new Date() : false
  }

  function isMaxUsed(c: Coupon) {
    return c.max_uses != null && c.used_count >= c.max_uses
  }

  function statusBadge(c: Coupon) {
    if (!c.active) return <span className="admin-badge admin-badge-red">Inactive</span>
    if (isExpired(c)) return <span className="admin-badge admin-badge-red">Expired</span>
    if (isMaxUsed(c)) return <span className="admin-badge admin-badge-purple">Fully Used</span>
    return <span className="admin-badge admin-badge-green">Active</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">{coupons.length} coupons</p>
        <button onClick={openNew} className="admin-btn admin-btn-primary">
          <Plus size={15} /> Add Coupon
        </button>
      </div>

      {/* Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['Code', 'Discount', 'Min Order', 'Usage', 'Status', 'Expires', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>No coupons yet</td></tr>
            ) : coupons.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--primary)', background: 'rgba(99,102,241,.1)', padding: '3px 10px', borderRadius: 6, letterSpacing: '.04em' }}>{c.code}</code>
                    <button onClick={() => copyCode(c.code, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text2)' }} title="Copy code">
                      {copiedId === c.id ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} />}
                    </button>
                  </div>
                </td>
                <td style={{ fontWeight: 700 }}>
                  {c.discount_type === 'percent' ? `${c.discount_value}%` : `$${c.discount_value.toFixed(2)}`}
                </td>
                <td style={{ color: 'var(--text2)' }}>{c.min_order > 0 ? `$${c.min_order.toFixed(2)}` : '—'}</td>
                <td style={{ color: 'var(--text2)' }}>
                  {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ' / ∞'}
                </td>
                <td>{statusBadge(c)}</td>
                <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => toggleActive(c)} title={c.active ? 'Deactivate' : 'Activate'}
                      style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: c.active ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)', color: c.active ? '#ef4444' : '#22c55e' }}>
                      {c.active ? 'Off' : 'On'}
                    </button>
                    <button onClick={() => openEdit(c)} title="Edit" style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} title="Delete" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
        {coupons.map(c => (
          <div key={c.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <code style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--primary)' }}>{c.code}</code>
                <div style={{ fontSize: '.85rem', fontWeight: 700, marginTop: 4 }}>
                  {c.discount_type === 'percent' ? `${c.discount_value}%` : `$${c.discount_value.toFixed(2)}`} off
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text2)' }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}><Trash2 size={15} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {statusBadge(c)}
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Used: {c.used_count}{c.max_uses != null ? `/${c.max_uses}` : ''}</span>
              {c.min_order > 0 && <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Min: ${c.min_order}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            <div className="admin-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Coupon Code</label>
                <input
                  type="text"
                  value={editing.code ?? ''}
                  onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '.06em' }}
                  placeholder="SAVE20"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Discount Type</label>
                <select
                  value={editing.discount_type ?? 'percent'}
                  onChange={e => setEditing({ ...editing, discount_type: e.target.value as 'percent' | 'fixed' })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>
                  Discount Value {editing.discount_type === 'percent' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step={editing.discount_type === 'percent' ? '1' : '0.01'}
                  value={editing.discount_value ?? 0}
                  onChange={e => setEditing({ ...editing, discount_value: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Min Order ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.min_order ?? 0}
                  onChange={e => setEditing({ ...editing, min_order: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Max Uses (empty = unlimited)</label>
                <input
                  type="number"
                  min="0"
                  value={editing.max_uses ?? ''}
                  onChange={e => setEditing({ ...editing, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Expires At (optional)</label>
                <input
                  type="date"
                  value={editing.expires_at ? new Date(editing.expires_at).toISOString().split('T')[0] : ''}
                  onChange={e => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <label style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editing.active ?? true}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })}
                  style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                />
                <span style={{ fontWeight: 600, fontSize: '.88rem' }}>Active</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 11 }}>
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Coupon'}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
