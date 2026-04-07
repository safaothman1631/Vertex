## تەکنۆلۆجیاکانی ماستەر

```
Next.js 16        — App Router, RSC, Server Actions, Streaming, Middleware, Turbopack
React 19          — React Compiler, useOptimistic, useTransition, useActionState, use()
TypeScript 5      — Strict mode, generics, utility types, satisfies, Zod
Supabase          — Client/Server, Auth (getUser), RLS, Realtime, Storage, Edge Functions
Stripe            — Checkout Sessions, Webhooks, Payment Intents, Subscriptions
Zustand 5         — Persist, Immer, Devtools, Subscriptions, Slices
Tailwind CSS 4    — JIT, dark:, responsive, RTL (logical properties)
Motion (Framer)   — animate, whileHover, AnimatePresence, layout, variants
next-intl         — Messages, locale routing, RTL support
```

---

## بەشی ١: Next.js 16 — تەواوی App Router

---

### §1. Route Types — هەموو جۆرەکان

```
📊 Next.js 16 Route Structure:
src/app/
├── layout.tsx              → Root Layout (هەموو لاپەڕەکان)
├── page.tsx                → Homepage /
├── loading.tsx             → Loading UI بۆ /
├── error.tsx               → Error UI بۆ /
├── not-found.tsx           → 404 بۆ /
├── (store)/                → Route Group (URL ـدا نییە)
│   ├── layout.tsx          → Store Layout
│   ├── page.tsx            → / (homepage — store layout)
│   ├── loading.tsx         → Loading بۆ store pages
│   ├── products/
│   │   ├── page.tsx        → /products
│   │   └── [slug]/
│   │       ├── page.tsx    → /products/barcode-scanner-x1
│   │       └── loading.tsx
│   ├── cart/
│   │   └── page.tsx        → /cart
│   ├── checkout/
│   │   └── page.tsx        → /checkout
│   └── orders/
│       └── page.tsx        → /orders
├── (auth)/                 → Auth Route Group
│   ├── layout.tsx          → Auth Layout (centered, minimal)
│   ├── login/page.tsx      → /login
│   ├── register/page.tsx   → /register
│   └── reset-password/page.tsx → /reset-password
├── admin/                  → Admin (protected)
│   ├── layout.tsx          → Admin Layout (sidebar)
│   ├── page.tsx            → /admin (dashboard)
│   ├── products/page.tsx   → /admin/products
│   ├── orders/page.tsx     → /admin/orders
│   └── ...
└── api/                    → API Routes
    ├── checkout/route.ts   → POST /api/checkout
    ├── webhook/route.ts    → POST /api/webhook
    └── admin/
        └── products/route.ts → GET/POST /api/admin/products
```

### §2. Server Components — Default (هیچ directive نەنووسە)

```typescript
// ✅ Server Component — data fetching + static content
// src/app/(store)/products/page.tsx
import { createClient } from '@/lib/supabase-server'
import { ProductCard } from '@/components/shop/ProductCard'
import { Suspense } from 'react'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; page?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const perPage = 12
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const supabase = await createClient()
  
  let query = supabase
    .from('products')
    .select('id, name, slug, price, old_price, images, rating, review_count, in_stock, brand, is_new, is_hot', { count: 'exact' })
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .range(from, to)
  
  if (params.category) query = query.eq('category', params.category)
  if (params.brand) query = query.eq('brand', params.brand)
  if (params.q) query = query.ilike('name', `%${params.q}%`)
  
  const { data: products, count } = await query
  const totalPages = Math.ceil((count ?? 0) / perPage)
  
  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<FiltersSkeleton />}>
        <ProductFilters />
      </Suspense>
      
      {products?.length === 0 ? (
        <EmptyState message="هیچ بەرهەمێک نەدۆزرایەوە" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      
      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} />}
    </main>
  )
}
```

### §3. Client Components — تەنیا بۆ interactivity

