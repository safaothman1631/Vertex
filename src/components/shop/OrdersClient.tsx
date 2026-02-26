'use client'
import { useT } from '@/contexts/locale'
import type { Order } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export default function OrdersClient({ orders }: { orders: Order[] | null }) {
  const t = useT()

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
        <div className="text-5xl mb-4">📋</div>
        <p>{t.orders.empty}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
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
        </div>
      ))}
    </div>
  )
}
