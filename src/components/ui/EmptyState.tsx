'use client'

interface Props {
  icon: string
  title: string
  subtitle?: string
  action?: { label: string; href: string }
}

export default function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
      animation: 'fadeInUp .5s cubic-bezier(.21,1.02,.73,1) forwards',
    }}>
      <div style={{
        fontSize: '4.5rem', marginBottom: 20,
        animation: 'float 3s ease-in-out infinite',
        filter: 'drop-shadow(0 8px 20px rgba(99,102,241,.15))',
      }}>
        {icon}
      </div>
      <h2 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: 8, color: 'var(--text)' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: 'var(--text2)', fontSize: '.92rem', maxWidth: 360, lineHeight: 1.6, marginBottom: 20 }}>
          {subtitle}
        </p>
      )}
      {action && (
        <a
          href={action.href}
          style={{
            padding: '12px 28px', borderRadius: 12, fontWeight: 700,
            fontSize: '.9rem', background: 'var(--gradient)', color: '#fff',
            textDecoration: 'none', transition: 'all .2s',
            boxShadow: '0 4px 16px rgba(99,102,241,.25)',
          }}
        >
          {action.label}
        </a>
      )}
    </div>
  )
}
