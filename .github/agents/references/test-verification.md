### قۆناغی ١: Build Verification — تاقیکردنەوەی بنیاتنان

```bash
# ═══════════════════════════════════════════════════
# ئەمانە لە ترتیبدا ڕان بکە — هیچ یەکێک fail نابێت!
# ═══════════════════════════════════════════════════

# ١. TypeScript type checking — هەموو type errors
npx tsc --noEmit 2>&1

# ٢. ESLint — هەموو lint errors  
npx eslint . 2>&1

# ٣. Next.js Build — هەموو build errors
npx next build 2>&1
```

#### ١.١ — TypeScript Error Categories
```
═══════════════════════════════════════════════════
📋 TypeScript Error Types — بزانە و ڕاپۆرت بکە:
═══════════════════════════════════════════════════

TS2304: Cannot find name 'X'
  → variable/function/type نەدۆزرایەوە
  → هۆکار: import missing, typo
  → چاککەر: شادۆ دەڤەلۆپەر

TS2322: Type 'X' is not assignable to type 'Y'
  → type mismatch
  → هۆکار: wrong type, missing property
  → چاککەر: شادۆ دەڤەلۆپەر

TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
  → function argument type wrong
  → هۆکار: wrong argument, missing conversion
  → چاککەر: شادۆ دەڤەلۆپەر

TS2339: Property 'X' does not exist on type 'Y'
  → property لەسەر type نییە
  → هۆکار: type definition نادروستە
  → چاککەر: شادۆ دەڤەلۆپەر

TS2307: Cannot find module 'X'
  → module/file نەدۆزرایەوە
  → هۆکار: wrong import path, missing package
  → چاککەر: شادۆ دەڤەلۆپەر / شادۆ DevOps (ئەگەر package)

TS7006: Parameter 'X' implicitly has an 'any' type
  → type missing on function parameter
  → هۆکار: strict mode complaint
  → چاککەر: شادۆ دەڤەلۆپەر

TS18046: 'X' is of type 'unknown'
  → unknown type بەبێ narrowing
  → هۆکار: catch(error) بەبێ type check
  → چاککەر: شادۆ دەڤەلۆپەر

TS2554: Expected X arguments, but got Y
  → پارامیتەری function هەڵەیە
  → چاککەر: شادۆ دەڤەلۆپەر

TS6133: 'X' is declared but its value is never read
  → unused variable/import
  → هۆکار: قاش بوونی refactor
  → چاککەر: شادۆ دەڤەلۆپەر
```

#### ١.٢ — ESLint Error Categories
```
═══════════════════════════════════════════════════
📋 ESLint Error Types — بزانە:
═══════════════════════════════════════════════════

react-hooks/rules-of-hooks
  → Hook calling rules violation
  → هۆکار: hook inside condition/loop
  → Critical! → شادۆ دەڤەلۆپەر

react-hooks/exhaustive-deps
  → Missing dependencies in useEffect/useCallback
  → هۆکار: dependency array incomplete
  → چاککەر: شادۆ دەڤەلۆپەر

@next/next/no-img-element
  → <img> instead of <Image />
  → هۆکار: next/image نەبەکارهێنراوە
  → چاککەر: شادۆ دەڤەلۆپەر / شادۆ ئەدا

@typescript-eslint/no-unused-vars
  → Unused variable
  → چاککەر: شادۆ دەڤەلۆپەر

no-console
  → console.log in production code
  → چاککەر: شادۆ دەڤەلۆپەر

@typescript-eslint/no-explicit-any
  → Explicit 'any' type
  → چاککەر: شادۆ دەڤەلۆپەر
```

#### ١.٣ — Build Error Categories
```
═══════════════════════════════════════════════════
📋 Next.js Build Errors — بزانە:
═══════════════════════════════════════════════════

"Server Error: ... is not defined"
  → variable/import missing لە server component
  → چاککەر: شادۆ دەڤەلۆپەر

"Hydration mismatch" 
  → Server vs Client HTML جیاوازە
  → هۆکار: useState initial value, Date, random
  → چاککەر: شادۆ دەڤەلۆپەر

"Error: Event handlers cannot be passed to Client Component props"
  → onClick لە Server Component
  → هۆکار: 'use client' missing
  → چاککەر: شادۆ دەڤەلۆپەر

"Dynamic server usage: headers/cookies"
  → static page trying to read headers
  → هۆکار: missing export const dynamic = 'force-dynamic'
  → چاککەر: شادۆ دەڤەلۆپەر

"Error occurred prerendering page"
  → SSG/ISR error — data fetching failed
  → هۆکار: missing env var, database connection
  → چاککەر: شادۆ دەڤەلۆپەر / شادۆ DevOps
```

