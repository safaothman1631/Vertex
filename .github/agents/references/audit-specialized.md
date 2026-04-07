### 🖼️ §23. پشکنینی Image & Media Pipeline

```
📋 Image Checklist:
□ next/image بەکارهاتووە (auto WebP/AVIF, lazy loading, responsive)
□ Remote patterns in next.config (Supabase Storage domain)
□ Upload validation: type + size + magic bytes
□ Image transforms via Supabase (resize, crop via URL params)
□ Blur placeholder or skeleton while loading
□ srcSet/sizes بۆ responsive images
□ Alt text descriptive (not empty for content images)
```
```typescript
// ✅ next.config.ts — Supabase remote images
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Best compression
  },
}
```
```typescript
// ✅ Product Image Component — responsive + accessible
import Image from 'next/image'

export function ProductImage({ product, priority = false }: Props) {
  return (
    <Image
      src={product.images?.[0] || '/images/placeholder.webp'}
      alt={product.name}  // ✅ Descriptive alt (not "image")
      width={400}
      height={400}
      priority={priority}  // ✅ true for LCP / above-fold images
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover rounded-lg"
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."  // Tiny blur
    />
  )
}
```
```typescript
// ✅ Secure File Upload with Magic Bytes Validation
// src/app/api/upload/route.ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Magic bytes for image formats
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Admin check
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file' }, { status: 400 })
  
  // 1️⃣ Type check (MIME type can be spoofed, but first layer)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 })
  }
  
  // 2️⃣ Size check
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }
  
  // 3️⃣ Magic bytes check (prevents .exe renamed to .jpg)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const magic = MAGIC_BYTES[file.type]
  if (magic && !magic.every((b, i) => bytes[i] === b)) {
    return Response.json({ error: 'File content mismatch' }, { status: 400 })
  }
  
  // 4️⃣ Generate unique filename (prevents path traversal + overwrites)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`
  
  // 5️⃣ Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('products')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })
  
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${data.path}`
  return Response.json({ url })
}
```

---

### 🔎 §24. پشکنینی Search

```
📋 Search Checklist:
□ Input sanitized (no SQL/XSS vectors)
□ Debounce on client (300-500ms) to avoid excessive requests
□ Server-side filtering (.ilike, .textSearch) — not client-side filter
□ Loading indicator during search
□ Empty state message ("هیچ نەدۆزرایەوە")
□ PostgreSQL full-text search (to_tsvector + GIN index) for future scale
□ Search analytics (track what users search for)
```
```typescript
// ✅ Client Search with Debounce + URL State
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from '@/contexts/locale'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const timerRef = useRef<NodeJS.Timeout>()
  
  // Debounce: wait 400ms after last keystroke
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setValue(q)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        params.set('q', q.trim())
      } else {
        params.delete('q')
      }
      params.delete('page') // Reset pagination on new search
      router.push(`/products?${params.toString()}`)
    }, 400)
  }, [router, searchParams])
  
  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])
  
  return (
    <input
      type="search"
      inputMode="search"
      enterKeyHint="search"
      value={value}
      onChange={handleChange}
      placeholder={t.common.search}
      aria-label={t.common.search}
      className="w-full px-4 py-2 border rounded-lg"
    />
  )
}
```
```typescript
// ✅ Server-side Search — Supabase ilike
// src/app/(store)/products/page.tsx
export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select('id, name, slug, price, images, brands(name)', { count: 'exact' })
    .eq('is_hidden', false)
  
  if (q) {
    // ✅ Server-side filter — Supabase handles sanitization
    query = query.or(`name.ilike.%${q}%,name_ku.ilike.%${q}%,name_ar.ilike.%${q}%`)
  }
  
  const page = Math.max(1, parseInt(params.page as string) || 1)
  const limit = 20
  const { data: products, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  
  return (
    <>
      <SearchInput />
      {products?.length ? (
        <ProductGrid products={products} />
      ) : (
        <EmptyState message="هیچ نەدۆزرایەوە" />
      )}
      <Pagination total={count ?? 0} page={page} limit={limit} />
    </>
  )
}
```

---

### 📋 §25. پشکنینی Logging & Observability

