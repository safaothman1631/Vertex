# NexPOS — Workspace Instructions

## Project Overview
NexPOS (Vertex) is an e-commerce web app for professional POS equipment (barcode scanners, receipt printers, cash drawers, POS terminals). Built for the Kurdistan Region / Iraq market with 4-language support.

## Tech Stack
- **Framework**: Next.js 16 (App Router, RSC, Server Actions, Turbopack)
- **React**: 19 (React Compiler enabled via babel-plugin-react-compiler)
- **Language**: TypeScript 5 (strict mode)
- **Database**: Supabase (PostgreSQL, RLS, Realtime, Storage, Edge Functions)
- **Auth**: Supabase Auth with PKCE flow — always use `getUser()` on server, NEVER `getSession()`
- **Payments**: Stripe (Checkout Sessions, Webhooks)
- **State**: Zustand 5 (cart, compare, recently-viewed)
- **Styling**: Tailwind CSS 4 (JIT, dark mode, RTL via logical properties)
- **Animation**: Motion (Framer Motion) 12
- **i18n**: next-intl 4 — 4 locales: `en`, `ckb` (Kurdish Sorani), `ar`, `tr`
- **Email**: Resend
- **Icons**: lucide-react (tree-shakeable named imports only)

## Project Structure
```
src/
├── app/
│   ├── (auth)/          # Login, register, reset-password
│   ├── (store)/         # Public storefront pages
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   └── auth/confirm/    # Auth callback
├── components/
│   ├── admin/           # Admin components
│   ├── shop/            # Store components
│   └── ui/              # Shared UI components
├── contexts/            # LocaleProvider, PreferencesProvider
├── data/                # Static data
├── hooks/               # Custom hooks
├── lib/                 # Utilities (supabase-server, supabase-client, env, rate-limit, email)
├── messages/            # i18n translations (en.ts, ckb.ts, ar.ts, tr.ts)
├── store/               # Zustand stores (cart, compare, recently-viewed)
├── types/               # TypeScript type definitions
└── proxy.ts             # Middleware Supabase session refresh
```

## Critical Rules

### Authentication
- **Server-side**: Always use `getUser()` — NEVER `getSession()` (unverified on server)
- **Client-side**: `createClient()` from `@/lib/supabase-client`
- **Server-side**: `createClient()` from `@/lib/supabase-server` (cookie-based)
- **Admin operations**: `createAdminClient()` from `@/lib/supabase-server` (service role)

### RTL & i18n
- **Always use logical properties**: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `rounded-ss-`, `rounded-se-`, `rounded-es-`, `rounded-ee-`
- **NEVER use physical properties**: `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`, `rounded-tl-`, `rounded-tr-`
- **All UI strings** must use the `t` object from `useLocale()` — no hardcoded strings
- **RTL locales**: `ckb`, `ar` — **LTR locales**: `en`, `tr`

### API Routes
- Every API route must have `try/catch` with contextual error logging: `console.error('[API /route-name]', error)`
- Protected routes must call `getUser()` and return 401 if unauthorized
- Public POST routes (`/api/contact`, `/api/newsletter`, `/api/forgot-password`) must use rate limiting via `createRateLimiter()` from `@/lib/rate-limit`
- Validate input with Zod schemas on all POST/PUT/PATCH routes
- Admin routes must verify `role === 'admin'` from the profiles table

### Components
- Client components that use hooks must have `'use client'` directive
- Import path alias: `@/` maps to `./src/`
- Use `<Image />` from `next/image` — never raw `<img>`
- Icons: `import { IconName } from 'lucide-react'` — never `import *`

### Database
- All tables use RLS policies — never bypass without service role
- Migrations go in `supabase/migrations/`
- Schema reference: `supabase/schema.sql`

### Environment Variables
- Public (client-safe): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `RESEND_API_KEY`
- NEVER put secrets in `NEXT_PUBLIC_*` variables

## Communication
- Respond in **Kurdish Sorani** — technical terms in English
- Keep responses concise and actionable
