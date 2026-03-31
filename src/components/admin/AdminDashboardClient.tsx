'use client'

import Link from 'next/link'
import {
  Package, ShoppingBag, Users, MessageSquare,
  TrendingUp, AlertTriangle, Bell, ArrowRight,
  CheckCircle, Clock, Truck, XCircle, RefreshCw,
  Layers, Star,
} from 'lucide-react'
import { useT, useLocale } from '@/contexts/locale'
import type { Locale } from '@/contexts/locale'

interface DashboardProps {
  productCount: number
  orderCount: number
  userCount: number
  msgCount: number
  outOfStockCount: number
  brandCount: number
  categoryCount: number
  reviewCount: number
  totalRevenue: number
  avgOrderValue: number
  statusCounts: Record<string, number>
  recentOrders: {
    id: string
    total: number
    status: string
    created_at: string
    userName: string | null
  }[]
  outOfStockProducts: {
    id: string
    name: string
    brand: string
    model: string
  }[]
  recentMessages: {
    id: string
    name: string
    subject: string
    created_at: string
  }[]
  revenueByDay: Record<string, number>
  ordersByDay: Record<string, number>
  last7: string[]
  maxRevDay: number
  topProducts: {
    name: string
    brand: string
    qty: number
    revenue: number
  }[]
}

