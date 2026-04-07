### 🎯 §39. پشکنینی State Management

```
📋 State Architecture:
□ Zustand cart store: persist to localStorage, addItem/removeItem/clearCart
□ Zustand recently-viewed: persist, max 20 items
□ React Context: locale (ckb/ar/en/tr) + theme preferences
□ Hydration safety: useEffect for initializing persisted state
□ No prop drilling > 2 levels (use Context or store)
□ URL state for filters/search (searchParams)
□ Server state via Server Components (no useEffect fetching)

📊 Anti-pattern detection:
□ useState for derived values → calculate during render
□ Multiple contexts re-rendering entire tree → split contexts
□ Store growing unbounded → implement max size / pagination
```

---

### 🛣️ §40. پشکنینی App Router Mastery

```
📋 App Router Checklist:
□ Dynamic routes: [slug], [...catchAll], [[...optional]]
□ Route segment config: revalidate, dynamic, runtime
□ generateStaticParams for known product slugs (SSG)
□ generateMetadata for dynamic SEO
□ loading.tsx for instant transition feedback
□ error.tsx for error boundaries
□ not-found.tsx for 404 pages
□ layout.tsx for shared UI (no data fetching — use Suspense)
□ Parallel routes (@modal, @sidebar) if needed
□ Intercepting routes (.) for modals
□ Route groups don't create URL segments

📊 Caching Strategy:
Static content (about, terms) → revalidate: false (ISR infinite)
Product list → revalidate: 60 (1 min)
Product detail → ISR + on-demand revalidation after admin edit
User-specific (cart, orders) → dynamic: 'force-dynamic'
Admin → dynamic: 'force-dynamic'
API routes → Cache-Control headers
```

---



```
📋 Error Handling Checklist:
□ Error boundary hierarchy: root error.tsx → group error.tsx → page error.tsx
□ API error response format: { error: { code, message, status } }
□ Error factory helpers: badRequest(), unauthorized(), forbidden(), notFound()
□ Network errors: retry with exponential backoff (max 3 retries)
□ Supabase errors: always check { data, error }
□ Stripe errors: catch and map to user-friendly messages
□ Form errors: inline (per-field) + summary
□ Global error tracking: Sentry (captureException with context)
□ Offline detection: navigator.onLine + online/offline events
```
```typescript
// ✅ API Error Response Helpers
function jsonError(message: string, status: number) {
  return Response.json({ error: { message, status } }, { status })
}

const badRequest = (msg = 'داواکاری هەڵەیە') => jsonError(msg, 400)
const unauthorized = () => jsonError('دەستگەیشتنت نییە', 401)
const forbidden = () => jsonError('مۆڵەتت نییە', 403)
const notFound = (msg = 'نەدۆزرایەوە') => jsonError(msg, 404)
const tooMany = () => jsonError('داواکاری زۆر — تکایە چاوەڕوان بە', 429)
const serverError = () => jsonError('هەڵەی سێرڤەر', 500)

// Usage in API route:
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()
  
  const { data: order, error } = await supabase
    .from('orders').select('*').eq('id', orderId).single()
  
  if (error || !order) return notFound('ئۆردەرەکە نەدۆزرایەوە')
  return Response.json(order)
}
```
```typescript
// ✅ Supabase Error Handling — ALWAYS check error
const { data, error } = await supabase
  .from('products').select('*').eq('id', productId).single()

// ❌ Never do this:
return data!.name  // Crashes if error or data is null

// ✅ Always check:
if (error) {
  logError('product-fetch', error, { productId })
  return notFound()
}
return Response.json(data)
```
```typescript
// ✅ Retry with Exponential Backoff (client-side)
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === retries) throw error
      const delay = baseDelay * Math.pow(2, attempt) // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}

// Usage:
const data = await fetchWithRetry(() =>
  fetch('/api/orders').then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })
)
```

---

### 🧩 §44. پشکنینی Component Architecture

```
📋 Component Architecture:
□ Server Component: data fetching + static UI
□ Client Component: interactivity only ('use client' at leaf level)
□ Composition: Server wraps Client islands
□ AdminShell: responsive sidebar → drawer on mobile, Escape to close, route-change close
□ Compound components: Tabs, Accordion, Dropdown (context-based)
□ Render props / headless components for flexible rendering
□ Props: serializable only for Server Components
□ 'use client' boundary pushed to lowest possible component
```

---

### 📡 §45. پشکنینی Data Fetching & Caching