---

### قۆناغی ٢: Route Verification — تاقیکردنەوەی ڕۆتەکان

```bash
# ═══════════════════════════════════════════════════
# هەموو فایلەکان بدۆزەوە
# ═══════════════════════════════════════════════════

# ١. هەموو page.tsx فایلەکان
find src/app -name "page.tsx" -type f | sort

# ٢. هەموو route.ts فایلەکان (API)
find src/app/api -name "route.ts" -type f | sort

# ٣. هەموو layout.tsx فایلەکان
find src/app -name "layout.tsx" -type f | sort

# ٤. loading.tsx فایلەکان
find src/app -name "loading.tsx" -type f | sort

# ٥. error.tsx فایلەکان
find src/app -name "error.tsx" -type f | sort

# ٦. not-found.tsx فایلەکان
find src/app -name "not-found.tsx" -type f | sort
```

#### ٢.١ — Store Routes Matrix
```
═══════════════════════════════════════════════════
📋 Store Routes — هەموو ڕۆتەکان تاقی بکەوە:
═══════════════════════════════════════════════════

| ڕۆت | page.tsx | loading.tsx | error.tsx | تاقی |
|------|---------|-------------|-----------|------|
| / | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /products | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /products/[slug] | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /cart | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /checkout | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /wishlist | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /orders | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /settings | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /contact | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /terms | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /privacy | ✅/❌ | ✅/❌ | ✅/❌ | □ |

📋 Auth Routes:
| /login | ✅/❌ | — | — | □ |
| /register | ✅/❌ | — | — | □ |
| /reset-password | ✅/❌ | — | — | □ |

📋 Admin Routes:
| /admin | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/products | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/orders | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/users | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/brands | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/categories | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/coupons | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/messages | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/notifications | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/promotions | ✅/❌ | ✅/❌ | ✅/❌ | □ |
| /admin/backup | ✅/❌ | — | — | □ |
| /admin/trash | ✅/❌ | — | — | □ |
| /admin/system | ✅/❌ | — | — | □ |
```

#### ٢.٢ — API Routes Matrix
```
═══════════════════════════════════════════════════
📋 API Routes — هەموو endpoints تاقی بکەوە:
═══════════════════════════════════════════════════

| Route | Methods | Auth | تاقی |
|-------|---------|------|------|
| /api/account | GET/PUT | ✅ user | □ |
| /api/admin/* | GET/POST/PUT/DELETE | ✅ admin | □ |
| /api/checkout | POST | ✅ user | □ |
| /api/contact | POST | ❌ public | □ |
| /api/cron/daily-report | GET | 🔑 CRON_SECRET | □ |
| /api/cron/daily-backup | GET | 🔑 CRON_SECRET | □ |
| /api/forgot-password | POST | ❌ public | □ |
| /api/newsletter | POST | ❌ public | □ |
| /api/notify | POST | varies | □ |
| /api/orders | GET | ✅ user | □ |
| /api/questions | POST | ✅ user | □ |
| /api/returns | POST | ✅ user | □ |
| /api/sms | POST | ✅ admin | □ |
| /api/stock-alert | POST | ✅ user | □ |
| /api/upload | POST | ✅ admin | □ |
| /api/variants | GET/POST | varies | □ |
| /api/webhook | POST | 🔑 Stripe sig | □ |

تاقیکردنەوە بۆ هەر API:
□ ئایا 200 return دەکات بە data ی دروست؟
□ ئایا 401 return دەکات بەبێ auth؟
□ ئایا 400 return دەکات بە invalid input؟
□ ئایا 500 return ناکات (try/catch هەیە)؟
□ ئایا rate limiting جێبەجێ کراوە؟
```

