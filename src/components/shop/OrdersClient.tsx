'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useT } from '@/contexts/locale'
import type { Order } from '@/types'
import { Package, X, MapPin, ShoppingBag, ChevronRight } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

/* ── Detail Modal ───────────────────────────────── */
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          maxHeight: '85vh',
          animation: 'scaleIn .25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <Package size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 className="font-bold text-base">{t.orders.orderDetails}</h3>
              <p className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>#{order.id.substring(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-70 transition" style={{ color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5" style={{ maxHeight: 'calc(85vh - 130px)' }}>
          {/* Status + Date row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full capitalize"
              style={{
                background: `${STATUS_COLORS[order.status]}22`,
                color: STATUS_COLORS[order.status],
                border: `1px solid ${STATUS_COLORS[order.status]}44`,
              }}
            >
              {t.orders.status[order.status as keyof typeof t.orders.status] ?? order.status}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag size={15} style={{ color: 'var(--accent)' }} />
              <h4 className="font-semibold text-sm">{t.orders.items}</h4>
            </div>
            <div className="flex flex-col gap-2.5">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }}
                >
                  {item.product?.images?.[0] && (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product?.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {t.orders.qty}: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--accent)' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {addr && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} style={{ color: 'var(--accent)' }} />
                <h4 className="font-semibold text-sm">{t.orders.shippingAddress}</h4>
              </div>
              <div
                className="p-3 rounded-xl text-sm leading-relaxed"
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{addr.name}</p>
                <p>{addr.address}</p>
                <p>{addr.city}, {addr.country} {addr.zip}</p>
                <p>{addr.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.orders.total}</span>
          <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Main Component ─────────────────────────────── */
export default function OrdersClient({ orders }: { orders: Order[] | null }) {
  const t = useT()
  const [selected, setSelected] = useState<Order | null>(null)

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title={t.orders.empty}
        action={{ label: t.orders.viewDetails ?? 'Browse Products', href: '/products' }}
      />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            className="w-full text-start rounded-xl p-5 transition-all duration-200"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            onClick={() => setSelected(order)}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.orders.orderId}</p>
                <p className="font-mono text-sm">{order.id.substring(0, 8)}…</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.orders.date}</p>
                <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.orders.total}</p>
                <p className="font-bold" style={{ color: 'var(--accent)' }}>
                  ${order.total.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full capitalize"
                  style={{
                    background: `${STATUS_COLORS[order.status]}22`,
                    color: STATUS_COLORS[order.status],
                    border: `1px solid ${STATUS_COLORS[order.status]}44`,
                  }}
                >
                  {t.orders.status[order.status as keyof typeof t.orders.status] ?? order.status}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>
            </div>
            <div
              className="flex flex-col gap-1.5 pt-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.product?.name} ×{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
