### 🔍 §3. پشکنینی SEO

#### A. Metadata
```
📋 SEO Checklist:
□ هەموو لاپەڕەکان metadata ـیان هەیە (title + description)
□ generateMetadata بۆ dynamic pages (products/[slug])
□ Open Graph (og:title, og:description, og:image)
□ Twitter Card tags
□ Canonical URLs
□ Structured data (JSON-LD) بۆ products
```
```bash
# Pages without metadata
for f in $(find src/app -name "page.tsx"); do
  grep -qL "metadata\|generateMetadata" "$f" && echo "⚠️ Missing metadata: $f"
done
```

#### B. Sitemap & Robots
- ئایا `sitemap.ts` هەیە و هەموو public pages لەخۆدەگرێت؟
- ئایا `robots.ts` admin/auth routes block دەکات؟
- ئایا hreflang بۆ multi-language pages هەیە؟
```bash
find src/app -name "sitemap.ts" -o -name "robots.ts"
```

#### C. Semantic HTML
```bash
# Non-semantic clickable elements
grep -rn "onClick" src/ --include="*.tsx" | grep "div\|span" | grep -v "role=\|button"
# Semantic elements count
grep -rn "<main\|<nav\|<header\|<footer\|<article\|<section" src/ --include="*.tsx" | wc -l
```

#### D. JSON-LD Structured Data
- ئایا Product schema بۆ product pages هەیە (name, price, image, availability)؟
- ئایا Organization schema بۆ homepage هەیە؟
- ئایا BreadcrumbList بۆ nested pages هەیە؟

---

### ♿ §4. پشکنینی دەسترەسپێداری (Accessibility — WCAG 2.2 AA)

#### A. Visual
```
📋 Accessibility Checklist:
□ Color contrast ratio ≥ 4.5:1 (text) / ≥ 3:1 (large text)
□ Focus indicators visible (no outline-none بەبێ alternative)
□ Dark mode contrast correct
□ Font size ≥ 16px base (no zoom issues)
□ Touch targets ≥ 44×44px (WCAG 2.5.8)
```

#### B. Keyboard & Screen Reader
```
□ Skip to content link
□ Logical tab order
□ All interactive elements keyboard accessible
□ <img> has alt text (decorative = alt="")
□ Form inputs have <label> with htmlFor
□ aria-label/aria-describedby where needed
□ aria-invalid + aria-describedby بۆ form errors
□ Role attributes on non-semantic interactive elements
□ Live regions (aria-live) بۆ dynamic content
```
```bash
# Missing alt
grep -rn "<img\|<Image" src/ --include="*.tsx" | grep -v "alt="
# Missing labels
grep -rn "<input\|<select\|<textarea" src/ --include="*.tsx" | grep -v "aria-label\|id="
# Click without keyboard
grep -rn "onClick" src/ --include="*.tsx" | grep "div\|span" | grep -v "role=\|tabIndex\|onKeyDown"
# outline-none without alternative
grep -rn "outline-none\|outline-0" src/ --include="*.tsx" | grep -v "focus-visible\|focus:"
```

#### C. Heading Hierarchy
```bash
grep -rn "<h1\|<h2\|<h3\|<h4" src/ --include="*.tsx" | sort
# ئایا h1 تەنها یەکێکە لە هەر لاپەڕەیەک؟
# ئایا heading levels لە ترتیبدان (h1 → h2 → h3, نەک h1 → h3)؟
```

---

### 🧹 §5. پشکنینی جوانی کۆد (Code Quality)

#### A. TypeScript Strictness
```
📋 Code Quality Checklist:
□ strict: true لە tsconfig.json
□ noUnusedLocals: true
□ noUnusedParameters: true
□ no @ts-ignore/@ts-nocheck (if any, justified?)
□ no `any` types (or minimal with justification)
□ Zod schemas بۆ runtime validation
□ satisfies operator بۆ type inference + checking
```
```bash
grep -rn ": any\|as any\|<any>" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "@ts-ignore\|@ts-nocheck\|@ts-expect-error" src/ --include="*.ts" --include="*.tsx"
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP" src/ --include="*.ts" --include="*.tsx"
```

#### B. Error Handling
```
□ هەموو async functions try/catch ـیان هەیە
□ catch blocks بەتاڵ نین (log or rethrow)
□ API routes structured error responses دەگەڕێننەوە
□ Supabase queries error check ـیان هەیە
```
```bash
grep -rn "catch.*{}" src/ --include="*.ts" --include="*.tsx"  # empty catch
grep -rn "\.from(" src/ --include="*.ts" | grep -v "error\|\.catch\|if ("  # unchecked queries
```

#### C. Code Organization
```bash
# Largest files (complexity indicator)
wc -l src/**/*.tsx src/**/*.ts 2>/dev/null | sort -rn | head -20
# console.log artifacts
grep -rn "console\.log\|console\.debug" src/ --include="*.ts" --include="*.tsx" | grep -v "error\|warn" | wc -l
```

---

### 🎨 §6. پشکنینی UI/UX

#### A. Responsive Design
```
📋 UI/UX Checklist:
□ Mobile-first (min-width breakpoints)
□ Breakpoints: sm(640) → md(768) → lg(1024) → xl(1280)
□ Touch targets ≥ 44×44px
□ No horizontal scroll on mobile
□ Loading skeletons (not spinners)
□ Empty states بۆ lists/tables
□ Error states بۆ failed operations
□ Success feedback (toast/notification)
```

#### B. Dark Mode & Theme
```
□ Dark mode support (OS preference + manual toggle)
□ No hardcoded colors — use CSS variables/Tailwind theme
□ Transition smooth between themes
```

#### C. Kurdish/RTL Typography
```
□ Kurdish font loaded (NRT, Noto Sans Arabic)
□ font-feature-settings: 'liga' 1
□ Kurdish digits (٠١٢٣٤٥٦٧٨٩) where appropriate
□ Numbers always LTR (dir="ltr" on price/phone inputs)
□ line-height: 1.8+ بۆ کوردی (لینکی بچووک ناخوێنرێتەوە)
```

---

