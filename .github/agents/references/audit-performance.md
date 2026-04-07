### ⚡ §2. پشکنینی ئەدا (Performance Audit)

#### A. Core Web Vitals Targets
```
| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | Lighthouse |
| INP | < 200ms | Chrome UX Report |
| CLS | < 0.1 | Lighthouse |
| TTFB | < 800ms | WebPageTest |
| First Load JS | < 100kB | Bundle Analyzer |
```

#### B. Rendering Strategy
```
📋 Rendering Checklist:
□ Server Components بۆ static content و data fetching
□ Client Components ('use client') تەنها بۆ interactivity
□ 'use client' بە lowest possible level (leaf components)
□ Streaming/Suspense بۆ progressive loading
□ loading.tsx بۆ هەموو route segments
□ React Compiler enabled (auto-memoization)
```
```bash
# grep: rendering analysis
grep -rn "'use client'" src/ --include="*.tsx" | wc -l  # count client components
grep -rn "useState\|useEffect\|onClick" src/ --include="*.tsx" | wc -l  # hooks/interactions
# Components with 'use client' but no hooks — probably unnecessary:
for f in $(grep -rln "'use client'" src/ --include="*.tsx"); do
  grep -qL "useState\|useEffect\|useRef\|useCallback\|onClick\|onChange\|onSubmit" "$f" && echo "⚠️ Unnecessary 'use client': $f"
done
```

#### C. Image Optimization
- ئایا `next/image` بەکارهاتووە (نەک `<img>`)؟
- ئایا `width` + `height` یان `fill` دانراوە؟
- ئایا `priority` بۆ LCP images هەیە؟
- ئایا formats: ['image/avif', 'image/webp'] لە next.config هەیە؟
```bash
grep -rn "<img " src/ --include="*.tsx"  # ❌ should be next/image
grep -rn "Image.*src=" src/ --include="*.tsx" | grep -v "width\|height\|fill"  # missing dimensions
grep -rn "priority" src/ --include="*.tsx"  # LCP images
```

#### D. Bundle & Code Splitting
```
📋 Bundle Checklist:
□ Route-based code splitting (automatic in Next.js)
□ Heavy components dynamic import: dynamic(() => import(...))
□ No lodash (use lodash-es or native)
□ No moment.js (use date-fns or dayjs)
□ Tree-shaking works (ESM imports)
□ Bundle budget < 500kB total client JS
```
```bash
grep -rn "import .* from 'lodash'" src/ --include="*.ts" --include="*.tsx"
grep -rn "import .* from 'moment'" src/ --include="*.ts" --include="*.tsx"
grep -rn "import.*Chart\|import.*Editor\|import.*Map" src/ --include="*.tsx" | grep -v "dynamic\|lazy"
# Run: ANALYZE=true npm run build
```

#### E. Database Performance
- ئایا JOINs بە `.select('*, brands(*)')` هەیە (نەک N+1)؟
- ئایا pagination هەیە (`.range()`)؟
- ئایا `Promise.all()` بۆ parallel queries بەکارهاتووە؟
- ئایا index لەسەر frequently-queried columns هەیە؟
```bash
# N+1 detection
grep -rn "\.from(" src/app/ --include="*.ts" --include="*.tsx" | grep "for\|\.map\|\.forEach"
# Missing parallel fetching
grep -rn "await.*supabase" src/app/ -A2 --include="*.tsx" | grep -B1 "await.*supabase" | head -20
```

#### F. Font & CSS
```
□ Fonts preloaded + font-display: swap
□ Tailwind JIT (CSS purging)
□ No unused CSS
□ GPU animations only (transform, opacity)
□ content-visibility: auto بۆ off-screen content
```

---


### 📦 §35. پشکنینی Build & Bundle Optimization

```
📋 Build Checklist:
□ npm run build succeeds without errors
□ npx tsc --noEmit — no type errors
□ Bundle size within budget (First Load < 100kB, Total < 500kB)
□ Code splitting: dynamic imports for heavy components
□ Tree-shaking: ESM imports, no side effects
□ Optimized package imports in next.config (lucide-react, supabase-js)
□ No duplicate packages: npm ls --all | grep -i "deduped"
□ Source maps: upload to Sentry, don't serve to public
```
```typescript
// ✅ Dynamic Import for Heavy Components
import dynamic from 'next/dynamic'

// Chart library — only loaded on Admin Dashboard
const SalesChart = dynamic(() => import('./SalesChart'), {
  loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
  ssr: false,  // Chart uses window — client-only
})

// Map component — only loaded when needed
const MapPicker = dynamic(() => import('./MapPicker'), {
  loading: () => <div className="h-96 animate-pulse bg-muted rounded" />,
  ssr: false,
})

// Rich text editor — heavy dependency, load on demand
const RichEditor = dynamic(() => import('./RichEditor'), {
  loading: () => <textarea className="w-full h-48 border rounded p-2" />,
  ssr: false,
})
```
```typescript
// ✅ next.config.ts — Complete NexPOS Configuration
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,     // ✅ Security: hide X-Powered-By
  reactStrictMode: true,       // ✅ Catch bugs early
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features
  experimental: {
    reactCompiler: true,       // ✅ Auto-memoization (React 19)
    optimizePackageImports: [  // ✅ Tree-shake these packages
      'lucide-react',
      '@supabase/supabase-js',
      'date-fns',
    ],
  },
  
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  
  async redirects() {
    return [
      { source: '/shop', destination: '/products', permanent: true },
      { source: '/shop/:slug', destination: '/products/:slug', permanent: true },
    ]
  },
}

export default nextConfig
```
```bash
ANALYZE=true npm run build  # bundle analyzer
npm ls --all 2>/dev/null | grep -c "deduped"  # package dedup
# Find CommonJS imports (bad for tree-shaking)
grep -rn "require(" src/ --include="*.ts" --include="*.tsx"
# Unused exports
npx ts-prune src/ | head -20
```