```typescript
// ✅ Client Component — SMALLEST possible island
// src/components/shop/AddToCartButton.tsx
'use client'

import { useCart } from '@/store/cart'
import { useTransition } from 'react'

interface Props {
  productId: string
  inStock: boolean
}

export function AddToCartButton({ productId, inStock }: Props) {
  const addItem = useCart(s => s.addItem)
  const [isPending, startTransition] = useTransition()
  
  if (!inStock) {
    return (
      <button disabled className="w-full py-3 bg-zinc-700 text-zinc-400 rounded-xl cursor-not-allowed">
        نەماوە
      </button>
    )
  }
  
  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          addItem(productId)
        })
      }}
      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
    >
      {isPending ? 'چاوەڕوان بە...' : 'خستنە سەبەتە'}
    </button>
  )
}
```

```typescript
// ✅ Client Island inside Server Component
// src/app/(store)/products/[slug]/page.tsx
import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProductImages } from '@/components/shop/ProductImages'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { WishlistButton } from '@/components/shop/WishlistButton'
import { ReviewsList } from '@/components/shop/ReviewsList'
import { RelatedProducts } from '@/components/shop/RelatedProducts'
import { ProductJsonLd } from '@/components/shop/ProductJsonLd'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

// Dynamic metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, price, brand')
    .eq('slug', slug)
    .single()
  
  if (!product) return { title: 'Product Not Found' }
  
  return {
    title: `${product.name} — NexPOS`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: product.images.map((img: string) => ({ url: img })),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: product, error } = await supabase
    .from('products')
    .select('*, brands(*), categories(*)')
    .eq('slug', slug)
    .eq('hidden', false)
    .single()
  
  if (error || !product) notFound()
  
  return (
    <>
      <ProductJsonLd product={product} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Server Component — static images */}
          <ProductImages images={product.images} name={product.name} />
          
          <div className="space-y-6">
            <div>
              <p className="text-sm text-indigo-400">{product.brand}</p>
              <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">${product.price}</span>
              {product.old_price && (
                <span className="text-xl text-zinc-500 line-through">${product.old_price}</span>
              )}
            </div>
            
            <p className="text-zinc-400 leading-relaxed">{product.description}</p>
            
            {/* Client Islands — only interactive parts */}
            <AddToCartButton productId={product.id} inStock={product.in_stock} />
            <WishlistButton productId={product.id} />
          </div>
        </div>
        
        {/* Streaming — loads independently, doesn't block page */}
        <Suspense fallback={<ReviewsSkeleton />}>
          <ReviewsList productId={product.id} />
        </Suspense>
        
        <Suspense fallback={<RelatedSkeleton />}>
          <RelatedProducts categoryId={product.category} currentId={product.id} />
        </Suspense>
      </main>
    </>
  )
}
```

### §4. Loading & Error & Not-Found

```typescript
// ✅ loading.tsx — Skeleton UI (shows instantly while page loads)
// src/app/(store)/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-zinc-800/50 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-zinc-700" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-zinc-700 rounded w-3/4" />
              <div className="h-4 bg-zinc-700 rounded w-1/2" />
              <div className="h-8 bg-zinc-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ✅ error.tsx — Error boundary (must be client component)
// src/app/(store)/error.tsx
'use client'

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-2xl font-bold text-white">هەڵەیەک ڕوویدا</h2>
      <p className="text-zinc-400">{error.message || 'تکایە دووبارە هەوڵ بدەوە'}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
      >
        دووبارە هەوڵبدەوە
      </button>
    </div>
  )
}

// ✅ not-found.tsx
// src/app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <h1 className="text-8xl font-bold text-indigo-500">404</h1>
      <p className="text-xl text-zinc-400">ئەم لاپەڕەیە نەدۆزرایەوە</p>
      <Link
        href="/"
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
      >
        گەڕانەوە بۆ سەرەکی
      </Link>
    </div>
  )
}
```

---

## بەشی ٢: API Route Patterns — هەموو جۆرەکان

---

### §5. CRUD API Route — تەواو

