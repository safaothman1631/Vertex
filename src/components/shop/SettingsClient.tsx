'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { User, Mail, Lock, Save, CheckCircle } from 'lucide-react'
import { useT } from '@/contexts/locale'

export default function SettingsClient({ user, profile }: { user: { id: string; email?: string | null }, profile: { full_name?: string | null } | null }) {
  const [name, setName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState(false)
  const supabase = createClient()
  const t = useT()

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--bg3)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '.75rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em',
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    if (pwForm.next !== pwForm.confirm) { setPwErr(true); setPwMsg('Passwords do not match'); return }
    if (pwForm.next.length < 8) { setPwErr(true); setPwMsg('Password must be at least 8 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    if (error) { setPwErr(true); setPwMsg(error.message) }
    else { setPwErr(false); setPwMsg('Password updated successfully!'); setPwForm({ current: '', next: '', confirm: '' }) }
  }

  const card: React.CSSProperties = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '28px 32px' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>{t.settings.title.replace('⚙ ', '')}</p>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-.02em' }}>{t.settings.title}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Profile info */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <User size={16} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontWeight: 800, fontSize: '.95rem' }}>Profile Information</h2>
            </div>
            <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t.settings.fullName}</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder={t.settings.fullName} />
              </div>
              <div>
                <label style={labelStyle}>{t.settings.email}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input value={user.email ?? ''} disabled style={{ ...inputStyle, paddingLeft: 34, opacity: .6, cursor: 'not-allowed' }} />
                </div>
                <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 5 }}>{t.settings.emailNote}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: saved ? 'rgba(16,185,129,.15)' : 'var(--primary)', color: saved ? '#10b981' : '#fff', border: saved ? '1px solid rgba(16,185,129,.3)' : 'none', borderRadius: 10, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s' }}>
                  {saved ? <><CheckCircle size={14} />{t.settings.saved}</> : <><Save size={14} />{saving ? t.settings.saving : t.settings.saveChanges}</>}
                </button>
              </div>
            </form>
          </div>

          {/* Password */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Lock size={16} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontWeight: 800, fontSize: '.95rem' }}>Change Password</h2>
            </div>
            <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'next', label: 'New Password' },
                { key: 'confirm', label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type="password" required value={pwForm[key as keyof typeof pwForm]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} placeholder="" />
                </div>
              ))}
              {pwMsg && (
                <div style={{ padding: '10px 14px', borderRadius: 9, background: pwErr ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)', border: `1px solid ${pwErr ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`, color: pwErr ? '#f87171' : '#10b981', fontSize: '.82rem' }}>
                  {pwMsg}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>
                  <Lock size={14} /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
