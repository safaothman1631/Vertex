'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-client'
import { Eye, Trash2, X, Package, MapPin, ChevronDown } from 'lucide-react'
import type { Order, OrderItem, ShippingAddress } from '@/types'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
type Status = typeof STATUSES[number]

const STATUS_CLASS: Record<Status, string> = {
  pending: 'admin-badge-yellow',
  processing: 'admin-badge-blue',
  shipped: 'admin-badge-purple',
  delivered: 'admin-badge-green',
  cancelled: 'admin-badge-red',
}

const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

type RawOrder = {
  id: string
  user_id: string
  user: { full_name: string | null; email: string } | null
  items: { id: string; quantity: number; price: number; product: { name: string; images: string[] } | null }[]
  total: number
  status: Status
  stripe_session_id: string | null
  shipping_address: ShippingAddress
  created_at: string
}

export default function AdminOrdersClient({ orders: initial }: { orders: RawOrder[] }) {
  const [orders, setOrders] = useState<RawOrder[]>(initial)
  const [detail, setDetail] = useState<RawOrder | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  async function handleStatus(id: string, status: Status) {
    setUpdatingId(id)
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : prev)

    // Send notification to customer
    const order = orders.find(o => o.id === id)
    if (order) {
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: `Order #${id.slice(0, 8)} ${STATUS_LABELS[status]}`,
        body: `Your order status has been updated to ${STATUS_LABELS[status].toLowerCase()}.`,
        type: 'order' as const,
      })
    }

    setUpdatingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this order permanently?')) return
    await supabase.from('order_items').delete().eq('order_id', id)
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
    if (detail?.id === id) setDetail(null)
  }

  const addr = detail?.shipping_address as ShippingAddress | undefined

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-sub">{orders.length} total</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="admin-card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px' }}>No orders yet</td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td>
                  <code style={{ fontSize: '.75rem', color: 'var(--text2)', background: 'var(--bg3)', padding: '2px 6px', borderRadius: 4 }}>
                    #{o.id.slice(0, 8)}
                  </code>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{o.user?.full_name ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{o.user?.email}</div>
                </td>
                <td style={{ color: 'var(--text2)' }}>{o.items?.length ?? 0} item(s)</td>
                <td style={{ color: 'var(--primary)', fontWeight: 700 }}>${o.total.toFixed(2)}</td>
                <td>
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <select
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={e => handleStatus(o.id, e.target.value as Status)}
                      style={{
                        appearance: 'none', padding: '4px 28px 4px 10px',
                        fontSize: '.75rem', fontWeight: 700, borderRadius: 20,
                        border: 'none', cursor: 'pointer', outline: 'none',
                        background: STATUS_CLASS[o.status] === 'admin-badge-yellow' ? 'rgba(245,158,11,.15)'
                          : STATUS_CLASS[o.status] === 'admin-badge-blue' ? 'rgba(56,189,248,.15)'
                          : STATUS_CLASS[o.status] === 'admin-badge-purple' ? 'rgba(168,85,247,.15)'
                          : STATUS_CLASS[o.status] === 'admin-badge-green' ? 'rgba(34,197,94,.15)'
                          : 'rgba(239,68,68,.15)',
                        color: STATUS_CLASS[o.status] === 'admin-badge-yellow' ? '#f59e0b'
                          : STATUS_CLASS[o.status] === 'admin-badge-blue' ? '#38bdf8'
                          : STATUS_CLASS[o.status] === 'admin-badge-purple' ? '#a855f7'
                          : STATUS_CLASS[o.status] === 'admin-badge-green' ? '#22c55e'
                          : '#ef4444',
                      }}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} style={{ position: 'absolute', right: 8, pointerEvents: 'none', opacity: .6 }} />
                  </div>
                </td>
                <td style={{ color: 'var(--text2)', fontSize: '.82rem' }}>
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => setDetail(o)}
                      title="View details"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--primary)' }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(o.id)}
                      title="Delete order"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#ef4444' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="admin-mobile-cards">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>No orders yet</div>
        ) : orders.map(o => (
          <div key={o.id} className="admin-product-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <code style={{ fontSize: '.75rem', color: 'var(--text2)' }}>#{o.id.slice(0, 8)}</code>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{o.user?.full_name ?? '—'}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{o.user?.email}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setDetail(o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--primary)' }}>
                  <Eye size={15} />
                </button>
                <button onClick={() => handleDelete(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>${o.total.toFixed(2)}</span>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{o.items?.length ?? 0} items</span>
              <span style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{new Date(o.created_at).toLocaleDateString()}</span>
              <select
                value={o.status}
                disabled={updatingId === o.id}
                onChange={e => handleStatus(o.id, e.target.value as Status)}
                style={{
                  appearance: 'none', padding: '3px 10px', fontSize: '.72rem', fontWeight: 700,
                  borderRadius: 20, border: 'none', cursor: 'pointer', outline: 'none',
                  background: 'var(--bg3)', color: 'var(--text)',
                }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setDetail(null) }}
        >
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: '1.05rem' }}>Order Details</h2>
                <code style={{ fontSize: '.75rem', color: 'var(--text2)' }}>#{detail.id}</code>
              </div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Status changer */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--text2)' }}>Status:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatus(detail.id, s)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, border: '1.5px solid',
                      fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                      borderColor: detail.status === s ? 'var(--primary)' : 'var(--border)',
                      background: detail.status === s ? 'var(--primary)' : 'transparent',
                      color: detail.status === s ? '#fff' : 'var(--text2)',
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer */}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Customer</div>
              <div style={{ fontWeight: 700 }}>{detail.user?.full_name ?? '—'}</div>
              <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{detail.user?.email}</div>
            </div>

            {/* Shipping address */}
            {addr && (
              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  <MapPin size={12} /> Shipping Address
                </div>
                <div style={{ fontWeight: 600 }}>{addr.name}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.7 }}>
                  {addr.address}<br />
                  {addr.city}{addr.zip ? `, ${addr.zip}` : ''}<br />
                  {addr.country}
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                <Package size={12} /> Items
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {detail.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {item.product?.images?.[0] ? (
                      <Image src={item.product.images[0]} alt={item.product.name} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 8, background: 'var(--bg2)' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product?.name ?? 'Unknown'}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total + delete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleDelete(detail.id)}
                style={{ padding: '8px 18px', background: 'rgba(239,68,68,.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '.82rem' }}
              >
                Delete Order
              </button>
              <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                Total: <span style={{ color: 'var(--primary)' }}>${detail.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
