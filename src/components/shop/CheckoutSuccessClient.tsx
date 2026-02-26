'use client'

import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/contexts/locale'

export default function CheckoutSuccessClient({ orderId }: { orderId?: string }) {
  const t = useT()
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="mx-auto mb-4" style={{ color: 'var(--success)' }} />
        <h1 className="text-3xl font-bold mb-2">{t.checkoutSuccess.title}</h1>
        <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
          {t.checkoutSuccess.sub}
        </p>
        {orderId && (
          <p className="text-sm mb-6 font-mono" style={{ color: 'var(--text-secondary)' }}>
            {t.checkoutSuccess.orderId}: {orderId.substring(0, 8)}…
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Link
            href="/orders"
            className="px-6 py-2.5 rounded-xl font-bold text-white"
            style={{ background: 'var(--accent)' }}
          >
            {t.checkoutSuccess.viewOrders}
          </Link>
          <Link
            href="/products"
            className="px-6 py-2.5 rounded-xl font-bold"
            style={{ border: '1px solid var(--border)' }}
          >
            {t.checkoutSuccess.continueShopping}
          </Link>
        </div>
      </div>
    </div>
  )
}
