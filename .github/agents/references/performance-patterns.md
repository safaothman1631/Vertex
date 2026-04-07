## بەشی ١: Core Web Vitals — ماستەر

---

### ⚡ §1. LCP — Largest Contentful Paint (ئامانج: < 2.5s)

```
چی LCP دیاری دەکات:
  → <img> (hero image, product image)
  → <video> poster
  → CSS background-image
  → Block-level text elements (<h1>, <p>)
  → <svg> with content

گەورەترین element لە viewport ـەکەدا = LCP element
```

```typescript
// ✅ FIX 1: Priority بۆ LCP image
<Image
  src="/images/hero.webp"
  alt="NexPOS Hero"
  width={1200}
  height={600}
  priority              // ← Preloads! No lazy loading
  sizes="100vw"
  fetchPriority="high"  // ← Browser hint
/>

// ✅ FIX 2: No lazy loading on above-fold images
// By default next/image uses loading="lazy"
// priority prop overrides this to loading="eager"

// ✅ FIX 3: Preconnect to image host
// In layout.tsx <head>
<link rel="preconnect" href="https://your-project.supabase.co" />
<link rel="dns-prefetch" href="https://your-project.supabase.co" />

// ✅ FIX 4: Optimize TTFB (Time to First Byte)
// → Server Components render on server → faster first byte
// → Streaming with Suspense → progressive rendering
// → ISR for cacheable pages → instant response from cache
// → Edge middleware → closest to user

// ✅ FIX 5: No render-blocking resources
// → next/font instead of <link> to Google Fonts
// → Dynamic imports for below-fold components
// → Critical CSS auto-extracted by Next.js

// ✅ FIX 6: Responsive images with sizes
<Image
  src={product.images[0]}
  alt={product.name}
  width={800}
  height={800}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
// Without sizes: browser downloads largest image always!
// With sizes: browser picks optimal size for viewport
```

```
📋 LCP Optimization Checklist:
□ Hero image has priority prop
□ No lazy loading on first visible image
□ Preconnect to image CDN
□ Image format: AVIF > WebP > JPEG
□ Image compressed (< 200kB for hero)
□ sizes attribute on all responsive images
□ No render-blocking CSS or fonts
□ TTFB < 800ms (check with Server Timing headers)
□ No large client-side JS blocking render
□ ISR or SSG for cacheable pages
□ Streaming/Suspense for slow data
```

### §2. INP — Interaction to Next Paint (ئامانج: < 200ms)

```
چی INP خراپ دەکات:
  → Long tasks (> 50ms JavaScript execution)
  → Heavy event handlers (onClick, onChange)
  → Layout thrashing (read DOM → write DOM → read DOM)
  → Synchronous re-renders (large state updates)
  → Third-party scripts blocking main thread
```

```typescript
// ✅ FIX 1: useTransition بۆ non-urgent updates
'use client'
import { useTransition } from 'react'

function SearchFilter() {
  const [isPending, startTransition] = useTransition()
  
  const handleSearch = (query: string) => {
    startTransition(() => {
      // Non-urgent UI update — won't block input
      setResults(filterProducts(query))
    })
  }
  
  return (
    <input
      type="search"
      onChange={(e) => handleSearch(e.target.value)}
      className={isPending ? 'opacity-50' : ''}
    />
  )
}

// ✅ FIX 2: Debounce expensive operations
import { useDeferredValue } from 'react'

function ProductSearch() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  // deferredQuery updates with lower priority than query
  
  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </>
  )
}

// ✅ FIX 3: Minimize JavaScript with Server Components
// Most components don't need 'use client'
// React handles rendering on server → zero JS for static content

// ✅ FIX 4: React Compiler auto-memoization
// No manual React.memo, useMemo, useCallback needed
// React Compiler optimizes re-renders automatically
```

