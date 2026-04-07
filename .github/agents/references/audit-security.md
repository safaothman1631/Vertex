### 🔒 §1. پشکنینی ئەمنیەت (Security Audit) — OWASP & Beyond

#### A. SQL Injection & Database Security
- ئایا Supabase query builder بەکارهاتووە (نەک raw SQL بە string interpolation)؟
- ئایا `.rpc()` functions parameterized ـن؟
- ئایا user input هەرگیز بە `${}` ناچێتە ناو query ـەوە؟
```typescript
// ❌ SQL injection risk
const { data } = await supabase.rpc('search', { query: `%' OR 1=1 --` })

// ✅ Supabase query builder (auto-parameterized)
const { data } = await supabase
  .from('products')
  .select('id, name, price')
  .ilike('name', `%${userInput}%`)
```
```bash
# grep: SQL injection vectors
grep -rn "\.rpc(\|\.raw(\|sql\`" src/ --include="*.ts"
grep -rn "\${.*}" src/ --include="*.ts" | grep -i "select\|insert\|update\|delete\|from\|where"
```

#### B. Authentication & Session
- ئایا `getUser()` بەکارهاتووە لە server (نەک `getSession()`)؟
  - `getSession()` JWT token لە cookie دەخوێنێتەوە — unverified ە!
  - `getUser()` verify دەکات لەگەڵ Supabase server — هەمیشە ئەم بەکاربهێنە لە server
- ئایا هەموو protected API routes `auth.getUser()` check ـیان هەیە؟
- ئایا admin routes دووبارە check ـی role ـیان هەیە (middleware + layout)؟
- ئایا session refresh لە middleware هەیە؟
```typescript
// ❌ Server-side — unverified (JWT could be revoked)
const { data: { session } } = await supabase.auth.getSession()
const userId = session?.user.id  // ⚠️ might be invalid!

// ✅ Server-side — verified with Supabase server
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// ✅ Admin double-check pattern
const { data: profile } = await supabase
  .from('profiles').select('role').eq('id', user.id).single()