#### ٢.٣ — Missing Files Check
```bash
# ═══════════════════════════════════════════════════
# ئایا فایلی گرنگ نەبوون هەیە؟
# ═══════════════════════════════════════════════════

# ── Global files ──
test -f src/app/layout.tsx && echo "✅ Root layout" || echo "❌ MISSING: Root layout"
test -f src/app/not-found.tsx && echo "✅ 404 page" || echo "❌ MISSING: 404 page"
test -f src/app/error.tsx && echo "✅ Root error" || echo "❌ MISSING: Root error"
test -f src/app/globals.css && echo "✅ Global CSS" || echo "❌ MISSING: Global CSS"
test -f src/app/robots.ts && echo "✅ robots.ts" || echo "❌ MISSING: robots.ts"
test -f src/app/sitemap.ts && echo "✅ sitemap.ts" || echo "❌ MISSING: sitemap.ts"
test -f src/app/manifest.ts && echo "✅ manifest.ts" || echo "❌ MISSING: manifest.ts"
test -f middleware.ts && echo "✅ middleware.ts" || echo "❌ MISSING: middleware.ts"

# ── Config files ──
test -f next.config.ts && echo "✅ next.config.ts" || echo "❌ MISSING: next.config.ts"
test -f tsconfig.json && echo "✅ tsconfig.json" || echo "❌ MISSING: tsconfig.json"
test -f package.json && echo "✅ package.json" || echo "❌ MISSING: package.json"
test -f .gitignore && echo "✅ .gitignore" || echo "❌ MISSING: .gitignore"
test -f vercel.json && echo "✅ vercel.json" || echo "❌ MISSING: vercel.json"

# ── Store route groups ──
test -f "src/app/(store)/layout.tsx" && echo "✅ Store layout" || echo "❌ MISSING: Store layout"
test -f "src/app/(store)/loading.tsx" && echo "✅ Store loading" || echo "❌ MISSING: Store loading"
test -f "src/app/(store)/error.tsx" && echo "✅ Store error" || echo "❌ MISSING: Store error"

# ── Auth route groups ──
test -f "src/app/(auth)/layout.tsx" && echo "✅ Auth layout" || echo "❌ MISSING: Auth layout"

# ── Admin ──
test -f src/app/admin/layout.tsx && echo "✅ Admin layout" || echo "❌ MISSING: Admin layout"
test -f src/app/admin/loading.tsx && echo "✅ Admin loading" || echo "❌ MISSING: Admin loading"
test -f src/app/admin/error.tsx && echo "✅ Admin error" || echo "❌ MISSING: Admin error"
```

---

### قۆناغی ٣: Code Quality Check — تاقیکردنەوەی جۆری کۆد