```
📋 INP Optimization Checklist:
□ No long tasks in event handlers (> 50ms)
□ useTransition for non-urgent state updates
□ useDeferredValue for expensive renders
□ Debounce/throttle expensive operations
□ Server Components for non-interactive content
□ Code splitting for heavy components
□ No synchronous layout reads in handlers
□ requestAnimationFrame for animation logic
□ Web Workers for CPU-intensive tasks
□ React Compiler enabled (auto-memoization)
```

### §3. CLS — Cumulative Layout Shift (ئامانج: < 0.1)

```
چی CLS خراپ دەکات:
  → Images without dimensions
  → Ads/embeds without reserved space
  → Dynamically injected content above viewport
  → Web fonts causing FOUT/FOIT
  → Dynamic content changing element sizes
```

```typescript
// ✅ FIX 1: Always set width + height on images
<Image
  src={product.images[0]}
  alt={product.name}
  width={400}          // ← REQUIRED: browser reserves space
  height={400}         // ← REQUIRED: prevents layout shift
  className="object-cover"
/>

// ✅ FIX 2: Use aspect-ratio for responsive containers
<div className="aspect-square relative">
  <Image src={img} alt="" fill className="object-cover" />
</div>

// ✅ FIX 3: Skeleton placeholders match final dimensions
function ProductCardSkeleton() {
  return (
    <div className="w-full rounded-2xl overflow-hidden">
      <div className="aspect-square bg-zinc-800 animate-pulse" />     {/* Same as image */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-zinc-800 rounded w-3/4 animate-pulse" /> {/* Same as title */}
        <div className="h-4 bg-zinc-800 rounded w-1/2 animate-pulse" /> {/* Same as price */}
        <div className="h-10 bg-zinc-800 rounded animate-pulse" />       {/* Same as button */}
      </div>
    </div>
  )
}

// ✅ FIX 4: Font display swap
const font = localFont({
  src: './fonts/NRT-Reg.woff2',
  display: 'swap',  // ← Shows fallback font immediately, no FOIT
})

// ✅ FIX 5: Reserve space for dynamic content
// Instead of conditionally rendering banners that push content down:
<div className="min-h-[48px]">  {/* Reserve space */}
  {banner && <Banner />}
</div>

// ✅ FIX 6: CSS contain for isolated layout
.product-card {
  contain: layout style; /* Layout changes inside don't affect outside */
}
```

```
📋 CLS Prevention Checklist:
□ width + height on ALL images (or aspect-ratio container)
□ Skeleton UI matches final layout dimensions
□ Font display: swap (no invisible text)
□ No content injected above existing content
□ Reserve space for ads/banners/embeds
□ Use CSS contain: layout on cards
□ No dynamic content changing sizes after load
□ Dialog/modal uses fixed positioning (doesn't push content)
□ Sticky headers have height reserved in flow
```

---

## بەشی ٢: Bundle Optimization — تەواو

---

### §4. Code Splitting & Dynamic Imports

```typescript
// ══════════════════════════════════════════
// DYNAMIC IMPORTS — Load on demand
// ══════════════════════════════════════════

import dynamic from 'next/dynamic'

// ✅ Heavy admin components (Charts, Rich Editor)
const AdminChart = dynamic(() => import('@/components/admin/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Charts need window object
})

// ✅ Map component (Leaflet is 150kB+)
const MapPicker = dynamic(() => import('@/components/shop/MapPicker'), {
  loading: () => <div className="h-64 bg-zinc-800 animate-pulse rounded-xl" />,
  ssr: false,
})

// ✅ Modal dialogs (load when needed)
const ProductQuickView = dynamic(() => import('@/components/shop/QuickView'))

// ✅ Below-fold sections on homepage
const TestimonialsSection = dynamic(() => import('@/components/shop/Testimonials'))
const NewsletterSection = dynamic(() => import('@/components/shop/Newsletter'))

// ══════════════════════════════════════════
// CONDITIONAL IMPORTS — Load based on condition
// ══════════════════════════════════════════

// ✅ Admin-only features never loaded for regular users
const AdminToolbar = dynamic(() => import('@/components/admin/Toolbar'), { ssr: false })

function Layout({ children, role }: { children: ReactNode; role: string }) {
  return (
    <>
      {role === 'admin' && <AdminToolbar />}
      {children}
    </>
  )
}
```

