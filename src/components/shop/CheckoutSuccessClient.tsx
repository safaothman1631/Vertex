'use client'

import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/contexts/locale'
import { useCartStore } from '@/store/cart'

export default function CheckoutSuccessClient({ orderId }: { orderId?: string }) {
  const t = useT()
  const clearCart = useCartStore(s => s.clearCart)

  // Clear cart only once after successful checkout
  useEffect(() => {
    try {
      if (sessionStorage.getItem('checkout_completed') === '1') {
        clearCart()
        sessionStorage.removeItem('checkout_completed')
      }
    } catch { /* SSR guard */ }
  }, [clearCart])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      background: 'var(--bg0)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 448 }}>
        <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{t.checkoutSuccess.title}</h1>
        <p style={{ marginBottom: 8, color: 'var(--text2)' }}>
          {t.checkoutSuccess.sub}
        </p>
        {orderId && (
          <p style={{ fontSize: '.875rem', marginBottom: 24, fontFamily: 'monospace', color: 'var(--text2)' }}>
            {t.checkoutSuccess.orderId}: {orderId.substring(0, 8)}…
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link
            href="/orders"
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              fontWeight: 700,
              color: '#fff',
              background: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            {t.checkoutSuccess.viewOrders}
          </Link>
          <Link
            href="/products"
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              fontWeight: 700,
              border: '1px solid var(--border)',
              color: 'var(--text)',
              textDecoration: 'none',
            }}
          >
            {t.checkoutSuccess.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  )
}
