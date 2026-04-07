# شادۆ پلانساز — Reference: Feature Expansion & Architecture Patterns

## ١. چۆن بیرۆکەیەکی بچووک شیکار دەکەیت

### مەتۆدی ٥ لایەن (5-Layer Expansion):

```
لایەنی ١: ئەوەی بەکارهێنەر وتی (Explicit)
  → وشە بە وشە ئەوەی داوای کردووە

لایەنی ٢: ئەوەی پێویستە بەڵام نەیوتووە (Implicit Requirements)  
  → بۆ نمونە "فرۆشتنی ئۆنلاین" = cart + checkout + payment + order tracking
  → بۆ نمونە "ئەکاونت" = login + register + reset password + profile + settings

لایەنی ٣: ئەوەی UX باشی پێویستی پێیە (UX Essentials)
  → search, filters, sorting, pagination, empty states, loading states
  → error handling, success feedback, confirmation dialogs
  → breadcrumbs, back navigation, 404 pages

لایەنی ٤: ئەوەی بازاڕەکە پێویستی پێیەتی (Market Needs)
  → Kurdistan/Iraq: WhatsApp contact, phone-first design, IQD currency
  → RTL support (Kurdish + Arabic), 4 languages
  → SMS نەک تەنها email, cash on delivery option

لایەنی ٥: ئەوەی Admin پێویستی پێیە (Admin Needs)
  → ئەگەر storefront هەیە → Admin panel پێویستە
  → dashboard, CRUD بۆ هەر entity, users management
  → orders management, analytics, notifications, backups
```

---

## ٢. خشتەی Feature Dependency

کاتێک فیچەرێک ئاماژە پێ دەکرێت، ئەمانەش **ئۆتۆماتیک** پێویستن:

```
فیچەری سەرەکی → فیچەرە پێویستەکان
═══════════════════════════════════════════

بەرهەم/Products →
  ├── لیستی بەرهەم (grid/list + filter + sort + search + pagination)
  ├── لاپەڕەی تاک بەرهەم (images, description, specs, price, stock)
  ├── کاتیگۆری (categories with hierarchy)
  ├── براند (brands with logos)
  ├── variants (size, color, model)
  ├── بەراوردکردن (compare 2-4 products)
  ├── دواین بینراوەکان (recently viewed)
  ├── پرسیار و وەڵام (Q&A)
  ├── هەڵسەنگاندن (reviews + ratings)
  └── stock alert (notify when back in stock)

Auth →
  ├── چوونەژوورەوە (login — email/password)
  ├── تۆمارکردن (register with email verification)
  ├── وشەی نهێنی لەبیرکراو (forgot/reset password)
  ├── email confirmation callback
  ├── middleware (session refresh, protected routes)
  └── profiles table (name, phone, avatar, role)

سەبەتە/Cart →
  ├── زیادکردن/لابردن/گۆڕینی ژمارە
  ├── persistent (Zustand + localStorage)
  ├── سەبەتەی لاپەڕە (cart page)
  ├── سەبەتەی لاوەکی (cart sidebar/drawer)
  └── کوپۆن (coupon code apply)

پارەدان/Checkout →
  ├── فۆڕمی ناونیشان (address form)
  ├── هەڵبژاردنی شێوازی گەیاندن (shipping method)
  ├── Stripe Checkout Session
  ├── Stripe Webhook (payment confirmation)
  ├── لاپەڕەی سەرکەوتوو (success page)
  ├── email بۆ فەرمان (order confirmation email)
  └── داشکاندن/کوپۆن لە checkout

فەرمانەکان/Orders →
  ├── لیستی فەرمانەکانی بەکارهێنەر
  ├── وردەکاری فەرمان (order detail)
  ├── شوێنکەوتن (order tracking/status)
  ├── هەڵوەشاندنەوە (cancel order)
  ├── گەڕاندنەوە (return request)
  └── email notification لە هەر گۆڕانکاریەک

لیستی خواست/Wishlist →
  ├── زیادکردن/لابردن
  ├── لاپەڕەی wishlist
  └── persistent (Zustand + localStorage)

پەیوەندی/Contact →
  ├── فۆڕمی پەیوەندی
  ├── نەخشە (map with address)
  ├── WhatsApp link
  ├── phone/email display
  └── rate limiting بۆ spam prevention

Admin Panel →
  ├── داشبۆرد (stats: revenue, orders, users, products)
  ├── بەرهەمەکان CRUD
  ├── فەرمانەکان (view, update status, tracking)
  ├── بەکارهێنەران (list, role management)
  ├── کاتیگۆری CRUD
  ├── براند CRUD
  ├── کوپۆنەکان CRUD
  ├── پرۆمۆشنەکان (promotions/banners)
  ├── نامەکان (contact messages inbox)
  ├── ئاگادارکردنەوەکان (notifications system)
  ├── سیستەم (settings, maintenance)
  ├── backup (database backup/restore)
  ├── ژێرکرەش (trash/soft delete)
  └── audit log

Static Pages →
  ├── سەرەکی (homepage — hero, featured, testimonials)
  ├── مەرجەکان (terms & conditions)
  ├── تایبەتمەندی (privacy policy)
  └── 404 (not found)

SEO & Meta →
  ├── metadata بۆ هەموو لاپەڕە
  ├── Open Graph / Twitter Cards
  ├── JSON-LD structured data
  ├── sitemap.xml (dynamic)
  ├── robots.txt
  ├── manifest.json (PWA)
  └── hreflang بۆ ٤ زمان

ئاگاداری/Notifications →
  ├── in-app notifications (bell icon)
  ├── email notifications (Resend)
  ├── newsletter subscription
  └── stock alert notifications

گشتی/Global →
  ├── navbar (logo, search, cart, wishlist, user menu, language switcher)
  ├── footer (links, social, newsletter, copyright)
  ├── search modal (full-text search)
  ├── dark mode toggle
  ├── currency switcher (IQD/USD)
  ├── back to top button
  ├── toast notifications
  ├── loading skeletons
  ├── error boundaries
  └── page transitions
```