### §5. Tree Shaking & Import Optimization

```typescript
// ══════════════════════════════════════════
// IMPORT PATTERNS — Right vs Wrong
// ══════════════════════════════════════════

// ❌ Imports entire library
import { ShoppingCart, Heart, Star, Search, Menu, X, ChevronDown } from 'lucide-react'
// Lucide tree-shakes well, but barrel imports can still be slow in dev

// ✅ optimizePackageImports in next.config.ts handles this
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion', 'date-fns'],
  },
}

// ❌ Full lodash (70kB+)
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ Native or tiny alternative
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ❌ moment.js (300kB+)
import moment from 'moment'

// ✅ Intl (built-in, 0kB)
new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date)
// Or date-fns (tree-shakeable, ~2kB per function)
import { format } from 'date-fns'
```

### §6. Bundle Analysis

```bash
# ══════════════════════════════════════════
# ANALYZE YOUR BUNDLE
# ══════════════════════════════════════════

# Method 1: Next.js built-in
ANALYZE=true npx next build

# Method 2: @next/bundle-analyzer
# Install: npm i -D @next/bundle-analyzer
# Configure in next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
# module.exports = withBundleAnalyzer(nextConfig)

# Important metrics from build output:
# ○ (Static)   — pre-rendered at build
# ● (SSG)      — generated via generateStaticParams
# λ (Dynamic)  — rendered at request time
# First Load JS — total JS for route (shared + page)
```

```
📊 Performance Budget:
┌─────────────────────────┬──────────────┐
│ Metric                  │ Budget       │
├─────────────────────────┼──────────────┤
│ First Load JS (per route)│ < 100kB     │
│ Total page weight       │ < 500kB     │
│ Images (hero)           │ < 200kB     │
│ Images (product)        │ < 100kB     │
│ Font files              │ < 50kB each │
│ Third-party JS          │ < 50kB      │
│ API response (list)     │ < 50kB      │
│ Time to Interactive     │ < 3.0s      │
│ LCP                     │ < 2.5s      │
│ INP                     │ < 200ms     │
│ CLS                     │ < 0.1       │
└─────────────────────────┴──────────────┘
```

---

## بەشی ٣: Image Pipeline — تەواو

---

### §7. next/image — Full Configuration

```typescript
// ✅ next.config.ts — Complete image config
const nextConfig = {
  images: {
    // Format priority: AVIF (best compression) → WebP → JPEG
    formats: ['image/avif', 'image/webp'],
    
    // Remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    
    // Generated srcset widths for `sizes` attribute
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimize layout shift
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
}
```

### §8. Image Patterns for NexPOS

```typescript
// ══════════════════════════════════════════
// HERO IMAGE — LCP critical
// ══════════════════════════════════════════
<Image
  src="/images/hero.webp"
  alt="Professional POS Hardware"
  width={1920}
  height={900}
  priority                    // Preload (no lazy)
  sizes="100vw"
  quality={85}
  className="w-full h-auto object-cover"
/>

// ══════════════════════════════════════════
// PRODUCT CARD IMAGE — Grid
// ══════════════════════════════════════════
<div className="aspect-square relative overflow-hidden rounded-lg bg-zinc-800">
  <Image
    src={product.images[0]}
    alt={product.name}
    fill                      // Fills parent container
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    className="object-cover transition-transform group-hover:scale-105"
  />
</div>

// ══════════════════════════════════════════
// PRODUCT GALLERY — Detail Page
// ══════════════════════════════════════════
function ProductGallery({ images, name }: { images: string[]; name: string }) {
  return (
    <div className="space-y-4">
      {/* Main image — LCP candidate */}
      <div className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-800">
        <Image
          src={images[0]}
          alt={name}
          fill
          priority                // First image = LCP
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain"
        />
      </div>
      
      {/* Thumbnails — lazy loaded */}
      <div className="grid grid-cols-4 gap-2">
        {images.slice(1).map((img, i) => (
          <div key={i} className="aspect-square relative rounded-lg overflow-hidden bg-zinc-800">
            <Image
              src={img}
              alt={`${name} view ${i + 2}`}
              fill
              sizes="25vw"         // Small thumbnails
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// BRAND LOGOS — Small SVG/PNG
// ══════════════════════════════════════════
<Image
  src={brand.logo_url}
  alt={brand.name}
  width={120}
  height={60}
  className="object-contain"
  // No priority needed — small, lazy-loaded
/>

// ══════════════════════════════════════════
// AVATAR / USER IMAGE
// ══════════════════════════════════════════
<Image
  src={profile.avatar_url || '/images/default-avatar.png'}
  alt={profile.full_name || 'User'}
  width={40}
  height={40}
  className="rounded-full"
/>

// ══════════════════════════════════════════
// OG IMAGE — Social sharing
// ══════════════════════════════════════════
// src/app/api/og/route.tsx — Dynamic OG images
import { ImageResponse } from 'next/og'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'NexPOS'
  
  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: 1200, height: 630, background: '#18181b', color: 'white', padding: 60 }}>
        <h1 style={{ fontSize: 64 }}>{title}</h1>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
```

