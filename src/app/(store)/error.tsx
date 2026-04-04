'use client'

import Link from 'next/link'
import { useT } from '@/contexts/locale'

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()
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
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
        {t.errorPage.title}
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '.92rem', maxWidth: 400, lineHeight: 1.7, marginBottom: 28 }}>
        {t.errorPage.desc}
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
          {t.errorPage.tryAgain}
        </button>
        <Link
          href="/"
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
          {t.errorPage.goHome}
        </Link>
      </div>
    </div>
  )
}
