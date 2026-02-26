'use client'

import { ShoppingCart, Heart } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase-client'
import type { Product } from '@/types'

export default function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem)
  const supabase = createClient()

  async function handleWishlist() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }
    await supabase.from('wishlist').upsert({ user_id: user.id, product_id: product.id })
    alert('Added to wishlist!')
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => addItem(product)}
        disabled={!product.in_stock}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        <ShoppingCart size={18} />
        {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
      </button>
      <button
        onClick={handleWishlist}
        className="px-4 py-3 rounded-xl transition-colors"
        style={{ border: '1px solid var(--border)' }}
      >
        <Heart size={18} />
      </button>
    </div>
  )
}