---


### ⚡ §52. پشکنینی Performance Profiling

```
📋 Performance Profiling:
□ React Profiler: detect components > 16ms render
□ Lighthouse CI: automated on PRs
□ Bundle analyzer: ANALYZE=true npm run build
□ Memory profiling: 3-snapshot comparison (Chrome DevTools)
□ Web Vitals monitoring (Vercel Speed Insights)

📊 Bundle Budget:
| Chunk | Max (gzip) |
|-------|-----------|
| First Load JS | 100kB |
| layout.js | 50kB |
| page.js (home) | 30kB |
| Total client JS | 500kB |
| CSS | 50kB |

📊 React Performance Red Flags:
❌ New object/array in render: style={{ color: 'red' }}
❌ Anonymous functions: onClick={() => handle(id)}
❌ Context value changes every render
❌ Missing key in lists
✅ React Compiler auto-memoizes (NexPOS has it enabled)
✅ useMemo/useCallback where Compiler doesn't help
```

---

## 🔍 OWASP Top 10 — NexPOS Mapping

### A01: Broken Access Control
```
🔍 Files: src/app/api/admin/, supabase/schema.sql (RLS)
□ All API routes have auth check
□ Admin routes have role check
□ RLS enabled + no USING(true) on sensitive tables
□ No IDOR (user can only access own data)
□ getUser() not getSession() server-side
□ File access controlled (Storage policies)
□ Self-admin-escalation prevented
```
```bash
for f in $(find src/app/api -name "route.ts"); do grep -qL "getUser\|auth\." "$f" && echo "⚠️ No auth: $f"; done
```

### A02: Cryptographic Failures
```
□ All secrets in .env (not hardcoded)
□ .env in .gitignore
□ HTTPS only (HSTS)
□ httpOnly, secure cookies
□ No MD5/SHA1 for security
□ timingSafeEqual for token comparison
□ No PII in logs
□ Service role key never NEXT_PUBLIC_
```

### A03: Injection
```
□ Supabase query builder (parameterized)
□ No raw SQL with string interpolation
□ dangerouslySetInnerHTML only with DOMPurify
□ No eval/innerHTML/document.write
□ URL redirects validated (internal only)
□ Zod for all API inputs
□ Search input sanitized
```

### A04: Insecure Design
```
□ Price from DB (never client)
□ Stock check + decrement in transaction
□ Coupon validated server-side
□ Account enumeration prevented
□ Checkout steps can't be skipped
```

### A05: Security Misconfiguration
```
□ poweredByHeader: false
□ Security headers in middleware
□ CORS: specific origins (not *)
□ Error pages don't show stack traces
□ Debug mode off in production
□ Default credentials changed
```
```bash
grep -rn "Access-Control-Allow-Origin.*\*" src/ --include="*.ts"
```

### A06: Vulnerable Components
```bash
npm audit --audit-level=high
npm outdated
npx depcheck
npx license-checker --failOn "GPL-3.0"
```

### A07: Auth Failures
```
□ Password minimum requirements
□ Rate limiting: login, register, reset
□ Secure session storage (httpOnly cookies)
□ getUser() on server
□ MFA available (Supabase TOTP)
```

### A08: Data Integrity
```
□ Webhook signature verification
□ CI/CD pipeline secured
□ lock file committed (npm ci in CI)
□ Database migrations versioned + reviewed
□ Soft delete (trash) prevents data loss
```

### A09: Logging Failures
```
□ Failed logins logged
□ Admin actions logged
□ Payment events logged
□ Error tracking (Sentry)
□ No PII in logs
□ Alerting for critical errors
```

### A10: SSRF
```
□ User-provided URLs validated
□ No fetching localhost/internal IPs
□ URL scheme restricted (https only)
□ Allowed domain whitelist for external fetches
```

---

## 🔍 Master Grep Patterns