if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```
```bash
# grep: auth patterns
grep -rn "getSession\b" src/ --include="*.ts"  # ⚠️ should be getUser on server
grep -rn "getUser" src/app/api/ --include="*.ts"  # ✅ verify auth
grep -rn "is_admin\|role.*admin" src/app/api/admin/ --include="*.ts"
# Missing auth check:
for f in $(find src/app/api -name "route.ts"); do grep -qL "getUser\|auth\." "$f" && echo "⚠️ No auth: $f"; done
```

#### C. CSRF / CSP / Security Headers
```
📋 Security Headers Checklist:
□ Content-Security-Policy (script-src 'self' + nonce بۆ Stripe)
□ X-Frame-Options: DENY
□ X-Content-Type-Options: nosniff
□ Strict-Transport-Security (max-age=63072000; includeSubDomains; preload)
□ Referrer-Policy: strict-origin-when-cross-origin
□ Permissions-Policy: camera=(), microphone=(), geolocation=()
□ poweredByHeader: false (next.config)
□ SameSite=Lax/Strict بۆ cookies
```

#### D. Input Validation
- ئایا Zod schema بۆ هەموو API inputs هەیە؟
- ئایا file upload validation هەیە (type + size + magic bytes)؟
- ئایا phone validation بۆ +964 pattern ـە (عێراق)؟
```bash
# grep: validation
grep -rn "z\.\|zod" src/app/api/ --include="*.ts" | wc -l
grep -rn "safeParse\|parse(" src/app/api/ --include="*.ts"
```

#### E. Rate Limiting
- ئایا rate limiting لەسەر: login, register, checkout, contact, forgot-password هەیە؟
- ئایا IP-based sliding window ـە؟
- ئایا 429 Too Many Requests دەگەڕێنێتەوە بە Retry-After header؟
```bash
grep -rn "rateLimiter\|rateLimit\|rate.limit\|checkRate" src/ --include="*.ts"
```

#### F. Secrets & Environment
```
📋 Secrets Checklist:
□ .env.local لە .gitignore
□ .env.example هەیە بۆ devs
□ NEXT_PUBLIC_ تەنها بۆ client-safe values
□ SUPABASE_SERVICE_ROLE_KEY بەبێ NEXT_PUBLIC_
□ STRIPE_SECRET_KEY بەبێ NEXT_PUBLIC_
□ هیچ secret hardcoded لە source code نییە
```
```bash
# grep: exposed secrets
grep -rn "sk_live\|sk_test\|service_role\|secret_key" src/ --include="*.ts" | grep -v "process.env"
grep -rn "NEXT_PUBLIC_.*SERVICE\|NEXT_PUBLIC_.*SECRET" .env*
```

#### G. XSS Prevention
- ئایا `dangerouslySetInnerHTML` بەبێ DOMPurify بەکارهاتووە؟
- ئایا `eval()` یان `new Function()` هەیە؟
- ئایا `innerHTML` بەکارهاتووە؟
```bash
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" 
grep -rn "eval(\|new Function(\|innerHTML\|outerHTML\|document\.write" src/ --include="*.ts" --include="*.tsx"
```

#### H. File Upload Security
```
📋 Upload Checklist:
□ File type validation (allowedTypes whitelist)
□ File size limit (5MB max)
□ Magic bytes check (file header)
□ Unique filename (UUID — no user-controlled filenames)
□ Storage in Supabase Storage (not filesystem)
□ RLS policy on storage buckets
```

#### I. Webhook Security
- ئایا Stripe webhook signature verification هەیە (`constructEvent`)؟
- ئایا raw body بەکارهاتووە (نەک parsed JSON) بۆ signature؟
- ئایا idempotent processing هەیە (`.eq('status', 'pending')`)؟
- ئایا 200 هەمیشە return دەکرێت (even on business logic errors)؟
```typescript
// ✅ Webhook pattern (NexPOS)
export async function POST(request: Request) {
  const body = await request.text()        // 1️⃣ Raw body
  const sig = request.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET) // 2️⃣ Verify
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    // 3️⃣ Idempotent — only process pending orders
    await adminSupabase
      .from('orders')
      .update({ status: 'processing', paid_at: new Date().toISOString() })
      .eq('stripe_session_id', session.id)
      .eq('status', 'pending')  // ← This is idempotency!
    
    // 4️⃣ Multi-channel notifications (one failure doesn't block others)
    await Promise.allSettled([
      sendOrderConfirmation(session.metadata!.orderId),
      createAdminNotification(session.metadata!.orderId),
      decrementStock(session.metadata!.orderId),
    ])
  }
  
  return NextResponse.json({ received: true }) // 5️⃣ Always 200
}
```
```bash
grep -rn "constructEvent\|webhooks\." src/app/api/webhook/ --include="*.ts"
grep -rn "request\.text()" src/app/api/webhook/ --include="*.ts"
```

#### J. Dependencies
```bash
npm audit --audit-level=high
npm outdated
npx depcheck
```

---


### 🌐 §16. پشکنینی ئەدڤانسی ئەمنیەت — بەچاوی هاکەرەوە

```
📋 Advanced Security:
□ Prototype pollution: no Object.assign({}, req.body) / _.merge with user input
□ ReDoS: no complex regex on user input (e.g., (a+)+ catastrophic backtracking)
□ Supply chain: npm audit, lock file committed, no postinstall scripts from untrusted
□ Business logic: price always from DB (never trust client), stock checked server-side
□ Mass assignment: Zod pick/omit — don't pass raw body to DB
□ Open redirect: redirect URLs must start with '/' and not '//'
□ Timing attacks: use timingSafeEqual for secret comparison
□ Account enumeration: generic messages ("If email exists, link sent")
□ Race conditions: database transactions for stock decrement + order creation
□ IDOR: RLS enforces data isolation, always filter by user_id
```
```typescript
// ✅ Rate Limiter Implementation — In-Memory Token Bucket
// src/lib/rate-limit.ts
interface RateLimitEntry {
  tokens: number
  lastRefill: number
}

const store = new Map<string, RateLimitEntry>()

// Auto-cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.lastRefill > 10 * 60 * 1000) store.delete(key)
  }
}, 5 * 60 * 1000)

export async function rateLimit(
  identifier: string,
  action: string,
  options: { limit: number; window: number } = { limit: 10, window: 60 }
): Promise<{ success: boolean; remaining: number }> {
  const key = `${action}:${identifier}`
  const now = Date.now()
  const entry = store.get(key)
  
  if (!entry) {
    store.set(key, { tokens: options.limit - 1, lastRefill: now })
    return { success: true, remaining: options.limit - 1 }
  }
  
  // Refill tokens based on elapsed time
  const elapsed = (now - entry.lastRefill) / 1000
  const refill = Math.floor(elapsed / options.window * options.limit)
  entry.tokens = Math.min(options.limit, entry.tokens + refill)
  entry.lastRefill = now
  
  if (entry.tokens <= 0) {
    return { success: false, remaining: 0 }
  }
  
  entry.tokens--
  return { success: true, remaining: entry.tokens }
}

// ✅ Usage in API route:
const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
const { success } = await rateLimit(ip, 'checkout', { limit: 5, window: 60 })
if (!success) return tooMany()
```
```typescript
// ✅ Mass Assignment Prevention — Zod pick/omit
import { z } from 'zod'

const ProductSchema = z.object({
  name: z.string().min(2).max(200),
  name_ku: z.string().max(200).optional(),
  price: z.number().min(0),
  stock: z.number().int().min(0),
  category_id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional(),
  description: z.string().max(5000).optional(),
  is_hidden: z.boolean().optional(),
})

// ❌ NEVER do this — user can set ANY field (role, id, etc):
await supabase.from('products').insert(request.body)

