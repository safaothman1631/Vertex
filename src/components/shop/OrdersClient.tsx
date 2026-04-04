'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'
import type { Order } from '@/types'
import type { LucideIcon } from 'lucide-react'
import { Package, X, MapPin, ShoppingBag, ChevronRight, Clock, Truck, CheckCircle2, XCircle, RefreshCw, FileText, RotateCcw, ExternalLink } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import OrdersPageHeader from '@/components/shop/OrdersPageHeader'
import { createClient } from '@/lib/supabase-client'
import ReturnRequestModal from '@/components/shop/ReturnRequestModal'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

const STATUS_STEP_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
}

const STATUS_ICONS: Record<string, LucideIcon> = {
  pending: Clock,
  processing: RefreshCw,
  shipped: Truck,
  delivered: CheckCircle2,
}

/* Detail Modal */
function OrderDetailModal({ order, onClose, onCancel }: { order: Order; onClose: () => void; onCancel: (id: string) => void }) {
  const t = useT()
  const { formatPrice } = usePreferences()
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

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

  const modal = createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 540, background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'scaleIn .22s cubic-bezier(.21,1.02,.73,1)', boxShadow: '0 32px 100px rgba(0,0,0,.6)', margin: '0 auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '22px 20px 18px', background: 'linear-gradient(135deg, var(--bg2), var(--bg1))', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 99, textTransform: 'capitalize' as const, background: sc + '20', color: sc, border: '1px solid ' + sc + '40', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc, display: 'inline-block', boxShadow: '0 0 6px ' + sc }} />
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
                const stepColor = STATUS_STEP_COLORS[step] ?? '#6366f1'
                const done = i <= stepIdx
                const active = i === stepIdx
                const StepIcon = STATUS_ICONS[step] ?? Package
                return (
                  <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', position: 'relative' as const }}>
                    {i > 0 && (
                      <div style={{ position: 'absolute' as const, top: 13, right: '50%', width: '100%', height: 2, background: i <= stepIdx ? STATUS_STEP_COLORS[STATUS_STEPS[i - 1]] ?? 'var(--border)' : 'var(--border)', transition: 'background .4s' }} />
                    )}
                    <div style={{ width: 28, height: 28, borderRadius: '50%', zIndex: 1, background: active ? stepColor : done ? stepColor + '25' : 'var(--bg3)', border: '2px solid ' + (done ? stepColor : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#fff' : done ? stepColor : 'var(--text3)', boxShadow: active ? '0 0 14px ' + stepColor + '80' : 'none', transition: 'all .4s' }}>
                      <StepIcon size={11} />
                    </div>
                    <div style={{ fontSize: '.6rem', marginTop: 5, color: done ? stepColor : 'var(--text3)', fontWeight: done ? 700 : 400, textAlign: 'center' as const, transition: 'color .4s' }}>
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
              <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary)' }}>{formatPrice(order.total)}</div>
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
                    <div style={{ color: 'var(--text2)', fontSize: '.75rem', marginTop: 3 }}>{t.orders.qty}: {item.quantity} x {formatPrice(item.price)}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '.92rem', color: 'var(--primary)', flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</div>
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

          {/* Tracking Info */}
          {(order.tracking_number || order.shipping_method) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Truck size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 800, fontSize: '.85rem' }}>Shipping & Tracking</span>
              </div>
              <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--border)', fontSize: '.85rem', lineHeight: 1.8, color: 'var(--text2)' }}>
                {order.shipping_method && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Method</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>{order.shipping_method}</span>
                  </div>
                )}
                {order.shipping_cost != null && order.shipping_cost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Shipping Cost</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatPrice(order.shipping_cost)}</span>
                  </div>
                )}
                {order.carrier && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Carrier</span>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{order.carrier}</span>
                  </div>
                )}
                {order.tracking_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <span>Tracking #</span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent((order.carrier ?? '') + ' ' + order.tracking_number + ' tracking')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {order.tracking_number}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, gap: 12 }}>
          {order.status === 'delivered' && (
            <button
              onClick={() => setReturnOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
                background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.3)',
                color: '#f59e0b', fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={13} /> Request Return
            </button>
          )}
          {order.status === 'pending' && !confirmCancel && (
            <button onClick={() => setConfirmCancel(true)} style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,.3)',
              background: 'rgba(239,68,68,.08)', color: '#ef4444', fontWeight: 700,
              fontSize: '.82rem', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,.08)')}
            >
              <XCircle size={13} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 5 }} />
              {(t.orders as Record<string, unknown>).cancelOrder as string ?? 'Cancel Order'}
            </button>
          )}
          {confirmCancel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '.8rem', color: '#ef4444', fontWeight: 600 }}>{(t.orders as Record<string, unknown>).confirmCancel as string ?? 'Are you sure?'}</span>
              <button onClick={async () => {
                setCancelling(true)
                await onCancel(order.id)
                setCancelling(false)
                setConfirmCancel(false)
              }} disabled={cancelling} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: '#ef4444', color: '#fff', fontWeight: 700,
                fontSize: '.78rem', cursor: cancelling ? 'not-allowed' : 'pointer',
                opacity: cancelling ? 0.6 : 1, fontFamily: 'inherit',
              }}>
                {cancelling ? '...' : ((t.orders as Record<string, unknown>).yes as string ?? 'Yes')}
              </button>
              <button onClick={() => setConfirmCancel(false)} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg3)', color: 'var(--text2)', fontWeight: 700,
                fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {(t.orders as Record<string, unknown>).no as string ?? 'No'}
              </button>
            </div>
          )}
          <button
            onClick={() => {
              const w = window.open('', '_blank')
              if (!w) return
              const addr = order.shipping_address
              const escHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
              const itemsHtml = (order.items ?? []).map(item =>
                `<tr><td style="padding:10px 12px;border-bottom:1px solid #eee">${escHtml(item.product?.name ?? 'Product')}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.price)}</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${formatPrice(item.price * item.quantity)}</td></tr>`
              ).join('')
              const subtotal = (order.items ?? []).reduce((s, i) => s + i.price * i.quantity, 0)
              const tax = order.total - subtotal
              const html = `<!DOCTYPE html><html><head><title>Invoice #${order.id.slice(0,8)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:40px auto;padding:20px;color:#1a1a1a}table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:10px 12px;text-align:left;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:2px solid #ddd}@media print{button{display:none!important}}</style></head><body>
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
                  <div><h1 style="margin:0;font-size:1.8rem">INVOICE</h1><p style="color:#666;margin:4px 0">Vertex POS Store</p></div>
                  <div style="text-align:right"><p style="font-size:.85rem;color:#666;margin:2px 0"><strong>Invoice #</strong> ${order.id.slice(0,8).toUpperCase()}</p><p style="font-size:.85rem;color:#666;margin:2px 0"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p><p style="font-size:.85rem;color:#666;margin:2px 0"><strong>Status:</strong> ${escHtml(order.status)}</p></div>
                </div>
                ${addr ? `<div style="margin-bottom:30px;padding:16px;background:#f9f9f9;border-radius:8px"><p style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#999;margin:0 0 6px;font-weight:700">Bill To</p><p style="margin:0;font-weight:700">${escHtml(addr.name ?? '')}</p><p style="margin:2px 0;color:#666">${escHtml(addr.address ?? '')}</p><p style="margin:2px 0;color:#666">${escHtml(addr.city ?? '')}${addr.country ? ', ' + escHtml(addr.country) : ''}${addr.zip ? ' ' + escHtml(addr.zip) : ''}</p>${addr.email ? `<p style="margin:4px 0;color:#6366f1">${escHtml(addr.email)}</p>` : ''}</div>` : ''}
                <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
                <div style="margin-top:20px;text-align:right;padding-top:12px">
                  <p style="margin:4px 0;font-size:.9rem"><span style="color:#666">Subtotal:</span> <strong>${formatPrice(subtotal)}</strong></p>
                  ${tax > 0.01 ? `<p style="margin:4px 0;font-size:.9rem"><span style="color:#666">Tax:</span> <strong>${formatPrice(tax)}</strong></p>` : ''}
                  <p style="margin:12px 0 0;font-size:1.3rem;font-weight:900;color:#6366f1">Total: ${formatPrice(order.total)}</p>
                </div>
                <div style="margin-top:48px;text-align:center;color:#999;font-size:.8rem;border-top:1px solid #eee;padding-top:20px"><p>Thank you for your purchase!</p></div>
                <button onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:12px 24px;background:#6366f1;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:.9rem;box-shadow:0 4px 12px rgba(99,102,241,.3)">🖨 Print / Save PDF</button>
              </body></html>`
              w.document.open()
              w.document.write(html)
              w.document.close()
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              fontSize: '.8rem', fontWeight: 700, cursor: 'pointer',
              background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.3)',
              color: 'var(--primary)', fontFamily: 'inherit',
            }}
          >
            <FileText size={13} /> {(t.invoice as Record<string, string> | undefined)?.download ?? 'Download Invoice'}
          </button>
          <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: '.88rem', color: 'var(--text2)' }}>{t.orders.total}</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      {modal}
      {returnOpen && (
        <ReturnRequestModal
          orderId={order.id}
          orderNumber={order.id.substring(0, 8).toUpperCase()}
          onClose={() => setReturnOpen(false)}
        />
      )}
    </>
  )
}

/* Order Card */
function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const t = useT()
  const { formatPrice } = usePreferences()
  const [hovered, setHovered] = useState(false)
  const sc = STATUS_COLORS[order.status] ?? '#6366f1'

  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', textAlign: 'start' as const, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid ' + (hovered ? sc + 'aa' : 'var(--border)'), borderRadius: 18, overflow: 'hidden', transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? '0 12px 40px rgba(0,0,0,.35)' : '0 2px 16px rgba(0,0,0,.25)', transition: 'all .22s cubic-bezier(.21,1.02,.73,1)', display: 'flex' }}>
        <div style={{ width: 5, flexShrink: 0, background: 'linear-gradient(180deg, ' + sc + ', ' + sc + '55)' }} />
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
              <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 99, textTransform: 'capitalize' as const, display: 'inline-flex', alignItems: 'center', gap: 5, background: sc + '18', color: sc, border: '1px solid ' + sc + '40' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc, display: 'inline-block', boxShadow: '0 0 5px ' + sc }} />
                {t.orders.status[order.status as keyof typeof t.orders.status] ?? order.status}
              </span>
              <ChevronRight className="rtl-flip" size={15} style={{ color: hovered ? sc : 'var(--text3)', transition: 'all .2s', transform: hovered ? 'translateX(2px)' : 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 14, flexWrap: 'wrap' as const }}>
            <div>
              <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: 3 }}>{t.orders.date}</div>
              <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{new Date(order.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em', marginBottom: 3 }}>{t.orders.total}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: sc }}>{formatPrice(order.total)}</div>
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
export default function OrdersClient({ orders: initialOrders, userId }: { orders: Order[] | null; userId: string }) {
  const t = useT()
  const [orders, setOrders] = useState<Order[]>(initialOrders ?? [])
  const [selected, setSelected] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updated = payload.new as Partial<Order>
          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
          setSelected(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function handleCancel(orderId: string) {
    const res = await fetch('/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
      setSelected(prev => prev && prev.id === orderId ? { ...prev, status: 'cancelled' } : prev)
    }
  }

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0)
  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)
  const statusCounts: Record<string, number> = { all: orders.length }
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1 })
  const STATUS_FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

  return (
    <div style={{ minHeight: '60vh' }}>
      <OrdersPageHeader totalOrders={orders.length} totalSpent={totalSpent} />

      {/* Status filter pills */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 2, scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.filter(s => s === 'all' || (statusCounts[s] ?? 0) > 0).map(s => {
            const active = statusFilter === s
            const color = s === 'all' ? 'var(--primary)' : STATUS_COLORS[s] ?? 'var(--primary)'
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 40,
                fontWeight: 700, fontSize: '.78rem', cursor: 'pointer', transition: 'all .18s',
                background: active ? color + '20' : 'var(--bg2)',
                color: active ? color : 'var(--text3)',
                border: active ? `1px solid ${color}40` : '1px solid var(--border)',
                fontFamily: 'inherit',
              }}>
                {s === 'all'
                  ? ((t.orders as Record<string, unknown>).all as string ?? 'All')
                  : (t.orders.status[s as keyof typeof t.orders.status] ?? s)}
                <span style={{ marginInlineStart: 5, opacity: 0.7 }}>({statusCounts[s] ?? 0})</span>
              </button>
            )
          })}
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState icon="📋" title={t.orders.empty} action={{ label: t.orders.viewDetails ?? 'Browse Products', href: '/products' }} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📋</p>
          <p style={{ fontWeight: 600 }}>{(t.orders as Record<string, unknown>).noOrdersFilter as string ?? 'No orders with this status'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => setSelected(order)} />
          ))}
        </div>
      )}
      {selected && <OrderDetailModal order={selected} onClose={() => setSelected(null)} onCancel={handleCancel} />}
    </div>
  )
}
