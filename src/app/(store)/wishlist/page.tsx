import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { WishlistItem } from '@/types'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import WishlistClient from '@/components/shop/WishlistClient'
import WishlistPageHeader from '@/components/shop/WishlistPageHeader'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wishlist } = await supabase
    .from('wishlist')
    .select('*, product:products(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <WishlistPageHeader count={wishlist?.length ?? 0} />

        {!wishlist || wishlist.length === 0 ? (
          <WishlistClient initialItems={[]} userId={user.id} />
        ) : (
          <WishlistClient initialItems={wishlist as WishlistItem[]} userId={user.id} />
        )}
      </div>
    </div>
  )
}