```
📋 Logging Checklist:
□ console.error بۆ هەموو catch blocks (with context)
□ No PII in logs (mask email/phone)
□ Structured logging format (JSON preferred)
□ Sentry or similar for error tracking
□ Vercel Analytics for traffic/performance
□ Request ID/correlation ID for tracing
□ Admin actions audit-logged
□ console.log removed from production (use no-console ESLint rule)
```
```typescript
// ✅ PII Masking Utility
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  return `${local[0]}***@${domain}` // s***@gmail.com
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4,}(\d{2})/, '$1****$2') // 075****45
}

// ✅ Structured Error Logging
function logError(context: string, error: unknown, meta?: Record<string, unknown>) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    ...meta, // ⚠️ Never include raw user data here!
  }))
}

// Usage in API route:
try {
  // ... business logic
} catch (error) {
  logError('checkout', error, { userId: user.id, itemCount: items.length })
  // ✅ userId is OK (not PII), email/phone would NOT be OK
  return Response.json({ error: 'هەڵەیەک ڕوویدا' }, { status: 500 })
}
```
```typescript
// ✅ Error Boundary Pattern — src/app/error.tsx
'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking service
    logError('page-error', error, { digest: error.digest })
  }, [error])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-bold">هەڵەیەک ڕویدا</h2>
      <p className="text-muted-foreground">تکایە دووبارە هەوڵ بدەرەوە</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-white rounded-lg"
      >
        هەوڵدانەوە
      </button>
    </div>
  )
}
```
```bash
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "error\|warn" | wc -l
grep -rn "catch.*{" src/ -A2 --include="*.ts" | grep -v "console\|Sentry\|log\|throw"  # silent catches
```

---

### 🧪 §26. پشکنینی Testing Strategy

#### A. Testing Pyramid
```
                 ╱╲
                ╱E2E╲           ← 2-3 critical flows
               ╱──────╲          (checkout, admin)
              ╱Integrat.╲      ← 10-20 (API routes)
             ╱────────────╲
            ╱  Unit Tests  ╲   ← 50+ (formatters, validators, stores)
           ╱────────────────╲
          ╱ Static Analysis  ╲ ← Always (TypeScript + ESLint)
         ╱────────────────────╲
```

#### B. What to Test
```
📋 Testing Checklist:
Unit: formatPrice, validatePhone, cart store (add/remove/clear), coupon validation
Integration: POST /api/checkout, POST /api/webhook, admin API auth checks
E2E (Playwright): checkout flow, admin CRUD, login/register, RTL switching
Accessibility: axe-core scan, keyboard nav, screen reader
Performance: Lighthouse CI on PRs, bundle size budgets

□ Vitest configured with @testing-library/react
□ Playwright for E2E
□ Test coverage > 70% (branches, functions, lines)
□ CI runs tests on every PR
```
```typescript
// ✅ Unit Test Example — Cart Store (Vitest)
import { describe, it, expect, beforeEach } from 'vitest'
import { useCart } from '@/store/cart'

describe('Cart Store', () => {
  beforeEach(() => {
    useCart.getState().clear()
  })
  
  it('adds item to cart', () => {
    useCart.getState().addItem('product-1')
    expect(useCart.getState().items).toHaveLength(1)
    expect(useCart.getState().items[0].quantity).toBe(1)
  })
  
  it('increments quantity for existing item', () => {
    useCart.getState().addItem('product-1')
    useCart.getState().addItem('product-1')
    expect(useCart.getState().items).toHaveLength(1)
    expect(useCart.getState().items[0].quantity).toBe(2)
  })
  
  it('removes item from cart', () => {
    useCart.getState().addItem('product-1')
    useCart.getState().removeItem('product-1')
    expect(useCart.getState().items).toHaveLength(0)
  })
  
  it('clears all items', () => {
    useCart.getState().addItem('product-1')
    useCart.getState().addItem('product-2')
    useCart.getState().clear()
    expect(useCart.getState().items).toHaveLength(0)
  })
})
```
```typescript
// ✅ Integration Test — API Route Auth Check
import { describe, it, expect } from 'vitest'

describe('Admin API Routes', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await fetch('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    })
    expect(res.status).toBe(401)
  })
  
  it('returns 403 for non-admin users', async () => {
    // Simulate regular user token
    const res = await fetch('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': regularUserCookie,
      },
      body: JSON.stringify({ name: 'Test' }),
    })
    expect(res.status).toBe(403)
  })
})
```
```typescript
// ✅ E2E Test — Checkout Flow (Playwright)
import { test, expect } from '@playwright/test'

test('complete checkout flow', async ({ page }) => {
  // 1. Browse products
  await page.goto('/products')
  await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible()
  
  // 2. Add to cart
  await page.click('[data-testid="add-to-cart"]')
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')
  
  // 3. Go to cart
  await page.goto('/cart')
  await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)
  
  // 4. Proceed to checkout
  await page.click('[data-testid="checkout-button"]')
  // Should redirect to login if not authenticated
  await expect(page).toHaveURL(/\/login/)
})

test('RTL layout switches correctly', async ({ page }) => {
  await page.goto('/')
  // Switch to Kurdish
  await page.click('[data-testid="lang-switcher"]')
  await page.click('[data-testid="lang-ckb"]')
  
  const html = page.locator('html')
  await expect(html).toHaveAttribute('dir', 'rtl')
  await expect(html).toHaveAttribute('lang', 'ckb')
})
```

