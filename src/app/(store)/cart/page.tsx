'use client'

import { useCartStore } from '@/store/cart'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useT } from '@/contexts/locale'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const t = useT()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={60} className="mx-auto mb-4 opacity-30" />
        <h2 className="text-2xl font-bold mb-2">{t.cartPage.empty}</h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          {t.cartPage.emptyDesc}
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-xl font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t.cartPage.browseProducts}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">{t.cartPage.title}</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items */}
        <div className="flex-1 flex flex-col gap-4">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-4 p-4 rounded-xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--accent)' }}>
                  {product.brand}
                </p>
                <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
                <p className="text-sm font-bold mt-1" style={{ color: 'var(--accent)' }}>
                  ${product.price.toFixed(2)}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => removeItem(product.id)}
                  className="hover:text-red-400 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-sm font-bold">${(product.price * quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-bold text-lg mb-4">{t.cartPage.subtotal}</h3>
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>{t.cartPage.subtotal}</span>
              <span>${totalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span style={{ color: 'var(--text-secondary)' }}>{t.cartPage.tax}</span>
              <span className="text-green-400">$0.00</span>
            </div>
            <div
              className="flex justify-between font-bold text-base pt-4 mb-5"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span>{t.cartPage.total}</span>
              <span style={{ color: 'var(--accent)' }}>${totalPrice().toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className="block text-center py-3 rounded-xl font-bold text-white transition-colors"
              style={{ background: 'var(--accent)' }}
            >
              {t.cartPage.checkout}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