```typescript
// ✅ src/app/api/admin/products/route.ts — Full CRUD
import { createClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

// ── Schemas ──
const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().min(1),
  model: z.string().default(''),
  category: z.string().min(1),
  price: z.number().positive(),
  old_price: z.number().positive().nullable().default(null),
  description: z.string().min(10).max(5000),
  specs: z.array(z.string()).default([]),
  images: z.array(z.string().url()).min(1),
  in_stock: z.boolean().default(true),
  is_new: z.boolean().default(false),
  is_hot: z.boolean().default(false),
})

const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().uuid(),
})

// ── Helper: Admin check ──
async function requireAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', status: 401 }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 }
  
  return { user, error: null, status: 200 }
}

// ── GET: List products (admin) ──
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const perPage = Number(searchParams.get('perPage')) || 20
  const search = searchParams.get('q') || ''
  const category = searchParams.get('category')
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  
  let query = supabase
    .from('products')
    .select('id, name, slug, brand, category, price, in_stock, is_new, is_hot, hidden, images, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  
  if (search) query = query.ilike('name', `%${search}%`)
  if (category) query = query.eq('category', category)
  
  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ data, total: count, page, perPage })
}

// ── POST: Create product ──
export async function POST(request: Request) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  
  const body = await request.json()
  const parsed = CreateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  
  // Generate slug
  const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...parsed.data, slug })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Product already exists' }, { status: 409 })
      throw error
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Create product error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── PUT: Update product ──
export async function PUT(request: Request) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  
  const body = await request.json()
  const parsed = UpdateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  
  const { id, ...updates } = parsed.data
  
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    
    return NextResponse.json(data)
  } catch (err) {
    console.error('Update product error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── DELETE: Delete product (soft delete) ──
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })
  
  const { id } = await request.json()
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing product ID' }, { status: 400 })
  }
  
  // Soft delete — just hide the product
  const { error } = await supabase
    .from('products')
    .update({ hidden: true })
    .eq('id', id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

### §6. Server Actions — تەواو

```typescript
// ✅ src/app/actions/cart.ts — Server Actions بۆ cart
'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
})

export async function addToServerCart(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const parsed = CartItemSchema.safeParse({
    productId: formData.get('productId'),
    quantity: Number(formData.get('quantity')) || 1,
  })
  if (!parsed.success) throw new Error('Invalid input')
  
  // Upsert — if exists, increment quantity
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', parsed.data.productId)
    .single()
  
  if (existing) {
    await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + parsed.data.quantity })
      .eq('id', existing.id)
  } else {
    await supabase.from('cart_items').insert({
      user_id: user.id,
      product_id: parsed.data.productId,
      quantity: parsed.data.quantity,
    })
  }
  
  revalidatePath('/cart')
}

export async function removeFromServerCart(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId)
  
  revalidatePath('/cart')
}

export async function updateCartQuantity(productId: string, quantity: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  if (quantity < 1) {
    return removeFromServerCart(productId)
  }
  
  await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', user.id)
    .eq('product_id', productId)
  
  revalidatePath('/cart')
}
```

```typescript
// ✅ Server Action بۆ Contact Form
'use server'

import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
})

export async function submitContactForm(formData: FormData) {
  const parsed = ContactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })
  
  if (!parsed.success) {
    return { error: 'تکایە هەموو خانەکان پڕ بکەوە', success: false }
  }
  
  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert(parsed.data)
  
  if (error) {
    return { error: 'هەڵەیەک ڕوویدا، دووبارە هەوڵ بدەوە', success: false }
  }
  
  return { error: null, success: true }
}
```

### §7. Webhook Pattern — Stripe

```typescript
// ✅ src/app/api/webhook/route.ts — Stripe Webhook
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