---

## بەشی ٤: Font Optimization — تەواو

---

### §9. next/font Complete Guide

```typescript
// ══════════════════════════════════════════
// GOOGLE FONTS — Auto-optimized
// ══════════════════════════════════════════
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',            // Show fallback font immediately
  variable: '--font-inter',   // CSS variable
  preload: true,
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

// ══════════════════════════════════════════
// LOCAL FONTS — Kurdish/Arabic
// ══════════════════════════════════════════
import localFont from 'next/font/local'

const nrt = localFont({
  src: [
    { path: './fonts/NRT-Reg.woff2', weight: '400', style: 'normal' },
    { path: './fonts/NRT-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-nrt',
  preload: true,
  fallback: ['Arial', 'Tahoma', 'sans-serif'],
})

// ══════════════════════════════════════════
// LAYOUT — Apply fonts
// ══════════════════════════════════════════
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${nrt.variable}`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}

// ══════════════════════════════════════════
// TAILWIND — Font families
// ══════════════════════════════════════════
// tailwind.config.ts
theme: {
  fontFamily: {
    sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
    kurdish: ['var(--font-nrt)', 'Arial', 'Tahoma', 'sans-serif'],
  },
}
```

```
📋 Font Checklist:
□ next/font (NEVER <link> to Google Fonts)
□ display: 'swap' (FOUT > FOIT)
□ preload: true for critical fonts
□ woff2 format only (best compression)
□ Subset: only needed character ranges
□ Variable: CSS custom property
□ Fallback fonts specified
□ Kurdish/Arabic: local font file, not Google
□ Font file size < 50kB each
□ Max 2 font families (performance)
□ No font-size < 16px on mobile inputs (iOS zoom)
```

---

## بەشی ٥: Rendering Strategy — Decision Tree

---

### §10. When to Use Each Strategy

```
═══════════════════════════════════════════════
RENDERING STRATEGY DECISION MATRIX
═══════════════════════════════════════════════

Question 1: Does it change per user?
  NO → Question 2
  YES → Server Component (dynamic, no cache)

Question 2: Does it change frequently?
  NO → Static (SSG) — generateStaticParams()
  SOMETIMES → ISR — revalidate: 3600/86400
  YES → Server Component (dynamic)

Question 3: Does it need interactivity?
  NO → Server Component (default)
  YES → Client Component Island
  MINIMAL → Server Component + Client Island for interactive part

Question 4: Does it have slow data?
  NO → Render normally
  YES → Suspense + Streaming (don't block page)
```

```typescript
// ══════════════════════════════════════════
// SSG — Build time generation
// ══════════════════════════════════════════
// Good for: About, Terms, Privacy, product pages (with ISR)

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('slug').eq('hidden', false)
  return data?.map(p => ({ slug: p.slug })) ?? []
}

