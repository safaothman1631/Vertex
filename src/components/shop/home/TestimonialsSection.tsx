'use client'
import Image from 'next/image'
import FadeIn from '@/components/ui/FadeIn'
import { useT } from '@/contexts/locale'

export interface HomeReview {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer_name: string
  avatar_url: string | null
  product_name: string
  product_brand: string
}

const DEMO_REVIEWS: HomeReview[] = [
  { id: 'd1', rating: 5, comment: 'Excellent POS terminal, fast and reliable. Our checkout speed improved dramatically after switching to this system.', created_at: '2025-03-10T10:00:00Z', reviewer_name: 'Ahmed Al-Rashidi', avatar_url: null, product_name: 'Verifone P400', product_brand: 'Verifone' },
  { id: 'd2', rating: 5, comment: 'The barcode scanner works flawlessly with all our product labels. Great build quality and very responsive support team.', created_at: '2025-03-08T14:30:00Z', reviewer_name: 'Sara Mahmoud', avatar_url: null, product_name: 'Honeywell Voyager 1250g', product_brand: 'Honeywell' },
  { id: 'd3', rating: 4, comment: 'Solid receipt printer, quiet and quick. Delivery was prompt and packaging was secure. Highly recommend for retail use.', created_at: '2025-03-05T09:15:00Z', reviewer_name: 'Omar Khalil', avatar_url: null, product_name: 'Epson TM-T88VI', product_brand: 'Epson' },
  { id: 'd4', rating: 5, comment: 'Best label printer I have used. Crystal clear prints and the rolls last a long time. Setup was extremely easy too.', created_at: '2025-03-02T11:45:00Z', reviewer_name: 'Lina Hassan', avatar_url: null, product_name: 'Zebra ZD421', product_brand: 'Zebra' },
  { id: 'd5', rating: 5, comment: 'This payment terminal is very secure and customers trust it. Integration with our existing system took less than an hour.', created_at: '2025-02-28T16:00:00Z', reviewer_name: 'Karwan Saleh', avatar_url: null, product_name: 'Ingenico Move 5000', product_brand: 'Ingenico' },
  { id: 'd6', rating: 4, comment: 'The cash drawer is sturdy and opens reliably every time. Exactly what a busy retail store needs. Very good value.', created_at: '2025-02-25T08:30:00Z', reviewer_name: 'Nadia Ibrahim', avatar_url: null, product_name: 'Star Micronics CD3-1616', product_brand: 'Star Micronics' },
  { id: 'd7', rating: 5, comment: 'PAX smart terminal exceeded our expectations. Contactless payments work perfectly and the screen is crisp and bright.', created_at: '2025-02-20T13:00:00Z', reviewer_name: 'Firas Aziz', avatar_url: null, product_name: 'PAX A920 Pro', product_brand: 'PAX Technology' },
  { id: 'd8', rating: 5, comment: 'Very happy with my purchase. The product arrived quickly, well packaged, and works exactly as described on the website.', created_at: '2025-02-15T10:20:00Z', reviewer_name: 'Rania Yousef', avatar_url: null, product_name: 'Square Terminal', product_brand: 'Square' },
]

const AVATAR_GRADIENTS = [
  ['#6366f1', '#8b5cf6'], ['#ef4444', '#f97316'], ['#f59e0b', '#eab308'],
  ['#10b981', '#06b6d4'], ['#3b82f6', '#6366f1'], ['#ec4899', '#a855f7'],
]

function ReviewCard({ r, verifiedLabel }: { r: HomeReview; verifiedLabel: string }) {
  const [c1, c2] = AVATAR_GRADIENTS[(r.reviewer_name.charCodeAt(0) || 65) % AVATAR_GRADIENTS.length]
  const initial = (r.reviewer_name[0] || '?').toUpperCase()
  const date = new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <div className="review-card">
      <div className="rv-header">
        {r.avatar_url ? (
          <div className="rv-avatar" style={{ position: 'relative', overflow: 'hidden' }}>
            <Image src={r.avatar_url} alt={r.reviewer_name} fill style={{ objectFit: 'cover' }} sizes="44px" />
          </div>
        ) : (
          <div className="rv-avatar" style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>{initial}</div>
        )}
        <div className="rv-meta">
          <div className="rv-name">{r.reviewer_name}</div>
          <div className="rv-date">{date} · {verifiedLabel}</div>
        </div>
        <div className="rv-stars">
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} style={{ color: s <= r.rating ? '#f59e0b' : 'var(--border)', fontSize: '.82rem' }}>★</span>
          ))}
        </div>
      </div>
      <p className="rv-comment">&#8220;{r.comment}&#8221;</p>
      {r.product_name && (
        <div className="rv-product">
          <span>📦</span>
          <span>{r.product_name}</span>
        </div>
      )}
    </div>
  )
}

export default function TestimonialsSection({ reviews = [] }: { reviews?: HomeReview[] }) {
  const t = useT()

  const realIds = new Set(reviews.map(r => r.id))
  const demoFill = DEMO_REVIEWS.filter(r => !realIds.has(r.id))
  const merged = [...reviews, ...demoFill]
  const displayReviews = merged.length >= 3 ? merged : DEMO_REVIEWS
  const mid = Math.ceil(displayReviews.length / 2)
  const row1 = [...displayReviews.slice(0, mid), ...displayReviews.slice(0, mid), ...displayReviews.slice(0, mid)]
  const half2 = displayReviews.length > mid ? displayReviews.slice(mid) : displayReviews.slice(0, mid)
  const row2 = [...half2, ...half2, ...half2]

  return (
    <section className="reviews-section">
      <div className="container">
        <FadeIn>
          <div className="section-header">
            <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.85rem', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>{t.testimonials.label}</p>
            <h2 className="section-title">{t.testimonials.title} <span className="gradient-text">{t.testimonials.titleHighlight}</span></h2>
            <p className="section-sub">{t.testimonials.sub}</p>
          </div>
        </FadeIn>
      </div>
      <div className="reviews-marquee-wrap">
        <div className="reviews-row">
          {row1.map((r, i) => <ReviewCard key={`r1-${r.id}-${i}`} r={r} verifiedLabel={t.testimonials.verifiedBuyer} />)}
        </div>
        <div className="reviews-row reviews-row-rtl">
          {row2.map((r, i) => <ReviewCard key={`r2-${r.id}-${i}`} r={r} verifiedLabel={t.testimonials.verifiedBuyer} />)}
        </div>
      </div>
    </section>
  )
}