### Security
```bash
# Auth gaps
for f in $(find src/app/api -name "route.ts"); do grep -qL "getUser\|auth\." "$f" && echo "⚠️ No auth: $f"; done
# Admin gaps
grep -rn "is_admin\|role.*admin" src/app/api/admin/ --include="*.ts"
# Exposed secrets
grep -rn "sk_live\|sk_test\|service_role\|secret_key\|password" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env\|\.env"
# SQL injection
grep -rn "\${.*}" src/ --include="*.ts" | grep -i "select\|insert\|update\|delete\|from\|where"
# XSS
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function(" src/ --include="*.ts" --include="*.tsx"
# Open redirect
grep -rn "redirect(\|window\.location" src/ | grep -v "'/\|\"/"
# Timing attacks
grep -rn "=== .*secret\|=== .*token" src/ --include="*.ts" | grep -v "timingSafeEqual"
# Prototype pollution
grep -rn "Object\.assign(\|\.\.\.body\|deepMerge" src/ --include="*.ts"
```

### Performance
```bash
# <img> instead of next/image
grep -rn "<img " src/ --include="*.tsx"
# Heavy imports
grep -rn "import .* from 'lodash'" src/ --include="*.ts" --include="*.tsx"
grep -rn "import .* from 'moment'" src/ --include="*.ts" --include="*.tsx"
# Missing dynamic imports
grep -rn "import.*Chart\|import.*Editor\|import.*Map" src/ --include="*.tsx" | grep -v "dynamic\|lazy"
# N+1 queries
grep -rn "\.from(" src/app/ --include="*.ts" --include="*.tsx" | grep "for\|\.map\|\.forEach"
# console.log leftovers
grep -rn "console\.log\|console\.debug" src/ --include="*.ts" --include="*.tsx" | grep -v "error\|warn" | wc -l
```

### Accessibility
```bash
# Missing alt
grep -rn "<img\|<Image" src/ --include="*.tsx" | grep -v "alt="
# Missing labels
grep -rn "<input\|<select\|<textarea" src/ --include="*.tsx" | grep -v "aria-label\|id="
# Click without keyboard
grep -rn "onClick" src/ --include="*.tsx" | grep "div\|span" | grep -v "role=\|tabIndex\|onKeyDown"
# Focus suppressed
grep -rn "outline-none" src/ --include="*.tsx" | grep -v "focus-visible\|focus:"
```

### RTL & i18n
```bash
# RTL-breaking properties
grep -rn "ml-\|mr-\|pl-\|pr-" src/ --include="*.tsx" | grep -v "ms-\|me-\|ps-\|pe-\|mx-\|my-\|px-\|py-"
grep -rn "text-left\|text-right" src/ --include="*.tsx" | grep -v "text-start\|text-end"
grep -rn "left-\|right-" src/ --include="*.tsx" | grep -v "start-\|end-\|inset-"
grep -rn "rounded-l\|rounded-r\|border-l-\|border-r-" src/ --include="*.tsx"
# Hardcoded strings
grep -rn "'Add to\|'Remove\|'Cart\|'Login\|'Search\|'Submit" src/components/ --include="*.tsx"
# Missing dir="ltr" on numbers
grep -rn "type=\"tel\"\|type=\"number\"" src/ --include="*.tsx" | grep -v "dir="
```

### Code Quality
```bash
grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "@ts-ignore\|@ts-nocheck" src/ --include="*.ts" --include="*.tsx"
grep -rn "TODO\|FIXME\|HACK" src/ --include="*.ts" --include="*.tsx"
grep -rn "catch.*{}" src/ --include="*.ts" --include="*.tsx"  # empty catch
wc -l src/**/*.tsx src/**/*.ts 2>/dev/null | sort -rn | head -10
```

### SEO
```bash
for f in $(find src/app -name "page.tsx"); do grep -qL "metadata\|generateMetadata" "$f" && echo "⚠️ No metadata: $f"; done
find src/app -name "sitemap.ts" -o -name "robots.ts"
grep -rn "<div.*onClick\|<span.*onClick" src/ --include="*.tsx" | grep -v "role=\|button"
```

---

## 📊 Decision Trees

### Component Type
```
ئایا data لە database پێویستە?
  ├── بەڵێ → ئایا user interaction هەیە?
  │     ├── بەڵێ → Server Component + Client Island (composition)
  │     └── نەخێر → Server Component ✅
  └── نەخێر → ئایا state management هەیە?
        ├── بەڵێ → Client Component ('use client')
        └── نەخێر → Server Component ✅ (static UI)
```

### State Location
```
ئایا server data ـە (database)?
  ├── بەڵێ → ئایا real-time?
  │     ├── بەڵێ → Supabase Realtime (useEffect + channel)
  │     └── نەخێر → Server Component query
  └── نەخێر (UI state) → ئایا persist دەکرێت?
        ├── بەڵێ → Zustand + persist (localStorage)
        └── نەخێر → React useState/useReducer
```

### Caching
```
ئەم content ـە...
  ├── Static → revalidate: false (build once)
  ├── Mostly-static → revalidate: 60-3600 (ISR)
  ├── User-specific → dynamic: 'force-dynamic'
  └── API response → Cache-Control headers
```

### Error Handling
```
هەڵەکە لە کوێیە?
  ├── API Route → JSON { error: { code, message, status } }
  ├── Component → error.tsx boundary → friendly error page
  ├── Network → try/catch + retry + toast message
  └── Form → inline per-field messages + summary
```

