### 💾 §15. پشکنینی Database و Backend

#### A. Schema Design
```
📋 Database Checklist:
□ All tables have RLS enabled
□ Primary keys: UUID (gen_random_uuid)
□ Foreign keys with ON DELETE CASCADE/SET NULL
□ Indexes on: foreign keys, frequently filtered columns, slug, status
□ Composite indexes for multi-column queries
□ created_at TIMESTAMPTZ DEFAULT now() on all tables
□ Soft delete → trash table pattern (30-day auto-purge)
```
```sql
-- ✅ NexPOS Standard Table Pattern
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ku TEXT,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_hidden ON products(is_hidden) WHERE is_hidden = false;

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read (non-hidden only)
CREATE POLICY "products_select" ON products FOR SELECT
  USING (is_hidden = false);

-- Admin full access
CREATE POLICY "products_admin_all" ON products FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ✅ is_admin() function — SECURITY DEFINER prevents client bypass
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';
```

#### B. Query Patterns
```
✅ Good:
  .select('id, name, price, brands(name)')  — specific columns + join
  .eq('is_hidden', false)                    — server-side filter
  .range(0, 19)                              — pagination
  Promise.all([query1, query2])              — parallel

❌ Bad:
  .select('*')                               — overfetching
  .from('x').select(); then filter in JS     — client-side filter
  for loop with await supabase.from(...)     — N+1 query
```
```typescript
// ✅ Efficient: parallel queries with specific columns + joins
const [
  { data: products },
  { data: categories },
  { count: totalProducts }
] = await Promise.all([
  supabase.from('products')
    .select('id, name, slug, price, stock, images, brands(name), categories(name)')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1),
  supabase.from('categories').select('id, name').order('name'),
  supabase.from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_hidden', false),
])

// ❌ N+1 Query — DO NOT DO THIS
const { data: orders } = await supabase.from('orders').select('*')
for (const order of orders!) {
  // ⚠️ This fires a separate query for EACH order!
  const { data: items } = await supabase
    .from('order_items').select('*').eq('order_id', order.id)
  order.items = items
}

// ✅ Fix: Use Supabase joins (single query!)
const { data: orders } = await supabase
  .from('orders')
  .select('*, order_items(*, products(name, price, images))')
  .order('created_at', { ascending: false })
```

#### C. Migration Strategy
```
□ Migrations versioned (YYYYMMDD_description.sql)
□ IF EXISTS checks
□ RLS policies included
□ Indexes included
□ Rollback comments
□ Test on staging first
```
```sql
-- ✅ Migration template
-- Migration: 20250615_add_wishlist.sql
-- Purpose: Add wishlist functionality
-- Rollback: DROP TABLE IF EXISTS wishlist;

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)  -- One wishlist entry per user per product
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wishlist_own" ON wishlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
```

---


### 🔄 §18. پشکنینی Real-Time و WebSocket

```
📋 Real-Time Checklist (Supabase):
□ Postgres Changes: subscribe to table changes (orders, notifications)
□ RLS applies to realtime subscriptions (security!)
□ Channel cleanup on unmount (supabase.removeChannel)
□ Reconnection handling (auto-reconnect on disconnect)
□ Optimistic updates with rollback on failure
□ Broadcast for multi-tab sync
□ Presence for online status (optional)
```
```typescript
// ✅ Realtime Subscription Pattern — Order Status Updates
'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function OrderStatusLive({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<string>('pending')
  
  useEffect(() => {
    const supabase = createBrowserClient()
    let channel: RealtimeChannel
    
    channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setStatus(payload.new.status)
        }
      )
      .subscribe()
    
    // ✅ CLEANUP: Remove channel on unmount!
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])
  
  return <StatusBadge status={status} />
}
```
```typescript
// ✅ Admin Notifications — Bell Icon with Live Count
'use client'
export function NotificationBell() {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const supabase = createBrowserClient()
    
    // Initial count
    supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => setCount(count ?? 0))
    
    // Live updates
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => {
        setCount(prev => prev + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: 'is_read=eq.true',
      }, () => {
        setCount(prev => Math.max(0, prev - 1))
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [])
  
  return (
    <button className="relative" aria-label={`${count} ئاگاداریی نوێ`}>
      <BellIcon />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
```
```bash
grep -rn "\.channel(\|\.on('postgres_changes" src/ --include="*.ts" --include="*.tsx"
grep -rn "removeChannel\|unsubscribe" src/ --include="*.ts" --include="*.tsx"
# Missing cleanup:
grep -rn "\.channel(" src/ -l --include="*.tsx" | while read f; do
  grep -qL "removeChannel\|return.*=>" "$f" && echo "⚠️ No cleanup: $f"
done
```

---

### 🏭 §19. پشکنینی Infrastructure و Scalability