// ══════════════════════════════════════════
// ISR — Rebuild on demand
// ══════════════════════════════════════════
// Good for: Products (change sometimes), categories, brands

// Segment-level revalidation
export const revalidate = 3600 // Rebuild every hour

// On-demand revalidation (from webhook or admin action)
import { revalidatePath, revalidateTag } from 'next/cache'

// After admin updates product:
revalidatePath('/products/barcode-scanner-x1')  // Specific page
revalidatePath('/products')                      // Product list
revalidateTag('products')                        // All product-tagged data

// ══════════════════════════════════════════
// STREAMING — Progressive rendering
// ══════════════════════════════════════════
// Good for: Pages with mix of fast/slow data

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug)  // Fast (cached)
  
  return (
    <>
      <ProductDetails product={product} />  {/* Renders immediately */}
      
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={product.id} />   {/* Streams in when ready */}
      </Suspense>
      
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedProducts category={product.category} />  {/* Independent stream */}
      </Suspense>
    </>
  )
}

// ══════════════════════════════════════════
// PARALLEL DATA FETCHING — No waterfalls
// ══════════════════════════════════════════

// ❌ Waterfall (sequential)
const categories = await getCategories()   // 200ms
const products = await getProducts()       // 300ms
const brands = await getBrands()           // 150ms
// Total: 650ms

// ✅ Parallel (concurrent)
const [categories, products, brands] = await Promise.all([
  getCategories(),   // 200ms
  getProducts(),     // 300ms ← limit
  getBrands(),       // 150ms
])
// Total: 300ms (fastest)
```

---

## بەشی ٦: Caching Strategy — ٤ لایەر

---

### §11. React cache() — Request Dedup

```typescript
// ✅ Same data used in layout + page + component?
// cache() ensures only ONE database query!

import { cache } from 'react'
import { createClient } from '@/lib/supabase-server'

export const getProduct = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, brands(*), categories(*)')
    .eq('slug', slug)
    .eq('hidden', false)
    .single()
  return data
})

// Used in generateMetadata() → 1 call
// Used in ProductPage() → cache hit (0 calls)
// Used in SEO component → cache hit (0 calls)
// Total: 1 database query instead of 3!
```

### §12. Cache-Control Headers

```typescript
// ✅ next.config.ts — Static asset caching
const nextConfig = {
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
}
```

---

## بەشی ٧: SEO — Metadata، JSON-LD، Sitemap

---

### §13. Complete Metadata System

```typescript
// ══════════════════════════════════════════
// ROOT LAYOUT — Global metadata
// ══════════════════════════════════════════
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://nexpos.store'),
  title: {
    default: 'NexPOS — Professional POS Hardware Store',
    template: '%s — NexPOS',
  },
  description: 'Premium Point-of-Sale hardware: barcode scanners, receipt printers, cash registers, POS terminals from Honeywell, Zebra, Ingenico, Datalogic.',
  keywords: ['POS hardware', 'barcode scanner', 'receipt printer', 'cash register', 'point of sale'],
  authors: [{ name: 'NexPOS' }],
  creator: 'NexPOS',
  publisher: 'NexPOS',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_IQ', 'ku_IQ', 'tr_TR'],
    url: 'https://nexpos.store',
    siteName: 'NexPOS',
    title: 'NexPOS — Professional POS Hardware Store',
    description: 'Premium POS hardware for your business',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'NexPOS — POS Hardware Store',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexPOS',
    description: 'Premium POS Hardware',
    images: ['/og-image.png'],
    creator: '@nexpos',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://nexpos.store',
    languages: {
      'en': '/en',
      'ar': '/ar',
      'ku': '/ku',
      'tr': '/tr',
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
  category: 'technology',
}

