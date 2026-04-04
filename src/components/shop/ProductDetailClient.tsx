'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, CheckCircle, XCircle, ZoomIn, Minus, Plus, Send, Share2, Link2, Check, Bell, BellOff, Loader2 } from 'lucide-react'
import AddToCartButton from './AddToCartButton'
import Lightbox from '@/components/ui/Lightbox'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import RecentlyViewed from './RecentlyViewed'
import { useT } from '@/contexts/locale'
import { usePreferences } from '@/contexts/preferences'
import CurrencySwitcher from '@/components/ui/CurrencySwitcher'
import { createClient } from '@/lib/supabase-client'
import { useRecentlyViewedStore } from '@/store/recently-viewed'
import type { Product, Review } from '@/types'
import ProductVariantSelector from './ProductVariantSelector'
import ProductQA from './ProductQA'

export default function ProductDetailClient({ product, relatedProducts = [], reviews: initialReviews = [] }: { product: Product; relatedProducts?: Product[]; reviews?: Review[] }) {
  const t = useT()
  const { formatPrice } = usePreferences()
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [hoverStar, setHoverStar] = useState(0)
  const [linkCopied, setLinkCopied] = useState(false)
  const [pageOrigin, setPageOrigin] = useState('')
  const [variantPrice, setVariantPrice] = useState<number | null>(null)

  const supabase = createClient()
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem)

  useEffect(() => {
    setPageOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    addRecentlyViewed(product)
  }, [product.id])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  const alreadyReviewed = userId ? reviews.some(r => r.user_id === userId) : false

  // ── Back-in-stock alert state
  const [stockAlertLoading, setStockAlertLoading] = useState(false)
  const [stockAlertSubscribed, setStockAlertSubscribed] = useState(false)

  // Check if already subscribed to stock alert
  useEffect(() => {
    if (!userId || product.in_stock) return
    supabase.from('stock_subscribers').select('id').eq('user_id', userId).eq('product_id', product.id).eq('notified', false).maybeSingle()
      .then(({ data }) => { if (data) setStockAlertSubscribed(true) })
  }, [userId, product.id, product.in_stock])

  async function subscribeStockAlert() {
    if (!userId) return
    setStockAlertLoading(true)
    try {
      const res = await fetch('/api/stock-alert', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.ok) setStockAlertSubscribed(true)
    } catch { /* ignore */ }
    setStockAlertLoading(false)
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setReviewLoading(true)
    setReviewError('')
    const { data, error } = await supabase.from('reviews').insert({
      user_id: userId,
      product_id: product.id,
      rating: reviewRating,
      comment: reviewComment.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    }).select('*, user:profiles(full_name)').single()
    if (error) {
      setReviewError('Failed to submit review')
    } else if (data) {
      setReviews(prev => [data, ...prev])
      setReviewComment('')
      setReviewRating(5)
    }
    setReviewLoading(false)
  }

  return (
    <div className="resp-page-padding">
    <div className="container" style={{ maxWidth: 1100 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: t.nav.home, href: '/' },
        { label: t.nav.shop, href: '/products' },
        { label: `${product.brand} ${product.name}` },
      ]} />

      <div className="resp-grid-2col" style={{ gap: 'clamp(24px, 4vw, 48px)', alignItems: 'start' }}>

        {/* ── Image gallery ── */}
        <div style={{ animation: 'anim-fade-up .6s var(--ease-smooth) .1s both' }}>
          <div
            onClick={() => product.images?.length && setLightboxOpen(true)}
            style={{
              position: 'relative', height: 360, maxHeight: '50vh', borderRadius: 20, overflow: 'hidden',
              background: '#fff', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: product.images?.length ? 'zoom-in' : 'default',
            }}
          >
            {product.images?.[activeImg] ? (
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                style={{ objectFit: 'contain', padding: 24 }}
                sizes="560px"
                priority
              />
            ) : (
              <div style={{ fontSize: '5rem' }}>📦</div>
            )}
            {product.images?.length ? (
              <div style={{
                position: 'absolute', bottom: 12, right: 12,
                background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
                color: '#fff', fontSize: '.75rem', fontWeight: 600,
              }}>
                <ZoomIn size={13} /> {t.productDetail.clickToZoom}
              </div>
            ) : null}
          </div>

          {/* Thumbnail row — clickable */}
          {(product.images?.length ?? 0) > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    position: 'relative', width: 80, height: 80, borderRadius: 10,
                    background: '#fff', overflow: 'hidden',
                    border: i === activeImg ? '2px solid var(--primary)' : '1px solid var(--border)',
                    flexShrink: 0, cursor: 'pointer', padding: 0,
                    boxShadow: i === activeImg ? '0 0 0 3px rgba(99,102,241,.2)' : 'none',
                    transition: 'all .2s ease',
                  }}
                >
                  <Image src={img} alt="" fill style={{ objectFit: 'contain', padding: 6 }} sizes="80px" />
                </button>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightboxOpen && product.images?.length && (
            <Lightbox images={product.images} startIndex={activeImg} onClose={() => setLightboxOpen(false)} />
          )}
        </div>

        {/* ── Details ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'anim-fade-up .6s var(--ease-smooth) .25s both' }}>

          {/* Brand */}
          <p style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            {product.brand}
          </p>

          {/* Name */}
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, lineHeight: 1.2, marginBottom: 10 }}>
            {product.name}
          </h1>

          {/* Model */}
          <p style={{ fontSize: '.82rem', color: 'var(--text3)', fontFamily: 'monospace', marginBottom: 16 }}>
            {t.productDetail.model}: {product.model}
          </p>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                stroke={s <= Math.round(product.rating) ? '#f59e0b' : 'var(--border)'}
              />
            ))}
            <span style={{ fontSize: '.82rem', color: 'var(--text2)', marginInlineStart: 4 }}>
              {product.rating} ({product.review_count} {t.productDetail.reviews})
            </span>
          </div>

          {/* Price */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 900, color: 'var(--primary)' }}>
                {formatPrice(variantPrice ?? product.price)}
              </span>
              {product.old_price && (
                <>
                

          {/* Notify me when back in stock */}
          {!product.in_stock && userId && (
            <button
              onClick={subscribeStockAlert}
              disabled={stockAlertSubscribed || stockAlertLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                border: stockAlertSubscribed ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: stockAlertSubscribed ? 'rgba(99,102,241,.1)' : 'var(--bg3)',
                color: stockAlertSubscribed ? 'var(--primary)' : 'var(--text)',
                cursor: stockAlertSubscribed ? 'default' : 'pointer',
                fontSize: '.85rem', fontWeight: 600, marginBottom: 24,
                transition: 'all .2s',
                opacity: stockAlertLoading ? 0.6 : 1,
              }}
            >
              {stockAlertLoading ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : stockAlertSubscribed ? (
                <BellOff size={15} />
              ) : (
                <Bell size={15} />
              )}
              {stockAlertSubscribed
                ? (t.productDetail.stockAlertSubscribed ?? 'You\'ll be notified when back in stock')
                : (t.productDetail.notifyBackInStock ?? 'Notify me when back in stock')}
            </button>
          )}  <span style={{ fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text3)' }}>
                    {formatPrice(product.old_price)}
                  </span>
                  <span style={{ fontSize: '.78rem', fontWeight: 800, background: 'rgba(16,185,129,.12)', color: '#10b981', borderRadius: 6, padding: '3px 8px' }}>
                    -{Math.round((1 - product.price / product.old_price) * 100)}%
                  </span>
                </>
              )}
            </div>
            <CurrencySwitcher variant="inline" previewAmount={product.price} />
          </div>

          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            {product.in_stock ? (
              <>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '.88rem', color: '#10b981', fontWeight: 600 }}>{t.productDetail.inStock}</span>
              </>
            ) : (
              <>
                <XCircle size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '.88rem', color: '#ef4444', fontWeight: 600 }}>{t.productDetail.outOfStock}</span>
              </>
            )}
          </div>

          {/* Description */}
          <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: 'var(--text2)', marginBottom: 28 }}>
            {product.description}
          </p>

          {/* Variant Selector */}
          <ProductVariantSelector
            productId={product.id}
            basePrice={product.price}
            onSelect={(_variant, finalPrice) => setVariantPrice(finalPrice)}
          />

          {/* Quantity selector */}
          {product.in_stock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text2)' }}>{t.productDetail.quantity ?? 'Quantity'}:</span>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-main)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                >
                  <Minus size={15} />
                </button>
                <span
                  style={{
                    width: 44, textAlign: 'center', fontSize: '.95rem', fontWeight: 700,
                    borderInline: '1px solid var(--border)', lineHeight: '38px',
                  }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  style={{
                    width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--bg-main)', border: 'none', cursor: 'pointer',
                    color: 'var(--text-secondary)', transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-main)')}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <AddToCartButton product={product} quantity={qty} />

          {/* Share */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 12 }}>
            <button
              onClick={() => {
                const url = `${window.location.origin}/products/${product.id}`
                navigator.clipboard.writeText(url).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) })
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                background: linkCopied ? 'rgba(16,185,129,.12)' : 'var(--bg2)',
                border: linkCopied ? '1px solid rgba(16,185,129,.4)' : '1px solid var(--border)',
                color: linkCopied ? '#10b981' : 'var(--text2)',
              }}
            >
              {linkCopied ? <><Check size={13} /> {t.productShare?.copied ?? 'Copied!'}</> : <><Link2 size={13} /> {t.productShare?.copyLink ?? 'Copy Link'}</>}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(`${pageOrigin}/products/${product.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                fontSize: '.8rem', fontWeight: 700, textDecoration: 'none',
                background: 'rgba(29,161,242,.08)', border: '1px solid rgba(29,161,242,.25)', color: '#1da1f2',
              }}
            >
              𝕏
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${pageOrigin}/products/${product.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                fontSize: '.8rem', fontWeight: 700, textDecoration: 'none',
                background: 'rgba(24,119,242,.08)', border: '1px solid rgba(24,119,242,.25)', color: '#1877f2',
              }}
            >
              Facebook
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${product.name} - ${pageOrigin}/products/${product.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
                fontSize: '.8rem', fontWeight: 700, textDecoration: 'none',
                background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.25)', color: '#25d366',
              }}
            >
              WhatsApp
            </a>
          </div>

          {/* Specs */}
          {(product.specs?.length ?? 0) > 0 && (
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '.9rem', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text2)', marginBottom: 14 }}>
                {t.productDetail.keySpecs}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.specs?.map((spec, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      fontSize: '.88rem', color: 'var(--text2)',
                      background: 'var(--bg2)', borderRadius: 10,
                      border: '1px solid var(--border)', padding: '10px 14px',
                    }}
                  >
                    <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '.8rem', marginTop: 1, flexShrink: 0 }}>✓</span>
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.3rem' }}>
            {t.productDetail.customerReviews} ({reviews.length})
          </h2>
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {[1,2,3,4,5].map(s => {
                const avg = reviews.reduce((a,r) => a + r.rating, 0) / reviews.length
                return <Star key={s} size={15} fill={s <= Math.round(avg) ? '#f59e0b' : 'none'} stroke={s <= Math.round(avg) ? '#f59e0b' : 'var(--border)'} />
              })}
              <span style={{ fontSize: '.85rem', color: 'var(--text2)', fontWeight: 600 }}>
                {(reviews.reduce((a,r) => a + r.rating, 0) / reviews.length).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Review Form */}
        {userId && !alreadyReviewed && (
          <form onSubmit={submitReview} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, marginBottom: 24,
          }}>
            <h3 style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: 14 }}>{t.productDetail.writeReview}</h3>
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button"
                  onClick={() => setReviewRating(s)}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Star size={22} fill={s <= (hoverStar || reviewRating) ? '#f59e0b' : 'none'} stroke={s <= (hoverStar || reviewRating) ? '#f59e0b' : 'var(--border)'} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder={t.productDetail.shareExperience}
              required
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '.9rem', resize: 'vertical',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {reviewError && (
              <p style={{ color: '#ef4444', fontSize: '.82rem', marginTop: 6 }}>{reviewError}</p>
            )}
            <button type="submit" disabled={reviewLoading} style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: 'var(--gradient)', color: '#fff', fontWeight: 700,
              fontSize: '.88rem', cursor: reviewLoading ? 'not-allowed' : 'pointer',
              opacity: reviewLoading ? .7 : 1,
            }}>
              <Send size={14} />
              {reviewLoading ? t.productDetail.submitting : t.productDetail.submitReview}
            </button>
          </form>
        )}
        {userId && alreadyReviewed && (
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 20, fontStyle: 'italic' }}>{t.productDetail.alreadyReviewed}</p>
        )}
        {!userId && (
          <p style={{ fontSize: '.85rem', color: 'var(--text2)', marginBottom: 20 }}>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t.productDetail.signIn}</Link> {t.productDetail.signInToReview}
          </p>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: '.9rem' }}>{t.productDetail.noReviews}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.map(r => (
              <div key={r.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '.72rem', fontWeight: 800, flexShrink: 0,
                    }}>
                      {((r.user as { full_name?: string | null })?.full_name ?? 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '.88rem' }}>{(r.user as { full_name?: string | null })?.full_name ?? 'User'}</span>
                      <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} fill={s <= r.rating ? '#f59e0b' : 'none'} stroke={s <= r.rating ? '#f59e0b' : 'var(--border)'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Q&A Section ── */}
      <ProductQA productId={product.id} />

      {/* ── Related Products ── */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: 24 }}>
            {t.productDetail.relatedProducts ?? 'Related Products'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                style={{
                  textDecoration: 'none', color: 'inherit',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 16, overflow: 'hidden',
                  transition: 'transform .2s, box-shadow .2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{ position: 'relative', height: 160, background: '#fff' }}>
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: 'contain', padding: 12 }} sizes="240px" />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem' }}>📦</div>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{p.brand}</p>
                  <h3 style={{ fontSize: '.85rem', fontWeight: 700, lineHeight: 1.3, margin: '4px 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{formatPrice(p.price)}</span>
                    {p.old_price && <span style={{ fontSize: '.78rem', textDecoration: 'line-through', color: 'var(--text3)' }}>{formatPrice(p.old_price)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* ── Recently Viewed ── */}
      <RecentlyViewed excludeId={product.id} />
    </div>
    </div>
  )
}