// ✅ Zod strips unknown fields — only expected fields pass through:
const parsed = ProductSchema.safeParse(await request.json())
if (!parsed.success) return badRequest(parsed.error.issues[0].message)
await supabase.from('products').insert(parsed.data)
// ✅ Even if body contained { role: 'admin', ... }, Zod strips it
```
```typescript
// ✅ Timing-Safe Comparison  — src/lib/safe-compare.ts
import { timingSafeEqual } from 'crypto'

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
// ❌ if (token === secret)   → timing attack leaks length
// ✅ if (safeCompare(token, secret)) → constant-time comparison
```
```bash
grep -rn "Object\.assign(\|\.\.\.body\|deepMerge\|_.merge" src/ --include="*.ts"
grep -rn "=== .*secret\|=== .*token" src/ --include="*.ts" | grep -v "timingSafeEqual"
grep -rn "redirect(\|router\.push(\|window\.location" src/ | grep -v "^/\|'/\|\"/"
```

---


### 🛡️ §33. پشکنینی Content Security & XSS Prevention

```
📋 CSP Checklist:
□ CSP header with nonce for inline scripts
□ script-src: 'self' 'nonce-xxx' https://js.stripe.com
□ style-src: 'self' 'unsafe-inline' (Tailwind needs this)
□ img-src: 'self' data: blob: https://*.supabase.co
□ connect-src: 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com
□ frame-src: https://js.stripe.com
□ No 'unsafe-eval' (breaks eval protection)

□ DOMPurify for any user HTML (product descriptions, reviews)
□ Input sanitization pipeline: trim → validate → escape → store
□ Output encoding: React auto-escapes JSX (but not dangerouslySetInnerHTML)
```
```typescript
// ✅ Security Headers in next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",  // Tailwind
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

// In next.config.ts:
const nextConfig: NextConfig = {
  poweredByHeader: false,  // ✅ Don't reveal Next.js
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```
```bash
grep -rn "unsafe-eval\|unsafe-inline" src/ --include="*.ts" | grep "script-src"
# Check for XSS sinks
grep -rn "dangerouslySetInnerHTML\|innerHTML\|\.html(\|eval(\|document\.write" src/ --include="*.tsx" --include="*.ts"
```

---


### 🍪 §34. پشکنینی Cookie & Session Management

```
📋 Cookie/Session Checklist:
□ Supabase SSR cookie handling (@supabase/ssr)
□ Cookie attributes: httpOnly, secure, sameSite=Lax, path=/
□ getUser() on server (not getSession) — verified with Supabase server
□ Session refresh in middleware (updateSession)
□ Token rotation on auth events
□ Cookie consent before non-essential cookies
□ JWT short-lived (access token) + refresh token pattern
□ Logout clears all cookies
```

---


### 🔐 §38. پشکنینی Auth Deep Dive — Supabase Authentication

```
📋 Auth Audit:
□ Registration: email + password, minimum strength, email confirmation
□ Login: rate-limited, generic error ("Invalid credentials"), redirect to previous page
□ Password reset: rate-limited, token expiry, one-time use, generic response
□ Account enumeration prevented (same response for existing/non-existing email)
□ Profile auto-created via database trigger on auth.users insert
□ Session refresh in middleware (Supabase SSR updateSession)
□ Protected route matrix:
  /cart, /checkout, /orders, /settings, /wishlist → auth required
  /admin/* → auth + admin role required
  /products, /, /contact → public
□ getUser() on server / getSession() on client (OK because client already has the JWT)
□ Logout clears session + redirects
```

```sql
-- ✅ Auto-create profile on user signup (database trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'  -- Default role — NEVER 'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

```typescript
// ✅ Protected Route Pattern — Server Component
// src/app/(store)/orders/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login?redirect=/orders')
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name, images))')
    .order('created_at', { ascending: false })
  // ✅ RLS automatically filters: only this user's orders returned
  
  return <OrdersList orders={orders ?? []} />
}
```

```typescript
// ✅ Login with Rate Limiting + Generic Errors
// src/app/api/account/login/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await rateLimit(ip, 'login', { limit: 5, window: 60 })
  if (!success) {
    return Response.json(
      { error: 'داواکاری زۆر — تکایە چاوەڕوان بە' },
      { status: 429 }
    )
  }
  
  const { email, password } = await request.json()
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) {
    // ✅ GENERIC error — doesn't reveal if email exists
    return Response.json(
      { error: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە' },
      { status: 401 }
    )
  }
  
  return Response.json({ success: true })
}
```

---


### 💳 §49. پشکنینی Stripe & Payment Security — PCI

```
📋 PCI SAQ-A:
□ Card data NEVER on server — Stripe Elements (iframe)
□ NEVER custom <input> for card number
□ HTTPS/TLS for all transactions (Vercel default ✅)
□ No logging of card data
□ Stripe Dashboard access limited
□ API keys rotated periodically

📋 Implementation:
□ checkout.sessions.create with server-side prices
□ unit_amount: Math.round(price * 100) — cents
□ metadata: { orderId, userId }
□ expires_at: 30 minutes max
□ success_url + cancel_url validated (no open redirect)
□ payment_intent_data.capture_method: 'automatic'
□ statement_descriptor set
□ Refund processing route
```

---