// Admin Supabase client — bypasses RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: Request) {
  // 1️⃣ Get raw body (NOT parsed JSON)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!
  
  // 2️⃣ Verify signature
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  // 3️⃣ Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Idempotent — only process pending orders
        const { data: order } = await adminSupabase
          .from('orders')
          .update({
            status: 'processing',
            paid_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)
          .eq('status', 'pending')
          .select()
          .single()
        
        if (order) {
          // Multi-channel notifications — one failure doesn't block others
          await Promise.allSettled([
            sendOrderEmail(order),
            createOrderNotification(order),
            decrementProductStock(order.id),
          ])
        }
        break
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await adminSupabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('stripe_session_id', session.id)
          .eq('status', 'pending')
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    // Still return 200 — Stripe will retry on non-200
  }
  
  // 4️⃣ Always return 200
  return NextResponse.json({ received: true })
}
```

---

## بەشی ٣: React 19 — هەموو فیچەرە نوێیەکان

---

### §8. React Compiler — Auto-memoization

```typescript
// ✅ React Compiler — بە ئۆتۆماتیکی memo دەکات
// لە next.config.ts:
// experimental: { reactCompiler: true }
// یان لە babel config:
// plugins: [['babel-plugin-react-compiler']]

// بەبێ React Compiler:
const MemoizedChild = React.memo(function Child({ data }) { ... })
const memoizedValue = useMemo(() => expensive(data), [data])
const memoizedFn = useCallback(() => handleClick(id), [id])

// لەگەڵ React Compiler — هیچکام پێویست نییە:
function Child({ data }) { ... }  // ئۆتۆماتیک memo دەبێت
const value = expensive(data)      // ئۆتۆماتیک memo دەبێت
const fn = () => handleClick(id)   // ئۆتۆماتیک memo دەبێت
```

### §9. useOptimistic — Instant UI Feedback

```typescript
// ✅ Wishlist toggle — instant visual feedback
'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleWishlistAction } from '@/app/actions/wishlist'
import { Heart } from 'lucide-react'

interface Props {
  productId: string
  isWished: boolean
}

export function WishlistButton({ productId, isWished }: Props) {
  const [optimisticWished, setOptimisticWished] = useOptimistic(isWished)
  const [isPending, startTransition] = useTransition()
  
  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          setOptimisticWished(!optimisticWished) // ← Instant UI
          await toggleWishlistAction(productId)   // ← Server (may fail → auto-reverts)
        })
      }}
      className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
      aria-label={optimisticWished ? 'لابردن لە دڵخواز' : 'زیادکردن بۆ دڵخواز'}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          optimisticWished ? 'fill-red-500 text-red-500' : 'text-zinc-400'
        }`}
      />
    </button>
  )
}
```

### §10. useActionState — Form بە Server Action

```typescript
// ✅ Login form بە useActionState
'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
    success: false,
  })
  
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-zinc-400 mb-1">ئیمەیڵ</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="name@example.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm text-zinc-400 mb-1">وشەی نهێنی</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>
      
      {state.error && (
        <p role="alert" className="text-red-400 text-sm">{state.error}</p>
      )}
      
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
      >
        {isPending ? 'چاوەڕوان بە...' : 'چوونەژوورەوە'}
      </button>
    </form>
  )
}
```

### §11. Suspense & Streaming — Parallel Loading

```typescript
// ✅ Streaming pattern — each section loads independently
// src/app/(store)/page.tsx (homepage)
import { Suspense } from 'react'

export default function HomePage() {
  return (
    <main>
      {/* Hero — static, renders immediately */}
      <HeroSection />
      
      {/* Each Suspense boundary streams independently */}
      <Suspense fallback={<BrandsSkeleton />}>
        <BrandsSection />
      </Suspense>
      
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesSection />
      </Suspense>
      
      <Suspense fallback={<TestimonialsSkeleton />}>
        <TestimonialsSection />
      </Suspense>
    </main>
  )
}

// ✅ Parallel data fetching inside Server Component
async function FeaturedProducts() {
  const supabase = await createClient()
  
  // These run in PARALLEL (not sequential!)
  const [hotProducts, newProducts] = await Promise.all([
    supabase.from('products').select('id, name, slug, price, images, rating').eq('is_hot', true).eq('hidden', false).limit(8),
    supabase.from('products').select('id, name, slug, price, images, rating').eq('is_new', true).eq('hidden', false).limit(8),
  ])
  
  return (
    <section>
      <ProductRow title="بەرهەمە گەرمەکان 🔥" products={hotProducts.data ?? []} />
      <ProductRow title="بەرهەمە نوێیەکان ✨" products={newProducts.data ?? []} />
    </section>
  )
}
```

