---
applyTo: "src/app/api/**/route.ts"
description: "API route conventions: try/catch, auth, rate limiting, Zod validation, error logging"
---

# API Route Conventions

## Structure Pattern
Every API route must follow this structure:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    // 1. Auth check (skip for public routes)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Input validation with Zod
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    // 3. Business logic
    // ...

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API /route-name]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Rules
- **Auth**: Always use `getUser()` — NEVER `getSession()` on server
- **Admin routes**: After getUser, also check `role === 'admin'` from profiles table
- **Public POST routes** (`/api/contact`, `/api/newsletter`, `/api/forgot-password`): Must use `createRateLimiter()` from `@/lib/rate-limit`
- **Error logging**: Always include route name: `console.error('[API /route-name]', error)`
- **Validation**: All POST/PUT/PATCH must validate with Zod schemas
- **CRON routes**: Verify `request.headers.get('authorization') === \`Bearer ${process.env.CRON_SECRET}\``
- **Webhook route**: Verify Stripe signature — never trust body without verification