```
📋 Data Fetching Patterns:
□ Server Component: direct Supabase query (async function component)
□ Parallel fetching: Promise.all([query1, query2, query3])
□ generateMetadata: SEO per product (title, description, OG image)
□ Client data: Zustand for persistent, useState for ephemeral
□ SWR/React Query: optional for client-side server state (with dedup, retry)
□ Loading states handled (Suspense, useState)
□ Error states handled (error.tsx, try/catch)

📊 Cache Strategy:
export const revalidate = 60       // ISR every 60s
export const dynamic = 'force-dynamic'  // always fresh
revalidatePath('/products')        // on-demand after admin change
revalidateTag('products')          // tag-based
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

---

### 🔗 §46. پشکنینی API Design Patterns

#### API Route Standard Pattern
```typescript
// ✅ NexPOS API route standard (every route should follow this)
export async function POST(request: Request) {
  // 1️⃣ Rate Limiting
  const ip = getClientIP(request)
  const rl = rateLimiter.check(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'زۆر داوات کردووە — تکایە چاوەڕوان بە' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }
  
  // 2️⃣ Authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 3️⃣ Input Validation (Zod)
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }
  
  // 4️⃣ Authorization (admin check if needed)
  // 5️⃣ Business Logic (try/catch)
  try {
    const result = await processRequest(parsed.data, user)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API Error]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### Zod Validation Patterns
```typescript
// ✅ NexPOS Zod schemas with Kurdish error messages
const shippingAddressSchema = z.object({
  name: z.string().min(2, 'ناوەکەت تکایە').max(100),
  phone: z.string().regex(/^(\+964|07)\d{9,10}$/, 'ژمارەی مۆبایل نادروستە'),
  city: z.string().min(2, 'شارەکە تکایە').max(50),
  address: z.string().min(5, 'ناونیشان تکایە').max(200),
  notes: z.string().max(500).optional(),
})

const checkoutSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(99),
  })).min(1, 'سەبەتە بەتاڵە'),
  shippingAddress: shippingAddressSchema,
  couponCode: z.string().optional(),
})
```

#### Webhook Standard
```
□ Raw body (request.text())
□ Signature verification (constructEvent)
□ Idempotent processing
□ SERVICE_ROLE client
□ Promise.allSettled for multi-channel notifications
□ Always return 200
```

---

### 🇰🇷 §47. پشکنینی Kurdish E-Commerce UX — بازاڕی کوردستان

#### A. Payment Methods
```
| پارەدان | پێویستن؟ | Notes |
|----------|----------|-------|
| Cash on Delivery | 🔴 پێویستە | ~70% orders لە کوردستان |
| FIB Mobile | 🔴 پێویستە | بانکی سەرەکی |
| FastPay | 🟡 باشترە | بەرفراوان لە هەولێر |
| Stripe/Card | 🟡 باشترە | بۆ diaspora |
| ZainCash | 🟢 باشە | بۆ زەین mobile money |
```

#### B. Address & Phone (Iraq/Kurdistan)
```
□ Cities: هەولێر، سلێمانی، دهۆک، هەڵەبجە، بەغدا، بەسرە، کەرکووک، مووسڵ
□ Phone: +964XXXXXXXXXX or 07XXXXXXXXX
□ Delivery zones: Erbil city (5,000 IQD), Kurdistan (10,000), Iraq (15,000)
□ Currency: IQD — no decimals (25,000 not 25,000.00)
□ Multi-currency: IQD, USD, EUR, TRY
```
```typescript
// ✅ Iraq/Kurdistan Phone Validation
const iraqPhoneRegex = /^(\+964|07)\d{9,10}$/

// ✅ IQD Currency Formatting — No decimals!
function formatIQD(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' IQD'
}
// formatIQD(25000) → "25,000 IQD"
// formatIQD(1250000) → "1,250,000 IQD"

// ✅ Delivery Zone Pricing
const DELIVERY_ZONES = {
  'erbil-city':    { price: 5000,  label_ku: 'ناو شار', label_en: 'Erbil City' },
  'kurdistan':     { price: 10000, label_ku: 'کوردستان', label_en: 'Kurdistan Region' },
  'iraq':          { price: 15000, label_ku: 'عێراق',   label_en: 'Iraq' },
} as const

// ✅ Kurdish City Dropdown Data
const CITIES = [
  { value: 'erbil',      label: 'هەولێر',    en: 'Erbil' },
  { value: 'sulaymaniyah', label: 'سلێمانی',  en: 'Sulaymaniyah' },
  { value: 'duhok',      label: 'دهۆک',      en: 'Duhok' },
  { value: 'halabja',    label: 'هەڵەبجە',   en: 'Halabja' },
  { value: 'kirkuk',     label: 'کەرکووک',   en: 'Kirkuk' },
  { value: 'baghdad',    label: 'بەغدا',     en: 'Baghdad' },
  { value: 'basra',      label: 'بەسرە',     en: 'Basra' },
  { value: 'mosul',      label: 'مووسڵ',     en: 'Mosul' },
]
```

#### C. Trust Signals
```
□ COD prominent on homepage/product pages
□ Phone number visible (WhatsApp link)
□ Physical address (if applicable)
□ Return policy in Kurdish
□ Social media links (Instagram = primary in Kurdistan)
□ Reviews with real names
□ Express delivery option
□ Real product photos (not stock)
```

