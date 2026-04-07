## تەکنۆلۆجیاکانی ماستەر

```
Vercel           — Deployment, Preview, Edge, Analytics, Speed Insights, Crons
Supabase Cloud   — Database hosting, Auth, Storage, Edge Functions, Realtime
GitHub           — Actions, Branch Protection, Secrets, PR Checks
Next.js          — Build, Middleware, Security Headers, ISR, Streaming
Stripe           — Webhook config, idempotency, test/live modes
DNS/SSL          — Custom domains, HTTPS, HSTS, CAA records
Monitoring       — Sentry, Vercel Analytics, Health Checks, Uptime
```

---

## ١٥ بەشی DevOps و زیربنا

---

### 🚀 §1. Vercel Deployment — ئەنسایکلۆپیدیای تەواو

```
═══════════════════════════════════════════════════
📋 Vercel Setup Checklist — تەواو
═══════════════════════════════════════════════════
□ Project connected to GitHub repo
□ Production branch: master
□ Preview deployments enabled for PRs
□ Build command: next build
□ Output directory: .next
□ Node.js version: 20.x
□ Framework preset: Next.js
□ Root directory: ./
□ Install command: npm ci
□ Development command: next dev
□ Serverless Function Region: iad1 (یان نزیکترین بۆ audience)
□ Edge Function Region: all (global)
```

#### ١.١ — vercel.json — ڕێکخستنی تەواو
```json
{
  "crons": [
    { "path": "/api/cron/daily-report", "schedule": "0 8 * * *" },
    { "path": "/api/cron/daily-backup", "schedule": "0 2 * * *" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/images/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/_next/static/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "redirects": [
    { "source": "/home", "destination": "/", "permanent": true },
    { "source": "/shop", "destination": "/products", "permanent": true }
  ],
  "rewrites": []
}
```

#### ١.٢ — Vercel Limits (بزانە!)
```
═══════════════════════════════════════════════════
⏱️ Vercel Serverless Function Limits:
═══════════════════════════════════════════════════

Hobby Plan:
  Execution timeout:      10 seconds
  Memory:                 1024 MB
  Payload size:           4.5 MB (request body)
  Deployments/day:        100
  Bandwidth:              100 GB/month
  Serverless invocations: 100,000/month
  Edge invocations:       500,000/month
  Cron jobs:              2 (daily only)
  Image Optimizations:    1,000/month
  
Pro Plan:
  Execution timeout:      60 seconds (300s بۆ streaming)
  Memory:                 3008 MB
  Payload size:           4.5 MB
  Deployments/day:        6,000
  Bandwidth:              1 TB/month
  Serverless invocations: 1,000,000/month
  Edge invocations:       unlimited
  Cron jobs:              unlimited (per minute)
  Image Optimizations:    5,000/month
  
گرنگ بۆ NexPOS:
  - API routes نابێت لە 10s (Hobby) تێپەڕن
  - Upload فایل ≤ 4.5 MB
  - ئەگەر Stripe webhook processing درێژە → background job
  - ISR revalidation: 60s+ باشە
```

#### ١.٣ — Vercel Edge vs Serverless
```typescript
// ═══════════════════════════════════════════════════
// کەی Edge بەکاربهێنە، کەی Serverless؟
// ═══════════════════════════════════════════════════

// ✅ Edge Function — خێرا، global، بەڵام سنووردار:
// بەکاربهێنە بۆ: middleware, redirects, simple API, geolocation
// سنوور: Node.js APIs نییە، 128KB code limit
export const runtime = 'edge'

// ✅ Serverless Function — ئاسایی، Node.js تەواو:
// بەکاربهێنە بۆ: database queries, Stripe, email, file upload
// NexPOS: هەموو API routes → serverless (default)
export const runtime = 'nodejs' // default — نەنووسیت باشە

// ✅ Middleware — هەمیشە Edge:
// middleware.ts لە ڕەگەوە — auth check, redirects, CSP
// خێرایە چونکە لە هەموو region ڕان دەکرێت
```

#### ١.٤ — ISR (Incremental Static Regeneration)
```typescript
// ═══════════════════════════════════════════════════
// ISR — لاپەڕە static بکە + هەر X چرکە نوێ بکەوە
// ═══════════════════════════════════════════════════

// ✅ Products page — هەر ٦٠ چرکە نوێ دەبێتەوە:
export const revalidate = 60

// ✅ Home page — هەر ٣٠٠ چرکە (٥ خولەک):
export const revalidate = 300

// ✅ On-demand revalidation (کاتێک admin بەرهەم نوێ دەکاتەوە):
// src/app/api/admin/products/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'

// Option 1: Path
revalidatePath('/products')
revalidatePath(`/products/${slug}`)

// Option 2: Tag
revalidateTag('products')

// ✅ Static generation (بۆ product pages):
export async function generateStaticParams() {
  const products = await getProducts()
  return products.map(p => ({ slug: p.slug }))
}
```