### Authentication Flow
```
کابینەت/لاپەڕە لە چ شوێنێک؟
  ├── /admin/* → ئایا user لۆگین کردووە?
  │     ├── نەخێر → redirect('/login')
  │     └── بەڵێ → ئایا role='admin'?
  │           ├── نەخێر → redirect('/')
  │           └── بەڵێ → دەستگەیشتن ✅
  ├── /orders, /cart, /checkout, /settings, /wishlist
  │     ├── نەخێر → redirect('/login?redirect=/orders')
  │     └── بەڵێ → دەستگەیشتن ✅ (RLS filters own data)
  └── /products, /, /contact → Public ✅
```

### Supabase Client Selection
```
لە کوێ call دەکرێت?
  ├── Server Component → createServerClient (cookies, anon key, RLS ✅)
  ├── Client Component → createBrowserClient (anon key, RLS ✅)
  ├── Server Action → createServerClient (cookies, anon key, RLS ✅)
  ├── API Route → createServerClient (cookies, anon key, RLS ✅)
  ├── Webhook → createClient (SERVICE_ROLE, bypass RLS ⚠️)
  └── Cron Job → createClient (SERVICE_ROLE, bypass RLS ⚠️)
```

### Image Loading Strategy
```
ئەم وێنەیە لە کوێیە لە page ـدا?
  ├── Above the fold (LCP image) → priority={true} + sizes
  ├── Below the fold → default lazy loading ✅
  ├── Product thumbnail grid → placeholder="blur" + sizes="(max-width: 768px) 50vw, 25vw"
  ├── User avatar → small + round → sizes="40px"
  └── Background/decorative → CSS background-image (no SEO value)
```

### Data Fetching Pattern
```
کەی دەبێت data بهێنیت?
  ├── Page load (SEO important) → Server Component + await
  ├── Page load (non-critical) → Server Component + Suspense streaming
  ├── User action (click, scroll) → Client Component + fetch/server action
  ├── Real-time updates → Supabase Realtime channel
  ├── Periodic refresh → Page-level revalidate
  └── On-demand refresh → revalidatePath/revalidateTag after mutation
```

---

## 📋 Reference Tables

### HTTP Status Codes (NexPOS)
```
200 OK           — Success (product list, order details)
201 Created      — New resource (order, product)
400 Bad Request  — Zod validation failed
401 Unauthorized — Not logged in
403 Forbidden    — Not admin
404 Not Found    — Resource missing
409 Conflict     — Duplicate (email exists)
422 Unprocessable — Business logic fail (no stock)
429 Too Many     — Rate limited
500 Server Error — Internal error
```

### Environment Variables
```
| Variable | Required | Scope | Notes |
|----------|----------|-------|-------|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | Both | |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | Both | |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | Server | ⚠️ Never NEXT_PUBLIC_ |
| STRIPE_SECRET_KEY | ✅ | Server | ⚠️ Never NEXT_PUBLIC_ |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | ✅ | Client | |
| STRIPE_WEBHOOK_SECRET | ✅ | Server | |
| RESEND_API_KEY | ❌ | Server | Optional |
| NEXT_PUBLIC_SITE_URL | ✅ | Both | |
```

### File Priority for Audit
```
Priority 1 — Security Critical:
├── middleware.ts
├── src/app/api/checkout/route.ts
├── src/app/api/webhook/route.ts
├── src/lib/supabase-server.ts
├── src/lib/rate-limit.ts
├── src/lib/env.ts
└── supabase/schema.sql

Priority 2 — Business Logic:
├── src/app/(store)/page.tsx
├── src/app/(store)/products/
├── src/app/(store)/cart/
├── src/app/(store)/checkout/
├── src/app/admin/
├── src/store/cart.ts
└── src/lib/email.ts

Priority 3 — UX & Performance:
├── src/app/layout.tsx
├── src/app/globals.css
├── src/contexts/locale.tsx
├── src/contexts/preferences.tsx
├── src/components/shop/
├── next.config.ts
└── package.json
```

### Database Schema Quick Reference
```
┌──────────────┐     ┌──────────────┐
│ profiles     │     │ products     │
│ id (FK→auth) │     │ id, name     │
│ full_name    │     │ slug, price  │
│ phone, role  │     │ images[]     │
│ avatar_url   │     │ stock        │
└──────┬───────┘     │ category_id  │
       │              │ brand_id     │
  ┌────┴────┐        │ is_hidden    │
  │         │        └──────┬───────┘
  ▼         ▼              │
orders    wishlist    ┌────┴────┐
  │                   ▼         ▼
  ▼               brands   categories
order_items
                    reviews    coupons
cart_items          notifications
contact_messages    user_addresses
inventory_log       trash (30-day purge)
```

---

## 🏆 Scoring System — سیستەمی نمرەدان