---

## بەشی ٤: Supabase — تەواوی پاتێرنەکان

---

### §12. Supabase Client Setup

```typescript
// ✅ src/lib/supabase-server.ts — Server-side client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component — can't set cookies (read-only)
          }
        },
      },
    },
  )
}

// ✅ src/lib/supabase-client.ts — Client-side client
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

### §13. Supabase Query Patterns

```typescript
// ✅ SELECT with JOINs (no N+1!)
const { data: orders } = await supabase
  .from('orders')
  .select(`
    id, total, status, created_at,
    order_items (
      id, quantity, price,
      products ( id, name, slug, images )
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

// ✅ Pagination
const { data, count } = await supabase
  .from('products')
  .select('*', { count: 'exact' })
  .range(0, 11) // 12 items (0-indexed)

// ✅ Full-text search
const { data } = await supabase
  .from('products')
  .select('id, name, slug, price, images')
  .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
  .eq('hidden', false)
  .limit(20)

// ✅ Aggregation via RPC
const { data: stats } = await supabase.rpc('get_dashboard_stats')

// ✅ Realtime subscription
const channel = supabase
  .channel('order-updates')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
    (payload) => {
      setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
    }
  )
  .subscribe()

// Cleanup
return () => { supabase.removeChannel(channel) }
```

### §14. Auth Flows

```typescript
// ✅ Register
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: name },
    emailRedirectTo: `${origin}/auth/confirm`,
  },
})

// ✅ Login
const { error } = await supabase.auth.signInWithPassword({ email, password })

// ✅ Logout
await supabase.auth.signOut()

// ✅ Reset password
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/reset-password`,
})

// ✅ Auth state listener (client-side)
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') router.push('/')
    if (event === 'SIGNED_OUT') router.push('/login')
  })
  return () => subscription.unsubscribe()
}, [])
```

---

## بەشی ٥: Zustand — State Management

---

### §15. Cart Store — تەواو

```typescript
// ✅ src/store/cart.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string       // product ID
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (id: string) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clear: () => void
  totalItems: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (id) => set((state) => {
        const existing = state.items.find(i => i.id === id)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.id === id ? { ...i, quantity: Math.min(i.quantity + 1, 99) } : i
            ),
          }
        }
        return { items: [...state.items, { id, quantity: 1 }] }
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id),
      })),
      
      updateQuantity: (id, quantity) => set((state) => {
        if (quantity < 1) return { items: state.items.filter(i => i.id !== id) }
        return {
          items: state.items.map(i =>
            i.id === id ? { ...i, quantity: Math.min(quantity, 99) } : i
          ),
        }
      }),
      
      clear: () => set({ items: [] }),
      
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'nexpos-cart',
      // ⚠️ SECURITY: Only store IDs + quantities
      // NEVER store prices — always fetch from database at checkout!
    },
  ),
)
```

### §16. Compare & Recently Viewed Stores

```typescript
// ✅ src/store/compare.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CompareState {
  items: string[] // product IDs (max 4)
  addItem: (id: string) => void
  removeItem: (id: string) => void
  clear: () => void
  hasItem: (id: string) => boolean
}

export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (id) => set((state) => {
        if (state.items.includes(id)) return state
        if (state.items.length >= 4) return state // Max 4 items
        return { items: [...state.items, id] }
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i !== id),
      })),
      clear: () => set({ items: [] }),
      hasItem: (id) => get().items.includes(id),
    }),
    { name: 'nexpos-compare' },
  ),
)

