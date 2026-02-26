'use client'
import { Heart } from 'lucide-react'
import { useT } from '@/contexts/locale'
import Link from 'next/link'

export default function WishlistPageHeader({ count }: { count: number }) {
  const t = useT()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Heart size={20} style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>
          {t.wishlist.title.replace('❤ ', '')}
        </p>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-.02em', lineHeight: 1.1 }}>
          {t.wishlist.title}
        </h1>
      </div>
      {count > 0 && (
        <span style={{ marginLeft: 'auto', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 14px', fontSize: '.82rem', color: 'var(--text2)', fontWeight: 600 }}>
          {count}
        </span>
      )}
    </div>
  )
}
