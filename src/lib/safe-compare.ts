import { timingSafeEqual } from 'crypto'

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns `true` if strings are equal, `false` otherwise.
 */
export function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Still do a comparison to avoid leaking length info through timing
    const padded = Buffer.alloc(bufA.length, bufB)
    timingSafeEqual(bufA, padded)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}
