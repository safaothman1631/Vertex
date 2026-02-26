'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useCartStore } from '@/store/cart'
import type { WishlistItem } from '@/types'
import { useT } from '@/contexts/locale'

export default function WishlistClient({
  initialItems,
  userId,
}: {
  initialItems: WishlistItem[]
  userId: string
}) {
  const [items, setItems] = useState(initialItems)
  const [removing, setRemoving] = useState<string | null>(null)
  const addItem = useCartStore((s) => s.addItem)
  const supabase = createClient()
  const t = useT()

  async function removeItem(wishlistId: string) {
    setRemoving(wishlistId)
    await supabase.from('wishlist').delete().eq('id', wishlistId)
    setItems((prev) => prev.filter((i) => i.id !== wishlistId))
    setRemoving(null)
  }

  function addToCart(item: WishlistItem) {
    addItem(item.product, 1)
  }

  const imgFor = (item: WishlistItem) => {
    const p = item.product as unknown as { img?: string }
    return p.img ?? item.product.images?.[0] ?? null
  }

  return (
    <>
      {items.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(99,102,241,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={36} style={{ color: 'var(--text3)' }} />
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text2)' }}>{t.wishlist.empty}</p>
          <p style={{ fontSize: '.88rem', color: 'var(--text3)', maxWidth: 300, textAlign: 'center' }}>{t.wishlist.emptyDesc}</p>
          <Link href="/products" style={{ marginTop: 8, padding: '10px 24px', background: 'var(--primary)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: '.9rem', textDecoration: 'none' }}>
            {t.wishlist.browsePrducts}
          </Link>
        </div>
      )}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
      {items.map((item) => {
        const img = imgFor(item)
        const isRemoving = removing === item.id
        return (
          <div
            key={item.id}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transition: 'transform .2s, box-shadow .2s',
              opacity: isRemoving ? 0.5 : 1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
          >
            {/* Image */}
            <Link href={`/products/${item.product.id}`} style={{ display: 'block', position: 'relative', height: 180, background: '#fff', flexShrink: 0 }}>
              {img ? (
                <Image src={img} alt={item.product.name} fill style={{ objectFit: 'contain', padding: 16 }} sizes="300px" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}></div>
              )}
              {item.product.is_new && (
                <span style={{ position: 'absolute', top: 10, left: 10, background: 'var(--primary)', color: '#fff', fontSize: '.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{t.productCard.new.replace('✨ ', '')}</span>
              )}
            </Link>

            {/* Info */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {item.product.brand}
              </p>
              <Link href={`/products/${item.product.id}`} style={{ textDecoration: 'none' }}>
                <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.product.name}
                </h3>
              </Link>
              <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)', marginTop: 6 }}>
                ${item.product.price.toFixed(2)}
              </p>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
              <button
                onClick={() => addToCart(item)}
                style={{
                  flex: 1, padding: '9px', background: 'var(--primary)', color: '#fff',
                  border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '.82rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'opacity .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <ShoppingCart size={14} />
                {t.wishlist.addToCart}
              </button>
              <button
                onClick={() => removeItem(item.id)}
                disabled={isRemoving}
                style={{
                  width: 38, height: 38, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)',
                  borderRadius: 10, cursor: 'pointer', color: '#f87171',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,.1)')}
                title="Remove from wishlist"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
    </>
  )
}