```bash
# ═══════════════════════════════════════════════════
# ١. console.log لە production code — مەبێت!
# ═══════════════════════════════════════════════════
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "\.test\." | grep -v "// debug"
# ئەگەر هەبوو → ⚠️ Warning (لابردن)
# exception: console.error, console.warn باشن

# ═══════════════════════════════════════════════════
# ٢. console.error بەبێ context — ناکەوێت بۆ debugging
# ═══════════════════════════════════════════════════
grep -rn "console\.error" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
# Check: ئایا هەر یەکێک context/route ناوی هەیە؟
# ✅ console.error('[API /checkout]', error)
# ❌ console.error(error)

# ═══════════════════════════════════════════════════
# ٣. Empty catch blocks — هەڵەکان قووت دەدەن!
# ═══════════════════════════════════════════════════
grep -rn "catch.*{}" src/ --include="*.ts" --include="*.tsx"
grep -rn "catch.*{\s*}" src/ --include="*.ts" --include="*.tsx"
# ئەگەر هەبوو → ❌ Error (هەڵە catch نابێت بەتاڵ بێت)

# ═══════════════════════════════════════════════════
# ٤. @ts-ignore / @ts-nocheck / @ts-expect-error
# ═══════════════════════════════════════════════════
grep -rn "@ts-ignore\|@ts-nocheck\|@ts-expect-error" src/ --include="*.ts" --include="*.tsx"
# ئەگەر هەبوو → ⚠️ Warning (هۆکاری بدۆزەوە)
# @ts-expect-error بە comment ئاکەپت دەکرێت

# ═══════════════════════════════════════════════════
# ٥. any types — type safety دەشکێنێت
# ═══════════════════════════════════════════════════
grep -rn ": any\b\|as any\b\|<any>" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v "\.d\.ts"
# ئەگەر هەبوو → ⚠️ Warning (type ی دروست بنووسە)

# ═══════════════════════════════════════════════════
# ٦. TODO / FIXME / HACK / XXX / TEMP
# ═══════════════════════════════════════════════════
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP" src/ --include="*.ts" --include="*.tsx"
# بنووسەیان — بۆ ئاگاداری team ە

# ═══════════════════════════════════════════════════
# ٧. Unused imports (TypeScript/ESLint دەیانگرێت)
# ═══════════════════════════════════════════════════
# tsc --noEmit هەموو unused imports دەڵێت

# ═══════════════════════════════════════════════════
# ٨. Missing error handling in API routes
# ═══════════════════════════════════════════════════
for f in $(find src/app/api -name "route.ts" -type f); do
  if ! grep -q "try" "$f"; then
    echo "⚠️ No try/catch: $f"
  fi
done

# ═══════════════════════════════════════════════════
# ٩. getSession instead of getUser (server-side)
# ═══════════════════════════════════════════════════
grep -rn "getSession" src/app/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
# ❌ getSession لەسەر server → ناتەحققکراوە! 
# ✅ getUser → authenticated by Supabase Auth
# ئەگەر getSession لەسەر server هەبوو → ❌ Security Error

# ═══════════════════════════════════════════════════
# ١٠. Hardcoded strings (i18n violation)
# ═══════════════════════════════════════════════════
grep -rn ">[A-Z][a-z].*<\/" src/components/ --include="*.tsx" | grep -v "className\|import\|const\|//" | head -20
# Check: ئایا string لە JSX hardcoded هەیە بەبێ t()?

# ═══════════════════════════════════════════════════
# ١١. Large files (>400 lines — شکاندن پێویستە)
# ═══════════════════════════════════════════════════
find src/ -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -20
# فایلی سەرووی ٤٠٠ هێڵ → ⚠️ Warning (بیشکێنە بۆ components)

# ═══════════════════════════════════════════════════
# ١٢. Duplicate code patterns
# ═══════════════════════════════════════════════════
grep -rn "createClient(process.env" src/ --include="*.ts" --include="*.tsx" | wc -l
# ئەگەر >5 → ⚠️ Warning (helper function بنووسە)

# ═══════════════════════════════════════════════════
# ١٣. Missing 'use client' directive
# ═══════════════════════════════════════════════════
# Check components that use hooks without 'use client':
for f in $(find src/components -name "*.tsx" -type f); do
  if grep -q "useState\|useEffect\|useRef\|useCallback\|useMemo\|useTransition\|useOptimistic" "$f"; then
    if ! grep -q "'use client'" "$f"; then
      echo "⚠️ Missing 'use client': $f"
    fi
  fi
done

# ═══════════════════════════════════════════════════
# ١٤. Async component without Suspense
# ═══════════════════════════════════════════════════
grep -rn "async function.*Page\|async function.*Layout" src/app/ --include="*.tsx" | head -20
# هەموو async page/layout → ئایا loading.tsx هەیە لە هەمان folder?

# ═══════════════════════════════════════════════════
# ١٥. RTL issues — logical properties check
# ═══════════════════════════════════════════════════
grep -rn "ml-\|mr-\|pl-\|pr-\|text-left\|text-right\|left-\|right-\|rounded-tl\|rounded-tr\|rounded-bl\|rounded-br" src/ --include="*.tsx" | grep -v "node_modules" | head -30
# ئەگەر هەبوو → ⚠️ Warning → شادۆ ناوەڕۆک چاکی بکاتەوە
# باید: ms- me- ps- pe- text-start text-end start- end- rounded-ss rounded-se rounded-es rounded-ee
```

---

### قۆناغی ٤: Security Check — تاقیکردنەوەی ئەمنیەت