---

### 📖 §27. پشکنینی Documentation & DX

```
📋 Documentation Checklist:
□ README.md: Tech stack, setup, env vars, available scripts
□ .env.example with all required variables
□ API endpoint reference (routes, methods, auth requirements)
□ JSDoc/TSDoc on exported functions
□ .vscode/settings.json + extensions.json for team
□ CONTRIBUTING.md (if open source)
```

---

### 🌍 §28. پشکنینی i18n (Internationalization)

```
📋 i18n Checklist:
□ Translation files: ckb.ts, ar.ts, en.ts, tr.ts
□ No hardcoded strings in components (use t.key pattern)
□ Locale stored in cookie + localStorage
□ dir attribute dynamic (rtl/ltr based on locale)
□ Kurdish number formatting (٠١٢٣٤٥٦٧٨٩)
□ Date formatting locale-aware (Intl.DateTimeFormat)
□ Currency formatting locale-aware (IQD: no decimals)
□ All translations complete (no missing keys)
```
```typescript
// ✅ Translation Pattern — src/messages/ckb.ts
export default {
  common: {
    home: 'سەرەتا',
    products: 'بەرهەمەکان',
    cart: 'سەبەتە',
    search: 'گەڕان...',
    addToCart: 'زیادکردن بۆ سەبەتە',
    outOfStock: 'نەماوە',
    loading: 'چاوەڕوان بە...',
  },
  checkout: {
    title: 'تەواوکردنی کڕین',
    total: 'کۆی گشتی',
    shipping: 'ناردن',
    cod: 'پارەدان لە کاتی وەرگرتن',
  },
  errors: {
    generic: 'هەڵەیەک ڕوویدا',
    notFound: 'نەدۆزرایەوە',
    unauthorized: 'دەستگەیشتنت نییە',
  },
} as const

// ✅ Usage in component
import { useLocale } from '@/contexts/locale'

export function ProductCard({ product }: Props) {
  const { t, locale, dir } = useLocale()
  
  return (
    <div dir={dir}>
      <h2>{product[`name_${locale}`] || product.name}</h2>
      <p>{t.common.addToCart}</p>
      <span dir="ltr">{formatIQD(product.price)}</span>
    </div>
  )
}
```

```typescript
// ✅ Translation Completeness Check Script
// Run: npx tsx scripts/check-translations.ts
import en from '../src/messages/en'
import ckb from '../src/messages/ckb'
import ar from '../src/messages/ar'
import tr from '../src/messages/tr'

function getKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? getKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  )
}

const enKeys = getKeys(en)
const locales = { ckb, ar, tr }

for (const [name, msgs] of Object.entries(locales)) {
  const keys = getKeys(msgs)
  const missing = enKeys.filter(k => !keys.includes(k))
  if (missing.length) {
    console.log(`⚠️ ${name}: Missing ${missing.length} keys:`, missing)
  } else {
    console.log(`✅ ${name}: All keys present`)
  }
}
```
```bash
# Hardcoded strings in components
grep -rn "'Add to\|'Remove\|'Cart\|'Login\|'Search\|'Submit" src/components/ --include="*.tsx"
grep -rn "'سەبەتە\|'بەرهەم\|'نرخ\|'گەڕان\|'داخڵبوون" src/components/ --include="*.tsx"
# Check all locales have same key count
for f in src/messages/*.ts; do echo "$f: $(grep -c ':\s' "$f") keys"; done
```

