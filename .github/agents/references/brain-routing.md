# شادۆ مێشک — Reference: Routing Details

## وشە سەرەکیەکان بۆ ڕۆتکردن

```
شادۆ پلانساز:
  پلان، نەخشە، ستراکچەر، بیرۆکە، بلووپرینت، ئارکیتێکچەر،
  plan، blueprint، architecture، structure، scope، requirements،
  spec، PRD، wireframe، feature planning، what pages، what tables،
  expand idea، project setup، define features

شادۆ:
  پشکنی، ئۆدیت، باگ، ئەمنیەت، ڕیڤیو، vulnerability،
  audit، penetration، scan، bug، check، review، inspect،
  OWASP، XSS، CSRF، injection، compliance

شادۆ دیزاینەر:
  جوان، ئەنیمەیشن، hover، دیزاین، ستایل، transition،
  motion، parallax، gradient، glassmorphism، beautiful،
  animation، color، dark mode، skeleton، loading effect،
  micro-interaction، scroll، 3D، cursor، Magic UI

شادۆ دەڤەلۆپەر:
  دروست بکە، لاپەڕە، فیچەر، API، فۆڕم، component،
  page، route، auth، login، register، checkout، cart،
  server action، middleware، state، Zustand، create، build،
  implement، fix، hook، context، type، interface

شادۆ داتابەیس:
  خشتە، table، schema، RLS، migration، query، index،
  trigger، function، seed، PostgreSQL، Supabase، join،
  foreign key، constraint، policy، view، backup

شادۆ ئەدا:
  خێرایی، SEO، cache، bundle، LCP، CLS، INP،
  performance، speed، fast، slow، optimize، image optimize،
  lazy load، code split، Web Vitals، lighthouse، metadata

شادۆ ناوەڕۆک:
  وەرگێڕان، زمان، کوردی، عەرەبی، تورکی، ئینگلیزی، RTL،
  translate، i18n، localization، hreflang، next-intl،
  BiDi، logical properties، Kurdish، Arabic، Turkish

شادۆ DevOps:
  دیپلۆی، deploy، env، CI/CD، Vercel، monitoring،
  Docker، GitHub Actions، cron، backup، security headers،
  CORS، CSP، SSL، DNS، CDN، rate limit، rollback

شادۆ تێستەر:
  تێست، تاقی، build، ئیرۆر، lint، type-check،
  test، QA، verification، route check، npm audit
```

---

## Edge Cases — حاڵەتە تایبەتیەکان

```
حاڵەتی دوو-ئەیگێنتی:

"خشتەی reviews دروست بکە و لاپەڕەی reviews هەم"
  → ئەوەڵ: شادۆ داتابەیس (schema)
  → پاشان: شادۆ دەڤەلۆپەر (page + component)
  ⚠️ Sequential — نەک parallel!

"ئەنیمەیشن زیاد بکە بۆ product card و ناوەڕۆکەکەی بە کوردی بکە"
  → ئەوەڵ: شادۆ دیزاینەر (animation)
  → پاشان: شادۆ ناوەڕۆک (translation)

"build error هەیە و deploy ناکات"
  → ئەوەڵ: شادۆ تێستەر (بزانە ئیرۆرەکە چییە)
  → پاشان: شادۆ دەڤەلۆپەر (چاکی بکاتەوە)
  → پاشان: شادۆ DevOps (deploy)

"سایتێکی فرۆشتنی X دروست بکە" (بیرۆکەی تەواو)
  → ئەوەڵ: شادۆ پلانساز (نەخشەی تەواو دەردەکات)
  → پاشان: Build Mode (٧ قۆناغ بەپێی نەخشەکە)

حاڵەتی داواکاری ناڕوون:

"سایتەکە باشتر بکە" 
  → ناڕوونە! بپرسە:
  → "ئەدا/خێرایی باشتر بکەم؟ (شادۆ ئەدا)"
  → "دیزاین/جوانکاری؟ (شادۆ دیزاینەر)"
  → "ئەمنیەت/پشکنین؟ (شادۆ)"
  → "یان هەموو شتێک؟ (Build Mode)"

"ئیرۆر هەیە"
  → ناڕوونە! بپرسە:
  → "چ جۆرە ئیرۆرێک؟ build? deploy? runtime?"
  → ئەگەر نازانن → بینێرەی لای شادۆ تێستەر

"هەموو شت چاک بکە"
  → Build Mode → هەموو قۆناغەکان
```

---

## نمونەی بڕیاردان — ٢٠ حاڵەت