// ✅ src/store/recently-viewed.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RecentlyViewedState {
  items: string[] // product IDs (max 20)
  addItem: (id: string) => void
}

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (id) => set((state) => {
        const filtered = state.items.filter(i => i !== id)
        return { items: [id, ...filtered].slice(0, 20) }
      }),
    }),
    { name: 'nexpos-recently-viewed' },
  ),
)
```

---

## بەشی ٦: Middleware — Auth + Security

---

### §17. Middleware Pattern

```typescript
// ✅ middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })
  
  // ── Security Headers ──
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // ── Supabase Auth Refresh ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    },
  )
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const pathname = request.nextUrl.pathname
  
  // ── Protect admin routes ──
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // ── Protect user routes ──
  if (pathname.startsWith('/orders') || pathname.startsWith('/settings') || pathname.startsWith('/wishlist')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // ── Redirect logged-in users from auth pages ──
  if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## بەشی ٧: TypeScript — Type-Safe Patterns

---

### §18. Types & Zod Schemas

```typescript
// ✅ src/types/index.ts — Complete type definitions
export type Role = 'user' | 'admin'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type CouponType = 'percent' | 'fixed'
export type NotificationType = 'info' | 'order' | 'promo' | 'system'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  phone: string | null
  avatar_url: string | null
  preferred_locale: string | null
  theme: string
  currency: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  model: string
  category: string
  price: number
  old_price: number | null
  description: string
  specs: string[]
  images: string[]
  rating: number
  review_count: number
  in_stock: boolean
  is_new: boolean
  is_hot: boolean
  hidden: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: OrderStatus
  stripe_session_id: string | null
  shipping_address: ShippingAddress
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: Pick<Product, 'name' | 'slug' | 'images'>
}

export interface ShippingAddress {
  name: string
  phone: string
  address: string
  city: string
  country: string
  zip: string
}
```

```typescript
// ✅ Zod schemas — runtime validation
import { z } from 'zod'

export const CheckoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1),
  shippingAddress: z.object({
    name: z.string().min(2).max(100),
    phone: z.string().regex(/^\+964\d{10}$/, 'ژمارەی مۆبایلی عێراقی نادروستە'),
    address: z.string().min(5).max(500),
    city: z.string().min(2).max(100),
    country: z.string().default('Iraq'),
    zip: z.string().default(''),
  }),
  couponCode: z.string().optional(),
})

export const RegisterSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email('ئیمەیڵ نادروستە'),
  password: z.string().min(6, 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت'),
})

export const ProductFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating']).default('newest'),
  page: z.number().int().min(1).default(1),
  q: z.string().optional(),
})
```

---

## بەشی ٨: Component Patterns — UI Library

---

### §19. Reusable UI Components

```typescript
// ✅ Skeleton Component
export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-700/50 rounded ${className ?? ''}`} />
}

