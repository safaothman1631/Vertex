'use client'

import Link from 'next/link'

export default function CheckoutError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      background: 'var(--bg0)',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>💳</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
        Checkout Error
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '.92rem', maxWidth: 400, lineHeight: 1.7, marginBottom: 28 }}>
        There was a problem with your checkout. Your cart items are safe — please try again.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '.92rem',
            background: 'var(--gradient)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,.25)',
          }}
        >
          Try Again
        </button>
        <Link
          href="/cart"
          style={{
            padding: '12px 28px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '.92rem',
            background: 'var(--bg2)',
            color: 'var(--text2)',
            border: '1px solid var(--border)',
          }}
        >
          Back to Cart
        </Link>
      </div>
    </div>
  )
}