---

### 🔐 §2. Environment Variables — ئەنسایکلۆپیدیای تەواو

```
═══════════════════════════════════════════════════
📋 Environment Variables — ٣ ئاست
═══════════════════════════════════════════════════

Production (Vercel Dashboard → Settings → Environment Variables):
├── NEXT_PUBLIC_SUPABASE_URL              → public (client + server)
├── NEXT_PUBLIC_SUPABASE_ANON_KEY         → public (client + server)
├── NEXT_PUBLIC_SITE_URL                  → public (client + server)
├── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY    → public (client + server)
├── SUPABASE_SERVICE_ROLE_KEY             → secret (server only!)
├── STRIPE_SECRET_KEY                     → secret (server only!)
├── STRIPE_WEBHOOK_SECRET                 → secret (server only!)
├── RESEND_API_KEY                        → secret (server only!)
├── CRON_SECRET                           → secret (cron auth)
└── ADMIN_EMAIL                           → secret (admin notifications)

Preview (هەمان production، یان Supabase project جیا)
Development (.env.local — NEVER commit!)
```

#### ٢.١ — Zod Validation بۆ env vars
```typescript
// ═══════════════════════════════════════════════════
// src/lib/env.ts — validate لە startup
// ═══════════════════════════════════════════════════
import { z } from 'zod'

// ── Public env (client + server) ──
const publicEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
})

// ── Server-only env (نابێت لە client بچێت) ──
const serverEnv = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  CRON_SECRET: z.string().min(16),
})

// ── Parse ──
export const publicConfig = publicEnv.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
})

// تەنیا لەسەر server:
export const serverConfig = typeof window === 'undefined' 
  ? serverEnv.parse(process.env)
  : null
```

#### ٢.٢ — .env.example
```bash
# ═══════════════════════════════════════════════════
# .env.example — commit ئەمە! (بەبێ values)
# ═══════════════════════════════════════════════════

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Supabase (server only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email
RESEND_API_KEY=re_xxx

# Cron
CRON_SECRET=your-random-secret-min-16-chars

# Admin
ADMIN_EMAIL=admin@nexpos.store
```

#### ٢.٣ — Secret Rotation Strategy
```
═══════════════════════════════════════════════════
📋 Secret Rotation — هەر ٩٠ ڕۆژ
═══════════════════════════════════════════════════

قۆناغ ١: Key نوێ دروست بکە لە provider (Stripe/Supabase/Resend)
قۆناغ ٢: نوێەکە لە Vercel Dashboard زیاد بکە
قۆناغ ٣: Redeploy بکە
قۆناغ ٤: تاقی بکەوە — هەموو شت کار دەکات؟
قۆناغ ٥: Key کۆنەکە disable/delete بکە لە provider
قۆناغ ٦: تۆمار بکە: "Rotated on [date]"

⚠️ هەرگیز key کۆنەکە مەسڕەوە پێش ئەوەی نوێەکە کار بکات!
⚠️ Stripe webhook secret — نوێەکە هەمان endpoint active بکە
```

#### ٢.٤ — Security Rules بۆ env vars
```
📋 Security Rules:
□ .env.local لە .gitignore
□ .env.example هەیە بەبێ values  
□ NEXT_PUBLIC_ تەنیا بۆ client-safe values
□ Secret keys بەبێ NEXT_PUBLIC_ prefix
□ هیچ secret hardcoded لە source code
□ Rotate secrets لە هەر 90 ڕۆژ
□ Validate env vars لە startup (Zod)
□ Different secrets بۆ dev/staging/production
□ ئەگەر secret leak کرد: ئەو کاتە rotate بکە — مەوەستە!
□ .env.local backup لە password manager (1Password, Bitwarden)
```

---

### 🛡️ §3. Security Headers — ئەنسایکلۆپیدیای تەواو

