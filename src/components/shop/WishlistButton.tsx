'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string
  size?: number
  style?: React.CSSProperties
}

export default function WishlistButton({ productId, size = 16, style }: Props) {
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [wishlistId, setWishlistId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setUserId(session.user.id)
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('product_id', productId)
        .maybeSingle()
      if (data) {
        setInWishlist(true)
        setWishlistId(data.id)
      }
    })
  }, [productId])

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) { router.push('/login'); return }
    setLoading(true)
    if (inWishlist && wishlistId) {
      await supabase.from('wishlist').delete().eq('id', wishlistId)
      setInWishlist(false)
      setWishlistId(null)
    } else {
      const { data } = await supabase
        .from('wishlist')
        .insert({ user_id: userId, product_id: productId })
        .select('id')
        .single()
      setInWishlist(true)
      setWishlistId(data?.id ?? null)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
      style={{
        background: inWishlist ? 'rgba(239,68,68,.12)' : 'rgba(255,255,255,.06)',
        border: inWishlist ? '1px solid rgba(239,68,68,.3)' : '1px solid var(--border)',
        borderRadius: 9, cursor: 'pointer', padding: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s', flexShrink: 0,
        opacity: loading ? 0.6 : 1,
        ...style,
      }}
      onMouseEnter={e => { if (!inWishlist) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.1)' }}
      onMouseLeave={e => { if (!inWishlist) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.06)' }}
    >
      <Heart
        size={size}
        fill={inWishlist ? '#f87171' : 'none'}
        stroke={inWishlist ? '#f87171' : 'var(--text2)'}
      />
    </button>
  )
}