// ══════════════════════════════════════════
// PRODUCT PAGE — Dynamic metadata
// ══════════════════════════════════════════
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product Not Found' }
  
  return {
    title: product.name,  // Template adds " — NexPOS"
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} — NexPOS`,
      description: product.description.slice(0, 160),
      images: product.images.map(img => ({
        url: img,
        width: 800,
        height: 800,
        alt: product.name,
      })),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      images: product.images.slice(0, 1),
    },
    alternates: {
      canonical: `https://nexpos.store/products/${slug}`,
    },
  }
}
```

### §14. JSON-LD Structured Data — Complete

```typescript
// ══════════════════════════════════════════
// PRODUCT — Schema.org
// ══════════════════════════════════════════
export function ProductJsonLd({ product }: { product: Product }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      url: `https://nexpos.store/products/${product.slug}`,
      price: product.price,
      priceCurrency: 'USD',
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'NexPOS',
      },
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    },
    aggregateRating: product.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ══════════════════════════════════════════
// ORGANIZATION — Homepage
// ══════════════════════════════════════════
export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NexPOS',
    url: 'https://nexpos.store',
    logo: 'https://nexpos.store/logo.png',
    description: 'Professional POS Hardware Store',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+964-750-000-0000',
      contactType: 'customer service',
      areaServed: ['IQ', 'TR'],
      availableLanguage: ['English', 'Kurdish', 'Arabic', 'Turkish'],
    },
    sameAs: [
      'https://twitter.com/nexpos',
      'https://instagram.com/nexpos',
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

// ══════════════════════════════════════════
// WEBSITE — Search box
// ══════════════════════════════════════════
export function WebsiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NexPOS',
    url: 'https://nexpos.store',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://nexpos.store/products?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}

// ══════════════════════════════════════════
// BREADCRUMB — Navigation
// ══════════════════════════════════════════
export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
}
```

### §15. Sitemap & Robots — Complete

```typescript
// ✅ src/app/sitemap.ts — Dynamic sitemap
import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  
  const [products, categories, brands] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('hidden', false),
    supabase.from('categories').select('slug'),
    supabase.from('brands').select('slug'),
  ])
  
  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://nexpos.store', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://nexpos.store/products', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://nexpos.store/contact', changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://nexpos.store/terms', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://nexpos.store/privacy', changeFrequency: 'yearly', priority: 0.3 },
  ]
  
  const productPages: MetadataRoute.Sitemap = products.data?.map(p => ({
    url: `https://nexpos.store/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) ?? []
  
  return [...staticPages, ...productPages]
}

// ✅ src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/', '/settings/', '/orders/', '/checkout/'],
      },
    ],
    sitemap: 'https://nexpos.store/sitemap.xml',
  }
}

// ✅ src/app/manifest.ts — PWA manifest
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NexPOS — POS Hardware Store',
    short_name: 'NexPOS',
    description: 'Professional Point-of-Sale Hardware',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#6366f1',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

---

## بەشی ٨: Memory & Runtime Performance

---

### §16. Memory Leak Prevention

```typescript
// ══════════════════════════════════════════
// CLEANUP PATTERNS — Every effect needs cleanup
// ══════════════════════════════════════════

// ✅ Event listener cleanup
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth)
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

// ✅ Timer cleanup
useEffect(() => {
  const interval = setInterval(() => poll(), 5000)
  return () => clearInterval(interval)
}, [])

// ✅ AbortController for fetch
useEffect(() => {
  const controller = new AbortController()
  
  fetch('/api/data', { signal: controller.signal })
    .then(r => r.json())
    .then(setData)
    .catch(e => {
      if (e.name !== 'AbortError') console.error(e)
    })
  
  return () => controller.abort()
}, [])

// ✅ Supabase Realtime cleanup
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handler)
    .subscribe()
  
  return () => { supabase.removeChannel(channel) }
}, [])

// ✅ IntersectionObserver cleanup
useEffect(() => {
  const observer = new IntersectionObserver(callback, options)
  if (ref.current) observer.observe(ref.current)
  return () => observer.disconnect()
}, [])
```

### §17. Runtime Performance Patterns

```typescript
// ══════════════════════════════════════════
// VIRTUALIZATION — For long lists
// ══════════════════════════════════════════

