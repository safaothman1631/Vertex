### 📱 §8. پشکنینی PWA و مۆبایل

```
📋 PWA Checklist:
□ manifest.json (name, icons, theme_color, start_url, display: standalone)
□ Service Worker registered (offline support)
□ Install prompt handling (beforeinstallprompt)
□ Offline fallback page
□ App icons (192x192, 512x512, maskable)
□ Meta tags: theme-color, apple-mobile-web-app-capable
□ Splash screen configured
```

---

### 🔐 §9. پشکنینی پاراستنی داتا (Data Privacy & GDPR)

#### A. GDPR Compliance
```
📋 Privacy Checklist:
□ Cookie consent banner (before loading analytics/tracking)
□ Privacy policy page (/privacy)
□ Terms of service page (/terms)
□ Data export capability (Right to Portability)
□ Account deletion capability (Right to Erasure)
□ No PII in logs (email, phone, password, card)
□ Data retention policy
□ Third-party data sharing disclosure
```
```bash
# PII in logs
grep -rn "console\.\(log\|error\|warn\)" src/ --include="*.ts" | grep -i "email\|phone\|password\|address\|card"
```

#### B. Audit Logging
- ئایا admin actions logged ـن (CRUD operations)؟
- ئایا audit trail بۆ sensitive changes هەیە (role changes, deletions)؟

---

### ⚙️ §10. پشکنینی DevOps و Infrastructure

#### A. CI/CD
```
📋 DevOps Checklist:
□ CI pipeline: lint + type-check + test + build + audit
□ Pull request checks enforced
□ Environment variables managed via Vercel/platform dashboard
□ Preview deployments for PRs
□ Rollback strategy available
```

#### B. Monitoring
```
□ Error tracking (Sentry recommended)
□ Vercel Analytics / Speed Insights
□ Health check endpoint (/api/health)
□ Uptime monitoring
□ Alerting for critical errors
```

#### C. Environment
```bash
# env validation check
grep -rn "process.env\." src/ --include="*.ts" | grep -v "NEXT_PUBLIC_\|NODE_ENV" | head -20
# Verify env.ts validation exists
find src/lib -name "env.ts"
```
```typescript
// ✅ Environment Variable Validation — src/lib/env.ts
// Fail fast at startup if required vars are missing
import { z } from 'zod'

const envSchema = z.object({
  // Public (client + server)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  
  // Server-only secrets
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  RESEND_API_KEY: z.string().optional(),
})

// Validate at import time — app won't start with missing vars
export const env = envSchema.parse(process.env)

// Usage: import { env } from '@/lib/env'
// env.STRIPE_SECRET_KEY ✔️ type-safe, validated
// process.env.STRIPE_SECRET_KEY ❌ could be undefined
```

---

### 🌐 §11. پشکنینی Cross-Browser & Compatibility

```
📋 Browser Support:
□ Chrome 90+ ✅
□ Firefox 90+ ✅
□ Safari 15+ ⚠️ (WebP, backdrop-filter, :has())
□ Edge 90+ ✅
□ iOS Safari 15+ ⚠️ (input zoom on font-size < 16px, 100vh bug)

□ CSS: backdrop-filter needs -webkit- prefix for Safari
□ CSS: dvh/svh/lvh instead of vh for iOS
□ JS: ResizeObserver, IntersectionObserver, structuredClone polyfills if needed
□ Test: iOS input zoom → font-size: 16px minimum on inputs
```

---

### 📊 §12. پشکنینی Analytics

```
📋 Analytics Checklist:
□ Analytics loads AFTER cookie consent
□ GA4 or Vercel Analytics configured
□ E-commerce events tracked: view_item, add_to_cart, begin_checkout, purchase
□ Conversion funnel defined
□ No PII sent to analytics (e.g., email in events)
□ Vercel Speed Insights / Web Vitals monitoring
```

---