---

### 🔌 §29. پشکنینی Third-Party Integration

```
📋 Third-Party Audit:
□ Script loading: defer/async/afterInteractive (no render-blocking)
□ SDK lock versions (no floating versions for payment/auth)
□ Vendor lock-in assessment (can you migrate from Supabase? Stripe? Resend?)
□ CORS proxy pattern for APIs without CORS
□ Error handling for external service failures (graceful degradation)
□ Rate limits of third-party APIs respected
□ License compatibility (no GPL in commercial project)
```

---

### 🧠 §30. پشکنینی Memory Management

```
📋 Memory Checklist:
□ useEffect cleanup: event listeners, subscriptions, intervals, channels
□ Zustand store bounded (no infinite growth without pagination)
□ Large data paginated (not all-in-memory)
□ Detached DOM nodes cleaned up (modal/tooltip portals)
□ AbortController for cancelled fetch requests
□ WeakRef/WeakMap for caches where appropriate

Detection: Chrome DevTools → Memory tab → 3-snapshot comparison
```
```typescript
// ✅ AbortController — Cancel fetch on unmount or new search
'use client'
export function useProducts(query: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!query) return
    const controller = new AbortController()
    setLoading(true)
    
    fetch(`/api/products?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,  // ← Cancellable!
    })
      .then(r => r.json())
      .then(data => setProducts(data.products))
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err)
      })
      .finally(() => setLoading(false))
    
    return () => controller.abort()  // ← Cancel on unmount or query change
  }, [query])
  
  return { products, loading }
}
```
```typescript
// ✅ Bounded Store — Recently Viewed with Max Size
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_RECENTLY_VIEWED = 20

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [] as string[],
      addItem: (productId: string) => set((state) => {
        const filtered = state.items.filter(id => id !== productId)
        return {
          items: [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED)
          //                                ^^^^^^^^^^^^^^^^^^^^^^^^^
          // ✅ Bounded! Never grows beyond 20 items
        }
      }),
    }),
    { name: 'nexpos-recently-viewed' }
  )
)
```
```typescript
// ✅ Window Event Listener Cleanup
useEffect(() => {
  function handleResize() {
    setIsMobile(window.innerWidth < 768)
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize) // ← Cleanup!
}, [])

// ❌ Common Leak: IntersectionObserver without disconnect
useEffect(() => {
  const observer = new IntersectionObserver(callback, options)
  if (ref.current) observer.observe(ref.current)
  // ⚠️ Missing return () => observer.disconnect()
}, [])
```

---

### 🚩 §31. پشکنینی Feature Flags

```
📋 Feature Flags Checklist:
□ Feature flag system (custom Supabase table or third-party)
□ Server-side evaluation (not client-side toggles)
□ Percentage rollout support
□ User targeting support
□ A/B testing capability
□ Default values for missing flags
□ Cleanup stale flags
```

---

### 📊 §32. پشکنینی Technical Debt

```
📋 Tech Debt Assessment:
□ ESLint complexity rules: max-depth, max-lines-per-function, max-params
□ Circular dependencies: npx madge --circular src/
□ Dependency health: npm outdated, npm audit
□ Dead code detection: npx depcheck (unused dependencies)
□ TypeScript strictness score (count of 'any' types)
□ Code duplication (copy-paste detector)
□ Refactoring opportunities (large files > 300 lines)
```
```bash
wc -l src/**/*.tsx src/**/*.ts 2>/dev/null | sort -rn | head -10  # large files
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l  # any count
npx madge --circular src/  # circular deps
npx depcheck  # unused deps
```

---