```
📋 Infrastructure Checklist:
□ Edge-compatible middleware (no Node.js APIs in middleware)
□ Cache-Control headers on static/API routes
□ Resource hints: preconnect, dns-prefetch for Supabase/Stripe CDNs
□ Vercel function config: maxDuration, memory
□ CDN caching for images (immutable)
□ API rate limiting + circuit breaker pattern
□ Serverless cold start mitigation (small bundles, tree-shaking)
□ Database connection pooling (Supabase handles this)
```

---


### 📧 §21. پشکنینی Email و ئاگادارکردنەوە

```
📋 Email Checklist:
□ Resend configured (graceful degradation if API key missing)
□ Email types: order confirmation, shipping, password reset, contact reply
□ HTML emails RTL-ready (dir="rtl" on wrapper)
□ No PII beyond what's needed in email content
□ DOMPurify for any user-generated content in emails
□ DNS records: SPF, DKIM, DMARC configured
□ Multi-channel: email + in-app notification (Promise.allSettled)
```

---

### 💳 §22. پشکنینی Payment Processing (Stripe)

```
📋 Payment Security Checklist (PCI SAQ-A):
□ Card input via Stripe Elements (iframe) — NEVER custom <input> for card
□ Amount calculated server-side (never trust client prices!)
□ Stripe.js loaded from js.stripe.com (CDN)
□ Secret key server-only (no NEXT_PUBLIC_)
□ Webhook signature verified (constructEvent with raw body)
□ Idempotent order processing (.eq('status', 'pending'))
□ Session expiry set (30 min max)
□ Success/cancel URLs validated (no open redirect)
□ Statement descriptor set
□ Test vs Live keys separated
□ Refund flow implemented
□ Currency consistent (USD cents: Math.round(price * 100))
```
```typescript
// ✅ Stripe Checkout Session Creation — Server-side prices
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { items } = await request.json() // Only IDs + quantities!
  
  // Fetch REAL prices from DB
  const productIds = items.map((i: { id: string }) => i.id)
  const { data: products } = await supabase
    .from('products').select('id, name, price, stock, images')
    .in('id', productIds)
  
  if (!products?.length) return Response.json({ error: 'No products' }, { status: 400 })
  
  // Verify stock + build line items
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  for (const item of items) {
    const product = products.find(p => p.id === item.id)
    if (!product) return Response.json({ error: `Product ${item.id} not found` }, { status: 404 })
    if (product.stock < item.quantity) {
      return Response.json({ error: `${product.name} نەماوە` }, { status: 400 })
    }
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: product.name, images: product.images?.slice(0, 1) },
        unit_amount: Math.round(product.price * 100), // ✅ DB price → cents
      },
      quantity: item.quantity,
    })
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    metadata: { user_id: user.id },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min expiry
  })
  
  return Response.json({ url: session.url })
}
```

---


### 🗄️ §41. پشکنینی Supabase Deep Dive

#### A. Schema (15 Tables)
```
profiles, products, orders, order_items, brands, categories,
reviews, coupons, notifications, user_addresses, inventory_log,
trash, wishlist, cart_items, contact_messages
```

#### B. RLS Policy Audit Matrix
```
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| products | 🌍 Public (!hidden) | 🔒 Admin | 🔒 Admin | 🔒 Admin |
| categories | 🌍 Public | 🔒 Admin | 🔒 Admin | 🔒 Admin |
| brands | 🌍 Public | 🔒 Admin | 🔒 Admin | 🔒 Admin |
| profiles | 🔐 Own | 🔐 Own | 🔐 Own | ❌ Never |
| orders | 🔐 Own | 🔐 Auth | 🔒 Admin | ❌ Never |
| order_items | 🔐 Own(via order)| 🔐 Auth | ❌ Never | ❌ Never |
| cart_items | 🔐 Own | 🔐 Auth | 🔐 Own | 🔐 Own |
| wishlist | 🔐 Own | 🔐 Auth | ❌ N/A | 🔐 Own |
| reviews | 🌍 Public | 🔐 Auth | 🔐 Own | 🔐 Own |
| notifications | 🔐 Own | 🔒 Admin | 🔐 Own(read)| 🔐 Own |
| coupons | 🌍 Public(active)| 🔒 Admin | 🔒 Admin | 🔒 Admin |
| contact_msgs | ❌ Never | 🌍 Public | 🔒 Admin | 🔒 Admin |
| user_addresses | 🔐 Own | 🔐 Auth | 🔐 Own | 🔐 Own |
| inventory_log | 🔒 Admin | 🔒 System | ❌ Never | ❌ Never |
| trash | 🔒 Admin | 🔒 Admin | 🔒 Admin | 🔒 Admin |

🔐 = auth.uid() = user_id    🔒 = is_admin()    🌍 = Public
```

