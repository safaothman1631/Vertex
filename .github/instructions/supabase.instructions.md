---
applyTo: "src/lib/supabase-*.ts"
description: "Supabase client conventions: getUser not getSession, createClient vs createAdminClient, PKCE flow"
---

# Supabase Client Conventions

## Two Server-Side Clients

### `createClient()` — User Context (cookie-based)
```typescript
import { createClient } from '@/lib/supabase-server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```
- Uses cookies for auth — respects RLS policies
- Always `await` because it reads cookies

### `createAdminClient()` — Service Role (bypasses RLS)
```typescript
import { createAdminClient } from '@/lib/supabase-server'
const admin = createAdminClient()
```
- Uses `SUPABASE_SERVICE_ROLE_KEY` — bypasses ALL RLS
- Only use for admin operations or system tasks
- No `await` needed — synchronous

## Client-Side
```typescript
import { createClient } from '@/lib/supabase-client'
const supabase = createClient()
```
- Singleton — safe to call multiple times
- Uses PKCE auth flow

## CRITICAL: getUser() vs getSession()
- `getUser()` — verifies JWT with Supabase Auth server. **Always use on server.**
- `getSession()` — reads JWT from cookie/storage WITHOUT verification. **NEVER use on server.**