// ✅ Empty State
export function EmptyState({ title, message, action }: {
  title?: string
  message: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
        <span className="text-2xl">📭</span>
      </div>
      {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
      <p className="text-zinc-400 text-center max-w-md">{message}</p>
      {action && (
        <Link href={action.href} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">
          {action.label}
        </Link>
      )}
    </div>
  )
}

// ✅ Badge
export function Badge({ variant, children }: {
  variant: 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
}) {
  const colors = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[variant]}`}>
      {children}
    </span>
  )
}

// ✅ Confirm Dialog Hook
import { useConfirm } from '@/hooks/useConfirm'

// Usage:
const { confirm, ConfirmDialog } = useConfirm()

const handleDelete = async () => {
  const ok = await confirm({
    title: 'سڕینەوە',
    message: 'دڵنیایت لە سڕینەوەی ئەم بەرهەمە؟',
    confirmText: 'سڕینەوە',
    variant: 'destructive',
  })
  if (ok) { /* delete */ }
}

return (
  <>
    <button onClick={handleDelete}>سڕینەوە</button>
    <ConfirmDialog />
  </>
)
```

### §20. Admin Data Table Pattern

```typescript
// ✅ Admin Client Component — Data Table with CRUD
'use client'

import { useState, useTransition } from 'react'

interface Props<T> {
  initialData: T[]
  initialTotal: number
  columns: Column<T>[]
  onDelete?: (id: string) => Promise<void>
}

export function AdminDataTable<T extends { id: string }>({
  initialData,
  initialTotal,
  columns,
  onDelete,
}: Props<T>) {
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()
  
  const handleSearch = (q: string) => {
    setSearch(q)
    startTransition(async () => {
      const res = await fetch(`/api/admin/products?q=${q}&page=1`)
      const json = await res.json()
      setData(json.data)
    })
  }
  
  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id)
      setData(prev => prev.filter(item => item.id !== id))
    }
  }
  
  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="گەڕان..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
      />
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-700">
              {columns.map(col => (
                <th key={col.key} className="text-start p-3 text-sm text-zinc-400">{col.label}</th>
              ))}
              <th className="p-3 text-sm text-zinc-400">کردارەکان</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                {columns.map(col => (
                  <td key={col.key} className="p-3 text-sm text-zinc-300">
                    {col.render ? col.render(row) : String((row as any)[col.key])}
                  </td>
                ))}
                <td className="p-3">
                  <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-300">
                    سڕینەوە
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## بەشی ٩: Checkout Flow — تەواو

---

### §21. Checkout — Client to Server to Stripe

```typescript
// ✅ src/app/api/checkout/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const CheckoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1),
  shippingAddress: z.object({
    name: z.string().min(2),
    phone: z.string().min(5),
    address: z.string().min(5),
    city: z.string().min(2),
    country: z.string().default('Iraq'),
    zip: z.string().default(''),
  }),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const parsed = CheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  
  // ⚠️ CRITICAL: Fetch prices from DATABASE — never trust client!
  const productIds = parsed.data.items.map(i => i.productId)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, images, in_stock')
    .in('id', productIds)
  
  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'Some products not found' }, { status: 400 })
  }
  
  // Check stock
  const outOfStock = products.filter(p => !p.in_stock)
  if (outOfStock.length > 0) {
    return NextResponse.json({ error: `Out of stock: ${outOfStock.map(p => p.name).join(', ')}` }, { status: 400 })
  }
  
  // Calculate total from DATABASE prices
  const orderItems = parsed.data.items.map(item => {
    const product = products.find(p => p.id === item.productId)!
    return {
      product_id: item.productId,
      quantity: item.quantity,
      price: product.price, // ← FROM DATABASE
    }
  })
  
  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  // Create order in database
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total,
      status: 'pending',
      shipping_address: parsed.data.shippingAddress,
    })
    .select()
    .single()
  
  if (orderError) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
  
  // Create order items
  await supabase.from('order_items').insert(
    orderItems.map(item => ({ ...item, order_id: order.id }))
  )
  
  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    metadata: { orderId: order.id, userId: user.id },
    line_items: parsed.data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: product.images.slice(0, 1),
          },
          unit_amount: Math.round(product.price * 100), // cents
        },
        quantity: item.quantity,
      }
    }),
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?cancelled=true`,
  })
  
  // Save Stripe session ID
  await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id)
  
  return NextResponse.json({ url: session.url })
}
```

---

## بەشی ١٠: File Upload — ئەمین

---

### §22. File Upload بە Supabase Storage

```typescript
// ✅ src/app/api/upload/route.ts
import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  
  // ── Validation ──
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, AVIF' }, { status: 400 })
  }
  
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 })
  }
  
  // ── Magic bytes check ──
  const buffer = Buffer.from(await file.arrayBuffer())
  const header = buffer.subarray(0, 4).toString('hex')
  const validHeaders = ['89504e47', 'ffd8ffe0', 'ffd8ffe1', '52494646'] // PNG, JPEG, JPEG, WebP
  if (!validHeaders.some(h => header.startsWith(h))) {
    return NextResponse.json({ error: 'File content does not match its extension' }, { status: 400 })
  }
  
  // ── Upload with UUID filename (prevent path traversal) ──
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const path = `products/${filename}`
  
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })
  
  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
  
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
  
  return NextResponse.json({ url: publicUrl })
}
```

---

## بەشی ١١: Rate Limiting & Email

---

### §23. Rate Limiting Pattern

```typescript
// ✅ src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60_000,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now }
}

// Usage in API route:
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { allowed, resetIn } = checkRateLimit(`login:${ip}`, 5, 60_000)
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) },
      },
    )
  }
  // ... rest of handler
}
```

### §24. Email Pattern (Resend)

