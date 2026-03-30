'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      background: 'var(--bg0)',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>⚠️</div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
        Something went wrong
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '.95rem', maxWidth: 420, lineHeight: 1.7, marginBottom: 28 }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '14px 32px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '.95rem',
          background: 'var(--gradient)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(99,102,241,.25)',
        }}
      >
        Try Again
      </button>
    </div>
  )
}
