'use client'

import { useCartStore } from '@/store/cart'
import Link from 'next/link'
import { useT } from '@/contexts/locale'

export default function CartSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore()
  const t = useT()

  return (
    <>
      <div className={`cart-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div className={`cart-sidebar${open ? ' open' : ''}`}>
        <div className="cart-header">
          <h3>🛒 {t.cartSidebar.title} ({items.length})</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
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
              <span style={{ fontSize: '3rem' }}>🛒</span>
              <p style={{ fontWeight: 500 }}>{t.cartSidebar.empty}</p>
              <p style={{ fontSize: '.9rem' }}>{t.cartSidebar.emptyDesc}</p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{product.name}</div>
                  <div className="cart-item-price">${(product.price * quantity).toFixed(2)}</div>
                </div>
                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQuantity(product.id, quantity - 1)}>−</button>
                  <span className="qty-num">{quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                </div>
                <button
                  onClick={() => removeItem(product.id)}
                  style={{ color: 'var(--text3)', fontSize: '.85rem', cursor: 'pointer', marginLeft: 8 }}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>{t.cartSidebar.subtotal}</span>
              <strong>${totalPrice().toFixed(2)}</strong>
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
