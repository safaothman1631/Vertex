'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'
import { ShoppingBag, CreditCard, Truck, Lock } from 'lucide-react'
import type { ShippingAddress } from '@/types'
import { useT } from '@/contexts/locale'

const EMPTY: ShippingAddress = { name: '', email: '', address: '', city: '', country: '', zip: '' }

export default function CheckoutPage() {
  const t = useT()
  const { items, totalPrice, clearCart } = useCartStore()
  const [form, setForm] = useState<ShippingAddress>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress: form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      if (data.url) {
        clearCart()
        window.location.href = data.url
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setLoading(false)
  }

  if (items.length === 0) {
    router.replace('/')
    return null
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--bg3)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '.92rem', outline: 'none',
    transition: 'border-color .2s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>{t.checkout.secureCheckout}</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-.02em' }}>{t.checkout.title}</h1>
        </div>

        <form onSubmit={handleCheckout}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>

            {/* LEFT  Shipping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)', padding: '32px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{t.checkout.shippingInfo}</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.fullName}</label>
                    <input type="text" required placeholder="Safa Othman" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
                  </div>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.email}</label>
                    <input type="email" required placeholder="you@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={inputStyle} />
                  </div>
                  {/* Address */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.address}</label>
                    <input type="text" required placeholder="123 Main Street, Apt 4B" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={inputStyle} />
                  </div>
                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.city}</label>
                    <input type="text" required placeholder="New York" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} />
                  </div>
                  {/* Country */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.country}</label>
                    <input type="text" required placeholder="United States" value={form.country} onChange={e => setForm({...form, country: e.target.value})} style={inputStyle} />
                  </div>
                  {/* ZIP */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.zip}</label>
                    <input type="text" required placeholder="10001" value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { icon: Lock, text: t.checkout.sslEncrypted },
                  { icon: CreditCard, text: t.checkout.securePayment },
                  { icon: ShoppingBag, text: t.checkout.freeReturns },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontSize: '.82rem' }}>
                    <Icon size={14} style={{ color: 'var(--primary)' }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT  Order summary */}
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', padding: '28px', position: 'sticky', top: 88,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{t.checkout.orderSummary}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {items.map(({ product, quantity }) => (
                  <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: 'var(--text2)', fontSize: '.85rem', flex: 1 }}>
                      {product.name}
                      <span style={{ color: 'var(--text3)', marginLeft: 4 }}>{quantity}</span>
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '.88rem', flexShrink: 0 }}>${(product.price * quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800 }}>{t.cartPage.total}</span>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>${totalPrice().toFixed(2)}</span>
                </div>
                <p style={{ color: 'var(--text3)', fontSize: '.75rem', marginTop: 4 }}>{t.checkout.taxNote}</p>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '.85rem', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  background: 'var(--gradient)', color: '#fff',
                  fontWeight: 800, fontSize: '1rem', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? .7 : 1, transition: 'opacity .2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Lock size={15} />
                {loading ? t.checkout.redirecting : t.checkout.payStripe}
              </button>

              <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text3)', marginTop: 12 }}>
                {t.checkout.stripeRedirect}
              </p>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
