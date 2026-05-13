/**
 * Auth shortcuts for Route Handlers.
 *
 * `requireSession()` defers to `requireUser()` from `@/lib/auth` (BE-04) —
 * that's the one place where the NextAuth session is resolved. If no user
 * is signed in, an `UnauthorizedError` bubbles up and `defineHandler()`
 * renders it as a 401.
 *
 * `requireRole(...allowed)` is a thin wrapper on top of `requireSession()`
 * that additionally enforces a role allow-list.
 *
 *   const session = await requireSession()
 *   const session = await requireRole("ADMIN", "DOCTOR")
 *
 * NOTE: `lib/auth.ts` is delivered by BE-04. Until that lands the imports
 * here will not resolve at runtime — that is intentional: BE-07 stops at
 * the contract and BE-04 implements `requireUser()`.
 */

import type { Role } from "@prisma/client"
// `requireUser` is implemented in BE-04. The import path is stable.
import { requireUser } from "@/lib/auth"
import { ForbiddenError } from "./errors"

/**
 * Shape returned by `requireUser()`. Re-exported here so route handlers can
 * type their `session` without reaching across modules.
 */
export type Session = Awaited<ReturnType<typeof requireUser>>

/**
 * Resolve the current session or throw `UnauthorizedError` (401).
 * Use as the first line of every authenticated route.
 */
export async function requireSession(): Promise<Session> {
  return requireUser()
}

/**
 * Resolve the current session and assert the user holds one of `allowed`.
 * Throws `UnauthorizedError` (401) if not signed in, `ForbiddenError`
 * (403) if signed in but the role is not in the allow-list.
 */
export async function requireRole(...allowed: Role[]): Promise<Session> {
  const session = await requireSession()
  const role = (session as { user?: { role?: Role } }).user?.role
  if (!role || !allowed.includes(role)) {
    throw new ForbiddenError(
      `Requires one of: ${allowed.join(", ")}`,
    )
  }
  return session
}