```typescript
// ═══════════════════════════════════════════════════
// next.config.ts — هەموو security headers
// ═══════════════════════════════════════════════════

const securityHeaders = [
  // ── X-Frame-Options ──
  // ڕێگری لە iframe embedding (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // DENY: هیچ سایتێک ناتوانێت iframe بکات
  // SAMEORIGIN: تەنیا هەمان domain
  
  // ── X-Content-Type-Options ──
  // ڕێگری لە MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  
  // ── X-DNS-Prefetch-Control ──
  // DNS prefetching بکە بۆ خێرایی
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  
  // ── Strict-Transport-Security (HSTS) ──
  // هەمیشە HTTPS بەکاربهێنە — ٢ ساڵ
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // max-age=63072000 = 2 years
  // includeSubDomains: هەموو subdomains
  // preload: لە HSTS preload list
  
  // ── Referrer-Policy ──
  // چەند زانیاری بدە بە سایتی تر
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // same-origin: full URL
  // cross-origin: origin only (نەک full path)
  // downgrade (https→http): هیچ نەنێرە
  
  // ── Permissions-Policy ──
  // APIs ی browser بلۆک بکە
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  // camera=(): هیچ کەس ناتوانێت کامێرا بەکاربهێنیت
  // microphone=(): هیچ کەس ناتوانێت مایکرۆفۆن بەکاربهێنیت
  // geolocation=(): هیچ کەس ناتوانێت location بەکاربهێنیت
  // browsing-topics=(): FLoC/Topics API بلۆک بکە
]

const nextConfig = {
  poweredByHeader: false, // X-Powered-By: Next.js بسڕەوە!
  headers: async () => [
    { source: '/(.*)', headers: securityHeaders },
  ],
}
```

#### ٣.١ — Content Security Policy (CSP)
```typescript
// ═══════════════════════════════════════════════════
// CSP — لە middleware.ts
// ═══════════════════════════════════════════════════

// ── هەر directive چی مانایە: ──

const cspDirectives = {
  // default-src: fallback بۆ هەموو شتےکان
  "default-src": "'self'",
  
  // script-src: JavaScript لەکوێ لۆد بکات
  "script-src": "'self' 'unsafe-inline' https://js.stripe.com",
  // 'self': هەمان domain
  // 'unsafe-inline': inline scripts (Next.js پێویستیە)
  // https://js.stripe.com: Stripe.js بۆ checkout
  // ⚠️ 'unsafe-eval' مەخە مەگەر پێویست بێت!
  
  // style-src: CSS لەکوێ لۆد بکات
  "style-src": "'self' 'unsafe-inline'",
  // 'unsafe-inline': Tailwind CSS inline styles
  
  // img-src: وێنەکان لەکوێ لۆد بکات
  "img-src": "'self' data: blob: https://*.supabase.co",
  // data: بۆ base64 images
  // blob: بۆ client-side image previews
  // https://*.supabase.co: Supabase Storage
  
  // font-src: فۆنتەکان لەکوێ لۆد بکات
  "font-src": "'self'",
  // ئەگەر Google Fonts بەکاردەهێنیت: "font-src 'self' https://fonts.gstatic.com"
  
  // connect-src: API calls و WebSocket
  "connect-src": "'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
  // wss://*.supabase.co: Realtime subscriptions
  // https://api.stripe.com: Stripe API
  
  // frame-src: iframes لەکوێ لۆد بکات
  "frame-src": "https://js.stripe.com https://hooks.stripe.com",
  // Stripe Elements / Checkout iframe
  
  // object-src: plugins (Flash, etc) — بلۆک بکە!
  "object-src": "'none'",
  
  // base-uri: <base> tag — تەنیا self
  "base-uri": "'self'",
  
  // form-action: فۆرمەکان بۆ کوێ submit بکرێن
  "form-action": "'self'",
  
  // frame-ancestors: کێ ئەتوانێت ئەم سایتە iframe بکات — هیچ کەس
  "frame-ancestors": "'none'",
  
  // upgrade-insecure-requests: http → https بگۆڕە
  "upgrade-insecure-requests": "",
}

// ── بیبکە بە string بۆ header:
const csp = Object.entries(cspDirectives)
  .map(([key, value]) => `${key} ${value}`.trim())
  .join('; ')
```

#### ٣.٢ — CORS Configuration
```typescript
// ═══════════════════════════════════════════════════
// CORS — بۆ API routes
// ═══════════════════════════════════════════════════

// ✅ باش — specific origins:
const allowedOrigins = [
  'https://nexpos.store',
  'https://www.nexpos.store',
  process.env.NEXT_PUBLIC_SITE_URL,
].filter(Boolean)

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  
  if (origin && allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    })
  }
  
  return new NextResponse(null, { status: 403 })
}

// ❌ هەرگیز:
// 'Access-Control-Allow-Origin': '*'  — قەدەغەیە!
// 'Access-Control-Allow-Credentials': 'true' + wildcard origin — ئاسیبپەزیر!
```

---

### 🔄 §4. CI/CD Pipeline — تەواو