```bash
# ═══════════════════════════════════════════════════
# ١. Exposed secrets in source code
# ═══════════════════════════════════════════════════
grep -rn "sk_live\|sk_test_[a-zA-Z0-9]\{10,\}\|service_role\|secret_key\|whsec_\|re_[a-zA-Z0-9]\{10,\}" src/ --include="*.ts" --include="*.tsx" | grep -v "process\.env\|env\.\|\.example\|\.env"
# ❌ ئەگەر هەبوو → CRITICAL Security Error!

# ═══════════════════════════════════════════════════
# ٢. Hardcoded API keys/URLs
# ═══════════════════════════════════════════════════
grep -rn "eyJ[a-zA-Z0-9]\{20,\}\|supabase\.co.*key=" src/ --include="*.ts" --include="*.tsx" | grep -v "process\.env"
# ❌ JWT token hardcoded → Critical!

# ═══════════════════════════════════════════════════
# ٣. dangerouslySetInnerHTML — XSS risk
# ═══════════════════════════════════════════════════
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx"
# ئەگەر هەبوو → ❌ Error (ئایا sanitized?)
# ئەگەر source trustworthy نییە → Critical!

# ═══════════════════════════════════════════════════
# ٤. eval / new Function — Code injection
# ═══════════════════════════════════════════════════
grep -rn "eval(\|new Function(" src/ --include="*.ts" --include="*.tsx"
# ❌ هەرگیز نابێت هەبێت → Critical Security Error!

# ═══════════════════════════════════════════════════
# ٥. Missing auth on API routes
# ═══════════════════════════════════════════════════
for f in $(find src/app/api -name "route.ts" -type f); do
  # Skip public routes
  case "$f" in
    *webhook*|*contact*|*newsletter*|*forgot-password*|*auth/confirm*) continue ;;
  esac
  if ! grep -q "getUser\|auth\.\|CRON_SECRET\|stripe.*signature" "$f"; then
    echo "⚠️ No auth check: $f"
  fi
done

# ═══════════════════════════════════════════════════
# ٦. NEXT_PUBLIC_ on secrets
# ═══════════════════════════════════════════════════
grep -rn "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*SERVICE_ROLE\|NEXT_PUBLIC_.*PRIVATE" .env* src/ 2>/dev/null
# ❌ ئەگەر secret بە NEXT_PUBLIC_ → Critical!

# ═══════════════════════════════════════════════════
# ٧. SQL injection patterns
# ═══════════════════════════════════════════════════
grep -rn "supabase\.rpc\|\.sql\|raw.*query\|\`.*\$\{" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
# Check: ئایا user input بە ڕاستەوخۆ لە SQL دەچێت؟
# Supabase parameterized queries safe-ن
# ❌ String interpolation لە SQL → Injection!

# ═══════════════════════════════════════════════════
# ٨. CORS wildcard
# ═══════════════════════════════════════════════════
grep -rn "Access-Control-Allow-Origin.*\*\|cors.*\*" src/ --include="*.ts" --include="*.tsx"
# ❌ Wildcard CORS → Security Error!

# ═══════════════════════════════════════════════════
# ٩. Missing input validation
# ═══════════════════════════════════════════════════
for f in $(find src/app/api -name "route.ts" -type f); do
  if grep -q "POST\|PUT\|PATCH" "$f"; then
    if ! grep -q "z\.\|zod\|schema\|validate\|parse" "$f"; then
      echo "⚠️ No input validation: $f"
    fi
  fi
done

# ═══════════════════════════════════════════════════
# ١٠. File upload without validation
# ═══════════════════════════════════════════════════
grep -rn "upload\|formData\|multipart" src/app/api/ --include="*.ts" | head -10
# Check: ئایا file type validation هەیە؟
# Check: ئایا file size limit هەیە؟
# ❌ بەبێ validation → Security Error

# ═══════════════════════════════════════════════════
# ١١. Cookie security
# ═══════════════════════════════════════════════════
grep -rn "cookie\|setCookie\|cookies()" src/ --include="*.ts" --include="*.tsx" | head -10
# Check: ئایا httpOnly, secure, sameSite دانراون؟
# Supabase cookies ئۆتۆماتیک secure-ن

# ═══════════════════════════════════════════════════
# ١٢. Rate limiting check
# ═══════════════════════════════════════════════════
grep -rn "rateLimit\|rate.limit\|rate_limit\|rateLimiter" src/ --include="*.ts"
# ئەگەر API routes بەبێ rate limit → ⚠️ Warning
# بەتایبەتی: /api/contact, /api/newsletter, /api/forgot-password

# ═══════════════════════════════════════════════════
# ١٣. CSRF protection
# ═══════════════════════════════════════════════════
# Next.js Server Actions ئۆتۆماتیک CSRF protection هەیە
# API routes: Check Origin header
grep -rn "origin\|csrf\|csrfToken" src/ --include="*.ts" | head -5

# ═══════════════════════════════════════════════════
# ١٤. Open redirect
# ═══════════════════════════════════════════════════
grep -rn "redirect\|redirectTo\|callbackUrl\|returnUrl\|next=" src/ --include="*.ts" --include="*.tsx" | head -10
# Check: ئایا redirect URL validate کراوە؟
# ❌ redirect بە user-provided URL بەبێ validation → Open Redirect!

# ═══════════════════════════════════════════════════
# ١٥. Sensitive data in logs
# ═══════════════════════════════════════════════════
grep -rn "console\.\(log\|error\|warn\).*password\|console\.\(log\|error\|warn\).*token\|console\.\(log\|error\|warn\).*secret\|console\.\(log\|error\|warn\).*key" src/ --include="*.ts" --include="*.tsx"
# ❌ ئەگەر sensitive data لە logs → Critical!
```

