### §11. Error Severity Classification

```
═══════════════════════════════════════════════════
📋 Error Severity Levels:
═══════════════════════════════════════════════════

🔴 CRITICAL — دەبێت ئێستا چاک بکرێت:
  • Secret/key exposed in source code
  • eval/new Function usage
  • SQL injection vulnerability
  • dangerouslySetInnerHTML with unsanitized input
  • .env.local committed to git
  • getSession on server (instead of getUser)
  • wildcard CORS
  • NEXT_PUBLIC_ on secret keys

❌ ERROR — دەبێت پێش deploy چاک بکرێت:
  • Build fails (tsc/eslint/next build)
  • Missing auth on protected API routes
  • Empty catch blocks
  • Missing input validation on POST routes
  • <img> instead of <Image />
  • Missing alt text on images
  • open redirect vulnerability

⚠️ WARNING — چاککردنەوە ڕیکۆمێندکراوە:
  • console.log in production code
  • any types
  • TODO/FIXME comments
  • Unused dependencies
  • Physical CSS properties (non-logical)
  • Large client components (>200 lines)
  • Missing dynamic imports for heavy components
  • N+1 queries
  • Hardcoded strings (i18n)
  • @ts-ignore without explanation

ℹ️ INFO — بۆ ئاگاداری:
  • Outdated packages (minor versions)
  • Code style inconsistencies
  • Missing optional files (e.g., loading.tsx)

💡 IMPROVEMENT — بۆ بەرزکردنەوەی ئاستی پڕۆژە:
  • React 19 patterns (useOptimistic, useActionState, useFormStatus)
  • Server Actions instead of unnecessary API routes
  • Streaming + Suspense boundaries
  • Database functions/views for complex queries
  • Realtime subscriptions for live data
  • Advanced caching (ISR, revalidateTag, unstable_cache)
  • Structured data (JSON-LD) for SEO
  • OG image generation
  • Skeleton loading screens
  • Page transitions & micro-interactions
  • Advanced animation patterns
  • CI/CD maturity (preview deploys, staging, canary)
  • Security hardening beyond OWASP Top 10
  • Edge middleware optimization
  • i18n completeness & cultural adaptation
  • Advanced error recovery (retry, fallback, graceful degradation)
  • Type-safe API layer (end-to-end)
  • Monitoring & observability (Sentry, Vercel Analytics)
  • PWA features (service worker, offline)
  • Advanced search (full-text, faceted, autocomplete)
```

---

### §12. Agent Assignment — کام ئەیگێنت چاکی بکاتەوە / ئیمپرۆڤی بکات

```
═══════════════════════════════════════════════════
📋 Error + Improvement → Agent Mapping:
═══════════════════════════════════════════════════

شادۆ دەڤەلۆپەر:
  ❌ Errors:
    • TypeScript errors (TS2304, TS2322, TS2345, TS2339, etc.)
    • ESLint errors
    • Build errors (hydration, server/client, imports)
    • Missing 'use client'
    • Empty catch blocks  
    • Missing try/catch in API routes
    • console.log cleanup
    • any type fixes
    • Missing auth on API routes
    • Input validation (Zod)
    • N+1 query fixes
    • Dynamic import optimization
    • Component splitting
  💡 Improvements:
    • useOptimistic → cart, wishlist, reviews
    • useActionState / useFormStatus → forms
    • Server Actions → replace simple API routes
    • Suspense boundaries → streaming UX
    • Error boundaries + retry → resilience
    • Custom hooks → reusable logic
    • Zod infer → end-to-end type safety

شادۆ داتابەیس:
  ❌ Errors:
    • RLS policy issues
    • Missing indexes
    • Query optimization
    • Schema changes
    • Migration fixes
  💡 Improvements:
    • Database functions → aggregations
    • Views → dashboard stats
    • Realtime → live orders/notifications
    • Full-text search → products
    • Soft delete → data recovery
    • Audit logging → admin tracking

شادۆ ناوەڕۆک:
  ❌ Errors:
    • Hardcoded strings → t() conversion
    • Physical CSS properties → logical
    • Missing translations
    • RTL layout issues
    • Letter-spacing on Arabic/Kurdish
  💡 Improvements:
    • ICU plural rules → counts
    • Number/currency formatting → locale-aware
    • Relative time → "3 ڕۆژ لەمەوبەر"
    • RTL icon flipping → arrows
    • Language switcher component

شادۆ ئەدا:
  ❌ Errors:
    • <img> → <Image /> conversion
    • Missing image dimensions
    • Bundle size > 200KB
    • Missing dynamic imports
    • Caching issues
    • Web Vitals issues
  💡 Improvements:
    • JSON-LD → structured data
    • OG images → social sharing
    • ISR + revalidateTag → fresh cache
    • Image priority → LCP
    • next/font → zero CLS
    • Web Vitals monitoring

شادۆ DevOps:
  ❌ Errors:
    • Environment variable issues
    • Missing security headers
    • CI/CD configuration
    • CORS configuration
    • Build configuration issues
  💡 Improvements:
    • /api/health → monitoring
    • Sentry → error tracking
    • Analytics → user behavior
    • GitHub Actions → CI/CD
    • Env validation (Zod) → deploy safety
    • Rate limiting library

شادۆ دیزاینەر:
  ❌ Errors:
    • Missing focus styles
    • Color contrast issues
    • Semantic HTML improvements
    • Accessibility fixes
    • Missing aria attributes
  💡 Improvements:
    • Skeleton loading → all states
    • Page transitions → smooth nav
    • Micro-interactions → buttons/cards
    • Toast system → notifications
    • Empty states → lists/search/cart
    • Dark mode completion
    • Loading button states

شادۆ:
  ❌ Errors:
    • Exposed secrets (Critical)
    • XSS vulnerabilities
    • SQL injection patterns
    • Open redirect
    • Security header review
  💡 Improvements:
    • CSP header
    • HSTS header
    • Complete security headers
    • SRI verification
```

