'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import Link from 'next/link'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'
import { ShoppingCart, X, Trash2, Package } from 'lucide-react'
import Image from 'next/image'

export default function CartSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const t = useT()
  const { formatPrice } = usePreferences()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      <div className={`cart-overlay${open ? ' open' : ''}`} onClick={onClose} role="presentation" />
      <div className={`cart-sidebar${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label={t.cartSidebar.title}>
        <div className="cart-header">
          <h3><ShoppingCart size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /> {t.cartSidebar.title} ({items.length})</h3>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg3)', border: '1px solid var(--border)',
              color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '.85rem',
            }}
          >
            ✕
          </button>
        </div>

        <div className="cart-items-list">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={48} style={{ color: 'var(--text3)' }} />
              <p style={{ fontWeight: 500 }}>{t.cartSidebar.empty}</p>
              <p style={{ fontSize: '.9rem' }}>{t.cartSidebar.emptyDesc}</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="cart-item">
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {product.images?.[0] ? (
                    <Image src={product.images[0]} alt={product.name} width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    <Package size={20} style={{ color: 'var(--text3)' }} />
                  )}
                </div>
                <div className="cart-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="cart-item-name">{product.name}</div>
                  <div className="cart-item-price">{formatPrice(product.price * quantity)}</div>
                </div>
                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Decrease quantity">−</button>
                  <span className="qty-num">{quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(product.id, quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
                <button
                  onClick={() => removeItem(product.id)}
                  aria-label={`Remove ${product.name}`}
                  style={{ color: 'var(--text3)', cursor: 'pointer', marginLeft: 8, background: 'none', border: 'none', padding: 4 }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>{t.cartSidebar.subtotal}</span>
              <strong>{formatPrice(totalPrice())}</strong>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-primary btn-full"
              style={{ padding: '16px', textAlign: 'center', borderRadius: 'var(--radius-sm)' }}
            >
              {t.cartSidebar.checkout}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