#### ٤.١ — CI Workflow (Quality Check)
```yaml
# ═══════════════════════════════════════════════════
# .github/workflows/ci.yml — Quality Pipeline
# ═══════════════════════════════════════════════════
name: CI — Quality Check

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

env:
  NODE_VERSION: '20'

jobs:
  quality:
    name: 🔍 Quality Check
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4
      
      - name: 📦 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: 📥 Install Dependencies
        run: npm ci
      
      - name: 🔧 TypeScript Check
        run: npx tsc --noEmit
      
      - name: 📏 ESLint
        run: npx eslint . --max-warnings 0
      
      - name: 🏗️ Build
        run: npx next build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_SITE_URL: ${{ secrets.NEXT_PUBLIC_SITE_URL }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
      
      - name: 🔒 Security Audit
        run: npm audit --audit-level=high
        continue-on-error: true  # warn but don't fail

  # Dependency check (جیا — هەفتانە)
  deps:
    name: 📦 Dependency Check
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Check outdated
        run: npm outdated || true
      - name: Security audit
        run: npm audit --production
```

#### ٤.٢ — Branch Strategy
```
═══════════════════════════════════════════════════
📋 Branch Strategy — NexPOS
═══════════════════════════════════════════════════

master (protected):
  → Production deployment (auto by Vercel)
  → Requires PR + CI pass
  → NO direct push

feature/* :
  → Feature branches
  → PR → master
  → Preview deployment (auto by Vercel)
  → Examples: feature/reviews, feature/admin-backup

fix/* :
  → Bug fix branches
  → PR → master
  → Examples: fix/cart-total, fix/auth-redirect

hotfix/* :
  → Critical production fixes
  → PR → master → merge immediately
  → Examples: hotfix/stripe-webhook

═══════════════════════════════════════════════════
📋 Branch Protection Rules (GitHub → Settings → Branches):
═══════════════════════════════════════════════════
□ Require pull request before merging
□ Require at least 1 approval (ئارەزوومەندانە)
□ Require status checks to pass: CI — Quality Check
□ Require branches to be up to date before merging
□ Do not allow force pushes
□ Do not allow deletions
```

#### ٤.٣ — Preview Deployments
```
═══════════════════════════════════════════════════
🔍 Preview Deployments — Vercel Automatic
═══════════════════════════════════════════════════

هەموو PR ئۆتۆماتیک preview deployment وەردەگرێت:
  URL: https://nexpos-app-{hash}-{team}.vercel.app
  
  فایدە:
  - تاقیکردنەوەی فیچەری نوێ بەبێ production
  - هاوبەشکردن بە team/client بۆ ڕاوێژ
  - هەر commit → نوێکردنەوەی preview
  
  ⚠️ گرنگ:
  - Preview هەمان env vars ی production بەکاردەهێنێت (default)
  - ئەگەر Supabase project جیا بۆ preview:
    → Vercel → Settings → Environment Variables
    → بگۆڕە NEXT_PUBLIC_SUPABASE_URL بۆ Preview scope
```

---

### 📊 §5. Monitoring & Error Tracking — تەواو

#### ٥.١ — Health Check Endpoint
```typescript
// ═══════════════════════════════════════════════════
// src/app/api/health/route.ts — Health Check تەواو
// ═══════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const checks: Record<string, 'healthy' | 'unhealthy' | 'degraded'> = {}
  const startTime = Date.now()
  
  // ── Check 1: Database ──
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.database = error ? 'unhealthy' : 'healthy'
  } catch {
    checks.database = 'unhealthy'
  }
  
  // ── Check 2: Environment Variables ──
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
  ]
  const missingEnvs = requiredEnvs.filter(k => !process.env[k])
  checks.environment = missingEnvs.length === 0 ? 'healthy' : 'unhealthy'
  
  // ── Check 3: Memory ──
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage()
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024)
    checks.memory = heapUsedMB < 400 ? 'healthy' : heapUsedMB < 800 ? 'degraded' : 'unhealthy'
  }
  
  // ── Overall Status ──
  const overall = Object.values(checks).includes('unhealthy') 
    ? 'unhealthy' 
    : Object.values(checks).includes('degraded')
    ? 'degraded'
    : 'healthy'
  
  const responseTime = Date.now() - startTime
  
  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    checks,
  }, { 
    status: overall === 'healthy' ? 200 : 503 
  })
}
```

#### ٥.٢ — Sentry Error Tracking
```typescript
// ═══════════════════════════════════════════════════
// Sentry Setup — ڕیکۆمێندکراو بۆ production
// ═══════════════════════════════════════════════════

// ١. Install:
// npm install @sentry/nextjs

// ٢. sentry.client.config.ts:
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,      // 10% of transactions
  replaysSessionSampleRate: 0, // 0% session replay (هەرزان)
  replaysOnErrorSampleRate: 1, // 100% replay on error
  environment: process.env.VERCEL_ENV ?? 'development',
})

// ٣. sentry.server.config.ts:
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV ?? 'development',
})

// ٤. next.config.ts:
// const { withSentryConfig } = require('@sentry/nextjs')
// module.exports = withSentryConfig(nextConfig, { ... })

// ✅ Usage لە API routes:
import * as Sentry from '@sentry/nextjs'

export async function POST(request: Request) {
  try {
    // ...
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: '/api/checkout' },
      extra: { requestBody: await request.text() },
    })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### ٥.٣ — Monitoring Checklist
```
═══════════════════════════════════════════════════
📋 Monitoring Checklist — تەواو
═══════════════════════════════════════════════════