---

### §13. ڕاپۆرتی نمونە — Full Report

```
🧪 ڕاپۆرتی شادۆ تێستەر
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 خولاسەی گشتی:
  Build:       ✅ Pass
  TypeScript:  ❌ Fail (3 errors)
  ESLint:      ✅ Pass (2 warnings)
  Security:    ⚠️ 2 issues
  Quality:     ⚠️ 5 issues
  Performance: ⚠️ 3 issues
  i18n/RTL:    ⚠️ 8 issues
  A11y:        ⚠️ 2 issues
  Dependencies: ✅ Clean (1 warning)
  Environment: ✅ Clean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL (0):
  (none — 🎉)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ ERRORS (3):

  Error #1 [TypeScript TS2322]:
    📁 src/app/api/checkout/route.ts:42
    💬 Type 'string | undefined' is not assignable to type 'string'
    🔧 → شادۆ دەڤەلۆپەر

  Error #2 [TypeScript TS2339]:
    📁 src/components/shop/ProductCard.tsx:18
    💬 Property 'slug' does not exist on type 'Product'
    🔧 → شادۆ دەڤەلۆپەر

  Error #3 [TypeScript TS7006]:
    📁 src/components/admin/AdminOrdersClient.tsx:55
    💬 Parameter 'order' implicitly has an 'any' type
    🔧 → شادۆ دەڤەلۆپەر

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ WARNINGS (20):

  Security:
    ⚠️ #1: No rate limiting on /api/contact
      🔧 → شادۆ دەڤەلۆپەر
    ⚠️ #2: Missing input validation on /api/newsletter (POST)
      🔧 → شادۆ دەڤەلۆپەر

  Quality:
    ⚠️ #3: 5x console.log in production code
    ⚠️ #4: 2x TODO comments
    ⚠️ #5: 1x empty catch block (src/lib/email.ts:23)
    ⚠️ #6: 3x 'any' type usage
    ⚠️ #7: AdminDashboardClient.tsx is 450 lines (consider splitting)
  
  Performance:
    ⚠️ #8: 2x <img> instead of next/image
    ⚠️ #9: No dynamic import for chart component
    ⚠️ #10: N+1 query in src/app/api/admin/orders/route.ts
  
  i18n/RTL:
    ⚠️ #11-18: 8x physical CSS properties (ml-, mr-, pl-, pr-, text-left, etc.)
  
  Accessibility:
    ⚠️ #19: 2x images missing alt text
    ⚠️ #20: 1x outline-none without focus-visible
  
  Dependencies:
    ⚠️ #21: 1 moderate vulnerability (npm audit)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ئەنجام:
  ❌ 3 ئیرۆر — دەبێت چاک بکرێنەوە
  ⚠️ 21 ئاگاداری — ڕیکۆمێندکراون

🔧 بۆ چاککردنەوە:
  → شادۆ دەڤەلۆپەر: 3 errors + 10 warnings
  → شادۆ ناوەڕۆک: 8 RTL warnings  
  → شادۆ ئەدا: 3 performance warnings
  → شادۆ دیزاینەر: 2 accessibility warnings
```

