'use client'

import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 40,
    }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 24, maxWidth: 360 }}>
        {error.message || 'An unexpected error occurred in this admin section.'}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={reset}
          className="admin-btn admin-btn-primary"
        >
          Try Again
        </button>
        <Link href="/admin" className="admin-btn admin-btn-outline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