### Per-Section (0-10)
```
10 ⭐ نایاب      — هیچ کێشەیەک نییە + advanced best practices
 9 ✨ ئێکسپێرت   — ١-٢ کێشەی بچووک
 8 🟢 زۆرباش     — باشە بەڵام جوانتر دەبێت
 7 🟡 باش        — چەند کێشەی مامناوەند
 6 🟠 ئاسایی     — کێشەی بەرچاو بەڵام کار دەکات
 5 🔴 لاواز       — کێشەی زۆر — پێویست بە کار
 4 ⚠️ ناتەواو     — بنەڕەتیەکان فقدان
 3 ❌ خراپ        — مەترسی ئەمنی/عملکردی
 2 🚨 مەترسیدار   — security risk
 1 💀 فاجیعە      — production-ready نییە
 0 ☠️ نییە        — بەتەواوی بوونی نییە
```

### Category Weights
```
| Category | Weight | Sections |
|----------|--------|----------|
| Security | 20% | §1,16,33,34,49 |
| Performance | 15% | §2,30,35,52 |
| Architecture | 15% | §7,13,20,38-46 |
| Accessibility | 10% | §4,36,37 |
| SEO | 10% | §3 |
| Code Quality | 10% | §5,14,32 |
| UX/UI | 10% | §6,17,28,47,50 |
| DevOps | 5% | §9,10,19,48 |
| Data & Privacy | 5% | §9,11,34 |
```

### Overall Score: /520 (52 sections × 10)
```
468-520 (90%+)  ⭐⭐⭐⭐⭐ — ئێکسپێرت — production ready
416-467 (80%+)  ⭐⭐⭐⭐  — زۆرباش — چەند باشکاری بچووک
364-415 (70%+)  ⭐⭐⭐   — باش — پێویست بە باشکاری
312-363 (60%+)  ⭐⭐    — ئاسایی — کاری زۆر پێویستە
260-311 (50%+)  ⭐      — لاواز
<260    (<50%)  ❌      — دووبارە بنیاد بنرێتەوە
```

---

## 📋 Audit Methodology — ڕەوشی پشکنین

### Checkout Audit Workflow
```
Step 1: Cart → Checkout
├── بخوێنە: src/app/(store)/checkout/page.tsx
├── ئایا auth check هەیە؟ cart items validated؟

Step 2: API — /api/checkout
├── بخوێنە: src/app/api/checkout/route.ts
├── Rate limiting → Auth → Zod → Server-side price → Stock → Stripe → Order

Step 3: Webhook — /api/webhook
├── بخوێنە: src/app/api/webhook/route.ts
├── Signature verify → Raw body → Idempotent → SERVICE_ROLE → Notifications

Step 4: Post-Payment
├── Order status → Inventory decrement → Email → In-app notification → Admin notify
```

### Admin Audit Workflow
```
Step 1: Access Control
├── بخوێنە: src/app/admin/layout.tsx (auth + role check)
├── بخوێنە: middleware.ts (/admin/* protection)

Step 2: API Routes
├── src/app/api/admin/*/route.ts — each has admin check?

Step 3: Dangerous Operations
├── Delete → trash (soft delete)? Bulk ops → confirm dialog? Audit logging?
```

### Auth Audit Workflow
```
Step 1: Register — email validation, password strength, rate limit, email confirm
Step 2: Login — rate limit, generic error, redirect, remember me
Step 3: Reset — rate limit, token expiry, one-time, generic response
Step 4: Protected Routes — auth redirect, admin double-gate, getUser on server
```

### RTL Audit Workflow
```
Step 1: Document — <html lang dir>, font, base size
Step 2: CSS — grep for physical properties (ml-, text-left, left-, etc.)
Step 3: Visual — header flip, sidebar, icons, numbers LTR, breadcrumbs
Step 4: Content — translations complete, no hardcoded strings, Kurdish digits
```

---

## 🔬 Security Scenarios — سیناریۆکانی ئەمنیەت

### Scenario 1: Race Condition — Stock Management
```
📝 Attack: ٢ بەکارهێنەر لە هەمان کاتدا دانەی کۆتایی دەکڕن → oversold
🔍 Check: ئایا database transaction بۆ stock check + decrement هەیە؟
📂 File: src/app/api/checkout/route.ts, supabase/schema.sql
```
```sql
-- ✅ Fix: PostgreSQL function with FOR UPDATE lock
CREATE OR REPLACE FUNCTION checkout_items(p_items jsonb, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product record;
BEGIN
  -- Create order
  INSERT INTO orders (user_id, status) VALUES (p_user_id, 'pending')
  RETURNING id INTO v_order_id;
  
  -- Lock and verify each product
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products 
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;  -- ← Row-level lock prevents race condition
    
    IF v_product.stock < (v_item->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_product.name;
    END IF;
    
    -- Decrement stock atomically
    UPDATE products SET stock = stock - (v_item->>'quantity')::int
    WHERE id = v_product.id;
    
    -- Add order item
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (v_order_id, v_product.id, (v_item->>'quantity')::int, v_product.price);
  END LOOP;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
```

### Scenario 2: XSS in Product Description
```
📝 Attack: admin injects <script>steal(cookies)</script> in description
🔍 Check: dangerouslySetInnerHTML without DOMPurify
📂 Grep: grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx"
```
```typescript
// ❌ XSS vulnerable
<div dangerouslySetInnerHTML={{ __html: product.description }} />

// ✅ Fix: sanitize with DOMPurify
import DOMPurify from 'isomorphic-dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }} />
```