// When you have 100+ items in a list, virtualize!
// Only render visible items → massive memory savings

// Libraries: @tanstack/react-virtual, react-window

// ══════════════════════════════════════════
// WEB WORKERS — CPU-intensive tasks
// ══════════════════════════════════════════

// Use for: CSV export, image processing, data transformation
// Don't block main thread!

// ══════════════════════════════════════════
// requestAnimationFrame — Smooth animations
// ══════════════════════════════════════════

// For scroll-based animations:
useEffect(() => {
  let rafId: number
  const handleScroll = () => {
    rafId = requestAnimationFrame(() => {
      // Animation logic here
    })
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => {
    window.removeEventListener('scroll', handleScroll)
    cancelAnimationFrame(rafId)
  }
}, [])
```

---

## بەشی ٩: Mobile Performance

---

### §18. Mobile Optimization Checklist

```
📋 Mobile Performance Checklist:
□ Touch targets ≥ 44×44px (WCAG 2.5.5)
□ Input font-size ≥ 16px (prevent iOS auto-zoom)
□ dvh units instead of vh (iOS Safari address bar)
□ No horizontal scroll (check overflow-x)
□ Responsive images with sizes attribute
□ Lazy load below-fold content
□ prefers-reduced-motion respected
□ Viewport meta tag correct
□ No fixed elements overlapping interactive areas
□ Bottom navigation ≥ 48px touch targets
□ Form inputs have appropriate inputMode
□ Safe area padding (env(safe-area-inset-*))
□ No hover-only interactions
□ scroll-behavior: smooth (but respect prefers-reduced-motion)
```

```typescript
// ✅ input types for mobile keyboards
<input type="email" inputMode="email" />        // @ and .com keys
<input type="tel" inputMode="tel" />             // Phone keypad
<input type="number" inputMode="decimal" />      // Number pad + decimal
<input type="search" inputMode="search" />       // Search key
<input type="text" inputMode="numeric" />        // Number pad (no decimal)
<input type="url" inputMode="url" />             // / and .com keys

// ✅ Safe area insets
<div className="pb-[env(safe-area-inset-bottom)]">
  {/* Bottom navigation */}
</div>

// ✅ prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## بەشی ١٠: Build & Deploy Optimization

---

### §19. next.config.ts — Full Optimization

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Remove X-Powered-By header
  poweredByHeader: false,
  
  // Enable gzip/brotli compression
  compress: true,
  
  // React Strict Mode
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  
  // Package import optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'motion',
      'date-fns',
      'zustand',
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
```

### §20. Lighthouse Audit Targets

```
═══════════════════════════════════════════════
LIGHTHOUSE SCORES TARGET: 90+ in all categories
═══════════════════════════════════════════════

Performance:   90+
  → LCP < 2.5s
  → INP < 200ms
  → CLS < 0.1
  → TBT < 200ms
  → First Load JS < 100kB

Accessibility: 95+
  → All images have alt text
  → Color contrast ratio ≥ 4.5:1
  → Interactive elements have accessible names
  → Logical heading hierarchy
  → Skip link present

Best Practices: 95+
  → HTTPS
  → No console errors
  → No deprecated APIs
  → Valid source maps

SEO:           95+
  → Meta description
  → Proper heading hierarchy
  → crawlable links
  → Valid robots.txt
  → Valid sitemap.xml
  → hreflang tags
```

---

## بەشی ١١: Monitoring & Web Vitals

---

### §21. Web Vitals Reporting

```typescript
// ✅ Vercel Analytics (built-in)
// Install: npm i @vercel/analytics @vercel/speed-insights
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// Add to root layout:
<Analytics />
<SpeedInsights />
```

```
📋 Monitoring Checklist:
□ Vercel Analytics enabled
□ Vercel Speed Insights enabled
□ Web Vitals dashboard monitored
□ Error tracking configured (Sentry recommended)
□ Performance budgets in CI/CD
□ Monthly Lighthouse audits
□ Real User Monitoring (RUM) data reviewed
□ Bundle size tracked per PR
```

---

