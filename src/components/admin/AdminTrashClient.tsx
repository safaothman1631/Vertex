'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Trash2, RotateCcw, Clock, Package, ShoppingBag, Mail, Tag, FolderTree, Building2, RefreshCw, AlertTriangle } from 'lucide-react'
import type { TrashItem } from '@/types'

const TABLE_META: Record<string, { label: string; icon: typeof Package; color: string }> = {
  products:         { label: 'Product',  icon: Package,    color: '#6366f1' },
  orders:           { label: 'Order',    icon: ShoppingBag, color: '#f59e0b' },
  contact_messages: { label: 'Message',  icon: Mail,       color: '#22c55e' },
  coupons:          { label: 'Coupon',   icon: Tag,        color: '#a855f7' },
  brands:           { label: 'Brand',    icon: Building2,  color: '#38bdf8' },
  categories:       { label: 'Category', icon: FolderTree, color: '#f97316' },
}

function getItemLabel(item: TrashItem): string {
  const d = item.record_data as Record<string, unknown>
  if (d.name) return String(d.name)
  if (d.code) return String(d.code)
  if (d.subject) return String(d.subject)
  return `#${item.record_id.slice(0, 8)}`
}

function getDaysLeft(expires: string): number {
  return Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86400000))
}

export default function AdminTrashClient({ items: initial }: { items: TrashItem[] }) {
  const [items, setItems] = useState<TrashItem[]>(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleRestore(item: TrashItem) {
    setLoadingId(item.id)
    setError(null)

    // Re-insert the record into its original table
    const { record_data, table_name, record_id } = item
    const data = { ...record_data } as Record<string, unknown>

    // Remove any auto-generated fields that might conflict
    delete data.created_at

    const { error: insertErr } = await supabase
      .from(table_name)
      .insert(data)

    if (insertErr) {
      setError(`Restore failed: ${insertErr.message}`)
      setLoadingId(null)
      return
    }

    // Remove from trash
    await supabase.from('trash').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setLoadingId(null)
    router.refresh()
  }

  async function handlePermanentDelete(item: TrashItem) {
    if (!confirm('Permanently delete? This cannot be undone.')) return
    setLoadingId(item.id)
    setError(null)

    const { error: delErr } = await supabase.from('trash').delete().eq('id', item.id)
    if (delErr) {
      setError(`Delete failed: ${delErr.message}`)
    } else {
      setItems(prev => prev.filter(i => i.id !== item.id))
    }
    setLoadingId(null)
  }

  async function handleEmptyTrash() {
    if (!confirm('Permanently delete ALL items in trash? This cannot be undone.')) return
    setLoadingId('all')
    setError(null)

    for (const item of items) {
      await supabase.from('trash').delete().eq('id', item.id)
    }
    setItems([])
    setLoadingId(null)
  }

  return (
    <div>
      {error && (
        <div style={{ margin: '0 0 16px', padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444', fontSize: '.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 4px' }}>×</button>
        </div>
      )}

      <div className="admin-page-head">
        <div>
          <p className="admin-page-sub">{items.length} item(s) in trash — auto-deleted after 30 days</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            disabled={loadingId === 'all'}
            className="admin-btn"
            style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', gap: 6 }}
          >
            <Trash2 size={14} />
            Empty Trash
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text2)' }}>
          <Trash2 size={32} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <p>Trash is empty</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="admin-card admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {['Type', 'Name', 'Deleted', 'Expires In', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const meta = TABLE_META[item.table_name] || { label: item.table_name, icon: Package, color: '#888' }
                  const Icon = meta.icon
                  const daysLeft = getDaysLeft(item.expires_at)
                  const isLoading = loadingId === item.id || loadingId === 'all'

                  return (
                    <tr key={item.id} style={{ opacity: isLoading ? 0.5 : 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `${meta.color}18`, color: meta.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={14} />
                          </div>
                          <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{meta.label}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getItemLabel(item)}
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>
                        {new Date(item.deleted_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} style={{ color: daysLeft <= 3 ? '#ef4444' : 'var(--text2)' }} />
                          <span style={{
                            fontSize: '.82rem', fontWeight: 600,
                            color: daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : 'var(--text2)',
                          }}>
                            {daysLeft}d left
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => handleRestore(item)}
                            disabled={isLoading}
                            title="Restore"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 12px', borderRadius: 8, fontSize: '.78rem', fontWeight: 700,
                              background: 'rgba(34,197,94,.12)', color: '#22c55e',
                              border: '1px solid rgba(34,197,94,.25)', cursor: 'pointer',
                            }}
                          >
                            {isLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={12} />}
                            Restore
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(item)}
                            disabled={isLoading}
                            title="Delete permanently"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 12px', borderRadius: 8, fontSize: '.78rem', fontWeight: 700,
                              background: 'rgba(239,68,68,.12)', color: '#ef4444',
                              border: '1px solid rgba(239,68,68,.25)', cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="admin-mobile-cards">
            {items.map(item => {
              const meta = TABLE_META[item.table_name] || { label: item.table_name, icon: Package, color: '#888' }
              const Icon = meta.icon
              const daysLeft = getDaysLeft(item.expires_at)
              const isLoading = loadingId === item.id || loadingId === 'all'

              return (
                <div key={item.id} className="admin-product-card" style={{ opacity: isLoading ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 0, alignItems: 'center' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${meta.color}18`, color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {getItemLabel(item)}
                        </div>
                        <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: 2 }}>
                          {meta.label} · {new Date(item.deleted_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
                      borderRadius: 6, fontSize: '.72rem', fontWeight: 700, flexShrink: 0,
                      background: daysLeft <= 3 ? 'rgba(239,68,68,.12)' : 'rgba(245,158,11,.12)',
                      color: daysLeft <= 3 ? '#ef4444' : '#f59e0b',
                    }}>
                      <Clock size={10} />
                      {daysLeft}d
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={isLoading}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '8px 12px', borderRadius: 8, fontSize: '.82rem', fontWeight: 700,
                        background: 'rgba(34,197,94,.12)', color: '#22c55e',
                        border: '1px solid rgba(34,197,94,.25)', cursor: 'pointer',
                      }}
                    >
                      {isLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={13} />}
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item)}
                      disabled={isLoading}
                      style={{
                        padding: '8px 14px', borderRadius: 8, fontSize: '.82rem', fontWeight: 700,
                        background: 'rgba(239,68,68,.12)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,.25)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