#### C. Client Types
```
1. Browser client (createBrowserClient) — client components, anon key, RLS applies
2. Server client (createServerClient + cookies) — server components, anon key, RLS applies
3. Admin client (SERVICE_ROLE) — webhooks/cron only, bypasses RLS
```

#### D. Common Supabase Anti-Patterns
```typescript
// ❌ #1: Service role exposed to client
// .env
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx  // 🚨 Anyone can bypass RLS!
// ✅ Fix:
SUPABASE_SERVICE_ROLE_KEY=xxx  // No NEXT_PUBLIC_

// ❌ #2: getSession() on server (unverified JWT)
const { data: { session } } = await supabase.auth.getSession()
// ✅ Fix:
const { data: { user }, error } = await supabase.auth.getUser()

// ❌ #3: New client instance every render
function Component() {
  const supabase = createClient(url, key)  // New auth listener every render!
}
// ✅ Fix: Singleton pattern in lib/supabase-client.ts

// ❌ #4: Service role when anon suffices
const adminSupabase = createAdminClient()
const { data } = await adminSupabase.from('products').select('*')
// ✅ Fix: anon client + RLS handles public products

// ❌ #5: Ignoring errors
const { data } = await supabase.from('products').select('*')
data.map(...)  // 🚨 data could be null!
// ✅ Fix:
const { data, error } = await supabase.from('products').select('*')
if (error) { console.error(error.message); return [] }

// ❌ #6: Channel without cleanup → memory leak
useEffect(() => {
  supabase.channel('orders').on('postgres_changes', {...}, handler).subscribe()
}, [])
// ✅ Fix:
useEffect(() => {
  const channel = supabase.channel('orders').on('postgres_changes', {...}, handler).subscribe()
  return () => { supabase.removeChannel(channel) }
}, [])
```

---

### 🛒 §42. پشکنینی E-Commerce Patterns

#### Cart & Checkout Security
```
📋 E-Commerce Checklist:
□ Cart: client-only (Zustand + localStorage) — no server round-trip for add/remove
□ Checkout: server validates items + prices from DB, creates order, creates Stripe session
□ Order lifecycle: pending → processing → shipped → delivered (state machine)
□ Inventory: check stock server-side before checkout, decrement atomically
□ Coupons: validate server-side (existence, expiry, min_order, usage_limit)
□ Price display: IQD (no decimals), USD (2 decimals)
□ Multi-currency: IQD, USD, EUR, TRY with locale-aware formatting
```

#### Security Critical Path
```typescript
// ✅ Checkout API — server-side price verification (NEVER trust client)
export async function POST(request: Request) {
  const { items, shippingAddress, couponCode } = parsed.data
  
  // 1️⃣ Query REAL prices from database
  const productIds = items.map(i => i.id)
  const { data: products } = await supabase
    .from('products')
    .select('id, price, stock, name')
    .in('id', productIds)
  
  // 2️⃣ Verify stock availability
  for (const item of items) {
    const product = products?.find(p => p.id === item.id)
    if (!product) throw new Error(`Product not found`)
    if (product.stock < item.quantity) throw new Error(`Insufficient stock: ${product.name}`)
  }
  
  // 3️⃣ Calculate total with DATABASE prices (not client prices!)
  let total = items.reduce((sum, item) => {
    const product = products!.find(p => p.id === item.id)!
    return sum + product.price * item.quantity
  }, 0)
  
  // 4️⃣ Apply coupon (validated server-side)
  if (couponCode) {
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .gte('expires_at', new Date().toISOString())
      .single()
    if (coupon && total >= coupon.min_order) {
      total = total * (1 - coupon.discount_percent / 100)
    }
  }
  
  // 5️⃣ Create Stripe session with verified prices
  const session = await stripe.checkout.sessions.create({
    line_items: items.map(item => {
      const product = products!.find(p => p.id === item.id)!
      return {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(product.price * 100), // ✅ DB PRICE in cents
          product_data: { name: product.name },
        },
        quantity: item.quantity,
      }
    }),
    metadata: { orderId: order.id, userId: user.id },
    expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 min
  })
}
```

#### Order Lifecycle State Machine
```
           ┌──────────┐
           │ pending   │ ← Order created, awaiting payment
           └────┬──────┘
                │ webhook: checkout.session.completed
           ┌────▼──────┐
           │processing │ ← Payment confirmed, preparing
           └────┬──────┘
                │ admin action
           ┌────▼──────┐
           │ shipped   │ ← Package sent
           └────┬──────┘
                │
           ┌────▼──────┐
           │ delivered  │ ← Customer received
           └───────────┘
           
   Side paths:
   pending → cancelled (customer cancels)
   processing → refunded (payment reversed)
```

---

### 🚨 §43. پشکنینی Error Handling & Recovery
