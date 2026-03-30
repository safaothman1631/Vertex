'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          listStyle: 'none',
          padding: 0,
          margin: 0,
          fontSize: '.85rem',
          flexWrap: 'wrap',
        }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <ChevronRight size={13} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
              {isLast || !item.href ? (
                <span style={{ color: 'var(--text2)', fontWeight: isLast ? 600 : 400 }} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} style={{ color: 'var(--text3)', textDecoration: 'none', transition: 'color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
