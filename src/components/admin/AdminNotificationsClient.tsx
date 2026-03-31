'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Bell, Users, Shield, Globe, CheckCircle, Clock } from 'lucide-react'
import { useT } from '@/contexts/locale'

interface Broadcast {
  title: string
  body: string
  type: string
  created_at: string
  recipientCount: number
  readCount: number
}

const TYPE_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  info: { label: 'Info', color: '#3b82f6', badge: 'admin-badge-blue' },
  promo: { label: 'Promo', color: '#f59e0b', badge: 'admin-badge-yellow' },
  system: { label: 'System', color: '#ef4444', badge: 'admin-badge-red' },
  order: { label: 'Order', color: '#22c55e', badge: 'admin-badge-green' },
}

export default function AdminNotificationsClient({ broadcasts, totalUsers }: { broadcasts: Broadcast[]; totalUsers: number }) {
  const router = useRouter()
  const t = useT()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [target, setTarget] = useState('all')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; sent?: number; error?: string } | null>(null)

  async function handleSend() {
    if (!title.trim() || !message.trim()) return
    if (!confirm(`Send this notification to ${target === 'all' ? 'all users' : target}?`)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), type, target }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, sent: data.sent })
        setTitle('')
        setMessage('')
        router.refresh()
      } else {
        setResult({ success: false, error: data.error })
      }
    } catch {
      setResult({ success: false, error: 'Network error' })
    }
    setLoading(false)
  }

  const LS: React.CSSProperties = { display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }
  const IS: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div>
      <p className="admin-page-sub">{totalUsers} {t.admin.registeredUsers}</p>

      {/* Compose Section */}
      <div className="admin-card" style={{ padding: 24, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={18} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: '1.05rem', margin: 0 }}>{t.admin.composeBroadcast}</h2>
            <p style={{ color: 'var(--text2)', fontSize: '.82rem', margin: 0 }}>{t.admin.broadcastDesc}</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div style={{ gridColumn: '1/-1' }}>
            <label style={LS}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={IS} placeholder="e.g. New Products Available!" maxLength={200} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={LS}>{t.admin.message} *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...IS, minHeight: 80, resize: 'vertical' }} placeholder="Write your notification message..." maxLength={2000} />
            <div style={{ textAlign: 'right', fontSize: '.75rem', color: 'var(--text3)', marginTop: 4 }}>{message.length}/2000</div>
          </div>
          <div>
            <label style={LS}>{t.admin.type}</label>
            <select value={type} onChange={e => setType(e.target.value)} style={IS}>
              <option value="info">{t.admin.infoType}</option>
              <option value="promo">{t.admin.promoType}</option>
              <option value="system">{t.admin.systemType}</option>
            </select>
          </div>
          <div>
            <label style={LS}>{t.admin.recipients}</label>
            <select value={target} onChange={e => setTarget(e.target.value)} style={IS}>
              <option value="all">{t.admin.allUsers} ({totalUsers})</option>
              <option value="users">{t.admin.customersOnly}</option>
              <option value="admins">{t.admin.adminsOnly}</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {title && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>{t.admin.preview}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: TYPE_CONFIG[type]?.color ?? 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{title}</div>
                {message && <div style={{ color: 'var(--text2)', fontSize: '.82rem', marginTop: 2 }}>{message.slice(0, 120)}{message.length > 120 ? '…' : ''}</div>}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: result.success ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', border: `1px solid ${result.success ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`, color: result.success ? '#16a34a' : '#ef4444', fontWeight: 700, fontSize: '.85rem' }}>
            {result.success ? `✓ ${t.admin.sentTo.replace('{count}', String(result.sent))}` : `✕ ${result.error}`}
          </div>
        )}

        <button onClick={handleSend} disabled={loading || !title.trim() || !message.trim()} className="admin-btn admin-btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center', padding: 12 }}>
          <Send size={15} /> {loading ? `${t.admin.loading}…` : t.admin.sendBroadcast}
        </button>
      </div>

      {/* History */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: 14 }}>{t.admin.broadcastHistory}</h2>
        {broadcasts.length === 0 ? (
          <div className="admin-card" style={{ textAlign: 'center', padding: 48, color: 'var(--text2)' }}>
            <Bell size={40} style={{ opacity: .3, marginBottom: 12 }} />
            <p>{t.admin.noBroadcasts}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {broadcasts.map((b, i) => {
              const cfg = TYPE_CONFIG[b.type] ?? TYPE_CONFIG.info
              const readPct = b.recipientCount > 0 ? Math.round((b.readCount / b.recipientCount) * 100) : 0
              return (
                <div key={i} className="admin-card" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={17} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '.92rem' }}>{b.title}</span>
                      <span className={`admin-badge ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: '.82rem', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.body}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '.78rem', color: 'var(--text3)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {t.admin.sentTo.replace('{count}', String(b.recipientCount))}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> {readPct}{t.admin.readPercentage}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                    {/* Read progress bar */}
                    <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: 'var(--bg3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${readPct}%`, borderRadius: 4, background: cfg.color, transition: 'width .3s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
