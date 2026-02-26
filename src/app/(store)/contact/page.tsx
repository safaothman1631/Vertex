'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { MapPin, Mail, Phone } from 'lucide-react'
import { useT } from '@/contexts/locale'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const t = useT()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.from('contact_messages').insert(form)
    if (error) {
      setError('Failed to send message. Please try again.')
    } else {
      setSuccess(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    }
    setLoading(false)
  }

  const CONTACTS = [
    { icon: Mail, label: 'Email', value: 'support@vertex.com', sub: 'We reply within 24 hours' },
    { icon: Phone, label: 'Phone', value: '+1 (800) 123-4567', sub: 'Mon-Fri, 9am-6pm EST' },
    { icon: MapPin, label: 'Address', value: '123 Commerce St, Tech City', sub: 'Visit us anytime' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', padding: '64px 0 80px' }}>
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Support</p>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>{t.contact.title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '1.05rem', maxWidth: 480 }}>
            Have a question about our products? Our team is ready to help you find the perfect POS solution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 48, alignItems: 'start' }}>

          {/* Left  contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CONTACTS.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: 'rgba(99,102,241,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 2 }}>{label}</div>
                  <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '.9rem', marginBottom: 2 }}>{value}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '.82rem' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right  form */}
          <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 40px',
          }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}></div>
                <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>{t.contact.sent}</h3>
                <p style={{ color: 'var(--text2)' }}>{t.contact.sub}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{t.contact.title}</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {(['name', 'email'] as const).map((key) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{key === 'name' ? t.contact.name : t.contact.email}</label>
                      <input
                        type={key === 'email' ? 'email' : 'text'}
                        required
                        placeholder={key === 'name' ? t.contact.namePlaceholder : t.contact.emailPlaceholder}
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{t.contact.message}</label>
                  <input
                    type="text"
                    required
                    placeholder={t.contact.messagePlaceholder}
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{t.contact.message}</label>
                  <textarea
                    required
                    rows={5}
                    placeholder={t.contact.messagePlaceholder}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                      resize: 'vertical', fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {error && <p style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px', borderRadius: 12, fontWeight: 800,
                    fontSize: '1rem', background: 'var(--gradient)',
                    color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1, transition: 'opacity .2s',
                  }}
                >
                  {loading ? t.contact.sending : t.contact.send + ' ✉'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
