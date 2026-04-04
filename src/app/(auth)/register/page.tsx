'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useT } from '@/contexts/locale'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bizType, setBizType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useT()

  async function signInWithGoogle() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/confirm?next=/` },
    })
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // ── Password strength enforcement ─────────────────────────────
    if (password.length < 8) {
      setError(t.auth.passwordMin)
      setLoading(false)
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError(t.auth.passwordUpper)
      setLoading(false)
      return
    }
    if (!/[0-9]/.test(password)) {
      setError(t.auth.passwordNumber)
      setLoading(false)
      return
    }

    const fullName = firstName + ' ' + lastName
    const origin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? '')
    const redirectTo = `${origin}/auth/confirm?next=/login`
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo,
      },
    })
    if (error) { setError(error.message) }
    else if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: fullName, role: 'user' })
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="auth-page-wrap">
        <div className="auth-modal-card" style={{ textAlign: 'center', animation: 'anim-scale-up .5s var(--ease-smooth) both' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📧</div>
          <h2>{t.auth.accountCreated}</h2>
          <p className="auth-sub" style={{ marginBottom: 12 }}>{t.auth.checkEmail}</p>
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
            ئیمەیڵێکی ڤێریفیکەیشنت بۆ نێردراوە بۆ <strong>{email}</strong>.<br />
            تکایە ئیمەیڵەکەت بپشکنە و لینکەکە کلیک بکە پێش داخیل بوون.
          </div>
          <Link href="/login" className="btn-primary btn-full btn-lg" style={{ display: 'block' }}>{t.auth.goSignIn}</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-modal-card" style={{ animation: 'anim-scale-up .5s var(--ease-smooth) both' }}>

        <div className="auth-logo">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>
        <h2>{t.auth.createAccount}</h2>
        <p className="auth-sub">{t.auth.registerSub}</p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-row">
            <div className="input-group">
              <label>{t.auth.firstName}</label>
              <input type="text" enterKeyHint="next" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
            </div>
            <div className="input-group">
              <label>{t.auth.lastName}</label>
              <input type="text" enterKeyHint="next" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" required />
            </div>
          </div>
          <div className="input-group">
            <label>{t.auth.businessEmail}</label>
            <input type="email" inputMode="email" enterKeyHint="next" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </div>
          <div className="input-group">
            <label>{t.auth.password}</label>
            <input type="password" enterKeyHint="next" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.passwordMin} minLength={8} required />
          </div>
          <div className="input-group">
            <label>{t.auth.businessType}</label>
            <select value={bizType} onChange={(e) => setBizType(e.target.value)} required>
              <option value="" disabled>{t.auth.selectBiz}</option>
              <option value="restaurant">{t.auth.bizTypes.restaurant}</option>
              <option value="retail">{t.auth.bizTypes.retail}</option>
              <option value="cafe">{t.auth.bizTypes.cafe}</option>
              <option value="grocery">{t.auth.bizTypes.grocery}</option>
              <option value="salon">{t.auth.bizTypes.salon}</option>
              <option value="other">{t.auth.bizTypes.other}</option>
            </select>
          </div>
          {error && <p role="alert" className="auth-error-msg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary btn-full btn-lg">
            {loading ? t.auth.creating : t.auth.createAccount + ' →'}
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
        </form>

        <p className="auth-switch">
          {t.auth.alreadyAccount}{' '}
          <Link href="/login" className="switch-btn">{t.auth.signIn}</Link>
        </p>
      </div>
    </div>
  )
}
