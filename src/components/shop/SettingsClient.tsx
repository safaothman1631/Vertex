'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Mail, Lock, Save, CheckCircle, MapPin, Globe, Bell,
  ShoppingBag, Trash2, Phone, Plus, Pencil, X, Star, ChevronRight,
  Camera, Loader2, LocateFixed, Map, BellRing, Package, Tag, Info,
  Settings, CheckCheck, Clock, Eye, EyeOff, AlertTriangle,
  Palette, DollarSign, Heart, BoxIcon, MessageSquare, Shield, Zap, LayoutGrid,
  Sun, Moon, Monitor,
} from 'lucide-react'
import { useT, useLocale, type Locale } from '@/contexts/locale'
import { usePreferences, SYMBOLS } from '@/contexts/preferences'
import type { UserAddress, Notification } from '@/types'

interface Props {
  user: { id: string; email?: string | null; created_at?: string }
  profile: {
    full_name?: string | null
    phone?: string | null
    avatar_url?: string | null
    preferred_locale?: string | null
    notify_email?: boolean
    notify_order?: boolean
    notify_promo?: boolean
    notify_wishlist?: boolean
    notify_stock?: boolean
    notify_sms?: boolean
    newsletter?: boolean
    login_alerts?: boolean
    auto_apply_coupon?: boolean
    theme?: string
    currency?: string
    compact_mode?: boolean
  } | null
  addresses: UserAddress[]
  recentOrders: { id: string; total: number; status: string; created_at: string }[]
  unreadNotifications: number
  notifications: Notification[]
}

const LANG_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '????' },
  { code: 'ckb', label: '?????', flag: '????' },
  { code: 'ar', label: '???????', flag: '????' },
  { code: 'tr', label: 'T�rk�e', flag: '????' },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

