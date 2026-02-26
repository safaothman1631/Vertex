'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useT } from '@/contexts/locale'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const t = useT()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Check if admin → redirect to /admin, else homepage
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      if (profile?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-modal-card">

        <div className="auth-logo">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>
        <h2>{t.auth.welcomeBack}</h2>
        <p className="auth-sub">{t.auth.signInSub}</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>{t.auth.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </div>
          <div className="input-group">
            <label>{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <a href="#" className="forgot-link" onClick={e => e.preventDefault()}>{t.auth.forgotPassword}</a>
          </div>
          {error && <p className="auth-error-msg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary btn-full btn-lg">
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>
          <div className="auth-divider"><span>{t.auth.or}</span></div>
          <button type="button" className="btn-social" disabled aria-disabled="true">{t.auth.continueGoogle}</button>
          <button type="button" className="btn-social" disabled aria-disabled="true">{t.auth.continueApple}</button>
        </form>

        <p className="auth-switch">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="switch-btn">{t.auth.signUpFree}</Link>
        </p>
      </div>
    </div>
  )
}
