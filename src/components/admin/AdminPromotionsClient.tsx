'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Calendar, ExternalLink } from 'lucide-react'
import ImageUploader from './ImageUploader'
import AdminSearch from './AdminSearch'
import AdminPagination from './AdminPagination'
import type { Promotion } from '@/types'
import { useT } from '@/contexts/locale'

const POSITION_LABELS: Record<string, string> = {
  hero_banner: 'Hero Banner',
  bar: 'Top Bar',
  popup: 'Popup',
  sidebar: 'Sidebar',
}

const POSITION_COLORS: Record<string, string> = {
  hero_banner: 'admin-badge-purple',
  bar: 'admin-badge-blue',
  popup: 'admin-badge-yellow',
  sidebar: 'admin-badge-green',
}

const EMPTY: Partial<Promotion> = {
  title: '', description: '', image_url: '', link_url: '', badge_text: '',
  position: 'bar', is_active: true, starts_at: '', ends_at: null, sort_order: 0,
}

export default function AdminPromotionsClient({ promotions: initial }: { promotions: Promotion[] }) {
  const t = useT()
  const router = useRouter()
  const supabase = createClient()
  const [promotions, setPromotions] = useState<Promotion[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Partial<Promotion>>(EMPTY)
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Promotion | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const [searchQ, setSearchQ] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const positionLabel = (pos: string) => ({ hero_banner: t.admin.heroBanner, bar: t.admin.topBar, popup: t.admin.popup, sidebar: t.admin.sidebar }[pos] ?? pos)

  const filtered = useMemo(() => {
    if (!searchQ.trim()) return promotions
    const q = searchQ.toLowerCase()
    return promotions.filter(p => p.title.toLowerCase().includes(q) || (p.badge_text ?? '').toLowerCase().includes(q))
  }, [promotions, searchQ])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  useEffect(() => { setPromotions(initial) }, [initial])

  useEffect(() => { setPage(1) }, [searchQ])

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
    setEditing({ ...EMPTY, starts_at: new Date().toISOString().slice(0, 16) })
    setIsEdit(false)
    setShowForm(true)
  }

  function openEdit(p: Promotion) {
    setEditing({
      ...p,
      starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : '',
      ends_at: p.ends_at ? new Date(p.ends_at).toISOString().slice(0, 16) : null,
    })
    setIsEdit(true)
    setShowForm(true)
  }

  async function handleSave() {
    if (!editing.title?.trim()) return
    setLoading(true)
    const payload = {
      title: editing.title!.trim(),
      description: editing.description ?? '',
      image_url: editing.image_url ?? '',
      link_url: editing.link_url ?? '',
      badge_text: editing.badge_text ?? '',
      position: editing.position ?? 'bar',
      is_active: editing.is_active ?? true,
      starts_at: editing.starts_at ? new Date(editing.starts_at).toISOString() : new Date().toISOString(),
      ends_at: editing.ends_at ? new Date(editing.ends_at as string).toISOString() : null,
      sort_order: editing.sort_order ?? 0,
    }
    if (isEdit && editing.id) {
      const { data } = await supabase.from('promotions').update(payload).eq('id', editing.id).select().single()
      if (data) setPromotions(prev => prev.map(p => p.id === editing.id ? data : p))
    } else {
      const { data } = await supabase.from('promotions').insert(payload).select().single()
      if (data) setPromotions(prev => [...prev, data])
    }
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(t.admin.movePromotionToTrash)) return
    const promo = promotions.find(p => p.id === id)
    if (promo) await supabase.from('trash').insert({ table_name: 'promotions', record_id: id, record_data: promo })
    await supabase.from('promotions').delete().eq('id', id)
    setPromotions(prev => prev.filter(p => p.id !== id))
    router.refresh()
  }

  async function toggleActive(p: Promotion) {
    const { data } = await supabase.from('promotions').update({ is_active: !p.is_active }).eq('id', p.id).select().single()
    if (data) setPromotions(prev => prev.map(x => x.id === p.id ? data : x))
  }

  function isLive(p: Promotion) {
    if (!p.is_active) return false
    const now = new Date()
    if (new Date(p.starts_at) > now) return false
    if (p.ends_at && new Date(p.ends_at) < now) return false
    return true
  }

  const LS: React.CSSProperties = { display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }
  const IS: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="admin-page-sub">{filtered.length} promotions · {filtered.filter(isLive).length} live</p>
        <button onClick={openNew} className="admin-btn admin-btn-primary"><Plus size={15} /> {t.admin.addPromotion}</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AdminSearch value={searchQ} onChange={setSearchQ} placeholder={`${t.admin.search}…`} />
      </div>

      {/* Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {[t.admin.status, t.admin.title, t.admin.position, t.admin.badge, t.admin.schedule, 'Order', t.admin.actions].map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text2)', padding: 32 }}>{t.admin.noPromotions}</td></tr>
            ) : paginated.map(p => (
              <tr key={p.id}>
                <td>
                  <button onClick={() => toggleActive(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title={p.is_active ? t.admin.active : t.admin.paused}>
                    {isLive(p) ? (
                      <span className="admin-badge admin-badge-green">{t.admin.live}</span>
                    ) : p.is_active ? (
                      <span className="admin-badge admin-badge-yellow">{t.admin.scheduled}</span>
                    ) : (
                      <span className="admin-badge admin-badge-red">{t.admin.paused}</span>
                    )}
                  </button>
                </td>
                <td style={{ fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                <td><span className={`admin-badge ${POSITION_COLORS[p.position] ?? ''}`}>{positionLabel(p.position)}</span></td>
                <td style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{p.badge_text || '—'}</td>
                <td style={{ fontSize: '.8rem', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                  <div>{new Date(p.starts_at).toLocaleDateString()}</div>
                  {p.ends_at && <div style={{ color: 'var(--text3)' }}>→ {new Date(p.ends_at).toLocaleDateString()}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>{p.sort_order}</td>
                <td>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={() => setPreview(p)} title={t.admin.preview} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Eye size={14} /></button>
                    <button onClick={() => openEdit(p)} title={t.admin.edit} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(p.id, p.title)} title={t.admin.delete} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="admin-mobile-cards">
        {paginated.map(p => (
          <div key={p.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {isLive(p) ? <span className="admin-badge admin-badge-green">{t.admin.live}</span> : p.is_active ? <span className="admin-badge admin-badge-yellow">{t.admin.scheduled}</span> : <span className="admin-badge admin-badge-red">{t.admin.paused}</span>}
                  <span className={`admin-badge ${POSITION_COLORS[p.position] ?? ''}`}>{positionLabel(p.position)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleActive(p)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>{p.is_active ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                <button onClick={() => openEdit(p)} style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={15} /></button>
                <button onClick={() => handleDelete(p.id, p.title)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminPagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
          <div ref={modalRef} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{isEdit ? t.admin.editPromotion : t.admin.newPromotion}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            {/* Live Preview Bar */}
            {editing.position === 'bar' && editing.title && (
              <div style={{ background: 'var(--gradient)', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: '.85rem', fontWeight: 700 }}>
                {editing.badge_text && <span style={{ background: 'rgba(255,255,255,.2)', padding: '2px 8px', borderRadius: 20, fontSize: '.75rem' }}>{editing.badge_text}</span>}
                {editing.title}
                {editing.link_url && <ExternalLink size={12} />}
              </div>
            )}

            {/* Hero Preview */}
            {editing.position === 'hero_banner' && editing.title && (
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary2))', color: '#fff', padding: 24, borderRadius: 14, marginBottom: 16, textAlign: 'center' }}>
                {editing.badge_text && <span style={{ background: 'rgba(255,255,255,.2)', padding: '4px 12px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700, marginBottom: 8, display: 'inline-block' }}>{editing.badge_text}</span>}
                <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>{editing.title}</div>
                {editing.description && <div style={{ opacity: .85, fontSize: '.85rem', marginTop: 6 }}>{editing.description}</div>}
              </div>
            )}

            <div className="admin-form-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={LS}>{t.admin.title} *</label>
                <input type="text" value={editing.title ?? ''} onChange={e => setEditing({ ...editing, title: e.target.value })} style={IS} placeholder="Spring Sale — 20% Off Everything" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={LS}>Description</label>
                <textarea value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} style={{ ...IS, minHeight: 60, resize: 'vertical' }} placeholder="Optional description text" />
              </div>
              <div>
                <label style={LS}>{t.admin.position}</label>
                <select value={editing.position ?? 'bar'} onChange={e => setEditing({ ...editing, position: e.target.value as Promotion['position'] })} style={IS}>
                  <option value="bar">{t.admin.topBar}</option>
                  <option value="hero_banner">{t.admin.heroBanner}</option>
                  <option value="popup">{t.admin.popup}</option>
                  <option value="sidebar">{t.admin.sidebar}</option>
                </select>
              </div>
              <div>
                <label style={LS}>{t.admin.badgeText}</label>
                <input type="text" value={editing.badge_text ?? ''} onChange={e => setEditing({ ...editing, badge_text: e.target.value })} style={IS} placeholder="e.g. NEW, HOT, 50% OFF" />
              </div>
              <div>
                <label style={LS}>{t.admin.linkUrl}</label>
                <input type="text" value={editing.link_url ?? ''} onChange={e => setEditing({ ...editing, link_url: e.target.value })} style={IS} placeholder="/products?q=spring" />
              </div>
              <div>
                <label style={LS}>Sort Order</label>
                <input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} style={IS} />
              </div>
              <div>
                <label style={LS}>{t.admin.startsAt}</label>
                <input type="datetime-local" value={editing.starts_at ?? ''} onChange={e => setEditing({ ...editing, starts_at: e.target.value })} style={IS} />
              </div>
              <div>
                <label style={LS}>{t.admin.endsAt}</label>
                <input type="datetime-local" value={(editing.ends_at as string) ?? ''} onChange={e => setEditing({ ...editing, ends_at: e.target.value || null })} style={IS} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <ImageUploader value={editing.image_url ? [editing.image_url] : []} onChange={urls => setEditing({ ...editing, image_url: urls[0] ?? '' })} folder="promotions" multiple={false} label={t.admin.bannerImage} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="promo-active" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                <label htmlFor="promo-active" style={{ fontWeight: 700, fontSize: '.9rem', cursor: 'pointer' }}>{t.admin.active}</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={handleSave} disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: 11 }}>
                {loading ? t.admin.loading : isEdit ? t.admin.saveChanges : t.admin.createPromotion}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn admin-btn-ghost">{t.admin.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }} onClick={e => { if (e.target === e.currentTarget) setPreview(null) }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontWeight: 900 }}>{t.admin.preview}</h2>
              <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={20} /></button>
            </div>

            {preview.position === 'bar' && (
              <div style={{ background: 'var(--gradient)', color: '#fff', padding: '12px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 700, fontSize: '.9rem' }}>
                {preview.badge_text && <span style={{ background: 'rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: 20, fontSize: '.75rem' }}>{preview.badge_text}</span>}
                {preview.title}
              </div>
            )}

            {preview.position === 'hero_banner' && (
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary2))', color: '#fff', padding: 32, borderRadius: 16, textAlign: 'center' }}>
                {preview.badge_text && <span style={{ background: 'rgba(255,255,255,.2)', padding: '4px 14px', borderRadius: 20, fontSize: '.8rem', fontWeight: 700, display: 'inline-block', marginBottom: 10 }}>{preview.badge_text}</span>}
                <div style={{ fontWeight: 900, fontSize: '1.4rem' }}>{preview.title}</div>
                {preview.description && <div style={{ opacity: .85, marginTop: 8 }}>{preview.description}</div>}
                {preview.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, marginTop: 16 }} />
                )}
              </div>
            )}

            {(preview.position === 'popup' || preview.position === 'sidebar') && (
              <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                {preview.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 20 }}>
                  {preview.badge_text && <span style={{ background: 'var(--gradient)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>{preview.badge_text}</span>}
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', marginTop: 8 }}>{preview.title}</div>
                  {preview.description && <div style={{ color: 'var(--text2)', fontSize: '.9rem', marginTop: 6 }}>{preview.description}</div>}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '.8rem' }}>
              <span className={`admin-badge ${POSITION_COLORS[preview.position]}`}>{positionLabel(preview.position)}</span>
              {isLive(preview) ? <span className="admin-badge admin-badge-green">{t.admin.live}</span> : <span className="admin-badge admin-badge-red">{t.admin.inactive}</span>}
              <span style={{ color: 'var(--text2)' }}><Calendar size={11} /> {new Date(preview.starts_at).toLocaleDateString()} {preview.ends_at ? `→ ${new Date(preview.ends_at).toLocaleDateString()}` : '(no end)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