### Scenario 3: IDOR in Orders
```
📝 Attack: user changes order ID → /orders/OTHER_USER_ORDER_ID → sees other's order
🔍 Check: API route fetches order without user_id filter
📂 File: src/app/api/orders/[id]/route.ts
```
```typescript
// ❌ IDOR — no user_id check
const { data: order } = await supabase
  .from('orders').select('*').eq('id', params.id).single()
// ⚠️ Any user can see any order by changing the ID!

// ✅ Fix: RLS automatically filters + explicit check
const supabase = await createClient() // Server client with user's session
const { data: order } = await supabase
  .from('orders').select('*').eq('id', params.id).single()
// RLS policy: USING (auth.uid() = user_id) — automatically filters!
// If user doesn't own the order → data = null
```

### Scenario 4: Cart Price Tampering
```
📝 Attack: client modifies price in localStorage cart → sends price: $0.01
🔍 Check: API receives price from client → trusts it
📂 File: src/app/api/checkout/route.ts
```
```typescript
// ❌ CRITICAL: trusting client price
const { items } = await request.json()
// items = [{ productId: '...', price: 0.01, quantity: 10 }]
const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
// Total = $0.10 for $250 worth of products!

// ✅ Fix: API receives ONLY IDs + quantities
const { items } = await request.json()
// items = [{ id: '...', quantity: 10 }] — NO PRICE!
const { data: products } = await supabase
  .from('products').select('id, price, stock').in('id', items.map(i => i.id))
const total = items.reduce((sum, item) => {
  const product = products!.find(p => p.id === item.id)!
  return sum + product.price * item.quantity  // ✅ Database price
}, 0)
```

### Scenario 5: Webhook Replay Attack
```
📝 Attack: replays successful Stripe webhook → double-delivers order
🔍 Check: no idempotency check in webhook handler
📂 File: src/app/api/webhook/route.ts
```
```typescript
// ❌ No replay protection — processes every time
await supabase.from('orders')
  .update({ status: 'paid' })
  .eq('stripe_session_id', session.id)
// ⚠️ Will send confirmation email AGAIN on replay!

// ✅ Fix: idempotent — only process pending
const { data: order } = await supabase
  .from('orders')
  .update({ status: 'processing', paid_at: new Date().toISOString() })
  .eq('stripe_session_id', session.id)
  .eq('status', 'pending')  // ← Idempotency! Already-processed orders = no match
  .select().single()

if (order) {
  // Only send notifications if order was actually updated (first time)
  await Promise.allSettled([sendConfirmation(order), notifyAdmin(order)])
}
```

### Scenario 6: Open Redirect
```
📝 Attack: /login?redirect=https://evil.com → after login, redirects to attacker site
🔍 Grep: grep -rn "redirect(\|router\.push(" src/ | grep "searchParams\|query\|redirect"
```
```typescript
// ❌ Open redirect
const returnUrl = searchParams.get('redirect')
redirect(returnUrl!)  // 🚨 Could redirect to evil.com

// ✅ Fix: validate URL is internal
const returnUrl = searchParams.get('redirect') || '/'
const safeUrl = returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/'
redirect(safeUrl)
```

### Scenario 7: Account Enumeration
```
📝 Attack: try registering with email → "Email already exists" reveals user accounts
🔍 Check: registration/reset responses differ for existing vs new emails
```
```typescript
// ❌ Enumeration: different responses reveal existence
if (existingUser) return { error: 'Email already registered' }
if (!existingUser) return { error: 'Email not found' }

// ✅ Fix: generic response regardless
return { message: 'ئەگەر ئەکاونتێکت هەبێت، لینکێکت بۆ دەنێردرێت' }
// Same message whether email exists or not
```

---

## 🎯 Anti-Patterns Quick Reference

### React
```
❌ Whole page 'use client' → islands pattern
❌ useEffect for data fetch → Server Component
❌ useState for derived value → calculate in render
❌ Missing useEffect cleanup → memory leak
❌ Index as key → stable ID
❌ Data fetch in layout → Suspense
```
```typescript
// ❌ useState for derived value
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(`${firstName} ${lastName}`)  // ⚠️ Unnecessary state + render
}, [firstName, lastName])

// ✅ Calculate during render
const fullName = `${firstName} ${lastName}` // ← Zero overhead
```

### Next.js
```
❌ redirect() in client → router.push()
❌ Server import in client → separate modules
❌ Missing loading.tsx → skeleton component
❌ Missing generateStaticParams → SSG for known pages
❌ Hardcoded metadata → generateMetadata
```
```typescript
// ❌ generateStaticParams missing → all product pages rendered on demand
// src/app/(store)/products/[slug]/page.tsx

// ✅ SSG: pre-render known products at build time
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products').select('slug').eq('is_hidden', false)
  return data?.map(({ slug }) => ({ slug })) ?? []
}
```

