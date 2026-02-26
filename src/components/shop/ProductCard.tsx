'use client'
import { useEffect, useRef, useState } from 'react'
import { useCartStore } from '@/store/cart'
import type { ProductData } from '@/data/products'
import QuickView from './QuickView'
import { useT } from '@/contexts/locale'

interface Props {
  product: ProductData
}

export default function ProductCard({ product: p }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [slide, setSlide] = useState(0)
  const [qvOpen, setQvOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useT()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % 3)
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function handleAddToCart() {
    addItem({
      id: p.id, name: p.name, brand: p.brand, model: p.model,
      category: p.category, price: p.priceNum, old_price: null,
      description: p.desc, specs: p.specs,
      images: p.img ? [p.img] : [],
      rating: p.rating, review_count: p.reviews,
      in_stock: true, is_new: p.isNew, is_hot: p.isHot, created_at: '',
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const artStyle = { '--pa1': p.pa1, '--pa2': p.pa2 } as React.CSSProperties

  return (
    <>
      <div className="prod-card" data-cat={p.cat} data-brand={p.brandKey} data-price={p.priceNum}>
        <div className="prod-badges">
          {p.isHot && <span className="badge-hot">{t.productCard.hot}</span>}
          {p.isNew && <span className="badge-new">{t.productCard.new}</span>}
        </div>

        {/* Slideshow */}
        <div className="prod-img prod-img-slider">
          {/* Slide 0 — photo or art */}
          <div className={`prod-slide${slide === 0 ? ' active' : ''}`}>
            {p.img ? (
              <img src={p.img} alt={p.name} className="prod-photo" />
            ) : (
              <div className="prod-art" style={artStyle}>
                <span className="prod-art-type">{p.artType}</span>
                <span className="prod-art-brand">{p.artBrand}</span>
                <span className="prod-art-name">{p.name}</span>
              </div>
            )}
          </div>

          {/* Slide 1 — Key Features */}
          <div className={`prod-slide${slide === 1 ? ' active' : ''}`}>
            <div className="prod-art" style={{ '--pa1': p.pa2, '--pa2': p.pa1 } as React.CSSProperties}>
              <span className="prod-art-type">KEY FEATURES</span>
              {p.specs.slice(0, 3).map((s, i) => (
                <span key={i} className="prod-slide-spec">✓ {s}</span>
              ))}
            </div>
          </div>

          {/* Slide 2 — Price + Rating */}
          <div className={`prod-slide${slide === 2 ? ' active' : ''}`}>
            <div className="prod-art" style={artStyle}>
              <span className="prod-slide-label">{p.artType}</span>
              <span className="prod-slide-price">{p.price}</span>
              <span className="prod-art-brand">{p.brand}</span>
              <span className="prod-slide-stars">{'★'.repeat(Math.round(p.rating))} {p.rating}</span>
            </div>
          </div>

          {/* Dot indicators */}
          <div className="slide-dots">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`slide-dot${slide === i ? ' active' : ''}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="prod-body">
          <div className="prod-brand">{p.brand}</div>
          <h3 className="prod-name">{p.name}</h3>
          <p className="prod-model">{t.productCard.model}: {p.model}</p>
          <p className="prod-desc">{p.desc}</p>
          <div className="prod-specs">
            {p.specs.slice(0, 3).map((s) => <span key={s}>✓ {s}</span>)}
          </div>
          <div className="prod-rating">
            <span className="stars">{'★'.repeat(Math.round(p.rating))}</span>
            <span className="rnum">{p.rating}</span>
            <span className="rcnt">({p.reviews.toLocaleString()} {t.productCard.reviews})</span>
          </div>
          <div className="prod-footer">
            <div className="prod-price">
              <span className="pm">{p.price}</span>
            </div>
            <div className="prod-btns">
              <button className="btn-view" onClick={() => setQvOpen(true)}>{t.productCard.quickView}</button>
              <button className="btn-cart" onClick={handleAddToCart}>
                {added ? t.productCard.added : t.productCard.addToCart}
              </button>
            </div>
          </div>
        </div>
      </div>

      {qvOpen && <QuickView product={p} onClose={() => setQvOpen(false)} onAddToCart={handleAddToCart} />}
    </>
  )
}
