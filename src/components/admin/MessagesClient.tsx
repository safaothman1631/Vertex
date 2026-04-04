'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Mail, Check, RefreshCw, Trash2 } from 'lucide-react'
import { useT } from '@/contexts/locale'
import AdminSearch from './AdminSearch'
import AdminPagination from './AdminPagination'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useConfirm } from '@/hooks/useConfirm'

interface Msg {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export default function MessagesClient({ initial }: { initial: Msg[] }) {
  const [messages, setMessages] = useState(initial)
  const [marking, setMarking] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchQ, setSearchQ] = useState('')
  const [filterRead, setFilterRead] = useState<'' | 'read' | 'unread'>('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const supabase = createClient()
  const t = useT()
  const { confirm, confirmProps } = useConfirm()

  useEffect(() => { setPage(1) }, [searchQ, filterRead])

  const filtered = useMemo(() => {
    let list = messages
    if (searchQ) {
      const q = searchQ.toLowerCase()
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q) || m.message.toLowerCase().includes(q))
    }
    if (filterRead === 'read') list = list.filter(m => m.is_read)
    if (filterRead === 'unread') list = list.filter(m => !m.is_read)
    return list
  }, [messages, searchQ, filterRead])

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  async function markRead(id: string) {
    setMarking(id)
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id)
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m))
    setMarking(null)
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ message: t.admin.moveMessageToTrash, title: t.admin.delete })
    if (!ok) return
    setDeleting(id)
    const msg = messages.find(m => m.id === id)
    if (msg) {
      await supabase.from('trash').insert({ table_name: 'contact_messages', record_id: id, record_data: msg })
    }
    await supabase.from('contact_messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
    setDeleting(null)
  }

  const unread = filtered.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t.admin.contactMessages}</h1>
          <p className="admin-page-sub">{filtered.length} total &mdash; {unread} {t.admin.unread}</p>
        </div>
      </div>

      <div className="admin-filter-toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <AdminSearch value={searchQ} onChange={setSearchQ} placeholder={t.admin.search} />
        <select
          value={filterRead}
          onChange={e => setFilterRead(e.target.value as '' | 'read' | 'unread')}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '.82rem', padding: '7px 10px' }}
        >
          <option value="">{t.admin.all}</option>
          <option value="read">{t.admin.markAsRead}</option>
          <option value="unread">{t.admin.unread}</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text2)' }}>
          <Mail size={32} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <p>{t.admin.noMessages}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paginated.map((msg) => (
            <div
              key={msg.id}
              style={{
                background: 'var(--bg2)',
                border: `1px solid ${msg.is_read ? 'var(--border)' : 'var(--primary)'}`,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                transition: 'border-color .3s',
              }}
            >
              {/* Top bar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                background: msg.is_read ? 'transparent' : 'rgba(99,102,241,.04)',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--gradient)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '.85rem', flexShrink: 0,
                  }}>
                    {msg.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{msg.name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{msg.email}</div>
                  </div>
                  {!msg.is_read && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff',
                      fontSize: '.68rem', fontWeight: 800, padding: '2px 8px',
                      borderRadius: 99, textTransform: 'uppercase', letterSpacing: '.05em',
                    }}>{t.admin.newBadge}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!msg.is_read && (
                      <button
                        onClick={() => markRead(msg.id)}
                        disabled={marking === msg.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: 'rgba(99,102,241,.12)', color: 'var(--primary)',
                          border: '1px solid rgba(99,102,241,.3)',
                          borderRadius: 8, padding: '8px 14px', fontSize: '.78rem',
                          fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {marking === msg.id
                          ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Check size={12} />}
                        {t.admin.markAsRead}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(msg.id)}
                      disabled={deleting === msg.id}
                      title={t.admin.moveMessageToTrash}
                      style={{
                        display: 'flex', alignItems: 'center',
                        background: 'rgba(239,68,68,.1)', color: '#ef4444',
                        border: '1px solid rgba(239,68,68,.2)',
                        borderRadius: 8, padding: '8px 12px', fontSize: '.78rem',
                        fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {deleting === msg.id
                        ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px 20px' }}>
                <p style={{ fontWeight: 700, marginBottom: 6, fontSize: '.92rem' }}>{msg.subject}</p>
                <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.65 }}>{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminPagination total={filtered.length} page={page} perPage={perPage} onPageChange={setPage} onPerPageChange={setPerPage} />
      <ConfirmModal {...confirmProps} />
    </div>
  )
}