```typescript
// ✅ src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(order: Order, email: string) {
  await resend.emails.send({
    from: 'NexPOS <noreply@nexpos.store>',
    to: email,
    subject: `Order Confirmed #${order.id.slice(0, 8)}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Order #${order.id.slice(0, 8)} has been confirmed.</p>
      <p>Total: $${order.total}</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders">View your orders</a>
    `,
  })
}
```

---

## بەشی ١٢: پاتێرنەکانی NexPOS

---

### فایل ستراکچەر:
```
src/app/(store)/          → public pages (shop, cart, checkout, orders)
src/app/(auth)/           → login, register, reset-password
src/app/admin/            → admin panel (protected)
src/app/api/              → API routes
src/components/shop/      → store components
src/components/admin/     → admin components
src/components/ui/        → shared UI components
src/lib/                  → utilities (supabase, email, rate-limit)
src/store/                → Zustand stores (cart, compare, recently-viewed)
src/messages/             → i18n messages (en, ckb, ar, tr)
src/types/                → TypeScript types
```

### ئەمنیەتی تەواو — چەکلیستی ١٥ خاڵ:
```
□ getUser() نەک getSession() لە server
□ Zod validation بۆ هەموو inputs (API + Server Actions)
□ Admin double-check (middleware + API route)
□ NEVER trust client-side prices — fetch from DB at checkout
□ Rate limiting on: login, register, checkout, contact, forgot-password
□ File upload: type whitelist + size limit + magic bytes + UUID filename
□ No PII in console.log (email, phone, password)
□ Parameterized queries only (Supabase query builder)
□ CSRF protection (SameSite cookies — automatic with Supabase SSR)
□ XSS prevention (React auto-escapes, no dangerouslySetInnerHTML)
□ Webhook signature verification (Stripe constructEvent)
□ Environment variables validated at startup (Zod)
□ Secrets never in NEXT_PUBLIC_ prefix
□ HTTP-only cookies for auth (Supabase SSR handles this)
□ Content-Security-Policy headers in middleware
```

### کۆمپۆنێنت دروستکردن — چەکلیستی ١٢ خاڵ:
```
□ Server Component by default — 'use client' ONLY for interactivity
□ 'use client' بە lowest possible level (leaf components)
□ Props type-safe (interface/type — never any)
□ Loading states (Suspense boundaries + skeleton components)
□ Error states (error.tsx + try/catch)
□ Empty states (meaningful message + action)
□ Responsive (mobile-first: base → sm → md → lg → xl)
□ RTL-ready (logical properties: ms, me, ps, pe, start, end)
□ Dark mode (dark: variants in Tailwind)
□ Accessible (aria labels, keyboard nav, focus management, contrast)
□ Semantic HTML (button not div, h1→h2→h3 hierarchy)
□ Performance (no useEffect for data, no index as key, cleanup effects)
```

### Anti-Patterns — هەرگیز مەیکە:
```typescript
// ❌ Whole page as client component
'use client'
export default function ProductsPage() { ... } // WRONG

// ✅ Page is Server Component, islands are client
export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductGrid products={products} /> // Server
  // <AddToCartButton /> inside ProductGrid → Client Island
}

// ❌ useEffect for data fetching
useEffect(() => {
  fetch('/api/products').then(r => r.json()).then(setProducts)
}, [])

// ✅ Server Component direct query
const products = await supabase.from('products').select('*')

// ❌ Index as key
{items.map((item, index) => <Card key={index} />)} // WRONG

// ✅ Stable ID as key
{items.map(item => <Card key={item.id} />)}

// ❌ Missing useEffect cleanup
useEffect(() => {
  const timer = setInterval(poll, 5000) // MEMORY LEAK!
}, [])

// ✅ Cleanup
useEffect(() => {
  const timer = setInterval(poll, 5000)
  return () => clearInterval(timer)
}, [])

// ❌ Derived state in useState
const [fullName, setFullName] = useState(first + ' ' + last)

// ✅ Calculate during render
const fullName = first + ' ' + last

// ❌ getSession on server
const { data: { session } } = await supabase.auth.getSession()

// ✅ getUser on server
const { data: { user } } = await supabase.auth.getUser()
```

---

