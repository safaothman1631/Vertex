'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, FolderTree, Building2, Ticket, ArrowLeft, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/brands', label: 'Brands', icon: Building2 },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
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
            <div className="admin-sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <div className="admin-sidebar-user">
          <div className="admin-user-avatar">{(fullName ?? 'A')[0].toUpperCase()}</div>
          <div>
            <div className="admin-user-name">{fullName}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`admin-nav-item${pathname === href ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item admin-nav-back">
            <ArrowLeft size={16} />
            Back to Store
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
          <button className="admin-topbar-close-placeholder" aria-hidden />
        </div>

        {children}
      </main>
    </div>
  )
}
