/**
 * Password hashing helpers.
 *
 * We use bcryptjs (pure-JS) so the bundle works on Vercel / edge-builders
 * without a native build step. Cost factor is 12 — a reasonable 2026 default
 * that takes ~150ms on modern hardware. Bump as hardware gets faster.
 *
 * Usage:
 *   import { hashPassword, verifyPassword } from "@/lib/passwords"
 *   const hash = await hashPassword("hunter2")
 *   const ok   = await verifyPassword("hunter2", hash)
 */

import bcrypt from "bcryptjs"

/** Bcrypt cost factor. 2^12 = 4096 key-expansion rounds. */
export const BCRYPT_COST = 12

/**
 * Hash a plaintext password. Throws if `plain` is empty.
 *
 * Salt is generated automatically and embedded in the returned hash.
 */
export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("hashPassword: plaintext password must be a non-empty string")
  }
  return bcrypt.hash(plain, BCRYPT_COST)
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 *
 * Returns `false` on any malformed input rather than throwing — callers
 * generally want to treat "bad hash" the same as "bad password" to avoid
 * leaking which accounts have corrupt records.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (typeof plain !== "string" || plain.length === 0) return false
  if (typeof hash !== "string" || hash.length === 0) return false
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}
