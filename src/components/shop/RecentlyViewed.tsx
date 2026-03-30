'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, Clock } from 'lucide-react'
import { useRecentlyViewedStore } from '@/store/recently-viewed'
import { useT } from '@/contexts/locale'

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const t = useT()
  const items = useRecentlyViewedStore((s) => s.items)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const display = excludeId ? items.filter((i) => i.id !== excludeId) : items
  if (display.length === 0) return null

  return (
    <div style={{ marginTop: 48, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <Clock size={16} style={{ color: 'var(--primary)' }} />
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
          {t.recentlyViewed?.title ?? 'Recently Viewed'}
        </h2>
      </div>
      <div style={{
        display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'thin',
      }}>
        {display.slice(0, 8).map((p) => {
          const img = (p as { img?: string }).img ?? p.images?.[0]
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              style={{
                flexShrink: 0, width: 160, background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 14,
                overflow: 'hidden', textDecoration: 'none',
                transition: 'transform .2s, box-shadow .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.2)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ position: 'relative', height: 120, background: '#fff' }}>
                {img ? (
                  <Image src={img} alt={p.name} fill style={{ objectFit: 'contain', padding: 10 }} sizes="160px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: '.68rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{p.brand}</p>
                <h4 style={{
                  fontSize: '.78rem', fontWeight: 700, color: 'var(--text)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', lineHeight: 1.3, margin: '3px 0 5px',
                }}>{p.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={10} fill="#f59e0b" stroke="#f59e0b" />
                  <span style={{ fontSize: '.7rem', color: 'var(--text2)' }}>{p.rating.toFixed(1)}</span>
                  <span style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--primary)', marginLeft: 'auto' }}>${p.price.toFixed(2)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