---

### قۆناغی ٥: Dependencies Check

```bash
# ═══════════════════════════════════════════════════
# ١. Vulnerability audit
# ═══════════════════════════════════════════════════
npm audit --audit-level=high 2>&1
# ئەگەر high/critical vulnerabilities هەبوون → ❌ Error
# moderate → ⚠️ Warning

# ═══════════════════════════════════════════════════
# ٢. Outdated packages
# ═══════════════════════════════════════════════════
npm outdated 2>&1
# Major version behind → ⚠️ Warning
# Check: ئایا breaking changes هەیە؟

# ═══════════════════════════════════════════════════
# ٣. Unused dependencies
# ═══════════════════════════════════════════════════
npx depcheck 2>&1 | head -30
# Unused dependency → ⚠️ Warning (لابردن بۆ bundle size)

# ═══════════════════════════════════════════════════
# ٤. License check
# ═══════════════════════════════════════════════════
npx license-checker --summary 2>&1 | head -20
# Check: ئایا GPL/AGPL license هەیە؟ (ئاگاداری بۆ commercial)

# ═══════════════════════════════════════════════════
# ٥. Bundle size check
# ═══════════════════════════════════════════════════
# لە next build output چی دیت؟
# First Load JS > 200KB → ⚠️ Warning
# First Load JS > 300KB → ❌ Error
# Route-specific JS > 100KB → ⚠️ Warning
```

---

### قۆناغی ٦: Performance Check

```bash
# ═══════════════════════════════════════════════════
# ١. Image optimization check
# ═══════════════════════════════════════════════════
grep -rn "<img " src/ --include="*.tsx" | grep -v "next/image\|Image" | grep -v "node_modules"
# ❌ <img> بەبێ next/image → Error (performance + SEO)
# ✅ <Image /> بەکاربهێنە

# ═══════════════════════════════════════════════════
# ٢. Missing Image sizes/width/height
# ═══════════════════════════════════════════════════
grep -rn "<Image" src/ --include="*.tsx" | grep -v "width\|fill" | head -10
# Image بەبێ width/height یان fill → ⚠️ CLS issue

# ═══════════════════════════════════════════════════
# ٣. Unoptimized imports (barrel imports)
# ═══════════════════════════════════════════════════
grep -rn "from 'lucide-react'" src/ --include="*.tsx" | head -5
# ✅ import { Search } from 'lucide-react' — باشە (tree-shakeable)
# ❌ import * as Icons from 'lucide-react' — نەخێر!

# ═══════════════════════════════════════════════════
# ٤. Dynamic imports check
# ═══════════════════════════════════════════════════
grep -rn "dynamic(\|lazy(" src/ --include="*.tsx" --include="*.ts" | head -10
# Heavy components ئایا dynamically imported?
# Modals, charts, maps → دەبێت dynamic بن

# ═══════════════════════════════════════════════════
# ٥. N+1 query check
# ═══════════════════════════════════════════════════
grep -rn "\.map.*await\|\.forEach.*await\|for.*await.*supabase" src/ --include="*.ts" --include="*.tsx"
# ❌ Loop بە await لەناو → N+1 query!
# ✅ Promise.all بەکاربهێنە

# ═══════════════════════════════════════════════════
# ٦. Client-side data fetching without cache
# ═══════════════════════════════════════════════════
grep -rn "useEffect.*fetch\|useEffect.*supabase" src/ --include="*.tsx" | head -10
# ئایا SWR/React Query بەکارهاتووە؟ یان naive fetch?

# ═══════════════════════════════════════════════════
# ٧. Large 'use client' components
# ═══════════════════════════════════════════════════
for f in $(grep -rl "'use client'" src/app/ --include="*.tsx"); do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 200 ]; then
    echo "⚠️ Large client component ($lines lines): $f"
  fi
done
# Client components = more JS sent to browser
```