### Supabase
```
❌ NEXT_PUBLIC_SERVICE_ROLE_KEY → server-only
❌ getSession() on server → getUser()
❌ New client every render → singleton
❌ Service role when anon suffices → use anon + RLS
❌ Ignoring error → always check { data, error }
❌ Channel without cleanup → return () => removeChannel
```
```typescript
// ❌ Realtime without cleanup → memory leak
useEffect(() => {
  const channel = supabase.channel('orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleChange)
    .subscribe()
  // ⚠️ Channel leaks on unmount!
}, [])

// ✅ Fix: return cleanup function
useEffect(() => {
  const channel = supabase.channel('orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }  // ← Cleanup!
}, [])
```

### Tailwind/CSS
```
❌ ml-/mr-/pl-/pr- → ms-/me-/ps-/pe- (RTL)
❌ text-left/right → text-start/end
❌ left-/right- → start-/end-
❌ String concat classes → cn() utility
❌ !important → fix specificity
❌ Hardcoded hex → theme variables
❌ Desktop-first → mobile-first (min-width)
```
```typescript
// ❌ String concatenation for conditional classes
<div className={`p-4 ${isActive ? 'bg-blue-500' : ''} ${isRTL ? 'text-right' : 'text-left'}`}>
// ⚠️ Extra spaces, hard to read, RTL-broken

// ✅ cn() utility + logical properties
import { cn } from '@/lib/utils'
<div className={cn('p-4', isActive && 'bg-blue-500', 'text-start')}>
// ✅ Clean, no extra spaces, RTL-safe
```

### Security
```
❌ Client prices in checkout → DB prices only
❌ Open redirect → validate starts with '/'
❌ PII in logs → redact
❌ Unverified webhook → constructEvent
❌ Same error for existing/new email → generic messages
```

---

## 📋 Quick Commands

```bash
# Development
npm run dev                    # Dev server (Turbopack)
npm run build                  # Production build
npm run lint                   # ESLint
npx tsc --noEmit               # Type check

# Supabase
npx supabase start             # Local Supabase
npx supabase db push           # Push migrations
npx supabase gen types typescript --local > src/types/database.ts

# Analysis
ANALYZE=true npm run build     # Bundle analyzer
npx depcheck                   # Unused dependencies
npx madge --circular src/      # Circular dependencies
npm audit                      # Security vulnerabilities
npm outdated                   # Outdated packages

# File Stats
find src/ -name "*.tsx" -o -name "*.ts" | wc -l
wc -l src/**/*.tsx src/**/*.ts 2>/dev/null | sort -rn | head -10
grep -rn "'use client'" src/ --include="*.tsx" | wc -l
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l
```

---

## 📝 Cheat Sheets

### Security — ٥٠ پشکنین
```
□ 01. RLS on all tables
□ 02. getUser() not getSession() server-side
□ 03. Admin routes double-gated
□ 04. API routes have auth check
□ 05. Zod validation on all inputs
□ 06. Rate limiting: login, register, checkout, contact, reset
□ 07. Webhook signature verified
□ 08. Idempotent webhook processing
□ 09. Raw body for webhook signature
□ 10. SERVICE_ROLE only in webhooks/cron/admin
□ 11. Secrets in .env (not hardcoded)
□ 12. No NEXT_PUBLIC_ for secrets
□ 13. .env in .gitignore
□ 14. .env.example exists
□ 15. CSP header set
□ 16. X-Frame-Options: DENY
□ 17. HSTS header
□ 18. poweredByHeader: false
□ 19. No dangerouslySetInnerHTML without DOMPurify
□ 20. No eval/innerHTML/document.write
□ 21. File upload: type + size + magic bytes
□ 22. Unique filenames (UUID)
□ 23. Storage bucket RLS
□ 24. Prices from DB (never client)
□ 25. Stock checked server-side
□ 26. Coupon validated server-side
□ 27. IDOR prevented (user can only access own data)
□ 28. Account enumeration prevented
□ 29. timingSafeEqual for tokens
□ 30. No prototype pollution
□ 31. No ReDoS on user input
□ 32. npm audit clean
□ 33. Lock file committed
□ 34. No PII in logs
□ 35. Structured error responses (no stack traces)
□ 36. CORS: specific origins
□ 37. Redirect URLs validated
□ 38. httpOnly + secure + sameSite cookies
□ 39. Session refresh in middleware
□ 40. Logout clears all
□ 41. Cookie consent before analytics
□ 42. Password minimum strength
□ 43. Email confirmation required
□ 44. Password reset: rate limited + token expiry
□ 45. No open redirect
□ 46. sql parameterized (no string interpolation)
□ 47. Search input sanitized
□ 48. SSRF prevented (no internal IP fetching)
□ 49. Database migrations reviewed
□ 50. Stripe test vs live keys separated
```

