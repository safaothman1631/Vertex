### 🏗️ §7. پشکنینی ئارکیتێکچەر (Architecture)

#### A. Route Structure & Layout
```
📋 Architecture Checklist:
□ Route groups meaningful: (store), (auth), admin
□ Layouts nest correctly (root → group → page)
□ No data fetching in layout (use Suspense)
□ Middleware handles: auth refresh, redirects, security headers
□ loading.tsx + error.tsx + not-found.tsx exist
```

#### B. State Management
```
📊 State Location Decision:
├── Server data (products, orders) → Server Component query
├── Persisted client state (cart) → Zustand + localStorage persist
├── Theme/locale → React Context + cookie
├── Form state → React useState
├── Search/filter → URL searchParams
├── Real-time (order status) → Supabase Realtime
└── Modal/drawer → React useState
```
```typescript
// ✅ Zustand Store Pattern — Cart with persistence
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem { id: string; quantity: number }
interface CartState {
  items: CartItem[]
  addItem: (id: string) => void
  removeItem: (id: string) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (id) => set((state) => {
        const existing = state.items.find(i => i.id === id)
        if (existing) {
          return { items: state.items.map(i => 
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          )}
        }
        return { items: [...state.items, { id, quantity: 1 }] }
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      clear: () => set({ items: [] }),
    }),
    { name: 'nexpos-cart' }  // localStorage key
  )
)
// ⚠️ SECURITY: Cart stores ONLY IDs + quantities
// Prices are ALWAYS fetched from database at checkout!
```

#### C. API Route Pattern
```
Every API route should follow:
1️⃣ Rate limiting (IP-based)
2️⃣ Authentication (supabase.auth.getUser)
3️⃣ Input validation (Zod)
4️⃣ Authorization (admin check if needed)
5️⃣ Business logic (try/catch)
6️⃣ Structured error response
```

#### D. Middleware Pattern
```typescript
// ✅ middleware.ts — Auth refresh + security headers + redirects
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Supabase auth refresh (required for SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

#### E. Supabase RLS
```
📋 RLS Checklist:
□ RLS enabled on ALL tables (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
□ No USING (true) policies (except public tables like products SELECT)
□ is_admin() function is SECURITY DEFINER with SET search_path = ''
□ User policies filter by auth.uid() = user_id
□ Admin policies use is_admin()
□ INSERT policies use WITH CHECK (not just USING)
□ Service role (bypass RLS) ONLY in webhooks, cron, admin API
```

---


### 🧠 §13. پشکنینی ئەدڤانسی React و Next.js

#### A. Server vs Client Components
```
📊 Decision Tree:
ئایا interactivity پێویستە (useState, onClick, etc)?
  → بەڵێ → Client Component ('use client') بە lowest level
  → نەخێر → Server Component ✅

نموونە:
  ProductPage → Server Component (data fetch)
    └── AddToCartButton → Client Component (onClick)
    └── ProductImages → Server Component (static)
    └── ReviewsList → Server Component (data)
```

#### B. Key Patterns
```
□ Server Actions بە Zod validation + auth check
□ Suspense بۆ streaming (parallel data loading)
□ Composition: Server Component بۆ data, Client Island بۆ interaction
□ useTransition بۆ non-blocking updates
□ useOptimistic بۆ instant UI feedback
□ useId بۆ SSR-safe unique IDs
□ Props serializable (no functions/classes to Server Components)
```
```typescript
// ✅ Server Action Pattern — Always validate + authenticate
'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'

const ReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  content: z.string().min(10).max(1000),
})

export async function addReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = ReviewSchema.safeParse({
    productId: formData.get('productId'),
    rating: Number(formData.get('rating')),
    content: formData.get('content'),
  })
  if (!parsed.success) throw new Error('Invalid data')

  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    product_id: parsed.data.productId,
    rating: parsed.data.rating,
    content: parsed.data.content,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/products/${parsed.data.productId}`)
}
```

```typescript
// ✅ Suspense Streaming Pattern (parallel data loading)
// src/app/(store)/products/[slug]/page.tsx
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug) // Awaited — needed for layout
  
  return (
    <main>
      <ProductDetails product={product} />
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={product.id} />   {/* Streams independently */}
      </Suspense>
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedProducts category={product.category_id} /> {/* Streams independently */}
      </Suspense>
    </main>
  )
}
```