---

### قۆناغی ٧: Accessibility Check

```bash
# ═══════════════════════════════════════════════════
# ١. Missing alt text on images
# ═══════════════════════════════════════════════════
grep -rn "<Image\|<img" src/ --include="*.tsx" | grep -v "alt=" | head -10
# ❌ Image بەبێ alt → Accessibility Error + SEO Error

# ═══════════════════════════════════════════════════
# ٢. Missing form labels
# ═══════════════════════════════════════════════════
grep -rn "<input\|<textarea\|<select" src/ --include="*.tsx" | grep -v "aria-label\|id=\|aria-labelledby" | head -10
# ئایا label/aria-label هەیە بۆ هەموو input?

# ═══════════════════════════════════════════════════
# ٣. Missing button type
# ═══════════════════════════════════════════════════
grep -rn "<button" src/ --include="*.tsx" | grep -v "type=" | head -10
# <button> بەبێ type= → type="submit" default-ە
# ❌ ئەگەر submit نییە → type="button" پێویستە

# ═══════════════════════════════════════════════════
# ٤. Missing lang attribute
# ═══════════════════════════════════════════════════
grep -rn "<html" src/app/layout.tsx | grep -v "lang="
# ❌ <html> بەبێ lang → Accessibility Error

# ═══════════════════════════════════════════════════
# ٥. Color contrast (manual check)
# ═══════════════════════════════════════════════════
# ئەمە manual-ە — بەڵام ئامادەکردنی:
# □ text-gray-400 لەسەر bg-white → ratio < 4.5:1 → ❌
# □ text-gray-500 لەسەر bg-white → ratio ≈ 4.5:1 → ⚠️
# □ text-gray-600 لەسەر bg-white → ratio > 4.5:1 → ✅

# ═══════════════════════════════════════════════════
# ٦. Focus management
# ═══════════════════════════════════════════════════
grep -rn "outline-none\|outline-0" src/ --include="*.tsx" | grep -v "focus-visible\|focus:" | head -10
# ❌ outline-none بەبێ focus style replacement → Accessibility Error
# ✅ className="outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

# ═══════════════════════════════════════════════════
# ٧. Semantic HTML
# ═══════════════════════════════════════════════════
# Check: ئایا <nav>, <main>, <header>, <footer>, <section>, <article> بەکارهاتوون؟
grep -c "<nav\|<main\|<header\|<footer\|<section\|<article" src/app/layout.tsx src/components/shop/*.tsx 2>/dev/null
```

---

### قۆناغی ٨: i18n/RTL Verification