---

## ٣. Database Schema Patterns

بۆ هەر entity ـێکی سەرەکی ئەم خشتانە پێویستن:

```
Entity → Tables:
═══════════════

Products →
  products (id, name, slug, description, price, images, stock, category_id, brand_id, ...)
  categories (id, name, slug, parent_id, image)
  brands (id, name, slug, logo)
  product_variants (id, product_id, name, values, price_modifier, stock)
  reviews (id, user_id, product_id, rating, comment, created_at)

Users →
  profiles (id [ref auth.users], full_name, phone, avatar_url, role, ...)
  user_addresses (id, user_id, label, city, address, phone, is_default)

Orders →
  orders (id, user_id, status, total, shipping_address, ...)
  order_items (id, order_id, product_id, quantity, price)

Engagement →
  cart_items (id, user_id, product_id, quantity)
  wishlist (id, user_id, product_id)
  contact_messages (id, name, email, phone, message, ...)
  notifications (id, user_id, type, title, message, read, ...)
  
Commerce →
  coupons (id, code, discount_type, discount_value, ...)
  inventory_log (id, product_id, change, reason, ...)

System →
  trash (id, table_name, record_id, data, deleted_by, ...)
  audit_log (id, user_id, action, table, record_id, ...)
  newsletter_subscribers (id, email, ...)
  stock_subscribers (id, user_id, product_id, ...)
```

---

## ٤. فۆرماتی ئەرکیتەکچەری خەرج (Output Blueprint)

پلانسازەکە ئەم فۆرماتە دەرکات:

### بەشی ١: خولاسەی پڕۆژە
```
📋 ناوی پڕۆژە: [ناو]
📝 وەسف: [١-٢ ڕستە]
🎯 ئامانج: [کێ بەکاری دەهێنێت + بۆ چی]
🌍 بازاڕ: [وڵات/ناوچە]
🗣️ زمانەکان: [لیست]
💰 دراو: [IQD/USD/...]
```

### بەشی ٢: نەخشەی لاپەڕەکان
```
هەر لاپەڕەیەک:
  📄 /path — ناو
     وەسف: [چی دەکات]
     جۆر: [public/protected/admin]
     کۆمپۆنێنتەکان: [لیست]
     API پێویست: [لیست]
     خشتەی داتابەیس: [لیست]
```

### بەشی ٣: نەخشەی API
```
هەر API:
  🔌 METHOD /api/path
     وەسف: [چی دەکات]
     Auth: [public/user/admin]
     Input: [Zod schema]
     Output: [شێوەی وەڵام]
```

