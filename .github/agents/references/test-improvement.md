### §16. Improvement Audit — ئۆدیتی ئیمپرۆڤمێنت بۆ هەموو ئەیگێنتەکان

```bash
# ═══════════════════════════════════════════════════════════
#  💡 ئۆدیتی ئیمپرۆڤمێنت — قۆناغی ١١ — بۆ هەموو ئەیگێنت
#  ئەمانە ئیرۆر نین — ئیمپرۆڤمێنتی بەرزکردنەوەی ئاستن
# ═══════════════════════════════════════════════════════════

# ─────────────────────────────────────────────
# 💡 شادۆ دەڤەلۆپەر — Architecture & Patterns
# ─────────────────────────────────────────────

# 1. React 19 — useOptimistic
grep -rn "useOptimistic" src/ --include="*.tsx" | wc -l
# 0 = 💡 useOptimistic بۆ optimistic UI (cart, wishlist, forms)
# نمرە: 0= +0, 1-3= +1, 4+= +2

# 2. React 19 — useActionState  
grep -rn "useActionState" src/ --include="*.tsx" | wc -l
# 0 = 💡 useActionState بۆ form state management
# نمرە: 0= +0, 1+= +1

# 3. React 19 — useFormStatus
grep -rn "useFormStatus" src/ --include="*.tsx" | wc -l
# 0 = 💡 useFormStatus بۆ pending state

# 4. Server Actions instead of API routes
grep -rn "'use server'" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 Server Actions بەکاربهێنە بۆ mutations
# نمرە: 0= +0, 1-5= +1, 6+= +2

# 5. Streaming + Suspense boundaries
grep -rn "Suspense" src/ --include="*.tsx" | wc -l
# 0 = 💡 Suspense boundaries بۆ incremental page loading
# نمرە: 0= +0, 1-3= +1, 4+= +2

# 6. Error recovery with retry
grep -rn "retry\|refetch\|reset()" src/ --include="*.tsx" | wc -l
# 0 = 💡 Error boundaries بە retry button

# 7. Parallel data fetching
grep -rn "Promise\.all\|Promise\.allSettled" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 Parallel data fetching بۆ page data

# 8. Type-safe API layer
grep -rn "satisfies\|as const\|z\.infer" src/ --include="*.ts" | wc -l
# 0 = 💡 End-to-end type safety بە Zod infer

# 9. Custom hooks abstraction
find src/hooks -name "*.ts" -type f 2>/dev/null | wc -l
# <3 = 💡 Custom hooks زیاتر بنووسە (بۆ reusability)

# 10. Component composition patterns
grep -rn "children\|render.*prop\|compound" src/components/ --include="*.tsx" | wc -l
# ئایا compound component pattern بەکارهاتووە؟

# ─────────────────────────────────────────────
# 💡 شادۆ داتابەیس — Data Layer
# ─────────────────────────────────────────────

# 1. Database functions
grep -rn "supabase\.rpc" src/ --include="*.ts" | wc -l
# 0 = 💡 Database functions بۆ complex aggregations
# نمرە: 0= +0, 1-3= +1, 4+= +2

# 2. Database views
grep -rn "from('.*_view')\|from('v_" src/ --include="*.ts" | wc -l
# 0 = 💡 Views بۆ dashboard stats / complex joins

# 3. Realtime subscriptions
grep -rn "subscribe\|on('postgres_changes'\|channel(" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 Realtime بۆ orders, notifications, stock
# نمرە: 0= +0, 1+= +2

# 4. Full-text search
grep -rn "textSearch\|fts\|to_tsvector\|plainto_tsquery" src/ --include="*.ts" | wc -l
# 0 = 💡 Full-text search بۆ products

# 5. Soft delete pattern
grep -rn "deleted_at\|is_deleted\|soft.delete" src/ --include="*.ts" | wc -l
# 0 = 💡 Soft delete بۆ data recovery

# 6. Audit log
grep -rn "audit.log\|audit_log\|auditLog" src/ --include="*.ts" | wc -l
# 0 = 💡 Audit logging بۆ admin actions

# 7. Connection pooling hints
grep -rn "pooler\|pgbouncer\|connection.*pool" src/ --include="*.ts" | wc -l

# ─────────────────────────────────────────────
# 💡 شادۆ دیزاینەر — UI/UX Excellence
# ─────────────────────────────────────────────

# 1. Skeleton loading screens
grep -rn "skeleton\|Skeleton\|animate-pulse" src/ --include="*.tsx" | wc -l
# 0 = 💡 Skeleton loading بۆ هەموو loading states
# نمرە: 0= +0, 1-3= +1, 4+= +2

# 2. Page transitions
grep -rn "AnimatePresence\|page.*transition\|layout.*animation" src/ --include="*.tsx" | wc -l
# 0 = 💡 Page transitions بۆ smooth navigation

# 3. Micro-interactions
grep -rn "whileHover\|whileTap\|whileFocus\|whileInView" src/ --include="*.tsx" | wc -l
# 0 = 💡 Micro-interactions بۆ buttons, cards
# نمرە: 0= +0, 1-5= +1, 6+= +2

# 4. Scroll animations
grep -rn "useScroll\|useInView\|intersection.*observer\|scroll.*animation" src/ --include="*.tsx" | wc -l
# 0 = 💡 Scroll-triggered animations

# 5. Toast/notification system
grep -rn "toast\|Toast\|Toaster\|sonner" src/ --include="*.tsx" | wc -l
# 0 = 💡 Toast notification system

# 6. Dark mode completeness
DARK_CLASSES=$(grep -rn "dark:" src/ --include="*.tsx" | wc -l)
TOTAL_FILES=$(find src/components -name "*.tsx" -type f | wc -l)
echo "Dark mode coverage: $DARK_CLASSES classes in $TOTAL_FILES files"
# نسبة < 50% = 💡 Dark mode نەتەواوە

# 7. Empty states
grep -rn "empty.*state\|no.*results\|no.*items\|EmptyState" src/ --include="*.tsx" | wc -l
# 0 = 💡 Empty states بۆ lists, search, cart

# 8. Loading button states
grep -rn "disabled.*loading\|isLoading.*disabled\|isPending" src/ --include="*.tsx" | wc -l
# 0 = 💡 Loading states بۆ buttons (prevent double submit)

# ─────────────────────────────────────────────
# 💡 شادۆ ئەدا — Performance & SEO
# ─────────────────────────────────────────────

# 1. Structured data (JSON-LD)
grep -rn "application/ld+json\|jsonLd\|JSON-LD" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 Structured data بۆ products, breadcrumbs, org
# نمرە: 0= +0, 1-2= +1, 3+= +2

# 2. OG image generation
find src/app -name "opengraph-image*" -o -name "og*" | wc -l
# 0 = 💡 Dynamic OG images بۆ social sharing

# 3. generateMetadata usage
grep -rn "generateMetadata\|export.*metadata" src/app/ --include="*.tsx" --include="*.ts" | wc -l
# ئایا هەموو route metadata هەیە؟

# 4. ISR / revalidation
grep -rn "revalidate\|revalidatePath\|revalidateTag\|unstable_cache" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 ISR/cache revalidation بۆ fresh data without full rebuild
# نمرە: 0= +0, 1-3= +1, 4+= +2

# 5. Preloading / Prefetching
grep -rn "preload\|prefetch\|preconnect\|dns-prefetch" src/ --include="*.tsx" --include="*.ts" | wc -l
# 0 = 💡 Resource hints بۆ faster loading

# 6. Image priority
grep -rn "priority" src/ --include="*.tsx" | grep -i "image" | wc -l
# 0 = 💡 priority={true} بۆ above-the-fold images (LCP)

# 7. Font optimization
grep -rn "next/font\|localFont\|font.*subset" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 next/font بۆ zero-layout-shift fonts

# 8. Web Vitals monitoring
grep -rn "web-vitals\|reportWebVitals\|useReportWebVitals\|@vercel/speed-insights" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 Web Vitals monitoring بۆ real user data

# ─────────────────────────────────────────────
# 💡 شادۆ ناوەڕۆک — i18n Maturity
# ─────────────────────────────────────────────

# 1. ICU plural rules
grep -rn "plural\|{count" src/messages/ --include="*.ts" | wc -l
# 0 = 💡 Plural forms بۆ strings ("{count} بەرهەم" vs "{count} بەرهەمەکان")

# 2. ICU select
grep -rn "select\|{gender" src/messages/ --include="*.ts" | wc -l
# 0 = 💡 Gender-aware translations

# 3. Relative time formatting
grep -rn "useFormatter\|formatRelativeTime\|relativeTime" src/ --include="*.tsx" | wc -l
# 0 = 💡 "٣ ڕۆژ لەمەوبەر" بۆ dates

# 4. Number/currency formatting
grep -rn "formatNumber\|formatCurrency\|Intl.NumberFormat" src/ --include="*.tsx" | wc -l
# 0 = 💡 Locale-aware number/currency formatting

# 5. RTL-aware icons
grep -rn "rtl:rotate\|rtl:scale-x\|rtl:.*flip\|ltr:" src/ --include="*.tsx" | wc -l
# 0 = 💡 Icons بۆ RTL flip (arrows, chevrons)

# 6. Language switcher component
grep -rn "LanguageSwitcher\|LocaleSwitcher\|locale.*switch" src/ --include="*.tsx" | wc -l
# 0 = 💡 Language switcher component

# ─────────────────────────────────────────────
# 💡 شادۆ DevOps — Infrastructure Maturity
# ─────────────────────────────────────────────

# 1. Health check endpoint
find src/app/api -path "*health*" -name "route.ts" | wc -l
# 0 = 💡 /api/health بۆ monitoring

# 2. Error tracking (Sentry)
grep -rn "sentry\|Sentry\|@sentry" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "sentry" package.json | wc -l
# 0 = 💡 Sentry بۆ production error tracking
# نمرە: 0= +0, installed= +2

# 3. Analytics
grep -rn "@vercel/analytics\|analytics\|gtag\|GA_" src/ --include="*.ts" --include="*.tsx" | wc -l
# 0 = 💡 Analytics بۆ user behavior tracking

# 4. CSP (Content Security Policy)
grep -rn "Content-Security-Policy\|CSP" src/ middleware.ts --include="*.ts" 2>/dev/null | wc -l
# 0 = 💡 CSP header بۆ XSS prevention

# 5. Rate limiting implementation
grep -rn "rateLimit\|rate-limit\|limiter" src/lib/ --include="*.ts" | wc -l
# 0 = 💡 Rate limiting library بۆ API protection

# 6. Env validation with Zod
grep -rn "z\.string\|z\.object" src/lib/env* 2>/dev/null | wc -l
# 0 = 💡 Runtime env validation بۆ deployment safety

# 7. GitHub Actions CI
find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l
# 0 = 💡 CI/CD pipeline بۆ automated testing

# 8. Preview deployments
grep -rn "preview\|staging\|canary" vercel.json 2>/dev/null | wc -l

# ─────────────────────────────────────────────
# 💡 شادۆ تێستەر (خۆی) — Testing Maturity
# ─────────────────────────────────────────────

# 1. Unit tests
find src/ -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" 2>/dev/null | wc -l
# 0 = 💡 Unit tests بۆ utilities, hooks
# نمرە: 0= +0, 1-10= +1, 11+= +2

# 2. E2E tests
find . -name "*.spec.ts" -path "*/e2e/*" -o -name "*.cy.ts" 2>/dev/null | wc -l
# 0 = 💡 E2E tests (Playwright/Cypress) بۆ critical flows

# 3. Test config
test -f vitest.config.ts -o -f jest.config.ts -o -f playwright.config.ts && echo "✅" || echo "💡 No test framework configured"

# ─────────────────────────────────────────────
# 💡 شادۆ (پشکنین) — Security Hardening
# ─────────────────────────────────────────────

# 1. Security headers completeness
grep -rn "X-Content-Type-Options\|X-Frame-Options\|Strict-Transport\|Referrer-Policy\|Permissions-Policy" middleware.ts src/ --include="*.ts" 2>/dev/null | wc -l
# <3 = 💡 Security headers نەتەواون

# 2. HSTS
grep -rn "Strict-Transport-Security" middleware.ts src/ --include="*.ts" 2>/dev/null | wc -l
# 0 = 💡 HSTS header missing

# 3. Subresource Integrity
grep -rn "integrity=\|crossOrigin" src/ --include="*.tsx" | wc -l

# 4. Safe password hashing
grep -rn "bcrypt\|argon2\|scrypt" src/ --include="*.ts" | wc -l
# (Supabase handles auth — but custom flows?)
```