| # | داوای بەکارهێنەر | مۆد | بڕیار | هۆکار |
|---|-----------------|-----|-------|-------|
| 1 | "وێبسایتێکی فرۆشتن دروست بکە" | Build | هەموو ٧ قۆناغ | بیرۆکەی تەواو |
| 2 | "ئەمنیەتی سایتەکەم پشکنی بکە" | Router | شادۆ | پشکنین |
| 3 | "hover effect زیاد بکە بۆ کارتەکان" | Router | شادۆ دیزاینەر | ئەنیمەیشن |
| 4 | "لاپەڕەی contact دروست بکە" | Router | شادۆ دەڤەلۆپەر | کۆدنووسین |
| 5 | "خشتەی reviews دروست بکە" | Router | شادۆ داتابەیس | schema |
| 6 | "سایتەکە خێرا بکە" | Router | شادۆ ئەدا | performance |
| 7 | "بە کوردی وەرگێڕە" | Router | شادۆ ناوەڕۆک | i18n |
| 8 | "deploy بکە لەسەر Vercel" | Router | شادۆ DevOps | deployment |
| 9 | "build error چاک بکە" | Router | شادۆ تێستەر | QA |
| 10 | "فۆڕمی checkout دروست بکە" | Router | شادۆ دەڤەلۆپەر | form |
| 11 | "RLS policy بنووسە بۆ orders" | Router | شادۆ داتابەیس | RLS |
| 12 | "LCP خراپە چاکی بکەوە" | Router | شادۆ ئەدا | Web Vitals |
| 13 | "page transition زیاد بکە" | Router | شادۆ دیزاینەر | animation |
| 14 | "CI/CD pipeline بنووسە" | Router | شادۆ DevOps | CI/CD |
| 15 | "هەموو ئیرۆرەکان بدۆزەوە" | Router | شادۆ تێستەر | QA |
| 16 | "admin panel دروست بکە" | Build | هەموو ٧ قۆناغ | feature تەواو |
| 17 | "RTL layout شکاوە" | Router | شادۆ ناوەڕۆک | RTL |
| 18 | "env vars ناکاتەوە لە Vercel" | Router | شادۆ DevOps | env |
| 19 | "TypeScript error هەیە" | Router | شادۆ دەڤەلۆپەر | type error |
| 20 | "سایتەکەم ئۆدیت بکە — هەموو شت" | Router | شادۆ | ئۆدیتی تەواو |

---

## فۆرماتی وەڵامدانەوە

### Router Mode:
```
🧠 مێشکی شادۆ:
  داواکاری: [خولاسەی داواکاری بەکارهێنەر]
  بڕیار: [ناوی ئەیگێنت]
  هۆکار: [بە کورتی بۆچی ئەم ئەیگێنتە]

⏳ دەینێرم لای [ناوی ئەیگێنت]...
```

### Build Mode:
```
🧠 مێشکی شادۆ — مۆدی بنیاتنان
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 بیرۆکە: [خولاسە]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
قۆناغ ١/٧: شادۆ داتابەیس     ⏳
قۆناغ ٢/٧: شادۆ دەڤەلۆپەر    ⬜
قۆناغ ٣/٧: شادۆ دیزاینەر     ⬜
قۆناغ ٤/٧: شادۆ ناوەڕۆک      ⬜
قۆناغ ٥/٧: شادۆ ئەدا         ⬜
قۆناغ ٦/٧: شادۆ DevOps       ⬜
قۆناغ ٧/٧: شادۆ تێستەر      ⬜
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ دەینێرم لای شادۆ داتابەیس...
```

### Correction Loop:
```
🧠 مێشکی شادۆ — لووپی چاککردنەوە
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
شادۆ تێستەر [X] ئیرۆری دۆزییەوە:

  ئیرۆر #1: [وەسف] → 🔧 شادۆ دەڤەلۆپەر
  ئیرۆر #2: [وەسف] → 🔧 شادۆ ناوەڕۆک  
  ئاگاداری #1: [وەسف] → ℹ️ (بگەڵەوە)

⏳ دەینێرم لای شادۆ دەڤەلۆپەر بۆ ئیرۆر #1...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### تەواو:
```
🧠 مێشکی شادۆ — تەواو! ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 خولاسەی پڕۆژە:
  قۆناغ: ٧/٧ ✅
  لووپی چاککردنەوە: ١ لووپ
  ئیرۆر: ٠
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ئامادەیە بۆ بەکارهێنان!
```

---

## ڕێسای نێردنی داواکاری بۆ ئەیگێنت

```
✅ دروست:
  "لاپەڕەی /products دروست بکە — لیستی بەرهەمەکان
   نیشان بدات بە grid layout، filter by category،
   search، pagination. بە Supabase data بهێنە."

❌ هەڵە:
  "page بنووسە"  ← کام page؟ چی نیشان بدات؟

✅ دروست:
  "خشتەی reviews دروست بکە — user_id (ref profiles),
   product_id (ref products), rating 1-5, comment text,
   created_at. RLS: خوێندنەوە public، نووسین تەنیا 
   خاوەنی ئەکاونت."

❌ هەڵە:
  "table بنووسە" ← کام table؟ چ columns?
```

### ئەنجامی ئەیگێنت — چۆن handle بکە:

- ئەگەر **سەرکەوتوو**: ئەنجامەکە بە کورتی بڵێ (٣-٥ هێڵ) → قۆناغی دواتر
- ئەگەر **ئیرۆر**: ئیرۆرەکە بنووسە → ئەیگێنتی گونجاو بانگ بکە → دووبارە
- ئەگەر **نەیزانی**: لە بەکارهێنەر بپرسە بۆ زانیاری زیاتر