---

### 🚀 §48. پشکنینی Production Readiness

#### A. Pre-Deploy Checklist
```
📋 Security:
□ RLS on all tables
□ Admin double-gated (middleware + layout)
□ API auth checks
□ Security headers set
□ .env secrets not in code
□ Rate limiting on sensitive endpoints
□ Webhook signature verified
□ File upload validated

📋 Build:
□ npm run build — ✅
□ npm run lint — ✅
□ npx tsc --noEmit — ✅
□ npm test — ✅
□ npm audit — no high/critical
□ Bundle within budget

📋 Content & SEO:
□ sitemap.xml generates
□ robots.txt blocks admin/auth
□ All pages have metadata
□ 404 page works
□ Favicon + app icons

📋 Functionality:
□ Auth flow works (register → login → logout)
□ Checkout flow works (cart → checkout → payment)
□ Admin accessible for admins only
□ Email notifications send
□ Webhook processes events
□ i18n switching works (ckb, ar, en, tr)
□ RTL layout correct

📋 Monitoring:
□ Error tracking configured
□ Analytics configured
□ Health check works (/api/health)
□ Uptime monitoring
```

---


### 🔔 §51. پشکنینی Notification System

```
📋 Notification Channels:
| Channel | Use Case | Priority |
|---------|----------|----------|
| Email (Resend) | Orders, password reset | 🔴 Must |
| In-App (DB) | All events, bell icon | 🔴 Must |
| Push (SW) | Order status, promos | 🟡 Nice |
| SMS | COD confirmation | 🟡 Nice |
| WhatsApp | Support, tracking | 🟢 Future |

□ Multi-channel via Promise.allSettled (one failure doesn't block others)
□ In-app: database table (notifications) + bell icon badge
□ Email: Resend with graceful degradation
□ Order lifecycle emails: confirmed, shipped, delivered
□ Notification unread count visible
```
```typescript
// ✅ Multi-Channel Notification — Promise.allSettled Pattern
// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyOrderConfirmed(order: Order, user: Profile) {
  // All channels fire independently — one failure doesn't block others
  const results = await Promise.allSettled([
    // 1️⃣ Email
    resend.emails.send({
      from: 'NexPOS <noreply@nexpos.app>',
      to: user.email,
      subject: `ئۆردەری #${order.id.slice(0, 8)} پشتڕاستکرایەوە`,
      html: orderConfirmationTemplate(order),
    }),
    
    // 2️⃣ In-App Notification (database)
    supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      type: 'order_confirmed',
      title: 'ئۆردەرەکەت پشتڕاستکرایەوە',
      body: `ئۆردەری #${order.id.slice(0, 8)} بە سەرکەوتوویی تۆمارکرا`,
      data: { orderId: order.id },
    }),
    
    // 3️⃣ Admin notification
    supabaseAdmin.from('notifications').insert({
      user_id: null, // null = admin notification
      type: 'new_order',
      title: `ئۆردەری نوێ — ${formatIQD(order.total)}`,
      body: `${user.full_name} — ${order.items_count} بەرهەم`,
      data: { orderId: order.id },
    }),
  ])
  
  // Log failures but don't throw (order already confirmed)
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const channels = ['email', 'user-notification', 'admin-notification']
      console.error(`[Notification] ${channels[i]} failed:`, result.reason)
    }
  })
}
```
```typescript
// ✅ Email Template — Order Confirmation (RTL-safe)
function orderConfirmationTemplate(order: Order): string {
  return `
    <div dir="rtl" style="font-family: 'Noto Sans Arabic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1a1a; text-align: center;">ئۆردەرەکەت پشتڕاستکرایەوە ✅</h1>
      
      <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>ژمارەی ئۆردەر:</strong> <span dir="ltr">#${order.id.slice(0, 8)}</span></p>
        <p><strong>کۆی گشتی:</strong> <span dir="ltr">${formatIQD(order.total)}</span></p>
        <p><strong>بار:</strong> ${order.status === 'processing' ? 'لە ئامادەکردندایە' : 'چاوەڕوان'}</p>
      </div>
      
      <table width="100%" cellpadding="8" style="border-collapse: collapse;">
        <tr style="background: #e5e7eb;">
          <th style="text-align: start;">بەرهەم</th>
          <th style="text-align: center;">دانە</th>
          <th style="text-align: end;">نرخ</th>
        </tr>
        ${order.items.map(item => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="text-align: start;">${item.product_name}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: end;" dir="ltr">${formatIQD(item.price * item.quantity)}</td>
          </tr>
        `).join('')}
      </table>
      
      <p style="text-align: center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/orders/${order.id}"
           style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
          بینینی ئۆردەر
        </a>
      </p>
    </div>
  `
}
```

---

