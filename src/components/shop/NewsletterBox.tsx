'use client'

import { useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'
import { useT } from '@/contexts/locale'

interface Props {
  dark?: boolean
}

export default function NewsletterBox({ dark = false }: Props) {
  const t = useT()
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || t.footer.subscribeFail)
      } else {
        setDone(true)
      }
    } catch {
      setError(t.footer.networkError)
    }
    setLoading(false)
  }

  return (
    <div className={`newsletter-box${dark ? ' dark' : ''}`}>
      <div className="nl-icon" aria-hidden="true">
        <Mail size={20} />
      </div>
      <div className="nl-content">
        <h3 className="nl-title">{t.footer.stayInTheLoop}</h3>
        <p className="nl-desc">{t.footer.nlBoxDesc}</p>
        {done ? (
          <div className="nl-success" role="status">
            <Check size={16} />
            {t.footer.subscribeSuccess}
          </div>
        ) : (
          <form className="nl-form" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              className="nl-input"
              aria-label="Email address"
              required
            />
            <button type="submit" className="nl-btn" disabled={loading || !email.trim()} aria-label={t.footer.subscribe}>
              {loading ? <Loader2 size={16} className="spin" /> : t.footer.subscribe}
            </button>
          </form>
        )}
        {error && <p className="nl-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}
