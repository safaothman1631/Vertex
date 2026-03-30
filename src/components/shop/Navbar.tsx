'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase-client'
import CartSidebar from './CartSidebar'
import { Heart, ShoppingBag, User, LogOut, Settings, Package, ChevronDown, LayoutDashboard, Globe } from 'lucide-react'
import { useLocale, useT, type Locale } from '@/contexts/locale'
import NotificationsPanel from './NotificationsPanel'

const LANG_OPTIONS: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ckb', label: 'کوردی', flag: '🟡' },
  { value: 'ar', label: 'العربية', flag: '🟢' },
  { value: 'tr', label: 'Türkçe', flag: '🔴' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string; role: string; id: string } | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const totalItems = useCartStore((s) => s.totalItems())
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const { locale, setLocale } = useLocale()
  const t = useT()

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    async function loadProfile(u: { id: string; email?: string | null }) {
      try {
        const [{ data: profile }, { count }] = await Promise.all([
          supabase.from('profiles').select('full_name, role').eq('id', u.id).single(),
          supabase.from('wishlist').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        ])
        setUser({
          email: u.email ?? '',
          name: profile?.full_name ?? u.email ?? '',
          role: profile?.role ?? 'user',
          id: u.id,
        })
        setWishlistCount(count ?? 0)
      } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user)
      else setUser(null)
    }).catch(() => {})

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user)
      else setUser(null)
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mousedown', handleClickOutside)
      subscription.unsubscribe()
    }
  }, [])

  function scrollToSection(id: string) {
    setMenuOpen(false)
    if (pathname === '/') {
      const el = document.getElementById(id)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push(`/#${id}`)
    }
  }

  async function handleSignOut() {
    setProfileOpen(false)
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const initials = user ? user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : ''

  return (
    <>
      <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container nav-inner">
          {/* Logo */}
          <button
            className="logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onClick={() => scrollToSection('hero')}
          >
            <span>Ver<span className="logo-accent">tex</span></span>
          </button>

          {/* Nav links */}
          <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
            <button className="nav-scroll-btn" onClick={() => scrollToSection('hero')}>{t.nav.home}</button>
            <button className="nav-scroll-btn" onClick={() => scrollToSection('products')}>{t.nav.shop}</button>
            <button className="nav-scroll-btn" onClick={() => scrollToSection('brands')}>{t.nav.brands}</button>
            <button className="nav-scroll-btn" onClick={() => scrollToSection('contact')}>{t.nav.contact}</button>
            {mounted && user?.role === 'admin' && (
              <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ color: 'var(--primary)', fontWeight: 700 }}>{t.nav.admin}</Link>
            )}
          </nav>

          {/* Actions */}
          <div className="nav-actions">
            {/* Wishlist */}
            {mounted && user && (
              <Link href="/wishlist" className="nav-action-btn" title={t.nav.myWishlist} style={{ textDecoration: 'none' }}>
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="nav-action-badge">{wishlistCount}</span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {mounted && user && (
              <NotificationsPanel userId={user.id} />
            )}

            {/* Cart */}
            <button className="nav-action-btn nav-cart" onClick={() => setCartOpen(true)} title="Cart">
              <ShoppingBag size={18} />
              {mounted && totalItems > 0 && (
                <span className="cart-count">{totalItems}</span>
              )}
            </button>

            {/* Divider */}
            <div className="nav-divider" />

            {/* Profile / Auth */}
            {mounted && user ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="nav-avatar-trigger"
                  onClick={() => setProfileOpen(p => !p)}
                  aria-label="Profile menu"
                >
                  <div className="nav-avatar">
                    {initials}
                  </div>
                  <span className="nav-profile-name" style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} className="nav-profile-chevron" style={{ color: 'var(--text3)', transition: 'transform .2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 14, minWidth: 220, maxWidth: 'calc(100vw - 32px)', overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(0,0,0,.4)',
                    animation: 'pageEnter .2s cubic-bezier(.22,1,.36,1) both',
                    zIndex: 200,
                  }}>
                    {/* Header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.82rem', fontWeight: 800, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                          <p style={{ fontSize: '.72rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '6px' }}>
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, fontSize: '.85rem', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LayoutDashboard size={15} />
                          {t.nav.adminDashboard}
                        </Link>
                      )}
                      {[
                        { href: '/orders', icon: Package, label: t.nav.myOrders },
                        { href: '/wishlist', icon: Heart, label: t.nav.myWishlist },
                        { href: '/settings', icon: Settings, label: t.nav.accountSettings },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setProfileOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, color: 'var(--text)', textDecoration: 'none', fontSize: '.85rem', transition: 'background .15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Icon size={15} style={{ color: 'var(--text2)' }} />
                          {label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div style={{ padding: '6px', borderTop: '1px solid var(--border)' }}>
                      <button onClick={handleSignOut}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 9, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600, transition: 'background .15s', textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <LogOut size={15} />
                        {t.nav.signOut}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-ghost" style={{ fontSize: '.88rem' }}>{t.nav.signIn}</Link>
                <Link href="/register" className="btn-primary">{t.nav.signUpFree}</Link>
              </>
            )}

            {/* Divider */}
            <div className="nav-divider" />

            {/* Language switcher */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                className="nav-action-btn nav-lang-btn"
                onClick={() => setLangOpen(p => !p)}
                style={{
                  width: 'auto', gap: 5, padding: '0 10px',
                  border: langOpen ? '1px solid var(--primary)' : '1px solid transparent',
                  background: langOpen ? 'rgba(99,102,241,.08)' : undefined,
                }}
              >
                <Globe size={15} />
                <span className="nav-lang-label" style={{ fontSize: '.8rem', fontWeight: 500 }}>{LANG_OPTIONS.find(o => o.value === locale)?.label}</span>
                <ChevronDown size={11} className="nav-lang-chevron" style={{ transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 12, overflow: 'hidden', minWidth: 140,
                  boxShadow: '0 12px 32px rgba(0,0,0,.4)',
                  animation: 'pageEnter .18s cubic-bezier(.22,1,.36,1) both',
                  zIndex: 300,
                }}>
                  {LANG_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setLocale(opt.value); setLangOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 14px', background: opt.value === locale ? 'rgba(99,102,241,.1)' : 'transparent',
                        border: 'none', cursor: 'pointer', color: opt.value === locale ? 'var(--primary)' : 'var(--text)',
                        fontSize: '.84rem', fontWeight: opt.value === locale ? 700 : 500,
                        transition: 'background .15s', textAlign: 'left', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { if (opt.value !== locale) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)' }}
                      onMouseLeave={e => { if (opt.value !== locale) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    >
                      {opt.flag} {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Animated hamburger → X */}
          <button
            className={`hamburger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className="hb-box">
              <span className="hb-line hb-top" />
              <span className="hb-line hb-mid" />
              <span className="hb-line hb-bot" />
            </span>
          </button>
        </div>
      </header>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
