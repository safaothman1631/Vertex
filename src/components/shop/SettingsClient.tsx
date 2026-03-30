'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Mail, Lock, Save, CheckCircle, MapPin, Globe, Bell,
  ShoppingBag, Trash2, Phone, Plus, Pencil, X, Star, ChevronRight,
  Camera, Loader2,
} from 'lucide-react'
import { useT, useLocale, type Locale } from '@/contexts/locale'
import type { UserAddress } from '@/types'

interface Props {
  user: { id: string; email?: string | null }
  profile: {
    full_name?: string | null
    phone?: string | null
    avatar_url?: string | null
    preferred_locale?: string | null
    notify_email?: boolean
    notify_order?: boolean
    notify_promo?: boolean
  } | null
  addresses: UserAddress[]
  recentOrders: { id: string; total: number; status: string; created_at: string }[]
  unreadNotifications: number
}

const LANG_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ckb', label: 'کوردی', flag: '🇮🇶' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

export default function SettingsClient({ user, profile, addresses: initAddresses, recentOrders, unreadNotifications }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const t = useT()
  const { locale, setLocale } = useLocale()

  // ── Profile state
  const [name, setName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState(false)

  // ── Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>(initAddresses)
  const [editingAddr, setEditingAddr] = useState<Partial<UserAddress> | null>(null)
  const [savingAddr, setSavingAddr] = useState(false)

  // ── Notifications state
  const [notifyEmail, setNotifyEmail] = useState(profile?.notify_email ?? true)
  const [notifyOrder, setNotifyOrder] = useState(profile?.notify_order ?? true)
  const [notifyPromo, setNotifyPromo] = useState(profile?.notify_promo ?? false)

  // ── Delete account state
  const [deleting, setDeleting] = useState(false)

  // ── Styles
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--bg3)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '.75rem', fontWeight: 700, color: 'var(--text2)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em',
  }
  const card: React.CSSProperties = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
  }
  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      {icon}
      <h2 style={{ fontWeight: 800, fontSize: '.95rem' }}>{title}</h2>
    </div>
  )
  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--primary)', color: '#fff', border: 'none',
    borderRadius: 10, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer',
  }

  // ══════════════════════════════════════════════════════════
  // 1. SAVE PROFILE
  // ══════════════════════════════════════════════════════════
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({ full_name: name, phone, avatar_url: avatarUrl || null }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ══════════════════════════════════════════════════════════
  // 2. CHANGE PASSWORD
  // ══════════════════════════════════════════════════════════
  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg('')
    if (!pwForm.current) { setPwErr(true); setPwMsg(t.settings.pwCurrentRequired); return }
    if (pwForm.next !== pwForm.confirm) { setPwErr(true); setPwMsg(t.settings.pwMismatch); return }
    if (pwForm.next.length < 8) { setPwErr(true); setPwMsg(t.settings.pwMinLength); return }
    if (!/[A-Z]/.test(pwForm.next) || !/[0-9]/.test(pwForm.next)) { setPwErr(true); setPwMsg(t.settings.pwRequirements); return }
    setChangingPw(true)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: pwForm.current })
    if (signInErr) { setPwErr(true); setPwMsg(t.settings.pwCurrentWrong); setChangingPw(false); return }
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })
    setChangingPw(false)
    if (error) { setPwErr(true); setPwMsg(error.message) }
    else { setPwErr(false); setPwMsg(t.settings.pwUpdated); setPwForm({ current: '', next: '', confirm: '' }) }
  }

  // ══════════════════════════════════════════════════════════
  // 3. ADDRESSES CRUD
  // ══════════════════════════════════════════════════════════
  function startNewAddress() {
    setEditingAddr({ label: 'Home', name: '', phone: '', address: '', city: '', country: '', zip: '' })
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAddr) return
    setSavingAddr(true)
    if (editingAddr.id) {
      const { data } = await supabase.from('user_addresses').update({
        label: editingAddr.label, name: editingAddr.name, phone: editingAddr.phone,
        address: editingAddr.address, city: editingAddr.city, country: editingAddr.country, zip: editingAddr.zip,
      }).eq('id', editingAddr.id).select().single()
      if (data) setAddresses(prev => prev.map(a => a.id === data.id ? data : a))
    } else {
      const { data } = await supabase.from('user_addresses').insert({
        user_id: user.id, label: editingAddr.label, name: editingAddr.name, phone: editingAddr.phone,
        address: editingAddr.address, city: editingAddr.city, country: editingAddr.country, zip: editingAddr.zip,
        is_default: addresses.length === 0,
      }).select().single()
      if (data) setAddresses(prev => [...prev, data])
    }
    setSavingAddr(false)
    setEditingAddr(null)
  }

  async function deleteAddress(id: string) {
    await supabase.from('user_addresses').delete().eq('id', id)
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  async function setDefaultAddress(id: string) {
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('user_addresses').update({ is_default: true }).eq('id', id)
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
  }

  // ══════════════════════════════════════════════════════════
  // 4. LANGUAGE
  // ══════════════════════════════════════════════════════════
  const changeLanguage = useCallback(async (code: Locale) => {
    setLocale(code)
    await supabase.from('profiles').update({ preferred_locale: code }).eq('id', user.id)
  }, [setLocale, supabase, user.id])

  // ══════════════════════════════════════════════════════════
  // 5. NOTIFICATIONS
  // ══════════════════════════════════════════════════════════
  async function toggleNotification(key: 'notify_email' | 'notify_order' | 'notify_promo', value: boolean) {
    const setters = { notify_email: setNotifyEmail, notify_order: setNotifyOrder, notify_promo: setNotifyPromo }
    setters[key](value)
    await supabase.from('profiles').update({ [key]: value }).eq('id', user.id)
  }

  // ══════════════════════════════════════════════════════════
  // 6. DELETE ACCOUNT
  // ══════════════════════════════════════════════════════════
  async function handleDeleteAccount() {
    if (!confirm(t.settings.deleteAccountConfirm)) return
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      setDeleting(false)
      alert('Failed to delete account')
    }
  }

  // ── Initials avatar
  const initials = (name || user.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('folder', 'avatars')
    formData.append('files', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.urls?.[0]) {
        setAvatarUrl(data.urls[0])
        await supabase.from('profiles').update({ avatar_url: data.urls[0] }).eq('id', user.id)
      }
      if (data.errors?.length) alert(data.errors.join('\n'))
    } catch { alert('Upload failed') }
    finally { setUploadingAvatar(false) }
  }

  return (
    <div className="resp-page-padding" style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        {/* ── Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: avatarUrl ? 'transparent' : 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '.03em',
              overflow: 'hidden', border: avatarUrl ? '2px solid var(--border)' : 'none',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
            </div>
            <label style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--primary)', border: '2px solid var(--bg2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              {uploadingAvatar ? <Loader2 size={11} color="#fff" className="spin" /> : <Camera size={11} color="#fff" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </label>
          </div>
          <div>
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              {t.settings.title.replace('⚙ ', '')}
            </p>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-.02em' }}>{t.settings.title}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ═══════════ 1. PROFILE ═══════════ */}
          <div className="resp-card-padding-lg" style={card}>
            {sectionHeader(<User size={16} style={{ color: 'var(--primary)' }} />, t.settings.fullName.split(' ')[0] + ' — ' + t.settings.email)}
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <div>
                <label style={labelStyle}>{t.settings.phone}</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={{ ...inputStyle, paddingLeft: 34 }} placeholder={t.settings.phonePlaceholder} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving}
                  style={{
                    ...btnPrimary,
                    background: saved ? 'rgba(16,185,129,.15)' : 'var(--primary)',
                    color: saved ? '#10b981' : '#fff',
                    border: saved ? '1px solid rgba(16,185,129,.3)' : 'none',
                  }}>
                  {saved ? <><CheckCircle size={14} />{t.settings.saved}</> : <><Save size={14} />{saving ? t.settings.saving : t.settings.saveChanges}</>}
                </button>
              </div>
            </form>
          </div>

          {/* ═══════════ 2. PASSWORD ═══════════ */}
          <div className="resp-card-padding-lg" style={card}>
            {sectionHeader(<Lock size={16} style={{ color: 'var(--primary)' }} />, t.settings.changePassword)}
            <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {([
                { key: 'current', label: t.settings.currentPassword },
                { key: 'next', label: t.settings.newPassword },
                { key: 'confirm', label: t.settings.confirmPassword },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type="password" required value={pwForm[key]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              {pwMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 9,
                  background: pwErr ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)',
                  border: `1px solid ${pwErr ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`,
                  color: pwErr ? '#f87171' : '#10b981', fontSize: '.82rem',
                }}>
                  {pwMsg}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={changingPw} style={{ ...btnPrimary, opacity: changingPw ? 0.6 : 1, cursor: changingPw ? 'not-allowed' : 'pointer' }}>
                  <Lock size={14} /> {changingPw ? t.settings.verifying : t.settings.updatePassword}
                </button>
              </div>
            </form>
          </div>

          {/* ═══════════ 3. ADDRESSES ═══════════ */}
          <div className="resp-card-padding-lg" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontWeight: 800, fontSize: '.95rem' }}>{t.settings.myAddresses}</h2>
              </div>
              {!editingAddr && (
                <button onClick={startNewAddress} style={{ ...btnPrimary, padding: '7px 14px', fontSize: '.8rem' }}>
                  <Plus size={14} /> {t.settings.addAddress}
                </button>
              )}
            </div>

            {editingAddr && (
              <form onSubmit={saveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, padding: 20, background: 'var(--bg3)', borderRadius: 12 }}>
                <div className="resp-grid-2col" style={{ gap: 12 }}>
                  <div>
                    <label style={labelStyle}>{t.settings.addressLabel}</label>
                    <input value={editingAddr.label ?? ''} onChange={e => setEditingAddr(p => ({ ...p, label: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.settings.addressName}</label>
                    <input value={editingAddr.name ?? ''} onChange={e => setEditingAddr(p => ({ ...p, name: e.target.value }))} style={inputStyle} required />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{t.settings.addressPhone}</label>
                  <input value={editingAddr.phone ?? ''} onChange={e => setEditingAddr(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t.settings.addressLine}</label>
                  <input value={editingAddr.address ?? ''} onChange={e => setEditingAddr(p => ({ ...p, address: e.target.value }))} style={inputStyle} required />
                </div>
                <div className="resp-grid-3col" style={{ gap: 12 }}>
                  <div>
                    <label style={labelStyle}>{t.settings.addressCity}</label>
                    <input value={editingAddr.city ?? ''} onChange={e => setEditingAddr(p => ({ ...p, city: e.target.value }))} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.settings.addressCountry}</label>
                    <input value={editingAddr.country ?? ''} onChange={e => setEditingAddr(p => ({ ...p, country: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t.settings.addressZip}</label>
                    <input value={editingAddr.zip ?? ''} onChange={e => setEditingAddr(p => ({ ...p, zip: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setEditingAddr(null)} style={{ ...btnPrimary, background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                    {t.settings.cancelEdit}
                  </button>
                  <button type="submit" disabled={savingAddr} style={{ ...btnPrimary, opacity: savingAddr ? 0.6 : 1 }}>
                    <Save size={14} /> {t.settings.saveAddress}
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 && !editingAddr && (
              <p style={{ color: 'var(--text3)', fontSize: '.85rem', textAlign: 'center', padding: '20px 0' }}>{t.settings.noAddresses}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {addresses.map(addr => (
                <div key={addr.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '14px 16px', borderRadius: 10, background: 'var(--bg3)',
                  border: addr.is_default ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{addr.label}</span>
                      {addr.is_default && (
                        <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(99,102,241,.1)', padding: '2px 8px', borderRadius: 6 }}>
                          {t.settings.defaultAddress}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '.8rem', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {addr.name} — {addr.address}, {addr.city} {addr.zip}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {!addr.is_default && (
                      <button onClick={() => setDefaultAddress(addr.id)} title={t.settings.setDefault}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: '.72rem', fontWeight: 600 }}>
                        <Star size={12} />
                      </button>
                    )}
                    <button onClick={() => setEditingAddr(addr)} title={t.settings.editAddress}
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'none', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => deleteAddress(addr.id)} title={t.settings.deleteAddress}
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'none', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════ 4. LANGUAGE ═══════════ */}
          <div className="resp-card-padding-lg" style={card}>
            {sectionHeader(<Globe size={16} style={{ color: 'var(--primary)' }} />, t.settings.language)}
            <p style={{ color: 'var(--text3)', fontSize: '.8rem', marginBottom: 14, marginTop: -10 }}>{t.settings.languageDesc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {LANG_OPTIONS.map(lang => (
                <button key={lang.code} onClick={() => changeLanguage(lang.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', fontFamily: 'inherit',
                    background: locale === lang.code ? 'rgba(99,102,241,.1)' : 'var(--bg3)',
                    border: locale === lang.code ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    color: locale === lang.code ? 'var(--primary)' : 'var(--text)',
                    transition: 'all .15s',
                  }}>
                  <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════ 5. NOTIFICATIONS ═══════════ */}
          <div className="resp-card-padding-lg" style={card}>
            {sectionHeader(
              <div style={{ position: 'relative' }}>
                <Bell size={16} style={{ color: 'var(--primary)' }} />
                {unreadNotifications > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6, width: 14, height: 14, borderRadius: '50%',
                    background: '#ef4444', color: '#fff', fontSize: '.6rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                )}
              </div>,
              t.settings.notifications
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { key: 'notify_email' as const, label: t.settings.notifyEmail, desc: t.settings.notifyEmailDesc, value: notifyEmail },
                { key: 'notify_order' as const, label: t.settings.notifyOrder, desc: t.settings.notifyOrderDesc, value: notifyOrder },
                { key: 'notify_promo' as const, label: t.settings.notifyPromo, desc: t.settings.notifyPromoDesc, value: notifyPromo },
              ]).map(n => (
                <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '.85rem' }}>{n.label}</p>
                    <p style={{ color: 'var(--text3)', fontSize: '.75rem', marginTop: 2 }}>{n.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(n.key, !n.value)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: n.value ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0,
                    }}>
                    <span style={{
                      position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
                      background: '#fff', transition: 'left .2s',
                      left: n.value ? 22 : 2,
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════ 6. RECENT ORDERS ═══════════ */}
          <div className="resp-card-padding-lg" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={16} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontWeight: 800, fontSize: '.95rem' }}>{t.settings.recentOrders}</h2>
              </div>
              <Link href="/orders" style={{ fontSize: '.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                {t.settings.viewAllOrders}
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: '.85rem', textAlign: 'center', padding: '20px 0' }}>{t.settings.noRecentOrders}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentOrders.map(order => (
                  <Link key={order.id} href="/orders" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)', textDecoration: 'none', color: 'var(--text)',
                    transition: 'background .15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: STATUS_COLORS[order.status] || '#888',
                      }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '.82rem' }}>
                          #{order.id.slice(0, 8)}
                        </p>
                        <p style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: '.7rem', fontWeight: 700, textTransform: 'capitalize',
                        color: STATUS_COLORS[order.status] || '#888',
                        background: `${STATUS_COLORS[order.status] || '#888'}15`,
                        padding: '3px 8px', borderRadius: 6,
                      }}>
                        {(t.orders.status as Record<string, string>)[order.status] || order.status}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '.85rem' }}>${order.total.toFixed(2)}</span>
                      <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════ 7. DANGER ZONE ═══════════ */}
          <div className="resp-card-padding-lg" style={{ ...card, border: '1px solid rgba(239,68,68,.25)' }}>
            {sectionHeader(<Trash2 size={16} style={{ color: '#ef4444' }} />, t.settings.dangerZone)}
            <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: 16, marginTop: -10 }}>
              {t.settings.deleteAccountDesc}
            </p>
            <button onClick={handleDeleteAccount} disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)',
                borderRadius: 10, fontWeight: 700, fontSize: '.85rem', cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}>
              <Trash2 size={14} /> {deleting ? t.settings.deleting : t.settings.deleteAccount}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
