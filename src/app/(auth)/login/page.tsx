'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useT } from '@/contexts/locale'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const t = useT()

  useEffect(() => {
    if (searchParams.get('verified') === '1') setVerified(true)
  }, [searchParams])

  async function handleResend() {
    if (!email) return
    setResendLoading(true)
    const redirectTo = `${window.location.origin}/auth/confirm?next=/login`
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
    setResendSent(true)
    setResendLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')) {
        setUnverified(true)
        setError('')
      } else {
        setError(error.message)
        setUnverified(false)
      }
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

        {verified && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 10, padding: '12px 16px', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
            ✅ ئیمەیڵەکەت ڤێریفای کرا! ئێستا داخیل ببەوە.
          </div>
        )}

        {unverified && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e', borderRadius: 10, padding: '12px 16px', marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>⚠️ ئیمەیڵەکەت ڤێریفای نەکراوە!</p>
            <p style={{ fontSize: 13, marginBottom: 12 }}>تکایە ئیمەیڵەکەت بپشکنە و لینکەکە کلیک بکە.</p>
            {resendSent ? (
              <p style={{ fontWeight: 600, color: '#065f46' }}>✅ ئیمەیڵی نوێ نێردرا!</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || !email}
                style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}
              >
                {resendLoading ? 'دەنێردرێت...' : '📧 دووبارە بنێرە'}
              </button>
            )}
          </div>
        )}

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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page-wrap"><div className="auth-modal-card" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
