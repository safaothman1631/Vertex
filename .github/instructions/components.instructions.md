---
applyTo: "src/components/**/*.tsx"
description: "Component conventions: 'use client', RTL logical properties, i18n, next/image, lucide-react imports"
---

# Component Conventions

## Client Components
Any component using hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useTransition`, `useOptimistic`) MUST have `'use client'` as the first line.

## RTL — Logical Properties Only
NEVER use physical properties. Always use logical equivalents:

| ❌ Physical | ✅ Logical |
|------------|-----------|
| `ml-`, `mr-` | `ms-`, `me-` |
| `pl-`, `pr-` | `ps-`, `pe-` |
| `left-`, `right-` | `start-`, `end-` |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `rounded-tl-`, `rounded-tr-` | `rounded-ss-`, `rounded-se-` |
| `rounded-bl-`, `rounded-br-` | `rounded-es-`, `rounded-ee-` |
| `border-l-`, `border-r-` | `border-s-`, `border-e-` |

## i18n
All UI strings must use the `t` object from `useLocale()`:
```tsx
const { t } = useLocale()
// ✅ <h1>{t.products.title}</h1>
// ❌ <h1>Products</h1>
```

## Images
Always use `<Image />` from `next/image`. Never `<img>`.

## Icons
```tsx
// ✅ Named imports only
import { Search, ShoppingCart } from 'lucide-react'

// ❌ Never wildcard
import * as Icons from 'lucide-react'
```