---

### §17. سیستەمی نمرەدان (Quality Scoring)

```
═══════════════════════════════════════════════════
📊 SCORING SYSTEM — نمرەدانی ئاستی پڕۆژە
═══════════════════════════════════════════════════

هەر بەشێک لە ١٠ نمرە → کۆی گشتی ١٠٠ نمرە

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Build & Types (10 نمرە):
   10 → tsc 0 errors + eslint 0 errors + build success
    8 → build success بەڵام eslint warnings هەن
    5 → tsc errors هەن بەڵام build success
    2 → build fails
    0 → multiple build failures + type errors

2️⃣ Security (10 نمرە):
   10 → 0 critical + 0 error + all checks pass
    8 → 0 critical + 1-2 warnings
    5 → 1+ error (missing auth, no validation)
    2 → 1 critical issue
    0 → multiple critical (secrets exposed, eval, injection)

3️⃣ Code Quality (10 نمرە):
   10 → No console.log, no any, no empty catch, all typed
    8 → 1-3 minor issues (few console.log)
    6 → 4-8 issues
    4 → 9-15 issues
    2 → 15+ issues
    0 → Severe quality problems

4️⃣ Performance (10 نمرە):
   10 → All Image optimized + dynamic imports + no N+1 + <200KB bundle
    8 → 1-2 minor performance issues
    6 → 3-5 issues (few <img>, missing dynamic import)
    4 → N+1 queries + bundle >200KB
    2 → Severe performance issues
    0 → Bundle >400KB + multiple N+1 + no Image

5️⃣ i18n/RTL (10 نمرە):
   10 → 0 physical properties + all strings translated + dir="ltr" on numbers
    8 → 1-5 physical properties remaining
    6 → 6-15 physical properties
    4 → 16-30 + hardcoded strings
    2 → 30+ physical properties + many hardcoded strings
    0 → No RTL support at all

6️⃣ Accessibility (10 نمرە):
   10 → All alt texts + labels + focus styles + semantic HTML + contrast
    8 → 1-3 minor issues
    6 → Missing alt on some images + few focus issues
    4 → Multiple accessibility failures
    2 → No focus management + missing labels
    0 → No accessibility consideration

7️⃣ Architecture & Patterns (10 نمرە):
   10 → React 19 patterns + Server Actions + Suspense + error boundaries
    8 → Some modern patterns adopted
    6 → Mostly traditional patterns (useEffect-heavy)
    4 → No streaming, no Suspense, all API routes
    2 → Monolithic components, no abstraction
    0 → No architecture consideration

8️⃣ DevOps & Infrastructure (10 نمرە):
   10 → CI/CD + Sentry + analytics + env validation + health check
    8 → Vercel deployed + env vars + monitoring
    6 → Deployed + basic env management
    4 → Manual deployment + no monitoring
    2 → No CI/CD, no monitoring, no env validation
    0 → No infrastructure

9️⃣ UX & Design Polish (10 نمرە):
   10 → Skeletons + page transitions + micro-interactions + empty states + dark mode
    8 → Most UX patterns in place
    6 → Basic loading states + some animations
    4 → Simple loading spinner + minimal design
    2 → No loading states + no animations
    0 → No UX consideration

🔟 Data & Backend (10 نمرە):
   10 → RLS + DB functions + realtime + full-text search + audit log
    8 → RLS + optimized queries + indexes
    6 → Basic RLS + direct queries
    4 → No RLS optimization + N+1
    2 → Missing RLS policies
    0 → No security on database layer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 GRADING SCALE:

  90-100 = 🏆 Grade S  — ئاستی Enterprise! سەرکەوتن تەواو
  80-89  = ⭐ Grade A  — ئامادەی Production — ئاستی پرۆفیشناڵ  
  70-79  = ✅ Grade B  — باشە — ئیمپرۆڤمێنت بۆ A/S
  60-69  = 📋 Grade C  — ناوەند — کار پێویستە
  50-59  = ⚠️ Grade D  — خراپ — زۆر کار پێویستە
  <50    = ❌ Grade F  — Fail — دوبارە بنیاتنان

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 ئامانج:
  MVP (Minimum Viable Product): Grade C (60+)
  Production Ready:             Grade B (70+)
  Professional:                 Grade A (80+)  
  Enterprise:                   Grade S (90+)
```

