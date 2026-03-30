import Link from 'next/link'

export default function NotFound() {
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
      <div style={{ fontSize: '6rem', marginBottom: 16, filter: 'drop-shadow(0 8px 20px rgba(99,102,241,.15))' }}>
        🔍
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.7, marginBottom: 28 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          padding: '14px 32px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '.95rem',
          background: 'var(--gradient)',
          color: '#fff',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(99,102,241,.25)',
        }}
      >
        Back to Home
      </Link>
    </div>
  )
}
