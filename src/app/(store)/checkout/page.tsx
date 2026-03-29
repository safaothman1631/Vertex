'use client'

import { useState, useCallback } from 'react'
import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'
import { ShoppingBag, CreditCard, Truck, Lock, AlertCircle, Tag, Check } from 'lucide-react'
import type { ShippingAddress } from '@/types'
import { useT } from '@/contexts/locale'

const EMPTY: ShippingAddress = { name: '', email: '', address: '', city: '', country: '', zip: '' }
type FieldKey = keyof ShippingAddress
type FieldErrors = Partial<Record<FieldKey, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CheckoutPage() {
  const t = useT()
  const { items, totalPrice, clearCart } = useCartStore()
  const [form, setForm] = useState<ShippingAddress>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount_type: 'percent' | 'fixed'; discount_value: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const router = useRouter()

  const validate = useCallback((field: FieldKey, value: string): string => {
    const v = value.trim()
    if (!v) return t.checkout.fieldRequired ?? 'This field is required'
    if (field === 'email' && !EMAIL_RE.test(v)) return t.checkout.invalidEmail ?? 'Invalid email address'
    if (field === 'zip' && v.length < 3) return t.checkout.invalidZip ?? 'Invalid zip code'
    return ''
  }, [t])

  function handleChange(field: FieldKey, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (touched[field]) {
      const err = validate(field, value)
      setFieldErrors(prev => ({ ...prev, [field]: err }))
    }
  }

  function handleBlur(field: FieldKey) {
    setTouched(prev => ({ ...prev, [field]: true }))
    const err = validate(field, form[field])
    setFieldErrors(prev => ({ ...prev, [field]: err }))
  }

  function validateAll(): boolean {
    const fields: FieldKey[] = ['name', 'email', 'address', 'city', 'country', 'zip']
    const errors: FieldErrors = {}
    const allTouched: Partial<Record<FieldKey, boolean>> = {}
    let valid = true
    for (const f of fields) {
      allTouched[f] = true
      const err = validate(f, form[f])
      if (err) { errors[f] = err; valid = false }
    }
    setTouched(allTouched)
    setFieldErrors(errors)
    return valid
  }

  async function applyCoupon() {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validateCoupon: true, couponCode: code, subtotal: totalPrice() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponError(data.error || 'Invalid coupon')
        setCouponApplied(null)
      } else {
        setCouponApplied({ code: data.code, discount_type: data.discount_type, discount_value: data.discount_value })
        setCouponError('')
      }
    } catch {
      setCouponError('Failed to validate coupon')
    }
    setCouponLoading(false)
  }

  const subtotal = totalPrice()
  const discount = couponApplied
    ? couponApplied.discount_type === 'percent'
      ? subtotal * couponApplied.discount_value / 100
      : couponApplied.discount_value
    : 0
  const finalTotal = Math.max(0, subtotal - discount)

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!validateAll()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          shippingAddress: form,
          couponCode: couponApplied?.code || undefined,
        }),
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

  const inputStyle = (field: FieldKey): React.CSSProperties => ({
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--bg3)',
    border: `1px solid ${touched[field] && fieldErrors[field] ? '#ef4444' : 'var(--border)'}`,
    color: 'var(--text)', fontSize: '.92rem', outline: 'none',
    transition: 'border-color .2s', boxSizing: 'border-box',
    fontFamily: 'inherit',
  })

  const fieldError = (field: FieldKey) =>
    touched[field] && fieldErrors[field] ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '.75rem', color: '#ef4444' }}>
        <AlertCircle size={12} />
        {fieldErrors[field]}
      </div>
    ) : null

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
                    <input type="text" placeholder="Safa Othman" value={form.name} onChange={e => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} style={inputStyle('name')} />
                    {fieldError('name')}
                  </div>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.email}</label>
                    <input type="email" placeholder="you@email.com" value={form.email} onChange={e => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} style={inputStyle('email')} />
                    {fieldError('email')}
                  </div>
                  {/* Address */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.address}</label>
                    <input type="text" placeholder="123 Main Street, Apt 4B" value={form.address} onChange={e => handleChange('address', e.target.value)} onBlur={() => handleBlur('address')} style={inputStyle('address')} />
                    {fieldError('address')}
                  </div>
                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.city}</label>
                    <input type="text" placeholder="New York" value={form.city} onChange={e => handleChange('city', e.target.value)} onBlur={() => handleBlur('city')} style={inputStyle('city')} />
                    {fieldError('city')}
                  </div>
                  {/* Country */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.country}</label>
                    <input type="text" placeholder="United States" value={form.country} onChange={e => handleChange('country', e.target.value)} onBlur={() => handleBlur('country')} style={inputStyle('country')} />
                    {fieldError('country')}
                  </div>
                  {/* ZIP */}
                  <div>
                    <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t.checkout.zip}</label>
                    <input type="text" placeholder="10001" value={form.zip} onChange={e => handleChange('zip', e.target.value)} onBlur={() => handleBlur('zip')} style={inputStyle('zip')} />
                    {fieldError('zip')}
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

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
                {/* Coupon Code */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>
                    <Tag size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Coupon Code
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!couponApplied}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: 8,
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontSize: '.85rem', outline: 'none',
                        fontFamily: 'monospace', letterSpacing: '.05em',
                        boxSizing: 'border-box',
                      }}
                    />
                    {couponApplied ? (
                      <button type="button" onClick={() => { setCouponApplied(null); setCouponCode(''); setCouponError('') }} style={{
                        padding: '9px 14px', borderRadius: 8, border: 'none',
                        background: 'rgba(239,68,68,.1)', color: '#ef4444',
                        fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
                      }}>
                        Remove
                      </button>
                    ) : (
                      <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{
                        padding: '9px 14px', borderRadius: 8, border: 'none',
                        background: 'var(--gradient)', color: '#fff',
                        fontSize: '.82rem', fontWeight: 700, cursor: couponLoading ? 'not-allowed' : 'pointer',
                        opacity: couponLoading || !couponCode.trim() ? .6 : 1,
                      }}>
                        {couponLoading ? '...' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p style={{ fontSize: '.75rem', color: '#ef4444', marginTop: 4 }}>{couponError}</p>
                  )}
                  {couponApplied && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: '.78rem', color: '#22c55e', fontWeight: 600 }}>
                      <Check size={13} />
                      {couponApplied.discount_type === 'percent' ? `${couponApplied.discount_value}% off` : `$${couponApplied.discount_value.toFixed(2)} off`} applied!
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '.88rem', color: 'var(--text2)' }}>Subtotal</span>
                    <span style={{ fontSize: '.88rem', color: 'var(--text2)' }}>${subtotal.toFixed(2)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '.88rem', color: '#22c55e', fontWeight: 600 }}>Discount</span>
                    <span style={{ fontSize: '.88rem', color: '#22c55e', fontWeight: 600 }}>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800 }}>{t.cartPage.total}</span>
                  <span style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary)' }}>${finalTotal.toFixed(2)}</span>
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
