'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { useT } from '@/contexts/locale'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const t = useT()

  // Supabase sends access_token as hash fragment (#access_token=...&type=recovery)
  // The browser client detects it and fires PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setReady(true)
      }
    })
    // Also check if session already exists
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError(t.auth.passwordsNoMatch)
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login'), 2500)
    }
    setLoading(false)
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-modal-card">
        <div className="auth-logo">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>
        <h2>{t.auth.forgotPasswordTitle}</h2>

        {done ? (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 10, padding: '16px', textAlign: 'center', fontWeight: 600 }}>
            {t.auth.passwordUpdated}
          </div>
        ) : !ready ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {error ? (
              <>
                <p className="auth-error-msg">{error}</p>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="btn-primary btn-full btn-lg"
                  style={{ marginTop: 16 }}
                >
                  {t.auth.backToSignIn}
                </button>
              </>
            ) : (
              <p>چاوەڕوانبە...</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>{t.auth.newPassword}</label>
              <input
                type="password"
                enterKeyHint="next"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
            <div className="input-group">
              <label>{t.auth.confirmPassword}</label>
              <input
                type="password"
                enterKeyHint="done"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>
            {error && <p role="alert" className="auth-error-msg">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary btn-full btn-lg">
              {loading ? t.auth.updating : t.auth.updatePassword}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page-wrap"><div className="auth-modal-card" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
