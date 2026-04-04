'use client'
import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'
import FadeIn from '@/components/ui/FadeIn'
import { useT } from '@/contexts/locale'
import { createClient } from '@/lib/supabase-client'

export default function ContactSection() {
  const t = useT()
  const supabase = createClient()
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactHp, setContactHp] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const [contactError, setContactError] = useState('')

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (contactHp) return
    setContactLoading(true)
    setContactError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      setContactError('Please enter a valid email address')
      setContactLoading(false)
      return
    }
    if (contactForm.name.length > 200 || contactForm.subject.length > 300 || contactForm.message.length > 5000) {
      setContactError('Please shorten your input')
      setContactLoading(false)
      return
    }
    const { error } = await supabase.from('contact_messages').insert(contactForm)
    if (error) {
      setContactError('Failed to send message. Please try again.')
    } else {
      setContactSuccess(true)
      setContactForm({ name: '', email: '', subject: '', message: '' })
    }
    setContactLoading(false)
  }

  return (
    <section id="contact" className="section" style={{ background: 'var(--bg0)' }}>
      <div className="container" style={{ maxWidth: 1100 }}>
        <FadeIn>
          <div className="section-header">
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Support</p>
            <h2 className="section-title">{t.contact.title.split(' ')[0]} <span className="gradient-text">{t.contact.title.split(' ').slice(1).join(' ')}</span></h2>
            <p className="section-sub">Have a question about our products? Our team is ready to help you find the perfect POS solution.</p>
          </div>
        </FadeIn>

        <div className="resp-grid-contact" style={{ display: 'grid', alignItems: 'start' }}>
          {/* Left — contact info */}
          <FadeIn>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: Mail, label: 'Email', value: 'safaothman1631@gmail.com', sub: 'We reply within 24 hours' },
                { icon: Phone, label: 'Phone', value: '+964 750 529 9118 / +964 750 870 6750', sub: 'Mon-Fri, 9am-6pm' },
                { icon: MapPin, label: 'Address', value: 'سوڵتان مزەفەر فەرعی جیهانی کامیرە بینای ئیپسۆن', sub: 'Visit us anytime' },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '20px 24px',
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(99,102,241,.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          </FadeIn>

          {/* Right — form */}
          <FadeIn delay={100}>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '36px 40px',
            }} className="resp-card-padding-lg">
              {contactSuccess ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                  <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>{t.contact.sent}</h3>
                  <p style={{ color: 'var(--text2)' }}>{t.contact.sub}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 4 }}>{t.contact.title}</h3>

                  {/* Honeypot */}
                  <div style={{ position: 'absolute', left: -9999, opacity: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
                    <input tabIndex={-1} autoComplete="off" value={contactHp} onChange={e => setContactHp(e.target.value)} />
                  </div>

                  <div className="resp-grid-2col" style={{ display: 'grid', gap: 16 }}>
                    {(['name', 'email'] as const).map((key) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{key === 'name' ? t.contact.name : t.contact.email}</label>
                        <input
                          type={key === 'email' ? 'email' : 'text'}
                          required
                          placeholder={key === 'name' ? t.contact.namePlaceholder : t.contact.emailPlaceholder}
                          value={contactForm[key]}
                          onChange={(e) => setContactForm({ ...contactForm, [key]: e.target.value })}
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
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
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
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontSize: '.9rem', outline: 'none',
                        resize: 'vertical', fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {contactError && <p style={{ color: 'var(--danger)', fontSize: '.85rem' }}>{contactError}</p>}

                  <button
                    type="submit"
                    disabled={contactLoading}
                    style={{
                      padding: '14px', borderRadius: 12, fontWeight: 800,
                      fontSize: '1rem', background: 'var(--gradient)',
                      color: '#fff', border: 'none',
                      cursor: contactLoading ? 'not-allowed' : 'pointer',
                      opacity: contactLoading ? 0.6 : 1, transition: 'opacity .2s',
                    }}
                  >
                    {contactLoading ? t.contact.sending : t.contact.send + ' ✉'}
                  </button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Map */}
        <FadeIn delay={200}>
          <div style={{
            marginTop: 40,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}>
            {/* Map header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--bg3)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(99,102,241,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '.92rem' }}>Vertex — هەولێر</div>
                <div style={{ color: 'var(--text2)', fontSize: '.78rem', marginTop: 2 }}>سوڵتان مزەفەر · فەرعی جیهانی کامیرە · بینای ئیپسۆن</div>
              </div>
              <a
                href="https://maps.app.goo.gl/cs2VCTksetkwhKt19"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginInlineStart: 'auto',
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'rgba(99,102,241,.12)',
                  border: '1px solid rgba(99,102,241,.2)',
                  color: 'var(--primary)',
                  fontSize: '.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <MapPin size={12} />
                Google Maps بکەرەوە
              </a>
            </div>
            {/* Iframe */}
            <div style={{ position: 'relative', width: '100%', height: 380 }}>
              <iframe
                src="https://maps.google.com/maps?q=36.191161,44.0035543&z=18&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block', filter: 'brightness(.88) contrast(1.05) saturate(.8)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vertex Location"
              />
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(180deg,rgba(6,6,14,.08) 0%,transparent 30%,transparent 70%,rgba(6,6,14,.1) 100%)',
              }} />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