── Vercel Built-in: ──
□ Vercel Analytics enabled (Dashboard → Analytics)
□ Vercel Speed Insights enabled (Dashboard → Speed Insights)
□ Vercel Logs (Dashboard → Deployments → Logs)
□ Vercel Functions tab (Dashboard → Functions)

── Error Tracking: ──
□ Sentry (recommended) — ئۆتۆماتیک errors دەگرێت
□ Error boundaries لە React (error.tsx)
□ API route try/catch بە Sentry logging

── Uptime: ──
□ UptimeRobot (free) — /api/health هەر ٥ خولەک
□ Better Stack (better) — /api/health + alerts
□ Status page (public) — ئارەزوومەندانە

── Alerts: ──
□ Email alert لە: 5xx errors
□ Email alert لە: high response time (>3s)
□ Email alert لە: downtime
□ Slack webhook (ئارەزوومەندانە)

── Dashboard: ──
□ Supabase Dashboard → query performance
□ Stripe Dashboard → webhook events, failures
□ Vercel Dashboard → function invocations, errors
```

#### ٥.٤ — Logging Strategy
```typescript
// ═══════════════════════════════════════════════════
// Logging — ستراتیجیەت
// ═══════════════════════════════════════════════════

// ❌ نەکە:
console.log('user data:', user)              // production data leak!
console.log('processing...')                  // noise
console.log(JSON.stringify(requestBody))       // PII exposure

// ✅ بکە:
console.error('[API /checkout] Stripe error:', error.message)
console.warn('[API /orders] Rate limit approached:', ip)
console.info('[CRON daily-report] Completed in 2.3s')

// ✅ Structured logging (بۆ searchability):
console.error(JSON.stringify({
  level: 'error',
  route: '/api/checkout',
  error: error.message,
  userId: user?.id,       // نەک هەموو user object
  timestamp: new Date().toISOString(),
}))

// ✅ Development only:
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}
```

---

### 💾 §6. Backup Strategy — تەواو

```
═══════════════════════════════════════════════════
📋 Backup Strategy — ٣ لایەن
═══════════════════════════════════════════════════

── Layer 1: Supabase Built-in ──
□ Pro plan: Daily automatic backups
□ 7-day retention (Pro)
□ Point-in-time recovery (Enterprise)

── Layer 2: Manual/Cron Backup ──
□ Daily cron → /api/cron/daily-backup
□ Export critical tables as CSV/JSON
□ Store in Supabase Storage bucket (private)

── Layer 3: Source Code ──
□ Git repository (GitHub) — هەموو source code
□ .env.example (variable names)
□ secrets لە password manager (1Password/Bitwarden)
□ Database schema لە supabase/ folder
```

#### ٦.١ — Cron Backup Implementation
```typescript
// ═══════════════════════════════════════════════════
// src/app/api/cron/daily-backup/route.ts
// ═══════════════════════════════════════════════════
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // ── Auth: Cron secret ──
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const tables = ['products', 'orders', 'order_items', 'profiles', 'brands', 'categories', 'coupons']
  const timestamp = new Date().toISOString().split('T')[0] // 2024-01-15
  const results: Record<string, number> = {}
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
    
    if (!error && data) {
      results[table] = data.length
      
      // Upload to storage
      const fileName = `backups/${timestamp}/${table}.json`
      await supabase.storage
        .from('backups')
        .upload(fileName, JSON.stringify(data, null, 2), {
          contentType: 'application/json',
          upsert: true,
        })
    }
  }
  
  // Clean old backups (keep 30 days)
  // ... cleanup logic
  
  return NextResponse.json({ 
    success: true, 
    date: timestamp,
    tables: results,
  })
}
```

#### ٦.٢ — Daily Report Cron
```typescript
// ═══════════════════════════════════════════════════
// src/app/api/cron/daily-report/route.ts
// ═══════════════════════════════════════════════════
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  
  // ── Stats ──
  const [orders, revenue, newUsers, messages] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact' })
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${dateStr}T23:59:59`),
    supabase.from('orders').select('total_amount')
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${dateStr}T23:59:59`),
    supabase.from('profiles').select('id', { count: 'exact' })
      .gte('created_at', `${dateStr}T00:00:00`),
    supabase.from('contact_messages').select('id', { count: 'exact' })
      .gte('created_at', `${dateStr}T00:00:00`),
  ])
  
  const totalRevenue = revenue.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) ?? 0
  
  // Send email report
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'NexPOS <reports@nexpos.store>',
      to: process.env.ADMIN_EMAIL,
      subject: `📊 Daily Report — ${dateStr}`,
      html: `
        <h2>NexPOS Daily Report — ${dateStr}</h2>
        <ul>
          <li>Orders: ${orders.count ?? 0}</li>
          <li>Revenue: $${totalRevenue.toFixed(2)}</li>
          <li>New Users: ${newUsers.count ?? 0}</li>
          <li>Messages: ${messages.count ?? 0}</li>
        </ul>
      `,
    }),
  })
  
  return NextResponse.json({ success: true, date: dateStr })
}
```

---

### 🌐 §7. Domain & DNS — تەواو

```
═══════════════════════════════════════════════════
📋 Domain Setup — Vercel
═══════════════════════════════════════════════════

