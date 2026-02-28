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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fullName = firstName + ' ' + lastName
    const redirectTo = `${window.location.origin}/auth/confirm?next=/login`
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
        <div className="auth-modal-card" style={{ textAlign: 'center' }}>
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
      <div className="auth-modal-card">

        <div className="auth-logo">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>
        <h2>{t.auth.createAccount}</h2>
        <p className="auth-sub">{t.auth.registerSub}</p>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-row">
            <div className="input-group">
              <label>{t.auth.firstName}</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
            </div>
            <div className="input-group">
              <label>{t.auth.lastName}</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" required />
            </div>
          </div>
          <div className="input-group">
            <label>{t.auth.businessEmail}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </div>
          <div className="input-group">
            <label>{t.auth.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.passwordMin} minLength={8} required />
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
          {error && <p className="auth-error-msg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary btn-full btn-lg">
            {loading ? t.auth.creating : t.auth.createAccount + ' →'}
          </button>
          <div className="auth-divider"><span>{t.auth.or}</span></div>
          <button type="button" className="btn-social" disabled aria-disabled="true">{t.auth.continueGoogle}</button>
        </form>

        <p className="auth-switch">
          {t.auth.alreadyAccount}{' '}
          <Link href="/login" className="switch-btn">{t.auth.signIn}</Link>
        </p>
      </div>
    </div>
  )
}
