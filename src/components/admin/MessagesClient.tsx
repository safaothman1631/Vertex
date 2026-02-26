'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Mail, Phone, MapPin, Check, RefreshCw } from 'lucide-react'

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
  const supabase = createClient()

  async function markRead(id: string) {
    setMarking(id)
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id)
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m))
    setMarking(null)
  }

  const unread = messages.filter((m) => !m.is_read).length

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Contact Messages</h1>
          <p className="admin-page-sub">{messages.length} total &mdash; {unread} unread</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text2)' }}>
          <Mail size={32} style={{ margin: '0 auto 12px', opacity: .3 }} />
          <p>No messages yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg) => (
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
                    }}>New</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                  {!msg.is_read && (
                    <button
                      onClick={() => markRead(msg.id)}
                      disabled={marking === msg.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(99,102,241,.12)', color: 'var(--primary)',
                        border: '1px solid rgba(99,102,241,.3)',
                        borderRadius: 8, padding: '5px 12px', fontSize: '.78rem',
                        fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {marking === msg.id
                        ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Check size={12} />}
                      Mark as read
                    </button>
                  )}
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
    </div>
  )
}