── قۆناغ ١: Domain زیاد بکە لە Vercel ──
Vercel Dashboard → Settings → Domains → Add Domain
  nexpos.store
  www.nexpos.store (redirect بۆ nexpos.store)

── قۆناغ ٢: DNS Records ──
سەردانی domain registrar بکە:
  Type  | Name | Value                      | TTL
  A     | @    | 76.76.21.21                | 3600
  CNAME | www  | cname.vercel-dns.com       | 3600

── قۆناغ ٣: SSL/TLS ──
Vercel ئۆتۆماتیک Let's Encrypt certificate دروست دەکات.
هیچ پێناکات — تەنیا DNS بکە و چاوەڕوان بە (٥-١٠ خولەک).

── قۆناغ ٤: HSTS ──
لە security headers → Strict-Transport-Security
بە preload → لە hstspreload.org submit بکە

── قۆناغ ٥: Email (MX Records) ──
ئەگەر ئیمەیڵی custom domain دەتەوێت:
  Type  | Name | Value                      | Priority
  MX    | @    | aspmx.l.google.com         | 1
  MX    | @    | alt1.aspmx.l.google.com    | 5
  
  یان Resend:
  Verify domain لە Resend dashboard
  Add TXT و CNAME records بەپێی instructions
```

#### ٧.١ — Subdomain Pattern
```
═══════════════════════════════════════════════════
📋 Subdomain Strategy:
═══════════════════════════════════════════════════
nexpos.store           → Main site
www.nexpos.store       → Redirect → nexpos.store
admin.nexpos.store     → Admin panel (ئەگەر جیا بێت)
api.nexpos.store       → API (ئەگەر جیا بێت)
status.nexpos.store    → Status page (UptimeRobot widget)
```

---

### 🔧 §8. Troubleshooting — ئەنسایکلۆپیدیای هەڵە

```
═══════════════════════════════════════════════════
📋 Common Issues & Solutions
═══════════════════════════════════════════════════

── Build Fails ──

❌ "Module not found"
  → npm ci (نوێکردنەوەی dependencies)
  → Check import paths (case-sensitive لە Linux/Vercel!)
  → ئایا فایلەکە بوونی هەیە؟

❌ TypeScript errors
  → npx tsc --noEmit (locally)
  → Check tsconfig.json → strict: true
  → ئایا type import ها? → import type { ... }

❌ "NEXT_PUBLIC_... undefined"
  → Vercel Dashboard → Settings → Environment Variables
  → ئایا scope ی production هەیە؟
  → Redeploy بکە (env vars لە build time لۆد دەبن)

❌ Build timeout
  → Vercel Hobby: 45 minutes max
  → Check: ئایا fetch بە uncached لە Static Generation?
  → generateStaticParams() زۆر نەکە

── Runtime Errors ──

❌ 504 Gateway Timeout
  → API route > 10s (Hobby) → optimize query
  → Add caching (React cache(), unstable_cache())
  → Streaming response (ReadableStream)

❌ 500 Internal Server Error
  → Check Vercel Logs (Dashboard → Deployments → ... → Functions)
  → Add try/catch + console.error لە API routes
  → ئایا env var missing?

❌ CORS error
  → Check middleware.ts → headers
  → ئایا API route OPTIONS handler هەیە؟
  → client-side fetch → same-origin ئایا ڕاستە؟

── Webhook Issues ──

❌ Stripe webhook fails
  → Verify STRIPE_WEBHOOK_SECRET
  → Stripe Dashboard → Webhooks → Events → check response
  → ئایا route 200 return دەکات؟
  → ئایا body raw (نە parsed)؟
  → Test: stripe listen --forward-to localhost:3000/api/webhook

── Database Issues ──