export default function AdminDashboardClient({
  productCount,
  orderCount,
  userCount,
  msgCount,
  outOfStockCount,
  brandCount,
  categoryCount,
  reviewCount,
  totalRevenue,
  avgOrderValue,
  statusCounts,
  recentOrders,
  outOfStockProducts,
  recentMessages,
  revenueByDay,
  ordersByDay,
  last7,
  maxRevDay,
  topProducts,
}: DashboardProps) {
  const t = useT()
  const { locale } = useLocale()
  const dateLocale = ({ en: 'en-US', ckb: 'ckb', ar: 'ar', tr: 'tr-TR' } as Record<Locale, string>)[locale] ?? 'en-US'

  const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string; Icon: React.ElementType }> = {
    pending:    { label: t.admin.pending,    color: '#f59e0b', badge: 'admin-badge-yellow', Icon: Clock },
    processing: { label: t.admin.processing, color: '#3b82f6', badge: 'admin-badge-blue',   Icon: RefreshCw },
    shipped:    { label: t.admin.shipped,    color: '#6366f1', badge: 'admin-badge-purple', Icon: Truck },
    delivered:  { label: t.admin.delivered,  color: '#22c55e', badge: 'admin-badge-green',  Icon: CheckCircle },
    cancelled:  { label: t.admin.cancelled,  color: '#ef4444', badge: 'admin-badge-red',    Icon: XCircle },
  }

  const totalOrdersForBar = orderCount || 1

  return (
    <div>
      {/* ── Header ── */}
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t.admin.dashboard}</h1>
          <p className="admin-page-sub">
            {new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/admin/products" className="admin-btn admin-btn-primary" style={{ fontSize: '.82rem', padding: '8px 16px' }}>
            <Package size={14} /> {t.admin.addProduct}
          </Link>
          {msgCount > 0 && (
            <Link href="/admin/messages" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 10, color: '#f59e0b', textDecoration: 'none' }}>
              <Bell size={16} />
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: '.6rem', fontWeight: 900, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg1)' }}>
                {msgCount}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="admin-stats" style={{ marginBottom: 28 }}>
        {/* Revenue */}
        <div className="admin-stat-card" style={{ '--stat-color': '#22c55e' } as React.CSSProperties}>
          <div className="admin-stat-top">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t.admin.totalRevenue}</span>
            </div>
            <div className="admin-stat-icon" style={{ background: 'rgba(34,197,94,.12)' }}>
              <TrendingUp size={18} style={{ color: '#22c55e' }} />
            </div>
          </div>
          <div>
            <div className="admin-stat-val" style={{ fontSize: '1.9rem' }}>${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="admin-stat-label">{t.admin.fromOrders.replace('{count}', String(orderCount))}</div>
          </div>
        </div>

        {/* Orders */}
        <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
          <div className="admin-stat-card" style={{ '--stat-color': '#6366f1' } as React.CSSProperties}>
            <div className="admin-stat-top">
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t.admin.orders}</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(99,102,241,.12)' }}>
                <ShoppingBag size={18} style={{ color: '#6366f1' }} />
              </div>
            </div>
            <div>
              <div className="admin-stat-val">{orderCount}</div>
              <div className="admin-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {(statusCounts['pending'] ?? 0) > 0
                  ? <><span style={{ color: '#f59e0b', fontWeight: 700 }}>{statusCounts['pending']}</span> {t.admin.pending}</>
                  : t.admin.allCaughtUp}
              </div>
            </div>
          </div>
        </Link>

        {/* Products */}
        <Link href="/admin/products" style={{ textDecoration: 'none' }}>
          <div className="admin-stat-card" style={{ '--stat-color': '#38bdf8' } as React.CSSProperties}>
            <div className="admin-stat-top">
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t.admin.products}</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(56,189,248,.12)' }}>
                <Package size={18} style={{ color: '#38bdf8' }} />
              </div>
            </div>
            <div>
              <div className="admin-stat-val">{productCount}</div>
              <div className="admin-stat-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {outOfStockCount > 0
                  ? <><span style={{ color: '#ef4444', fontWeight: 700 }}>{outOfStockCount}</span> {t.admin.outOfStock}</>
                  : t.admin.allInStock}
              </div>
            </div>
          </div>
        </Link>

        {/* Users */}
        <Link href="/admin/users" style={{ textDecoration: 'none' }}>
          <div className="admin-stat-card" style={{ '--stat-color': '#f59e0b' } as React.CSSProperties}>
            <div className="admin-stat-top">
              <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t.admin.users}</span>
              <div className="admin-stat-icon" style={{ background: 'rgba(245,158,11,.12)' }}>
                <Users size={18} style={{ color: '#f59e0b' }} />
              </div>
            </div>
            <div>
              <div className="admin-stat-val">{userCount}</div>
              <div className="admin-stat-label">{t.admin.registeredAccounts}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="admin-dash-grid-main" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>

        {/* Recent Orders table */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-head">
            <span className="admin-card-title">{t.admin.recentOrders}</span>
            <Link href="/admin/orders" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.78rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
              {t.admin.viewAll} <ArrowRight size={13} />
            </Link>
          </div>
          <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.admin.orders}</th>
                <th>{t.admin.customer}</th>
                <th>{t.admin.total}</th>
                <th>{t.admin.status}</th>
                <th>{t.admin.date}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>{t.admin.noOrders}</td></tr>
              ) : recentOrders.map(o => {
                const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG['pending']
                return (
                  <tr key={o.id}>
                    <td><code style={{ fontSize: '.78rem', color: 'var(--text2)', background: 'var(--bg3)', padding: '2px 7px', borderRadius: 4 }}>{o.id.slice(0, 8)}…</code></td>
                    <td style={{ fontWeight: 600 }}>{o.userName ?? <span style={{ color: 'var(--text3)' }}>Guest</span>}</td>
                    <td style={{ color: '#22c55e', fontWeight: 800 }}>${o.total.toFixed(2)}</td>
                    <td><span className={`admin-badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td style={{ color: 'var(--text2)', fontSize: '.8rem' }}>{new Date(o.created_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Order status breakdown */}
          <div className="admin-card" style={{ marginBottom: 0 }}>
            <div className="admin-card-head">
              <span className="admin-card-title">{t.admin.ordersByStatus}</span>
              <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{orderCount} {t.admin.total}</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(STATUS_CONFIG).map(([key, { label, color, Icon }]) => {
                const count = statusCounts[key] ?? 0
                const pct = totalOrdersForBar > 0 ? Math.round((count / totalOrdersForBar) * 100) : 0
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Icon size={13} style={{ color }} />
                        <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text2)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: '.8rem', fontWeight: 800, color: count > 0 ? color : 'var(--text3)' }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .4s ease', opacity: count > 0 ? 1 : .25 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="admin-card" style={{ marginBottom: 0 }}>
            <div className="admin-card-head"><span className="admin-card-title">{t.admin.quickLinks}</span></div>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { href: '/admin/products', icon: Package, label: t.admin.products, sub: `${productCount} ${t.admin.products}` },
                { href: '/admin/brands', icon: Star, label: t.admin.brands, sub: `${brandCount} ${t.admin.brands}` },
                { href: '/admin/categories', icon: Layers, label: t.admin.categories, sub: `${categoryCount} ${t.admin.categories}` },
                { href: '/admin/messages', icon: MessageSquare, label: t.admin.messages, sub: msgCount > 0 ? `${msgCount} ${t.admin.unread}` : t.admin.noUnread, alert: msgCount > 0 },
              ].map(({ href, icon: Icon, label, sub, alert }) => (
                <Link key={href} href={href} className="admin-quick-link" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 8, textDecoration: 'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} style={{ color: alert ? '#f59e0b' : 'var(--primary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: '.75rem', color: alert ? '#f59e0b' : 'var(--text2)', fontWeight: alert ? 700 : 400 }}>{sub}</div>
                  </div>
                  <ArrowRight size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom 2-col grid ── */}
      <div className="admin-dash-grid-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Out of stock */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} style={{ color: '#ef4444' }} />
              <span className="admin-card-title">{t.admin.outOfStockAlerts}</span>
              {outOfStockCount > 0 && (
                <span style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444', fontSize: '.7rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99 }}>
                  {outOfStockCount}
                </span>
              )}
            </div>
            <Link href="/admin/products" style={{ fontSize: '.78rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              {t.admin.viewAll} <ArrowRight size={12} />
            </Link>
          </div>
          {outOfStockProducts.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text2)' }}>
              <CheckCircle size={32} style={{ color: '#22c55e', opacity: .5, marginBottom: 8 }} />
              <p style={{ fontSize: '.85rem', fontWeight: 600 }}>{t.admin.allInStock}</p>
            </div>
          ) : (
            <div>
              {outOfStockProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{p.brand} · {p.model}</div>
                  </div>
                  <span className="admin-badge admin-badge-red" style={{ marginLeft: 12, flexShrink: 0 }}>{t.admin.outOfStock}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent unread messages */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={15} style={{ color: '#f59e0b' }} />
              <span className="admin-card-title">{t.admin.messages}</span>
              {msgCount > 0 && (
                <span style={{ background: 'rgba(245,158,11,.12)', color: '#f59e0b', fontSize: '.7rem', fontWeight: 900, padding: '2px 8px', borderRadius: 99 }}>
                  {msgCount}
                </span>
              )}
            </div>
            <Link href="/admin/messages" style={{ fontSize: '.78rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              {t.admin.viewAll} <ArrowRight size={12} />
            </Link>
          </div>
          {recentMessages.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text2)' }}>
              <CheckCircle size={32} style={{ color: '#22c55e', opacity: .5, marginBottom: 8 }} />
              <p style={{ fontSize: '.85rem', fontWeight: 600 }}>{t.admin.noUnread}</p>
            </div>
          ) : (
            <div>
              {recentMessages.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,158,11,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '.85rem', fontWeight: 900, color: '#f59e0b' }}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</div>
                  </div>
                  <span style={{ fontSize: '.72rem', color: 'var(--text3)', flexShrink: 0 }}>
                    {new Date(m.created_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Analytics Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24, marginBottom: 24 }}>

        {/* Revenue Chart (last 7 days) */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-head">
            <span className="admin-card-title">{t.admin.totalRevenue}</span>
            <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{t.admin.avgOrderValue}: ${avgOrderValue.toFixed(0)}</span>
          </div>
          <div style={{ padding: '16px 20px 20px', display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
            {last7.map(day => {
              const rev = revenueByDay[day]
              const orders = ordersByDay[day]
              const pct = maxRevDay > 0 ? Math.max((rev / maxRevDay) * 100, 2) : 2
              const dateLabel = new Date(day + 'T00:00:00').toLocaleDateString(dateLocale, { weekday: 'short' })
              return (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '.65rem', fontWeight: 700, color: rev > 0 ? '#22c55e' : 'var(--text3)' }}>
                    {rev > 0 ? `$${rev >= 1000 ? (rev / 1000).toFixed(1) + 'k' : rev.toFixed(0)}` : '—'}
                  </span>
                  <div style={{
                    width: '100%', maxWidth: 36, borderRadius: 6,
                    background: rev > 0 ? 'linear-gradient(to top, rgba(34,197,94,.7), rgba(34,197,94,.3))' : 'var(--bg3)',
                    height: `${pct}%`, minHeight: 4,
                    transition: 'height .4s ease',
                  }} title={`${day}: $${rev.toFixed(2)} (${orders} ${t.admin.orders})`} />
                  <span style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600 }}>{dateLabel}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top selling products */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div className="admin-card-head">
            <span className="admin-card-title">{t.admin.products}</span>
            <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{reviewCount} reviews</span>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text2)' }}>
              <Package size={32} style={{ opacity: .3, marginBottom: 8 }} />
              <p style={{ fontSize: '.85rem', fontWeight: 600 }}>{t.admin.noProducts}</p>
            </div>
          ) : (
            <div>
              {topProducts.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', fontWeight: 900, flexShrink: 0,
                    background: i === 0 ? 'rgba(245,158,11,.15)' : 'var(--bg3)',
                    color: i === 0 ? '#f59e0b' : 'var(--text3)',
                  }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text2)' }}>{p.brand} · {p.qty} sold</div>
                  </div>
                  <span style={{ fontSize: '.82rem', fontWeight: 800, color: '#22c55e', flexShrink: 0 }}>${p.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