---

### §18. ڕاپۆرتی تەواو — Full Improvement Report

```
🧪 ڕاپۆرتی شادۆ تێستەر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 نمرەی گشتی: XX/100 — Grade [S/A/B/C/D/F]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 نمرەکان بە بەش:
  1️⃣ Build & Types:      X/10
  2️⃣ Security:           X/10
  3️⃣ Code Quality:       X/10
  4️⃣ Performance:        X/10
  5️⃣ i18n/RTL:           X/10
  6️⃣ Accessibility:      X/10
  7️⃣ Architecture:       X/10
  8️⃣ DevOps:             X/10
  9️⃣ UX & Design:        X/10
  🔟 Data & Backend:      X/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL (X):
  [هەر ئیرۆرێکی CRITICAL بنووسە]

❌ ERRORS (X):
  Error #1 [category]:
    📁 file:line
    💬 description
    🔧 → agent name

⚠️ WARNINGS (X):
  [grouped by category → agent]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 IMPROVEMENTS — بۆ بەرزکردنەوەی ئاست

  💡 شادۆ دەڤەلۆپەر (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: useOptimistic بۆ cart/wishlist → optimistic UI
       📁 src/components/shop/AddToCartButton.tsx
       📈 Architecture: +1 نمرە
    💡 #2: Server Actions بۆ contact/newsletter forms
       📁 src/app/api/contact/route.ts → server action
       📈 Architecture: +1 نمرە
    💡 #3: Suspense boundary بۆ product list
       📁 src/app/(store)/products/page.tsx
       📈 Architecture: +1 نمرە

  💡 شادۆ داتابەیس (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: Database function بۆ dashboard stats
       📈 Data & Backend: +1 نمرە
    💡 #2: Realtime subscription بۆ orders
       📈 Data & Backend: +1 نمرە
    💡 #3: Full-text search بۆ products
       📈 Data & Backend: +1 نمرە

  💡 شادۆ دیزاینەر (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: Skeleton loading بۆ هەموو loading states
       📈 UX & Design: +2 نمرە
    💡 #2: Page transitions بە AnimatePresence
       📈 UX & Design: +1 نمرە
    💡 #3: Empty states بۆ cart, wishlist, search
       📈 UX & Design: +1 نمرە

  💡 شادۆ ئەدا (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: JSON-LD structured data بۆ products
       📈 Performance: +1 نمرە (SEO)
    💡 #2: Dynamic OG images
       📈 Performance: +1 نمرە (social sharing)
    💡 #3: ISR + revalidateTag بۆ product pages
       📈 Performance: +1 نمرە

  💡 شادۆ ناوەڕۆک (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: ICU plural rules بۆ count strings
       📈 i18n/RTL: +1 نمرە
    💡 #2: Locale-aware number formatting
       📈 i18n/RTL: +1 نمرە

  💡 شادۆ DevOps (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: Sentry error tracking
       📈 DevOps: +2 نمرە
    💡 #2: GitHub Actions CI pipeline
       📈 DevOps: +2 نمرە
    💡 #3: /api/health endpoint
       📈 DevOps: +1 نمرە

  💡 شادۆ (X ئیمپرۆڤمێنت — +Y نمرە):
    💡 #1: CSP header
       📈 Security: +1 نمرە
    💡 #2: HSTS header
       📈 Security: +1 نمرە

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 خولاسەی ئیمپرۆڤمێنت:

  نمرەی ئێستا:          XX/100 (Grade Y)
  ئەگەر هەموو جێبەجێ بکرێت: XX/100 (Grade Y)
  
  کۆی ئیمپرۆڤمێنت: X دانە
  
  بۆ هەر ئەیگێنت:
    → شادۆ دەڤەلۆپەر: X errors + Y warnings + Z improvements
    → شادۆ داتابەیس:   X errors + Y warnings + Z improvements
    → شادۆ دیزاینەر:   X errors + Y warnings + Z improvements
    → شادۆ ئەدا:       X errors + Y warnings + Z improvements
    → شادۆ ناوەڕۆک:    X errors + Y warnings + Z improvements
    → شادۆ DevOps:     X errors + Y warnings + Z improvements
    → شادۆ:           X errors + Y warnings + Z improvements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ڕێنمای لەوانەی دواتر:
  □ ئەوەڵ: هەموو 🔴 CRITICAL چاک بکە (ئەگەر هەبوو)
  □ دووەم: هەموو ❌ ERROR چاک بکە  
  □ سێیەم: ⚠️ WARNING چاک بکە (بۆ Grade B)
  □ چوارەم: 💡 IMPROVEMENT جێبەجێ بکە (بۆ Grade A/S)
```

