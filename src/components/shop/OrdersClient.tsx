'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useT } from '@/contexts/locale'
import type { Order } from '@/types'
import { Package, X, MapPin, ShoppingBag, ChevronRight, Clock, Truck, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import OrdersPageHeader from '@/components/shop/OrdersPageHeader'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

/* Detail Modal */
function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = useT()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const addr = order.shipping_address
  const sc = STATUS_COLORS[order.status] ?? '#6366f1'
  const stepIdx = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  const STATUS_ICONS: Record<string, string> = { pending: 'clock', processing: 'loader', shipped: 'truck', delivered: 'check', cancelled: 'x' }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 540, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'scaleIn .22s cubic-bezier(.21,1.02,.73,1)', boxShadow: '0 32px 100px rgba(0,0,0,.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', background: 'linear-gradient(135deg, var(--bg2), var(--bg1))', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize' as const, background: sc + '20', color: sc, border: '1px solid ' + sc + '40', display: 'inline-block', marginBottom: 8 }}>
                {t.orders.status[order.status as keyof typeof t.orders.status] ?? order.status}
              </span>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{t.orders.orderDetails}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--text2)', marginTop: 3 }}>#{order.id.substring(0, 16)}...</div>
            </div>
            <button onClick={onClose} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>

          {!isCancelled && (
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start' }}>
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIdx
                const active = i === stepIdx
                return (
                  <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', position: 'relative' as const }}>
                    {i > 0 && (
                      <div style={{ position: 'absolute' as const, top: 12, right: '50%', width: '100%', height: 2, background: i <= stepIdx ? sc : 'var(--border)' }} />
                    )}
                    <div style={{ width: 26, height: 26, borderRadius: '50%', zIndex: 1, background: active ? sc : done ? sc + '30' : 'var(--bg3)', border: '2px solid ' + (done ? sc : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#fff' : done ? sc : 'var(--text3)', fontSize: '.65rem', fontWeight: 800, boxShadow: active ? '0 0 12px ' + sc + '60' : 'none' }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: '.6rem', marginTop: 5, color: done ? 'var(--text)' : 'var(--text3)', fontWeight: done ? 700 : 400, textAlign: 'center' as const }}>
                      {t.orders.status[step as keyof typeof t.orders.status] ?? step}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto' as const, padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', flex: 1 }}>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '.04em', fontWeight: 600 }}>{t.orders.date}</div>
              <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 16px', flex: 1 }}>
              <div style={{ fontSize: '.68rem', color: 'var(--text3)', marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '.04em', fontWeight: 600 }}>{t.orders.total}</div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary)' }}>${order.total.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShoppingBag size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 800, fontSize: '.85rem' }}>{t.orders.items}</span>
              <span style={{ fontSize: '.72rem', background: 'rgba(99,102,241,.12)', color: 'var(--primary)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{order.items?.length ?? 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {order.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                  {item.product?.images?.[0] ? (
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#fff', padding: 4 }}>
                      <Image src={item.product.images[0]} alt={item.product.name} width={44} height={44} style={{ objectFit: 'contain' as const, width: '100%', height: '100%' }} />
                    </div>
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📦</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product?.name ?? 'Product'}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '.75rem', marginTop: 3 }}>{t.orders.qty}: {item.quantity} x ${item.price.toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '.92rem', color: 'var(--primary)', flexShrink: 0 }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          {addr && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MapPin size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 800, fontSize: '.85rem' }}>{t.orders.shippingAddress}</span>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--border)', fontSize: '.85rem', lineHeight: 1.8, color: 'var(--text2)' }}>
                <div style={{ fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{addr.name}</div>
                <div>{addr.address}</div>
                <div>{addr.city}{addr.country ? ', ' + addr.country : ''}{addr.zip ? ' ' + addr.zip : ''}</div>
                {addr.email && <div style={{ marginTop: 4, color: 'var(--primary)', fontSize: '.82rem' }}>{addr.email}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0 }}>
          <span style={{ fontSize: '.88rem', color: 'var(--text2)' }}>{t.orders.total}</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* Order Card */
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const t = useT()
  const [hovered, setHovered] = useState(false)
  const sc = STATUS_COLORS[order.status] ?? '#6366f1'

  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', textAlign: 'start' as const, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid ' + (hovered ? sc + 'aa' : 'var(--border)'), borderRadius: 18, overflow: 'hidden', transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? '0 12px 40px rgba(0,0,0,.35)' : '0 2px 16px rgba(0,0,0,.25)', transition: 'all .22s cubic-bezier(.21,1.02,.73,1)', display: 'flex' }}>
        <div style={{ width: 4, flexShrink: 0, background: sc }} />
        <div style={{ flex: 1, padding: '18px 20px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: sc + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={16} style={{ color: sc }} />
              </div>
              <div>
                <div style={{ fontSize: '.65rem', color: 'var(--text3)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em' }}>{t.orders.orderId}</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '.88rem' }}>#{order.id.substring(0, 8).toUpperCase()}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 99, textTransform: 'capitalize' as const, background: sc + '18', color: sc, border: '1px solid ' + sc + '40' }}>
                {t.orders.status[order.status as keyof typeof t.orders.status] ?? order.status}
              </span>
              <ChevronRight size={15} style={{ color: hovered ? sc : 'var(--text3)', transition: 'all .2s', transform: hovered ? 'translateX(2px)' : 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 14, flexWrap: 'wrap' as const }}>
            <div>
              <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: 3 }}>{t.orders.date}</div>
              <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{new Date(order.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: 3 }}>{t.orders.total}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: sc }}>${order.total.toFixed(2)}</div>
            </div>
            {order.items && <div>
              <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: 3 }}>Items</div>
              <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{order.items.length}</div>
            </div>}
          </div>

          {order.items && order.items.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={item.id} style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: item.product?.images?.[0] ? '#fff' : 'var(--bg3)', border: '2px solid var(--bg2)', marginInlineStart: i > 0 ? -8 : 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 - i }}>
                    {item.product?.images?.[0] ? (
                      <Image src={item.product.images[0]} alt="" width={26} height={26} style={{ objectFit: 'contain' as const, width: '100%', height: '100%' }} />
                    ) : <span style={{ fontSize: '.85rem' }}>📦</span>}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {order.items.slice(0, 2).map(i => i.product?.name).filter(Boolean).join(', ')}
                  {order.items.length > 2 && (' +' + (order.items.length - 2))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

/* Main */
export default function OrdersClient({ orders }: { orders: Order[] | null }) {
  const t = useT()
  const [selected, setSelected] = useState<Order | null>(null)
  const totalSpent = (orders ?? []).reduce((sum, o) => sum + o.total, 0)

  return (
    <div style={{ minHeight: '60vh' }}>
      <OrdersPageHeader totalOrders={orders?.length ?? 0} totalSpent={totalSpent} />
      {!orders || orders.length === 0 ? (
        <EmptyState icon="📋" title={t.orders.empty} action={{ label: t.orders.viewDetails ?? 'Browse Products', href: '/products' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
        </div>
      )}
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
