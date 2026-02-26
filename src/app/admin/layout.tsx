import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, ArrowLeft } from 'lucide-react'
import PageTransition from '@/components/ui/PageTransition'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div>
            <div className="admin-sidebar-title">Ver<span style={{ color: 'var(--primary)' }}>tex</span></div>
            <div className="admin-sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <div className="admin-sidebar-user">
          <div className="admin-user-avatar">{(profile.full_name ?? 'A')[0].toUpperCase()}</div>
          <div>
            <div className="admin-user-name">{profile.full_name}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="admin-nav-item">
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

      {/* Main content */}
      <main className="admin-main">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
