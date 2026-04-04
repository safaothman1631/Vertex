'use client'

import { useState } from 'react'
import { Mail, Loader2, Check } from 'lucide-react'

interface Props {
  dark?: boolean
}

export default function NewsletterBox({ dark = false }: Props) {
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
        setError(json.error || 'Subscription failed')
      } else {
        setDone(true)
      }
    } catch {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  return (
    <div className={`newsletter-box${dark ? ' dark' : ''}`}>
      <div className="nl-icon" aria-hidden="true">
        <Mail size={20} />
      </div>
      <div className="nl-content">
        <h3 className="nl-title">Stay in the loop</h3>
        <p className="nl-desc">Latest deals, new products &amp; tech updates — right to your inbox.</p>
        {done ? (
          <div className="nl-success" role="status">
            <Check size={16} />
            You&apos;re subscribed! Check your inbox.
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
            <button type="submit" className="nl-btn" disabled={loading || !email.trim()} aria-label="Subscribe">
              {loading ? <Loader2 size={16} className="spin" /> : 'Subscribe'}
            </button>
          </form>
        )}
        {error && <p className="nl-error" role="alert">{error}</p>}
      </div>
    </div>
  )
}