❌ RLS policy blocks query
  → Supabase Dashboard → Table Editor → RLS enabled?
  → ئایا policy ی SELECT بۆ authenticated هەیە؟
  → Test لە Supabase SQL Editor بە set role authenticated

❌ Connection pool exhausted
  → Supabase: connection pooler بەکاربهێنە (port 6543)
  → سروشتی: createClient هەمیشە نوێ دروست مەکە
  → Supabase client singleton pattern بەکاربهێنە

── Auth Issues ──

❌ "Auth session missing"
  → getUser() نەک getSession() بەکاربهێنە لەسەر server
  → middleware.ts → updateSession() فەرامۆش نەکەیت
  → Check Supabase Auth → Settings → Email Auth enabled?

❌ Infinite redirect loop
  → middleware.ts → matcher ئایا ase و /.next exclude کراون؟
  → Check redirect logic — ئایا condition loop دروست دەکات؟

── Performance Issues ──

❌ Slow page load
  → Check: Component ئایا 'use client' لەسەرەوەیە بەبێ پێویست?
  → ئایا blocking fetch هەیە لە server component?
  → Bundle analyzer: next build --analyze

❌ High memory usage
  → ئایا memory leak هەیە? (event listeners, intervals)
  → ئایا گەورە data لە cache?
  → Vercel Functions → check memory usage per function
```

---

### 🐳 §9. Docker Development (ئارەزوومەندانە)

```dockerfile
# ═══════════════════════════════════════════════════
# Dockerfile — بۆ local development (optional)
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# env vars بۆ build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml — بۆ local dev
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    volumes:
      - .:/app
      - /app/node_modules
```

---

### 🔄 §10. Rollback & Recovery

```
═══════════════════════════════════════════════════
📋 Rollback Procedures
═══════════════════════════════════════════════════

── Vercel Instant Rollback ──
  ١. Vercel Dashboard → Deployments
  ٢. بەرەنجامی کۆنی باش بدۆزەوە
  ٣. ... → Promote to Production
  ٤. کاتی گەڕانەوە: ~١ چرکە!

── Git Rollback ──
  ١. git log → commit ی باش بدۆزەوە
  ٢. git revert HEAD → commit نوێ دروست بکە
  ٣. git push → ئۆتۆماتیک deploy دەکرێت

── Database Rollback ──
  ١. Supabase Dashboard → Database → Backups
  ٢. Restore from backup
  ⚠️ ئەمە هەموو data دەگەڕێنێتەوە — بەئاگاییەوە!
  ⚠️ باشتر: migration reverse بنووسە

── Incident Response ──
  ١. تأکید: ئایا بەڕاستی مەسەلەی production هەیە؟
  ٢. Communication: هاوتیم ئاگادار بکەوە
  ٣. Rollback: Vercel instant rollback
  ٤. Investigate: Vercel Logs + Sentry
  ٥. Fix: هەڵەکە لە development چاک بکە
  ٦. Deploy: fix بۆ production push بکە
  ٧. Post-mortem: چۆن ڕوویدا؟ چۆن ڕێگری بکەین؟
```

---

### ⚡ §11. Edge & Serverless Optimization

```typescript
// ═══════════════════════════════════════════════════
// Optimization Patterns بۆ Vercel
// ═══════════════════════════════════════════════════

// ✅ Cold start optimization — import lazy:
export async function POST(request: Request) {
  // ❌ top-level import → cold start = slow
  // import { someHeavyLib } from 'heavy-lib'
  
  // ✅ dynamic import → cold start = fast
  const { someHeavyLib } = await import('heavy-lib')
  // ...
}

// ✅ Response streaming بۆ long operations:
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for (const item of items) {
        controller.enqueue(encoder.encode(JSON.stringify(item) + '\n'))
        await processItem(item)
      }
      controller.close()
    },
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
}

// ✅ Region configuration:
// next.config.ts:
// experimental: { serverFunctionRegion: 'iad1' }  // بۆ نزیکی database
```

---

### 📊 §12. Cost Optimization

```
═══════════════════════════════════════════════════
💰 Cost Optimization بۆ NexPOS
═══════════════════════════════════════════════════

── Vercel Hobby (Free) ——
  باشە بۆ: development, MVP, کەم traffic
  سنوور: 100 deployments/day, 100GB bandwidth, 10s timeout
  
── Vercel Pro ($20/month) ──
  باشە بۆ: production, بازاڕ
  فایدە: 60s timeout, 1TB bandwidth, analytics, team
  
── Supabase Free ──
  باشە بۆ: development, MVP
  سنوور: 500MB database, 1GB storage, 50K monthly active users
  
── Supabase Pro ($25/month) ──
  باشە بۆ: production
  فایدە: 8GB database, 100GB storage, daily backups