---

### §19. Improvement Priority Matrix

```
═══════════════════════════════════════════════════
📊 ئیمپرۆڤمێنت Priority — بەم ترتیبە جێبەجێ بکە:
═══════════════════════════════════════════════════

⬛ Priority 1 — High Impact + Low Effort:
  • Skeleton loading (دیزاینەر) — UX زۆر باش دەبێت
  • Image priority={true} بۆ hero (ئەدا) — LCP باشتر
  • generateMetadata بۆ هەموو pages (ئەدا) — SEO
  • useFormStatus بۆ submit buttons (دەڤەلۆپەر) — UX
  • Empty states بۆ lists (دیزاینەر) — polished feel
  • next/font بۆ Kurdish font (ئەدا) — CLS fix
  • Error recovery buttons (دەڤەلۆپەر) — resilience

⬛ Priority 2 — High Impact + Medium Effort:
  • Server Actions بۆ forms (دەڤەلۆپەر) — modern patterns
  • Sentry setup (DevOps) — production debugging
  • JSON-LD structured data (ئەدا) — rich search results
  • Suspense boundaries (دەڤەلۆپەر) — streaming UX
  • useOptimistic بۆ cart (دەڤەلۆپەر) — instant feedback
  • Realtime بۆ notifications (داتابەیس) — live updates
  • CSP header (DevOps) — security hardening
  • ICU plural rules (ناوەڕۆک) — proper translations

⬛ Priority 3 — Medium Impact + High Effort:
  • Page transitions (دیزاینەر) — smooth navigation
  • Full-text search (داتابەیس) — better product search
  • GitHub Actions CI (DevOps) — automated testing
  • OG image generation (ئەدا) — social media
  • Dark mode completion (دیزاینەر) — theme polish
  • E2E tests (تێستەر) — quality assurance
  • Database functions (داتابەیس) — performance

⬛ Priority 4 — Nice to Have:
  • Unit tests (تێستەر) — code confidence
  • PWA features (DevOps) — offline support
  • Scroll animations (دیزاینەر) — visual flair
  • Audit logging (داتابەیس) — admin tracking
  • Advanced search facets (داتابەیس) — UX
```