```typescript
// ✅ useOptimistic — Instant UI Feedback
'use client'
import { useOptimistic, useTransition } from 'react'

export function WishlistButton({ productId, isWished }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(isWished)
  const [isPending, startTransition] = useTransition()
  
  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          setOptimistic(!optimistic)          // ← Instant UI update
          await toggleWishlist(productId)      // ← Server action (may fail)
        })
      }}
    >
      {optimistic ? '❤️' : '🤍'}
    </button>
  )
}
```

#### C. Anti-Patterns to Detect
```
❌ Whole page as 'use client' (should be islands)
❌ useEffect for data fetching (use Server Component)
❌ useState for derived state (calculate during render)
❌ Missing cleanup in useEffect (memory leak!)
❌ Index as key in lists (use stable ID)
❌ Data fetching in layout.tsx (blocks children — use Suspense)
❌ redirect() in client component (use router.push)
❌ Server module import in client component
```
```typescript
// ❌ Anti-Pattern: useEffect for data fetching
'use client'
export function ProductList() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts)
    // ⚠️ No loading state, no error handling, no SSR, bad for SEO
  }, [])
  return <div>{products.map(...)}</div>
}

// ✅ Fix: Server Component (zero JS sent to client!)
export default async function ProductList() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('id, name, price, slug')
  return <div>{products?.map(...)}</div>
  // ✅ SSR, SEO-friendly, zero client JS, no loading state needed
}
```

```typescript
// ❌ Anti-Pattern: Missing useEffect cleanup
useEffect(() => {
  const timer = setInterval(checkStock, 30000)
  // ⚠️ Memory leak! Timer keeps running after unmount
}, [])

// ✅ Fix: cleanup function
useEffect(() => {
  const timer = setInterval(checkStock, 30000)
  return () => clearInterval(timer) // ← Cleanup on unmount
}, [])
```

```bash
# Detect Anti-Patterns
grep -rn "'use client'" src/app/**/page.tsx  # ← pages should be Server Components
grep -rn "useEffect.*fetch\|useEffect.*supabase" src/ --include="*.tsx"
grep -rn "setInterval\|addEventListener" src/ --include="*.tsx" -A5 | grep -v "return.*clear\|return.*remove"
grep -rn "\.map(" src/ --include="*.tsx" | grep "key={i}\|key={index}"
```

---

### 🔧 §14. پشکنینی ئەدڤانسی TypeScript

```
📋 TypeScript Audit:
□ Discriminated unions بۆ state variants
□ Branded types بۆ type-safe IDs (UserId, ProductId)
□ Zod schemas بۆ runtime validation (checkout, product creation)
□ satisfies operator بۆ type inference
□ Mapped types / conditional types where beneficial
□ No enum (use const objects or union types)
□ Generic components where reusable
□ tsconfig: strict, noUnusedLocals, noUnusedParameters, forceConsistentCasingInFileNames
```

---


### 📐 §20. پشکنینی Design Patterns

```
📋 Architecture Patterns:
□ Clear separation: components/shop, components/admin, components/ui
□ Server state (Supabase query) vs Client state (Zustand/Context) vs URL state (searchParams)
□ Controller pattern: API route validates → calls service → returns response
□ Strategy pattern: payment methods, notification channels
□ Factory pattern: error response helpers (badRequest, unauthorized, forbidden)
□ Module boundaries respected (no cross-imports between admin/shop)
```
```
📂 NexPOS File Organization:
src/
├── app/                    # Route handlers (thin — delegates to services)
│   ├── (store)/           # Public storefront routes
│   ├── (auth)/            # Auth routes (login, register, reset)
│   ├── admin/             # Admin dashboard routes
│   └── api/               # API routes (REST endpoints)
├── components/
│   ├── shop/              # Customer-facing components
│   ├── admin/             # Admin-only components
│   └── ui/                # Shared UI primitives (Button, Input, Modal)
├── contexts/              # React Contexts (locale, preferences)
├── store/                 # Zustand stores (cart, recently-viewed)
├── lib/                   # Utilities (supabase, email, rate-limit, env)
├── messages/              # i18n translations (ckb, ar, en, tr)
├── data/                  # Static data (product seeds)
└── types/                 # Shared TypeScript types

⚠️ Rules:
- components/admin/ NEVER imports from components/shop/
- components/shop/ NEVER imports from components/admin/
- Both can import from components/ui/
- lib/ has ZERO UI imports
- store/ has ZERO Supabase imports (stores are client-only)
```
```bash
# Detect cross-boundary imports
grep -rn "from.*components/admin" src/components/shop/ --include="*.tsx"
grep -rn "from.*components/shop" src/components/admin/ --include="*.tsx"
grep -rn "from.*react\|from.*next" src/lib/ --include="*.ts"
```

---