---

### §14. Automated Test Scripts

```bash
# ═══════════════════════════════════════════════════
# full-test.sh — ڕان بکە بۆ تاقیکردنەوەی تەواو
# ═══════════════════════════════════════════════════
#!/bin/bash

echo "🧪 شادۆ تێستەر — تاقیکردنەوەی تەواو"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0
WARNINGS=0

# ── TypeScript ──
echo -n "🔧 TypeScript... "
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo "❌ Fail"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Pass"
fi

# ── ESLint ──
echo -n "📏 ESLint... "
if npx eslint . --quiet 2>&1 | grep -q "error"; then
  echo "❌ Fail"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Pass"
fi

# ── Build ──
echo -n "🏗️ Build... "
if npx next build 2>&1 | grep -q "Build error\|Failed"; then
  echo "❌ Fail"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Pass"
fi

# ── Security ──
echo -n "🔒 Secrets... "
if grep -rq "sk_live\|sk_test_[a-zA-Z0-9]\{10,\}" src/ 2>/dev/null; then
  echo "🔴 CRITICAL — Secret exposed!"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Clean"
fi

echo -n "🔒 eval... "
if grep -rq "eval(\|new Function(" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
  echo "🔴 CRITICAL — eval found!"
  ERRORS=$((ERRORS+1))
else
  echo "✅ Clean"
fi

# ── Results ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo "✅ ئامادەیە بۆ دیپلۆی — 0 ئیرۆر"
else
  echo "❌ $ERRORS ئیرۆر — دەبێت چاک بکرێنەوە"
fi
```

---

### §15. چەکلیستی تەواو

```
═══════════════════════════════════════════════════
📋 QA MASTER CHECKLIST — ٥٠ خاڵ
═══════════════════════════════════════════════════

── Build ──
□ tsc --noEmit: 0 errors
□ eslint: 0 errors
□ next build: success
□ No build warnings (ideally)

── TypeScript ──
□ strict: true enabled
□ No 'any' types
□ No @ts-ignore without explanation
□ All function parameters typed
□ No unused imports/variables

── Security ──
□ No exposed secrets in code
□ No eval/new Function
□ No dangerouslySetInnerHTML (or sanitized)
□ No wildcard CORS
□ No NEXT_PUBLIC_ on secrets
□ getUser not getSession on server
□ All API routes have auth (except public ones)
□ All POST routes validate input (Zod)
□ Rate limiting on public endpoints
□ .env.local in .gitignore
□ .env.local not committed

── Code Quality ──
□ No console.log (except error/warn)
□ No empty catch blocks
□ No TODO/FIXME (or documented)
□ No files > 400 lines
□ All hooks in 'use client' components
□ All async pages have loading.tsx

── Performance ──
□ next/image instead of <img>
□ All Image components have width/height or fill
□ Heavy components dynamically imported
□ No N+1 queries
□ Bundle size < 200KB per route
□ First Load JS < 100KB per route

── i18n/RTL ──
□ No physical properties (ml, mr, pl, pr)
□ No text-left/right (use start/end)
□ No left/right positioning (use start/end)
□ No physical border-radius
□ Price/phone/email have dir="ltr"
□ No hardcoded strings in JSX
□ All 4 language files consistent
□ No letter-spacing on Kurdish/Arabic

── Accessibility ──
□ All images have alt text
□ All inputs have labels/aria-label
□ All buttons have type attribute
□ <html> has lang attribute
□ No outline-none without focus-visible
□ Semantic HTML used (nav, main, etc.)
□ Color contrast ≥ 4.5:1

── Environment ──
□ middleware.ts exists and works
□ robots.ts / sitemap.ts exist
□ not-found.tsx exists
□ error.tsx exists at all route levels

── Dependencies ──
□ npm audit: no high/critical
□ No unused dependencies
```

---

### §16. Improvement Audit — ئۆدیتی ئیمپرۆڤمێنت بۆ هەموو ئەیگێنتەکان