```bash
# ═══════════════════════════════════════════════════
# ١. Physical properties (باید logical بن)
# ═══════════════════════════════════════════════════
grep -rn "ml-\|mr-\|pl-\|pr-" src/ --include="*.tsx" | grep -v "node_modules" | wc -l
# ئەگەر > 0 → ⚠️ شادۆ ناوەڕۆک چاکی بکاتەوە
# ms- me- ps- pe- بەکاربهێنە

# ═══════════════════════════════════════════════════
# ٢. Physical text-align
# ═══════════════════════════════════════════════════
grep -rn "text-left\|text-right" src/ --include="*.tsx" | grep -v "node_modules" | wc -l
# باید text-start / text-end بێت

# ═══════════════════════════════════════════════════
# ٣. Physical positioning
# ═══════════════════════════════════════════════════
grep -rn "left-\|right-" src/ --include="*.tsx" | grep -v "node_modules\|ChevronLeft\|ChevronRight\|ArrowLeft\|ArrowRight" | wc -l
# باید start- / end- بێت

# ═══════════════════════════════════════════════════
# ٤. Physical border-radius
# ═══════════════════════════════════════════════════
grep -rn "rounded-tl\|rounded-tr\|rounded-bl\|rounded-br" src/ --include="*.tsx" | grep -v "node_modules" | wc -l
# باید rounded-ss/se/es/ee بێت

# ═══════════════════════════════════════════════════
# ٥. Missing dir attribute on LTR content in RTL
# ═══════════════════════════════════════════════════
grep -rn "price\|phone\|email\|sku" src/components/ --include="*.tsx" | grep -v "dir=" | head -10
# ئایا price/phone/email dir="ltr" هەیە؟

# ═══════════════════════════════════════════════════
# ٦. Hardcoded strings check
# ═══════════════════════════════════════════════════
grep -rn ">Add to\|>Buy Now\|>Loading\|>Submit\|>Cancel\|>Delete\|>Save\|>Search" src/ --include="*.tsx" | grep -v "node_modules" | head -10
# ❌ Hardcoded UI strings → شادۆ ناوەڕۆک

# ═══════════════════════════════════════════════════
# ٧. Letter-spacing on Kurdish/Arabic font
# ═══════════════════════════════════════════════════
grep -rn "tracking-\|letter-spacing" src/ --include="*.tsx" --include="*.css" | head -5
# ⚠️ letter-spacing لەسەر Arabic/Kurdish text → خەتی نووسین دەشکێنێت!

# ═══════════════════════════════════════════════════
# ٨. Message files consistency
# ═══════════════════════════════════════════════════
# Check: ئایا هەموو key لە en.ts → لە ckb.ts, ar.ts, tr.ts هەمان key هەیە؟
echo "=== Key counts ==="
grep -c ":" src/messages/en.ts 2>/dev/null
grep -c ":" src/messages/ckb.ts 2>/dev/null
grep -c ":" src/messages/ar.ts 2>/dev/null
grep -c ":" src/messages/tr.ts 2>/dev/null
# ئەگەر ژمارەکان زۆر جیاوازن → ⚠️ Missing translations
```

---

### قۆناغی ٩: Environment & Config Check

```bash
# ═══════════════════════════════════════════════════
# ١. .env.local لە .gitignore
# ═══════════════════════════════════════════════════
grep -q ".env.local" .gitignore && echo "✅ .env.local in .gitignore" || echo "❌ .env.local NOT in .gitignore!"

# ═══════════════════════════════════════════════════
# ٢. .env files committed?
# ═══════════════════════════════════════════════════
git ls-files | grep "^\.env" | grep -v "\.example"
# ❌ ئەگەر .env.local committed → Critical Security!

# ═══════════════════════════════════════════════════
# ٣. next.config.ts security
# ═══════════════════════════════════════════════════
grep -q "poweredByHeader.*false" next.config.ts && echo "✅ poweredByHeader: false" || echo "⚠️ poweredByHeader not disabled"

# ═══════════════════════════════════════════════════
# ٤. TypeScript strict mode
# ═══════════════════════════════════════════════════
grep -q '"strict".*true' tsconfig.json && echo "✅ strict: true" || echo "⚠️ strict mode not enabled"

# ═══════════════════════════════════════════════════
# ٥. ESLint configuration
# ═══════════════════════════════════════════════════
test -f eslint.config.mjs && echo "✅ ESLint configured" || echo "⚠️ No ESLint config"
```

---

### قۆناغی ١٠: Middleware Verification

```bash
# ═══════════════════════════════════════════════════
# middleware.ts — ئایا تەواوە و دروستە؟
# ═══════════════════════════════════════════════════

# ١. ئایا middleware.ts هەیە؟
test -f middleware.ts && echo "✅ middleware.ts exists" || echo "❌ MISSING middleware.ts!"

# ٢. ئایا auth check هەیە؟
grep -q "getUser\|auth\.\|updateSession" middleware.ts 2>/dev/null && echo "✅ Auth check in middleware" || echo "⚠️ No auth in middleware"

# ٣. ئایا matcher config هەیە؟
grep -q "matcher" middleware.ts 2>/dev/null && echo "✅ Matcher configured" || echo "⚠️ No matcher in middleware"

# ٤. ئایا static files exclude کراون؟
grep -q "_next/static\|_next/image\|favicon" middleware.ts 2>/dev/null && echo "✅ Static files excluded" || echo "⚠️ Static files may not be excluded"

# ٥. ئایا security headers هەیە؟
grep -q "CSP\|Content-Security-Policy\|X-Frame" middleware.ts 2>/dev/null && echo "✅ Security headers in middleware" || echo "⚠️ No security headers in middleware"
```

---

