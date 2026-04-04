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
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')
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
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
    const redirectTo = `${origin}/auth/confirm?next=/login`
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
    setResendSent(true)
    setResendLoading(false)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError('')
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    })
    const json = await res.json()
    if (!res.ok) {
      setForgotError(json.error || 'Something went wrong')
    } else {
      setForgotSent(true)
    }
    setForgotLoading(false)
  }

  async function signInWithGoogle() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/confirm?next=/` },
    })
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
      <div className="auth-modal-card" style={{ animation: 'anim-scale-up .5s var(--ease-smooth) both' }}>

        <div className="auth-logo">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>

        {/* ── FORGOT PASSWORD VIEW ── */}
        {forgotMode ? (
          <>
            <h2>{t.auth.forgotPasswordTitle}</h2>
            <p className="auth-sub">{t.auth.forgotPasswordSub}</p>
            {forgotSent ? (
              <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 10, padding: '16px', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
                {t.auth.resetLinkSent}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="input-group">
                  <label>{t.auth.email}</label>
                  <input type="email" inputMode="email" enterKeyHint="send" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@business.com" required />
                </div>
                {forgotError && <p role="alert" className="auth-error-msg">{forgotError}</p>}
                <button type="submit" disabled={forgotLoading} className="btn-primary btn-full btn-lg">
                  {forgotLoading ? t.auth.sendingLink : t.auth.sendResetLink}
                </button>
              </form>
            )}
            <p className="auth-switch">
              <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); setForgotError('') }} className="switch-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ← {t.auth.backToSignIn}
              </button>
            </p>
          </>
        ) : (
          <>
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
            <input type="email" inputMode="email" enterKeyHint="next" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </div>
          <div className="input-group">
            <label>{t.auth.password}</label>
            <input type="password" enterKeyHint="done" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            <button type="button" className="forgot-link" onClick={() => { setForgotMode(true); setForgotEmail(email) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t.auth.forgotPassword}</button>
          </div>
          {error && <p role="alert" className="auth-error-msg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary btn-full btn-lg">
            {loading ? t.auth.signingIn : t.auth.signIn}
          </button>
          <div className="auth-divider"><span>{t.auth.or}</span></div>
          <button type="button" className="btn-social btn-google" onClick={signInWithGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t.auth.continueGoogle}
          </button>
          <button type="button" className="btn-social" disabled aria-disabled="true">{t.auth.continueApple}</button>
        </form>

        <p className="auth-switch">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="switch-btn">{t.auth.signUpFree}</Link>
        </p>
          </>
        )}
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
