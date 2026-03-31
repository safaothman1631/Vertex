/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding window per key. In serverless environments each cold-start
 * resets the window, which is acceptable — it stops automated tooling while
 * being zero-dependency. For stricter needs, swap to Upstash Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ window: 15 * 60_000, max: 5 })
 *   const ok = limiter.check(identifierString)
 *   if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimiterOpts {
  /** Sliding window size in milliseconds */
  window: number
  /** Maximum requests allowed within the window */
  max: number
}

const buckets = new Map<string, Map<string, number[]>>()

export function createRateLimiter(opts: RateLimiterOpts) {
  // Each limiter instance gets its own namespace
  const ns = Math.random().toString(36).slice(2)
  if (!buckets.has(ns)) buckets.set(ns, new Map())
  const store = buckets.get(ns)!

  // Periodically prune stale keys (every 5 min)
  if (typeof globalThis !== 'undefined') {
    const interval = setInterval(() => {
      const cutoff = Date.now() - opts.window
      for (const [key, timestamps] of store) {
        const valid = timestamps.filter(t => t > cutoff)
        if (valid.length === 0) store.delete(key)
        else store.set(key, valid)
      }
    }, 5 * 60_000)
    // Don't prevent process exit in serverless
    if (typeof interval === 'object' && 'unref' in interval) interval.unref()
  }

  return {
    /**
     * Returns `true` if the request is allowed, `false` if rate-limited.
     */
    check(key: string): boolean {
      const now = Date.now()
      const cutoff = now - opts.window
      const timestamps = (store.get(key) ?? []).filter(t => t > cutoff)

      if (timestamps.length >= opts.max) {
        store.set(key, timestamps)
        return false
      }

      timestamps.push(now)
      store.set(key, timestamps)
      return true
    },

    /** Remaining requests for the key */
    remaining(key: string): number {
      const cutoff = Date.now() - opts.window
      const count = (store.get(key) ?? []).filter(t => t > cutoff).length
      return Math.max(0, opts.max - count)
    },

    /** Clear all data for a specific key (e.g. on successful login) */
    reset(key: string): void {
      store.delete(key)
    },
  }
}

/**
 * Extract client IP from request headers (works behind Vercel / Cloudflare proxies).
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}
