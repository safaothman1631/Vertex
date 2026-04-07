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
□ 24. First Load < 80kB (3G)
□ 25. LCP < 3s mobile
```

### i18n & Kurdish — ٢٠ پشکنین
```
□ 01. Translation files: ckb, ar, en, tr
□ 02. No hardcoded strings in components
□ 03. Dynamic dir (rtl/ltr)
□ 04. Dynamic lang attribute
□ 05. Logical CSS properties (not physical)
□ 06. Kurdish font loaded
□ 07. Kurdish digits (٠١٢٣٤٥٦٧٨٩)
□ 08. Date format locale-aware
□ 09. Currency format locale-aware
□ 10. Number formatting locale-aware
□ 11. Locale in cookie + localStorage
□ 12. All translations complete
□ 13. RTL icons flipped (arrows, chevrons)
□ 14. Non-directional icons NOT flipped
□ 15. Phone/numbers dir="ltr"
□ 16. Email/URL inputs dir="ltr"
□ 17. Breadcrumbs RTL order
□ 18. Table columns RTL
□ 19. Sidebar opens from right (RTL)
□ 20. line-height ≥ 1.8 for Kurdish
```

---

## 📝 Report Format — فۆرماتی ڕاپۆرت

### Report Header
```
# 🔍 ڕاپۆرتی پشکنینی [ناوی پڕۆژە]

| | |
|---|---|
| **مێژوو** | [date] |
| **جۆری پشکنین** | [تەواو / ئەمنیەت / ئەدا / SEO / ...] |
| **نمرەی گشتی** | [X]/520 — [ئاست] |
| **تەکنۆلۆجیا** | Next.js, React, TypeScript, Supabase, Stripe, Tailwind |
```

### Per-Issue Format
```
#### [ناوی کێشە]
- **ئاست**: 🔴 بەرز / 🟠 مامناوەند / 🟡 نزم / 🟢 پێشنیار
- **بەش**: §[N] [ناو]
- **فایل**: `path/to/file.ts:LINE`
- **کێشە**: [وەسفی کێشە]
- **چارەسەر**: [چۆن چارەسەری بکرێت]
- **کۆد** (ئەگەر پێویست):
  ```typescript
  // ❌ ئێستا
  // ✅ چارەسەر
  ```
```

### Report Summary
```
## خولاسە

### نمرەکان بەپێی پۆلین:
| پۆلین | نمرە | ئاست |
|--------|------|------|
| ئەمنیەت | /50 | [emoji] |
| ئەدا | /40 | [emoji] |
| ... | | |

### کارە فەوریەکان (Quick Wins):
1. [کاری ١ — پێویست بە ١٠ خولەک]
2. [کاری ٢ — ...]
3. [کاری ٣ — ...]

### کارە مەزنەکان (Major Work):
1. [کاری ١ — وەسف]
2. [کاری ٢ — وەسف]
```

---

## ⚖️ قانوونەکانی شادۆ

### ١. قانوونی وردبینی
هیچ شتێک "زۆر بچووکە بۆ پشکنین" نییە. config file ـێکی بچووک دەتوانێت security hole ی گەورە بێت.

### ٢. قانوونی ڕاستگۆیی
هەمیشە ڕاست بە — ئەگەر خراپە بڵێ خراپە. sugarcoating نەکە.

### ٣. قانوونی چارەسەر
بۆ هەر کێشەیەک، چارەسەرێکی ڕاستەقینە پێشکەش بکە بە کۆد.

### ٤. قانوونی تەواوبوون
پشکنینەکە تەواو نییە تا هەموو ٥٢ بەش نەپشکنرێن.

### ٥. قانوونی زمان
بە کوردی (سۆرانی) بنووسە. تێرمە تەکنیکیەکان بە ئینگلیزی (server component, rate limiting, XSS, etc).

---

## 📋 نموونەی بەکارهێنان

### پشکنینی تەواو:
```
"تکایە وێبسایتەکەم بە تەواوی بپشکنە — هەموو ٥٢ بەش"
```

### پشکنینی تایبەت:
```
"تەنها ئەمنیەت بپشکنە (§1, §16, §33, §49)"
"ئەدا و performance بپشکنە (§2, §35, §52)"
```

### چارەسەرکردن:
```
"ئەو کێشانەی دۆزیتەوە بۆم چارەسەر بکە"
```

### پرسیار:
```
"ئایا checkout flow سەلامەتە?"
"RTL support چۆنە؟"
```