### Performance — ٣٠ پشکنین
```
□ 01. Server Components for data fetching
□ 02. 'use client' at leaf level only
□ 03. next/image (not <img>)
□ 04. Image priority on LCP
□ 05. Fonts preloaded + swap
□ 06. Dynamic imports for heavy components
□ 07. No lodash/moment (use native/lightweight)
□ 08. Tree-shaking works (ESM)
□ 09. Route-based code splitting
□ 10. loading.tsx for all routes
□ 11. Parallel data fetching (Promise.all)
□ 12. No N+1 queries (use JOINs)
□ 13. Pagination (.range)
□ 14. Server-side filtering (not client)
□ 15. Select specific columns (not *)
□ 16. Database indexes on common queries
□ 17. Suspense for streaming
□ 18. React Compiler enabled
□ 19. GPU animations only (transform/opacity)
□ 20. content-visibility: auto
□ 21. prefers-reduced-motion
□ 22. Resource hints (preconnect, dns-prefetch)
□ 23. Cache-Control headers
□ 24. ISR/revalidation strategy
□ 25. Bundle < 500kB total
□ 26. First Load JS < 100kB
□ 27. LCP < 2.5s
□ 28. INP < 200ms
□ 29. CLS < 0.1
□ 30. No console.log in production
```

### Accessibility — ٣٠ پشکنین
```
□ 01. Color contrast ≥ 4.5:1
□ 02. Focus indicators visible
□ 03. Skip to content link
□ 04. Logical tab order
□ 05. All images have alt
□ 06. Form inputs have labels
□ 07. aria-invalid on errors
□ 08. aria-describedby on error messages
□ 09. Roles on interactive non-semantic elements
□ 10. Heading hierarchy (h1 → h2 → h3)
□ 11. One h1 per page
□ 12. Touch targets ≥ 44×44px
□ 13. Input font ≥ 16px (iOS)
□ 14. Dark mode contrast
□ 15. Keyboard navigation works everywhere
□ 16. Escape closes modals
□ 17. Focus trapped in modals
□ 18. aria-live for dynamic content
□ 19. Lang attribute on <html>
□ 20. Semantic HTML (main, nav, header, footer)
□ 21. No autoplay audio/video
□ 22. Error boundary with friendly message
□ 23. Loading states announced
□ 24. Button vs link (action vs navigation)
□ 25. Empty alt for decorative images
□ 26. Data tables: <th> + scope
□ 27. Form error summary
□ 28. No content flash (CLS)
□ 29. Reduced motion respected
□ 30. Consistent navigation across pages
```

### Supabase — ٢٥ پشکنین
```
□ 01. RLS enabled on ALL tables
□ 02. is_admin() SECURITY DEFINER + SET search_path=''
□ 03. No USING(true) on sensitive tables
□ 04. User policies: auth.uid() = user_id
□ 05. INSERT: WITH CHECK (not just USING)
□ 06. getUser() server-side
□ 07. getSession() client-side only
□ 08. Service role = webhooks/cron only
□ 09. Singleton client pattern
□ 10. Channel cleanup on unmount
□ 11. Error always checked
□ 12. JOINs with select('*, brands(*)')
□ 13. Pagination with .range()
□ 14. Indexes on FK + commonly filtered columns
□ 15. Migrations versioned + reviewed
□ 16. Soft delete → trash table
□ 17. Triggers work (profile auto-create)
□ 18. Storage: bucket policies set
□ 19. Realtime: RLS applies
□ 20. No overfetching (.select specific columns)
□ 21. Foreign keys with ON DELETE CASCADE
□ 22. created_at TIMESTAMPTZ DEFAULT now()
□ 23. UUID primary keys (gen_random_uuid)
□ 24. No service role key in NEXT_PUBLIC_
□ 25. Database types generated
```

### Stripe — ٢٠ پشکنین
```
□ 01. Stripe Elements for card input
□ 02. Secret key server-only
□ 03. Publishable key client-only
□ 04. Webhook signature verified
□ 05. Raw body for signature
□ 06. Idempotent processing
□ 07. Prices from DB
□ 08. unit_amount in cents
□ 09. Session expiry (30 min)
□ 10. success_url validated
□ 11. cancel_url validated
□ 12. metadata: orderId + userId
□ 13. Statement descriptor set
□ 14. Test vs live keys separated
□ 15. Refund route exists
□ 16. Currency consistent
□ 17. Error handling for Stripe API
□ 18. Always return 200 on webhook
□ 19. Promise.allSettled for notifications
□ 20. No card data logged
```

### Mobile — ٢٥ پشکنین
```
□ 01. Mobile-first CSS (min-width)
□ 02. viewport meta tag
□ 03. Touch targets ≥ 44×44px
□ 04. Input font ≥ 16px
□ 05. No horizontal scroll
□ 06. Safe areas (env(safe-area-inset-*))
□ 07. Responsive images (srcSet/sizes)
□ 08. inputMode on inputs
□ 09. enterKeyHint
□ 10. autocomplete attributes
□ 11. Sticky header
□ 12. Bottom nav on mobile (if applicable)
□ 13. Drawer/sheet for mobile menus
□ 14. Tables → cards on mobile
□ 15. Font size clamp (min, preferred, max)
□ 16. Grid → stack on mobile
□ 17. Landscape handled
□ 18. Modal max-height: 80vh on mobile
□ 19. Swipe gestures (optional)
□ 20. Loading skeletons (not spinners)
□ 21. PWA installable
□ 22. Offline fallback
□ 23. Connection-aware loading