── Stripe ──
  2.9% + $0.30 per transaction
  هیچ monthly fee نییە

── Resend ──
  Free: 100 emails/day
  Pro ($20/month): 50,000 emails/month

═══════════════════════════════════════════════════
📋 Cost Reduction Tips:
═══════════════════════════════════════════════════
□ ISR بەکاربهێنە بۆ کەمکردنەوەی serverless invocations
□ Image optimization + CDN caching
□ Supabase queries optimize بکە (N+1 prevention)
□ Static pages هەرچی زیاتر = کەم function calls
□ Stripe webhook retry limit: 3 (نەک unlimited)
```

---

### 🔐 §13. Rate Limiting at Edge

```typescript
// ═══════════════════════════════════════════════════
// Rate Limiting — لە middleware.ts
// ═══════════════════════════════════════════════════

// ✅ Simple IP-based rate limiting (بەبێ Redis):
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true // allowed
  }
  
  if (record.count >= limit) {
    return false // blocked!
  }
  
  record.count++
  return true // allowed
}

// ✅ لە middleware:
export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  
  // API routes: 60 requests/minute
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!rateLimit(ip, 60, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }
  
  // Auth routes: 10 requests/minute  
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    if (!rateLimit(`auth:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
  }
}

// ⚠️ ئەم ڕێگایە تەنیا بۆ single instance باشە
// بۆ multi-instance: Redis (Upstash) بەکاربهێنە
```

---

### 📋 §14. Infrastructure Checklist

```
═══════════════════════════════════════════════════
📋 DEVOPS MASTER CHECKLIST — ٤٠ خاڵ
═══════════════════════════════════════════════════

── Deployment ──
□ Vercel project connected to GitHub
□ Production branch: master (protected)
□ Preview deployments enabled
□ Build succeeds (tsc + eslint + next build)
□ Node.js 20.x
□ vercel.json cron jobs configured

── Environment ──
□ All env vars set in Vercel Dashboard
□ .env.local NOT in git
□ .env.example committed (no values)
□ Zod validation for env vars
□ Separate secrets for dev/staging/production
□ Secret rotation every 90 days

── Security ──
□ X-Frame-Options: DENY
□ X-Content-Type-Options: nosniff
□ HSTS: max-age=63072000; includeSubDomains; preload
□ CSP: properly configured
□ CORS: specific origins (no wildcard)
□ Referrer-Policy: strict-origin-when-cross-origin
□ Permissions-Policy: camera=(), microphone=()
□ poweredByHeader: false

── Monitoring ──
□ /api/health endpoint
□ Vercel Analytics enabled
□ Vercel Speed Insights enabled
□ Error tracking (Sentry recommended)
□ Uptime monitoring (UptimeRobot/Better Stack)
□ Alerts configured (email on 5xx)

── CI/CD ──
□ GitHub Actions CI workflow
□ tsc + eslint + build on every PR
□ Branch protection on master
□ Required status checks
□ npm audit (security)

── Backup ──
□ Supabase daily backups (Pro plan)
□ Cron backup job → /api/cron/daily-backup
□ Cron report → /api/cron/daily-report
□ .env backup in password manager

── DNS/Domain ──
□ Custom domain configured
□ DNS records (A/CNAME)
□ SSL/HTTPS automatic
□ www → non-www redirect
□ Email domain verified (Resend)

── Performance ──
□ ISR configured on appropriate pages
□ API routes optimized (< 10s Hobby)
□ Static pages where possible
□ CDN caching for assets
□ Image optimization enabled
```

---

### 🔧 §15. Useful Commands

```bash
# ═══════════════════════════════════════════════════
# فەرمانەکانی ڕۆژانە — بۆ DevOps
# ═══════════════════════════════════════════════════

# ── Build & Deploy ──
npm run build                    # local build test
npx tsc --noEmit                 # type check
npx eslint .                     # lint
npx next build                   # full build

# ── Vercel CLI ──
npx vercel                       # deploy to preview
npx vercel --prod                # deploy to production
npx vercel env pull              # download env vars → .env.local
npx vercel logs                  # view logs
npx vercel domains               # manage domains

# ── Database ──
npx supabase db push             # push migrations
npx supabase db diff             # see schema diff
npx supabase db dump             # export schema

# ── Stripe ──
stripe listen --forward-to localhost:3000/api/webhook  # local webhook testing
stripe trigger checkout.session.completed               # test event

# ── Security ──
npm audit                        # vulnerability check
npm audit fix                    # auto-fix
npx npm-check-updates            # check for updates

# ── Analysis ──
npx next build --debug           # detailed build info
ANALYZE=true npx next build      # bundle analyzer (needs @next/bundle-analyzer)
```

---

