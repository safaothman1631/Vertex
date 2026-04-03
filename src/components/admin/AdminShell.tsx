'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, FolderTree, Building2, Ticket, Trash2, Megaphone, Bell, Activity, HardDrive, ArrowLeft, Menu, X } from 'lucide-react'
import { useT } from '@/contexts/locale'
import CurrencySwitcher from '@/components/ui/CurrencySwitcher'

type NavKey = 'dashboard' | 'products' | 'orders' | 'users' | 'messages' | 'categories' | 'brands' | 'coupons' | 'promotions' | 'notifications' | 'system' | 'backup' | 'trash'

const navDefs: { href: string; key: NavKey; icon: typeof LayoutDashboard }[] = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/products', key: 'products', icon: Package },
  { href: '/admin/orders', key: 'orders', icon: ShoppingBag },
  { href: '/admin/users', key: 'users', icon: Users },
  { href: '/admin/messages', key: 'messages', icon: MessageSquare },
  { href: '/admin/categories', key: 'categories', icon: FolderTree },
  { href: '/admin/brands', key: 'brands', icon: Building2 },
  { href: '/admin/coupons', key: 'coupons', icon: Ticket },
  { href: '/admin/promotions', key: 'promotions', icon: Megaphone },
  { href: '/admin/notifications', key: 'notifications', icon: Bell },
  { href: '/admin/system', key: 'system', icon: Activity },
  { href: '/admin/backup', key: 'backup', icon: HardDrive },
  { href: '/admin/trash', key: 'trash', icon: Trash2 },
]

export default function AdminShell({
  children,
  fullName,
}: {
  children: React.ReactNode
  fullName: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const t = useT()

  // Close sidebar on route change
  useEffect(() => { setOpen(false) }, [pathname])
  // Close on ESC
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar${open ? ' admin-sidebar-open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div>
            <div className="admin-sidebar-title">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>
            <div className="admin-sidebar-sub">{t.admin.adminPanel}</div>
          </div>
        </div>

        <div className="admin-sidebar-user">
          <div className="admin-user-avatar">{(fullName ?? 'A')[0].toUpperCase()}</div>
          <div>
            <div className="admin-user-name">{fullName}</div>
            <div className="admin-user-role">{t.admin.administrator}</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navDefs.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`admin-nav-item${pathname === href ? ' active' : ''}`}
            >
              <Icon size={17} />
              {t.admin[key]}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item admin-nav-back">
            <ArrowLeft size={16} />
            {t.admin.backToStore}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Mobile top bar */}
        <div className="admin-topbar">
          <button className="admin-topbar-menu" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="admin-topbar-brand">Ver<span style={{ color: 'var(--primary)' }}>tex</span> Admin</div>
          <CurrencySwitcher variant="admin" />
        </div>

        {children}
      </main>
    </div>
  )
}