---

### §20. Improvement Assignment Rules

```
═══════════════════════════════════════════════════
📋 Improvement → Agent Mapping:
═══════════════════════════════════════════════════

شادۆ دەڤەلۆپەر (Architecture):
  💡 useOptimistic → cart, wishlist, reviews
  💡 useActionState → forms
  💡 useFormStatus → submit buttons  
  💡 Server Actions → mutations
  💡 Suspense boundaries → async components
  💡 Error boundaries + retry → error recovery
  💡 Promise.all → parallel data fetching
  💡 Custom hooks → reusable logic
  💡 Zod infer → end-to-end types
  💡 Compound components → complex UI

شادۆ داتابەیس (Data):
  💡 Database functions → complex aggregations
  💡 Database views → dashboard stats
  💡 Realtime subscriptions → live updates
  💡 Full-text search → product search
  💡 Soft delete → data recovery
  💡 Audit logging → admin actions
  💡 Connection pooling → performance

شادۆ دیزاینەر (UX):
  💡 Skeleton loading → loading states
  💡 Page transitions → smooth navigation
  💡 Micro-interactions → buttons, cards
  💡 Scroll animations → visual engagement
  💡 Toast system → notifications
  💡 Dark mode completion → full support
  💡 Empty states → lists, search, cart
  💡 Loading button states → prevent double-submit

شادۆ ئەدا (Performance + SEO):
  💡 JSON-LD → product, breadcrumb, org
  💡 OG images → dynamic social cards
  💡 generateMetadata → per-route SEO
  💡 ISR + revalidateTag → fresh cache
  💡 Resource hints → preload, prefetch
  💡 Image priority → LCP optimization
  💡 next/font → zero CLS fonts
  💡 Web Vitals monitoring → real data

شادۆ ناوەڕۆک (i18n):
  💡 ICU plural rules → proper counts
  💡 ICU select → gender-aware
  💡 Relative time → "3 ڕۆژ لەمەوبەر"
  💡 Number/currency formatting → locale-aware
  💡 RTL icon flipping → arrows, chevrons
  💡 Language switcher → user control

شادۆ DevOps (Infra):
  💡 /api/health → monitoring endpoint
  💡 Sentry → error tracking
  💡 Analytics → user behavior
  💡 CSP header → XSS prevention
  💡 Rate limiting → API protection
  💡 Env validation → deployment safety
  💡 GitHub Actions → CI/CD
  💡 Preview deploys → PR review

شادۆ (Security):
  💡 Security headers complete → hardening
  💡 HSTS → transport security
  💡 SRI → integrity checks
```

---