### بەشی ٤: نەخشەی داتابەیس
```
هەر خشتەیەک:
  🗄️ table_name
     columns: [لیست بە type]
     RLS: [کێ دەیبینێت/دەیگۆڕێت]
     indexes: [لیست]
     relations: [FK → table]
```

### بەشی ٥: کۆمپۆنێنتەکان
```
هەر کۆمپۆنێنت:
  🧩 ComponentName
     جۆر: server/client
     props: [لیست]
     dependencies: [لیست]
```

### بەشی ٦: Zustand Stores
```
هەر store:
  🏪 storeName
     state: [لیست]
     actions: [لیست]
     persist: بەڵێ/نەخێر
```

### بەشی ٧: i18n Keys
```
بەشێ/namespace:
  key: "English value"
```

### بەشی ٨: خولاسەی ئاماری
```
📊 کۆ:
  لاپەڕە: X
  API Routes: X
  کۆمپۆنێنت: X
  خشتەی داتابەیس: X
  i18n keys: ~X
  Zustand stores: X
```

---

## ٥. تایپی وێبسایت و فیچەرە ستاندارەکان

### E-Commerce (وەک Vertex):
```
ستاندارد:
  products, cart, checkout, orders, wishlist, search, filters,
  categories, brands, reviews, Q&A, compare, recently-viewed,
  auth, profile, settings, addresses, newsletter, contact,
  admin (dashboard, products CRUD, orders, users, categories,
  brands, coupons, promotions, messages, notifications, system,
  backup, trash), SEO, i18n, dark mode, responsive, PWA

ئۆپشناڵ (بەپێی بازاڕ):
  SMS notifications, WhatsApp integration, cash-on-delivery,
  multi-currency, product variants, stock alerts, bulk import,
  analytics dashboard, email marketing, loyalty points,
  affiliate program, gift cards, product bundles
```

### Portfolio / Agency:
```
ستاندارد:
  homepage (hero, services, portfolio, testimonials, CTA),
  about, services, portfolio/projects, contact, blog (optional),
  admin (content management), SEO, i18n, dark mode, animations

ئۆپشناڵ:
  case studies, team page, careers, client portal, booking system
```

### SaaS / Dashboard:
```
ستاندارد:
  landing page, pricing, features, auth, dashboard, settings,
  billing/subscription, admin, API keys, usage stats, docs

ئۆپشناڵ:
  multi-tenant, team management, webhooks, audit log, changelog
```

### Blog / Content:
```
ستاندارد:
  homepage, posts list, post detail, categories, tags, search,
  author page, comments, admin (posts CRUD), SEO, RSS feed

ئۆپشناڵ:
  newsletter, series/collections, reading time, likes, bookmarks
```

---

## ٦. چەکلیستی پلان — ئایا هەمووت لەبیر بوو؟

```
□ Auth system (login, register, reset, email confirm)?
□ Admin panel (dashboard + CRUD بۆ هەر entity)?
□ Error pages (404, 500, error.tsx)?
□ Loading states (loading.tsx, skeletons)?
□ Empty states (no items, no results)?
□ Search functionality?
□ Pagination / infinite scroll?
□ Filters and sorting?
□ Dark mode?
□ Responsive / mobile-first?
□ RTL support (Kurdish/Arabic)?
□ SEO metadata (all pages)?
□ Open Graph / social sharing?
□ sitemap.xml + robots.txt?
□ manifest.json (PWA)?
□ Rate limiting (contact, auth)?
□ Email notifications?
□ Toast / feedback system?
□ Confirmation dialogs (delete, cancel)?
□ Breadcrumbs?
□ Back to top button?
□ Navbar + Footer?
□ Analytics setup?
□ Environment variables documented?
□ Types/interfaces defined?
□ Zustand stores needed?
□ Middleware (auth, session)?
□ CRON jobs (backup, cleanup)?
□ Privacy policy + Terms pages?
□ Newsletter subscription?
□ Soft delete / trash system?
```

---

## ٧. ڕێسای نرخاندنی کات/ئەستەمی (Effort Estimation)

```
بچووک (S) — ١ ریکوێست:
  static page, simple API, utility component

مامناوەند (M) — ٢-٣ ریکوێست:
  CRUD page + API, complex component, auth flow

گەورە (L) — ٤-٦ ریکوێست:
  full feature (e.g., cart system, admin orders, checkout flow)

زۆر گەورە (XL) — ٧+ ریکوێست:
  complete module (e.g., full admin panel, complete e-commerce flow)
```