export default function SettingsClient({ user, profile, addresses: initAddresses, recentOrders, unreadNotifications, notifications: initNotifications }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const t = useT()
  const { locale, setLocale } = useLocale()
  const { setTheme: applyTheme, setCurrency: applyCurrency, setCompactMode: applyCompactMode, formatPrice, effectiveRates, rates, customRates, setCustomRate: applyCustomRate } = usePreferences()

  // -- Profile state
  const [name, setName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // -- Password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPw, setChangingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState(false)

  // -- Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>(initAddresses)
  const [editingAddr, setEditingAddr] = useState<Partial<UserAddress> | null>(null)
  const [savingAddr, setSavingAddr] = useState(false)
  const [mapPickerOpen, setMapPickerOpen] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // -- IntersectionObserver: track active section for sidebar
  useEffect(() => {
    const ids = ['profile', 'password', 'addresses', 'appearance', 'language', 'notifications', 'privacy', 'orders', 'danger']
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id) })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  // -- Supabase realtime: new notification arrives ? prepend to inbox
  useEffect(() => {
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload: { new: Notification }) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, user.id])

  // Listen for map clicks from iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data && typeof e.data.lat === 'number' && typeof e.data.lng === 'number') {
        setPickedLatLng({ lat: e.data.lat, lng: e.data.lng })
        reverseGeocode(e.data.lat, e.data.lng)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reverseGeocode(lat: number, lng: number) {
    setGeocoding(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      const a = data.address ?? {}
      setEditingAddr(prev => ({
        ...prev,
        address: [a.road, a.house_number].filter(Boolean).join(' ') || a.suburb || a.neighbourhood || data.display_name?.split(',')[0] || '',
        city: a.city || a.town || a.village || a.county || a.state_district || '',
        country: a.country || '',
        zip: a.postcode || '',
      }))
      setMapPickerOpen(false)
    } catch (err) { console.error('[settings] geocode:', err) }
    setGeocoding(false)
  }

  const [geoError, setGeoError] = useState('')

  async function useMyLocation() {
    setGeocoding(true)
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('??????????? ??????? ??????? ?????')
      setGeocoding(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        iframeRef.current?.contentWindow?.postMessage({ flyTo: true, lat, lng }, '*')
        reverseGeocode(lat, lng)
      },
      () => {
        setGeoError('????? ????????? ??? ?? ??????? � ?? ??? ?????? ???? ??? ????? ??????? ?? ? Location ????? ?? Allow')
        setGeocoding(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // -- Notifications state
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [activeSection, setActiveSection] = useState('profile')
  const [clearConfirm, setClearConfirm] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState(profile?.notify_email ?? true)
  const [notifyOrder, setNotifyOrder] = useState(profile?.notify_order ?? true)
  const [notifyPromo, setNotifyPromo] = useState(profile?.notify_promo ?? false)
  const [notifyWishlist, setNotifyWishlist] = useState(profile?.notify_wishlist ?? true)
  const [notifyStock, setNotifyStock] = useState(profile?.notify_stock ?? true)
  const [notifySms, setNotifySms] = useState(profile?.notify_sms ?? false)
  const [newsletter, setNewsletter] = useState(profile?.newsletter ?? true)
  const [loginAlerts, setLoginAlerts] = useState(profile?.login_alerts ?? true)
  const [autoApplyCoupon, setAutoApplyCoupon] = useState(profile?.auto_apply_coupon ?? true)
  const [theme, setTheme] = useState(profile?.theme ?? 'dark')
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD')
  const [compactMode, setCompactMode] = useState(profile?.compact_mode ?? false)
  const [notifications, setNotifications] = useState<Notification[]>(initNotifications)
  const [unreadCount, setUnreadCount] = useState(unreadNotifications)
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all')
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const filteredNotifs = notifFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  async function markNotifRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllRead() {
    setMarkingAllRead(true)
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    }
    setMarkingAllRead(false)
  }

  async function deleteNotif(id: string) {
    const wasUnread = notifications.find(n => n.id === id && !n.is_read)
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1))
    await supabase.from('notifications').delete().eq('id', id)
  }

  async function clearAllNotifs() {
    setNotifications([])
    setUnreadCount(0)
    await supabase.from('notifications').delete().eq('user_id', user.id)
  }

  function getNotifIcon(type: string) {
    switch (type) {
      case 'order': return <Package size={16} />
      case 'promo': return <Tag size={16} />
      case 'system': return <Settings size={16} />
      default: return <Info size={16} />
    }
  }

  function getNotifColor(type: string) {
    switch (type) {
      case 'order': return '#3b82f6'
      case 'promo': return '#f59e0b'
      case 'system': return '#8b5cf6'
      default: return '#6366f1'
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t.settings.justNow
    if (mins < 60) return `${mins}${t.settings.minutesAgo}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}${t.settings.hoursAgo}`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}${t.settings.daysAgo}`
    return new Date(dateStr).toLocaleDateString()
  }

  // -- Delete account state
  const [deleting, setDeleting] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle')
  const [deletePassword, setDeletePassword] = useState('')

  // -- Styles
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--bg3)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '.75rem', fontWeight: 700, color: 'var(--text2)',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em',
  }

  // Leaflet map HTML for iframe srcdoc
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

  // ----------------------------------------------------------
  // 1. SAVE PROFILE
  // ----------------------------------------------------------
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('profiles').update({ full_name: name, phone, avatar_url: avatarUrl || null }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ----------------------------------------------------------
  // 2. CHANGE PASSWORD
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // 3. ADDRESSES CRUD
  // ----------------------------------------------------------
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

  // ----------------------------------------------------------
  // 4. LANGUAGE
  // ----------------------------------------------------------
  const changeLanguage = useCallback(async (code: Locale) => {
    setLocale(code)
    await supabase.from('profiles').update({ preferred_locale: code }).eq('id', user.id)
  }, [setLocale, supabase, user.id])

  // ----------------------------------------------------------
  // 5. NOTIFICATIONS
  // ----------------------------------------------------------
  type BoolPrefKey = 'notify_email' | 'notify_order' | 'notify_promo' | 'notify_wishlist' | 'notify_stock' | 'notify_sms' | 'newsletter' | 'login_alerts' | 'auto_apply_coupon' | 'compact_mode'

  const [smsPhoneWarn, setSmsPhoneWarn] = useState(false)

  async function toggleNotification(key: BoolPrefKey, value: boolean) {
    // Require phone number for SMS
    if (key === 'notify_sms' && value && !phone.trim()) {
      setSmsPhoneWarn(true)
      setTimeout(() => setSmsPhoneWarn(false), 4000)
      // Scroll to profile section so user can add phone
      document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    const prev: Record<BoolPrefKey, boolean> = {
      notify_email: notifyEmail, notify_order: notifyOrder, notify_promo: notifyPromo,
      notify_wishlist: notifyWishlist, notify_stock: notifyStock, notify_sms: notifySms,
      newsletter, login_alerts: loginAlerts, auto_apply_coupon: autoApplyCoupon,
      compact_mode: compactMode,
    }
    const setters: Record<BoolPrefKey, (v: boolean) => void> = {
      notify_email: setNotifyEmail, notify_order: setNotifyOrder, notify_promo: setNotifyPromo,
      notify_wishlist: setNotifyWishlist, notify_stock: setNotifyStock, notify_sms: setNotifySms,
      newsletter: setNewsletter, login_alerts: setLoginAlerts, auto_apply_coupon: setAutoApplyCoupon,
      compact_mode: setCompactMode,
    }
    setters[key](value) // optimistic
    if (key === 'compact_mode') applyCompactMode(value)
    const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', user.id)
    if (error) {
      setters[key](prev[key]) // revert on failure
      console.error('toggleNotification failed:', error.message)
    }
  }

  async function updateTextPref(key: 'theme' | 'currency', value: string) {
    const prev = { theme, currency }
    if (key === 'theme') { setTheme(value); applyTheme(value) }
    else { setCurrency(value); applyCurrency(value) }
    const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', user.id)
    if (error) {
      if (key === 'theme') setTheme(prev.theme)
      else setCurrency(prev.currency)
      console.error('updateTextPref failed:', error.message)
    }
  }

  // ----------------------------------------------------------
  // 6. DELETE ACCOUNT
  // ----------------------------------------------------------
  async function handleDeleteAccount() {
    if (deleteStep === 'idle') {
      setDeleteStep('confirm')
      setDeletePassword('')
      return
    }
    if (!deletePassword) {
      alert(t.settings.deletePasswordRequired)
      return
    }
    setDeleting(true)
    const res = await fetch('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: deletePassword }),
    })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      const data = await res.json().catch(() => ({}))
      setDeleting(false)
      setDeleteStep('idle')
      setDeletePassword('')
      alert(data.error || 'Failed to delete account')
    }
  }

  // -- Sections list for sidebar nav
  const SECTIONS = [
    { id: 'profile',       icon: <User size={14} />,         label: t.settings.sectionProfile },
    { id: 'password',      icon: <Lock size={14} />,         label: t.settings.sectionPassword },
    { id: 'addresses',     icon: <MapPin size={14} />,       label: t.settings.myAddresses },
    { id: 'appearance',    icon: <Palette size={14} />,      label: t.settings.sectionAppearance },
    { id: 'language',      icon: <Globe size={14} />,        label: t.settings.language },
    { id: 'notifications', icon: <Bell size={14} />,         label: t.settings.notifications },
    { id: 'privacy',       icon: <Shield size={14} />,       label: t.settings.sectionPrivacy },
    { id: 'orders',        icon: <ShoppingBag size={14} />,  label: t.settings.recentOrders },
    { id: 'danger',        icon: <AlertTriangle size={14} />,label: t.settings.dangerZone },
  ]

  // -- Initials avatar
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
      <div className="container" style={{ maxWidth: 980 }}>
        {/* -- Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative', width: 56, height: 56, borderRadius: 16, background: avatarUrl ? 'transparent' : 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '.03em',
              overflow: 'hidden', border: avatarUrl ? '2px solid var(--border)' : 'none',
            }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill style={{ objectFit: 'cover' }} sizes="56px" />
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
              {t.settings.title.replace('? ', '')}
            </p>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-.02em' }}>{t.settings.title}</h1>
          </div>
        </div>

        <div className="settings-layout">

          {/* -- Sidebar nav -- */}
          <aside className="settings-sidebar">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                className={`settings-nav-btn${activeSection === s.id ? ' active' : ''}`}
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <span className="snav-icon">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </aside>

          {/* -- Main content -- */}
          <div className="settings-main">

          {/* ----------- 1. PROFILE ----------- */}
          <div id="profile" className="settings-section resp-card-padding-lg" style={card}>
            {sectionHeader(<User size={16} style={{ color: 'var(--primary)' }} />, t.settings.fullName.split(' ')[0] + ' � ' + t.settings.email)}
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t.settings.fullName}</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder={t.settings.fullName} />
              </div>
              <div>
                <label style={labelStyle}>{t.settings.email}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input value={user.email ?? ''} disabled style={{ ...inputStyle, paddingInlineStart: 34, opacity: .6, cursor: 'not-allowed' }} />
                </div>
                <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginTop: 5 }}>{t.settings.emailNote}</p>
              </div>
              <div>
                <label style={labelStyle}>{t.settings.phone}</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input value={phone} onChange={e => setPhone(e.target.value)} style={{ ...inputStyle, paddingInlineStart: 34 }} placeholder={t.settings.phonePlaceholder} />
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

          {/* ----------- 2. PASSWORD ----------- */}
          <div id="password" className="settings-section resp-card-padding-lg" style={card}>
            {sectionHeader(<Lock size={16} style={{ color: 'var(--primary)' }} />, t.settings.changePassword)}
            <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {([
                { key: 'current', label: t.settings.currentPassword },
                { key: 'next', label: t.settings.newPassword },
                { key: 'confirm', label: t.settings.confirmPassword },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      required
                      value={pwForm[key]}
                      onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                      style={{ ...inputStyle, paddingInlineEnd: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                      style={{ position: 'absolute', insetInlineEnd: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, display: 'flex', alignItems: 'center' }}
                    >
                      {showPw[key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
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

          {/* ----------- 3. ADDRESSES ----------- */}
          <div id="addresses" className="settings-section resp-card-padding-lg" style={card}>
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

                {/* Map picker buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen(true)}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
                      fontSize: '.82rem', fontFamily: 'inherit', border: '1.5px solid rgba(99,102,241,.4)',
                      background: 'rgba(99,102,241,.08)', color: 'var(--primary)', transition: 'all .18s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,.18)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,.08)' }}
                  >
                    <Map size={15} />
                    ????? ??? ????? ???
                  </button>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={geocoding}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      padding: '10px 16px', borderRadius: 10, cursor: geocoding ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: '.82rem', fontFamily: 'inherit',
                      border: '1.5px solid rgba(16,185,129,.35)',
                      background: geocoding ? 'rgba(16,185,129,.05)' : 'rgba(16,185,129,.08)',
                      color: '#10b981', transition: 'all .18s', opacity: geocoding ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!geocoding) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,.18)' }}
                    onMouseLeave={e => { if (!geocoding) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,.08)' }}
                  >
                    {geocoding ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <LocateFixed size={15} />}
                    {geocoding ? '??????????...' : '????? ??????????'}
                  </button>
                </div>

                {/* Geolocation error */}
                {geoError && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                    color: '#f87171', fontSize: '.8rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <MapPin size={14} />
                    {geoError}
                  </div>
                )}

                {/* Map picker modal */}
                {mapPickerOpen && (
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 16,
                  }}>
                    <div style={{
                      background: 'var(--bg2)', borderRadius: 18, overflow: 'hidden',
                      width: '100%', maxWidth: 640,
                      border: '1px solid var(--border)',
                      boxShadow: '0 24px 60px rgba(0,0,0,.6)',
                      display: 'flex', flexDirection: 'column',
                    }}>
                      {/* Modal header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', borderBottom: '1px solid var(--border)',
                        background: 'var(--bg3)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontWeight: 800, fontSize: '.95rem' }}>???????? ????? ??? ????? ???</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMapPickerOpen(false)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4, borderRadius: 6 }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      {/* Hint */}
                      <div style={{ padding: '10px 20px', background: 'rgba(99,102,241,.05)', borderBottom: '1px solid var(--border)', fontSize: '.8rem', color: 'var(--text2)' }}>
                        ?? ????? ??? ???? ??? ?? ???????? ????? ?????? ??? ????? ??????????? ????????
                      </div>
                      {/* Map iframe */}
                      <iframe
                        ref={iframeRef}
                        src="/map-picker.html"
                        style={{ border: 0, width: '100%', height: 420, display: 'block' }}
                        title="Location Picker"
                        allow="geolocation"
                      />
                      {geocoding && (
                        <div style={{
                          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8,
                          color: 'var(--primary)', fontSize: '.82rem', borderTop: '1px solid var(--border)',
                        }}>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          ?????? ????????????...
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                      {addr.name} � {addr.address}, {addr.city} {addr.zip}
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

          {/* ----------- 4. APPEARANCE ----------- */}
          <div id="appearance" className="settings-section resp-card-padding-lg" style={card}>
            {sectionHeader(<Palette size={16} style={{ color: 'var(--primary)' }} />, t.settings.sectionAppearance)}

            {/* Theme */}
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {t.settings.themeLabel}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {([
                { value: 'dark', icon: <Moon size={16} />, label: t.settings.themeDark },
                { value: 'light', icon: <Sun size={16} />, label: t.settings.themeLight },
                { value: 'auto', icon: <Monitor size={16} />, label: t.settings.themeAuto },
              ]).map(opt => (
                <button key={opt.value} onClick={() => updateTextPref('theme', opt.value)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '16px 12px', borderRadius: 12, cursor: 'pointer', fontWeight: 600,
                    fontSize: '.82rem', fontFamily: 'inherit', transition: 'all .15s',
                    background: theme === opt.value ? 'rgba(99,102,241,.12)' : 'var(--bg3)',
                    border: theme === opt.value ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    color: theme === opt.value ? 'var(--primary)' : 'var(--text)',
                  }}>
                  <span style={{ opacity: theme === opt.value ? 1 : 0.5 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Currency */}
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {t.settings.currencyLabel}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
              {([
                { code: 'USD', symbol: '$', label: 'USD' },
                { code: 'IQD', symbol: '?.?', label: 'IQD' },
                { code: 'EUR', symbol: '�', label: 'EUR' },
                { code: 'TRY', symbol: '?', label: 'TRY' },
              ]).map(cur => (
                <button key={cur.code} onClick={() => updateTextPref('currency', cur.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '.85rem', fontFamily: 'inherit',
                    background: currency === cur.code ? 'rgba(99,102,241,.1)' : 'var(--bg3)',
                    border: currency === cur.code ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    color: currency === cur.code ? 'var(--primary)' : 'var(--text)',
                    transition: 'all .15s',
                  }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, opacity: 0.7, width: 24, textAlign: 'center' }}>{cur.symbol}</span>
                  {cur.label}
                </button>
              ))}
            </div>

            {/* Custom Exchange Rates */}
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, marginTop: 20, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {t.settings.customRateLabel ?? 'Custom Exchange Rates'}
            </p>
            <p style={{ fontSize: '.73rem', color: 'var(--text3)', marginBottom: 12 }}>
              {t.settings.customRateDesc ?? 'Override API rates with your own market rates (e.g. Kurdistan parallel market)'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['IQD', 'EUR', 'TRY'] as const).map(code => {
                const apiRate = rates[code] ?? 0
                const isCustom = code in customRates
                const currentRate = effectiveRates[code] ?? apiRate
                return (
                  <div key={code} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderRadius: 10, background: 'var(--bg3)', border: isCustom ? '1px solid #f59e0b33' : '1px solid transparent',
                  }}>
                    <span style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--text2)', minWidth: 36 }}>{code}</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--text3)', whiteSpace: 'nowrap' }}>1 USD =</span>
                    <input
                      type="number"
                      dir="ltr"
                      defaultValue={currentRate}
                      onBlur={e => {
                        const val = parseFloat(e.target.value)
                        if (val > 0 && val !== apiRate) {
                          applyCustomRate(code, val)
                        } else if (val === apiRate || !e.target.value) {
                          applyCustomRate(code, null)
                        }
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 8,
                        border: '1px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text)', fontFamily: 'inherit', fontWeight: 700,
                        fontSize: '.85rem', minWidth: 0,
                      }}
                    />
                    <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{SYMBOLS[code]}</span>
                    {isCustom && (
                      <button
                        onClick={() => applyCustomRate(code, null)}
                        title="Reset"
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)',
                          background: 'var(--bg)', color: '#f59e0b', cursor: 'pointer',
                          fontSize: '.65rem', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
                        }}
                      >
                        Reset
                      </button>
                    )}
                    {!isCustom && (
                      <span style={{ fontSize: '.6rem', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>API</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Compact mode & Auto-apply coupons */}
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {t.settings.displayLabel}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { key: 'compact_mode' as const, icon: <LayoutGrid size={15} />, label: t.settings.compactMode, desc: t.settings.compactModeDesc, value: compactMode },
                { key: 'auto_apply_coupon' as const, icon: <Zap size={15} />, label: t.settings.autoApplyCoupon, desc: t.settings.autoApplyCouponDesc, value: autoApplyCoupon },
              ]).map(n => (
                <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{n.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '.85rem' }}>{n.label}</p>
                      <p style={{ color: 'var(--text3)', fontSize: '.73rem', marginTop: 2 }}>{n.desc}</p>
                    </div>
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

          {/* ----------- 5. LANGUAGE ----------- */}
          <div id="language" className="settings-section resp-card-padding-lg" style={card}>
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

          {/* ----------- 6. NOTIFICATIONS ----------- */}
          <div id="notifications" className="settings-section resp-card-padding-lg" style={card}>
            {sectionHeader(
              <div style={{ position: 'relative' }}>
                <Bell size={16} style={{ color: 'var(--primary)' }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6, width: 14, height: 14, borderRadius: '50%',
                    background: '#ef4444', color: '#fff', fontSize: '.6rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </div>,
              t.settings.notifications
            )}

            {/* -- Notification Preferences -- */}
            <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              {t.settings.notifPreferences}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {([
                { key: 'notify_email' as const, icon: <Mail size={15} />, label: t.settings.notifyEmail, desc: t.settings.notifyEmailDesc, value: notifyEmail },
                { key: 'notify_order' as const, icon: <Package size={15} />, label: t.settings.notifyOrder, desc: t.settings.notifyOrderDesc, value: notifyOrder },
                { key: 'notify_promo' as const, icon: <Tag size={15} />, label: t.settings.notifyPromo, desc: t.settings.notifyPromoDesc, value: notifyPromo },
                { key: 'notify_wishlist' as const, icon: <Heart size={15} />, label: t.settings.notifyWishlist, desc: t.settings.notifyWishlistDesc, value: notifyWishlist },
                { key: 'notify_stock' as const, icon: <BoxIcon size={15} />, label: t.settings.notifyStock, desc: t.settings.notifyStockDesc, value: notifyStock },
                { key: 'notify_sms' as const, icon: <MessageSquare size={15} />, label: t.settings.notifySms, desc: t.settings.notifySmsDesc, value: notifySms },
                { key: 'newsletter' as const, icon: <Mail size={15} />, label: t.settings.newsletter, desc: t.settings.newsletterDesc, value: newsletter },
              ]).map(n => (
                <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{n.icon}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '.85rem' }}>{n.label}</p>
                      <p style={{ color: 'var(--text3)', fontSize: '.73rem', marginTop: 2 }}>{n.desc}</p>
                    </div>
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

            {/* SMS phone warning */}
            {smsPhoneWarn && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderRadius: 10, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)',
                marginBottom: 24, animation: 'fadeIn .2s',
              }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <p style={{ fontSize: '.82rem', color: '#f59e0b', fontWeight: 600 }}>
                  {t.settings.smsPhoneRequired ?? 'Please add your phone number in the Profile section before enabling SMS notifications.'}
                </p>
              </div>
            )}

            {/* -- Notification Inbox -- */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BellRing size={15} style={{ color: 'var(--primary)' }} />
                  <p style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {t.settings.notifInbox}
                  </p>
                  {unreadCount > 0 && (
                    <span style={{
                      background: 'rgba(99,102,241,.15)', color: 'var(--primary)', fontSize: '.68rem',
                      fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    }}>
                      {unreadCount} {t.settings.unread}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {/* Filter tabs */}
                  {(['all', 'unread'] as const).map(f => (
                    <button key={f} onClick={() => setNotifFilter(f)} style={{
                      padding: '4px 12px', borderRadius: 8, border: '1px solid',
                      borderColor: notifFilter === f ? 'var(--primary)' : 'var(--border)',
                      background: notifFilter === f ? 'rgba(99,102,241,.1)' : 'transparent',
                      color: notifFilter === f ? 'var(--primary)' : 'var(--text3)',
                      fontSize: '.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                    }}>
                      {f === 'all' ? t.settings.allNotifs : t.settings.unreadNotifs}
                    </button>
                  ))}
                  {/* Mark all read */}
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} disabled={markingAllRead} style={{
                      padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--primary)', fontSize: '.72rem',
                      fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      opacity: markingAllRead ? 0.5 : 1,
                    }}>
                      <CheckCheck size={12} />
                      {t.settings.markAllRead}
                    </button>
                  )}
                  {/* Clear all */}
                  {notifications.length > 0 && (
                    clearConfirm ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { clearAllNotifs(); setClearConfirm(false) }} style={{
                          padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,.4)',
                          background: 'rgba(239,68,68,.1)', color: '#ef4444', fontSize: '.72rem',
                          fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Trash2 size={12} /> {t.settings.confirmDeleteBtn}
                        </button>
                        <button onClick={() => setClearConfirm(false)} style={{
                          padding: '4px 8px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text3)', fontSize: '.72rem',
                          fontWeight: 600, cursor: 'pointer',
                        }}>
                          {t.settings.cancelBtn}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setClearConfirm(true)} style={{
                        padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'transparent', color: '#ef4444', fontSize: '.72rem',
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Trash2 size={12} />
                        {t.settings.clearAll}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Notification list */}
              {filteredNotifs.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '36px 20px', color: 'var(--text3)',
                }}>
                  <Bell size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '.85rem', fontWeight: 600 }}>
                    {notifFilter === 'unread' ? t.settings.noUnread : t.settings.noNotifications}
                  </p>
                  <p style={{ fontSize: '.73rem', marginTop: 4, opacity: 0.7 }}>
                    {t.settings.noNotifDesc}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
                  {filteredNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markNotifRead(n.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                        borderRadius: 10, background: n.is_read ? 'var(--bg3)' : 'rgba(99,102,241,.06)',
                        border: n.is_read ? '1px solid transparent' : '1px solid rgba(99,102,241,.15)',
                        cursor: n.is_read ? 'default' : 'pointer', transition: 'all .15s',
                        position: 'relative',
                      }}
                    >
                      {/* Unread dot */}
                      {!n.is_read && (
                        <span style={{
                          position: 'absolute', top: 14, left: 6, width: 6, height: 6,
                          borderRadius: '50%', background: 'var(--primary)',
                        }} />
                      )}
                      {/* Type icon */}
                      <span style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `${getNotifColor(n.type)}15`, color: getNotifColor(n.type),
                        marginInlineStart: !n.is_read ? 6 : 0,
                      }}>
                        {getNotifIcon(n.type)}
                      </span>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontWeight: n.is_read ? 600 : 800, fontSize: '.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title}
                          </p>
                          <span style={{
                            fontSize: '.58rem', fontWeight: 600, padding: '1px 6px', borderRadius: 6,
                            background: `${getNotifColor(n.type)}20`, color: getNotifColor(n.type),
                            flexShrink: 0, textTransform: 'capitalize',
                          }}>
                            {n.type}
                          </span>
                        </div>
                        {n.body && (
                          <p style={{
                            color: 'var(--text3)', fontSize: '.75rem', lineHeight: 1.4,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}>
                            {n.body}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Clock size={11} style={{ color: 'var(--text3)', opacity: 0.6 }} />
                          <span style={{ fontSize: '.68rem', color: 'var(--text3)', opacity: 0.7 }}>
                            {timeAgo(n.created_at)}
                          </span>
                          {!n.is_read && (
                            <span style={{ fontSize: '.65rem', color: 'var(--primary)', fontWeight: 600 }}>
                              � {t.settings.clickToRead}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id) }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                          color: 'var(--text3)', opacity: 0.5, transition: 'all .15s', flexShrink: 0,
                          borderRadius: 6,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text3)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ----------- 7. PRIVACY & SECURITY ----------- */}
          <div id="privacy" className="settings-section resp-card-padding-lg" style={card}>
            {sectionHeader(<Shield size={16} style={{ color: 'var(--primary)' }} />, t.settings.sectionPrivacy)}
            <p style={{ color: 'var(--text3)', fontSize: '.8rem', marginBottom: 14, marginTop: -10 }}>{t.settings.privacyDesc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'var(--bg3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}><Shield size={15} /></span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '.85rem' }}>{t.settings.loginAlerts}</p>
                    <p style={{ color: 'var(--text3)', fontSize: '.73rem', marginTop: 2 }}>{t.settings.loginAlertsDesc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleNotification('login_alerts', !loginAlerts)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: loginAlerts ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0,
                  }}>
                  <span style={{
                    position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', transition: 'left .2s',
                    left: loginAlerts ? 22 : 2,
                  }} />
                </button>
              </div>

              {/* Active sessions info */}
              <div style={{
                padding: '14px 16px', borderRadius: 10, background: 'var(--bg3)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Monitor size={15} style={{ color: 'var(--primary)' }} />
                  <p style={{ fontWeight: 700, fontSize: '.85rem' }}>{t.settings.activeSessions}</p>
                </div>
                <p style={{ color: 'var(--text3)', fontSize: '.78rem', lineHeight: 1.5 }}>{t.settings.activeSessionsDesc}</p>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut({ scope: 'others' })
                    alert(t.settings.sessionsRevoked)
                  }}
                  style={{
                    marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)',
                    color: '#ef4444', fontSize: '.78rem', fontWeight: 700, fontFamily: 'inherit',
                  }}>
                  <Lock size={13} /> {t.settings.revokeOtherSessions}
                </button>
              </div>

              {/* Account info */}
              <div style={{
                padding: '14px 16px', borderRadius: 10, background: 'var(--bg3)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Info size={15} style={{ color: 'var(--primary)' }} />
                  <p style={{ fontWeight: 700, fontSize: '.85rem' }}>{t.settings.accountInfo}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)' }}>
                    <p style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{t.settings.accountId}</p>
                    <p style={{ fontSize: '.75rem', fontWeight: 600, fontFamily: 'monospace', opacity: 0.8 }}>{user.id.slice(0, 12)}�</p>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)' }}>
                    <p style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{t.settings.memberSince}</p>
                    <p style={{ fontSize: '.75rem', fontWeight: 600 }}>{new Date(user.created_at ?? '').toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ----------- 8. RECENT ORDERS ----------- */}
          <div id="orders" className="settings-section resp-card-padding-lg" style={card}>
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
                      <span style={{ fontWeight: 700, fontSize: '.85rem' }}>{formatPrice(order.total)}</span>
                      <ChevronRight className="rtl-flip" size={14} style={{ color: 'var(--text3)' }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ----------- 7. DANGER ZONE ----------- */}
          <div id="danger" className="settings-section resp-card-padding-lg" style={{ ...card, border: '1px solid rgba(239,68,68,.25)' }}>
            {sectionHeader(<Trash2 size={16} style={{ color: '#ef4444' }} />, t.settings.dangerZone)}
            <p style={{ color: 'var(--text3)', fontSize: '.82rem', marginBottom: 16, marginTop: -10 }}>
              {t.settings.deleteAccountDesc}
            </p>

            {deleteStep === 'confirm' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...labelStyle, color: '#ef4444' }}>{t.settings.deletePasswordLabel}</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder={t.settings.deletePasswordPlaceholder}
                  autoFocus
                  style={{ ...inputStyle, border: '1px solid rgba(239,68,68,.5)' }}
                  onKeyDown={e => e.key === 'Escape' && (setDeleteStep('idle'), setDeletePassword(''))}
                />
                <button
                  onClick={() => { setDeleteStep('idle'); setDeletePassword('') }}
                  style={{
                    marginTop: 8, fontSize: '.8rem', background: 'none', border: 'none',
                    color: 'var(--text3)', cursor: 'pointer', padding: 0,
                  }}
                >{t.settings.cancelBtn}</button>
              </div>
            )}

            <button onClick={handleDeleteAccount} disabled={deleting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: 'rgba(239,68,68,.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)',
                borderRadius: 10, fontWeight: 700, fontSize: '.85rem', cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}>
              <Trash2 size={14} /> {deleting ? t.settings.deleting : deleteStep === 'confirm' ? t.settings.confirmDeleteBtn : t.settings.deleteAccount}
            </button>
          </div>

          </div>{/* end settings-main */}
        </div>{/* end settings-layout */}
      </div>
    </div>
  )
}
