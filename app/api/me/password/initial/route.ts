/**
 * `POST /api/me/password/initial`
 *
 * Forced first-login password reset for a temp-password account. The caller
 * is already authenticated (they signed in with the emailed temp password),
 * so only the new password is required. Clears `mustResetPassword` so the
 * proxy stops pinning them to /reset-password.
 *
 *   Body : { newPassword: string }
 *   200  : { data: { ok: true } }
 *   401  : not signed in
 *   422  : account is not in a forced-reset state / weak password
 */

import { defineHandler, ok, requireSession, ValidationError } from "@/lib/api"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/passwords"
import { initialPasswordSchema } from "@/lib/validation/change-password"

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = initialPasswordSchema.parse(await req.json())

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, isActive: true, mustResetPassword: true },
  })
  if (!user || !user.isActive) {
    throw new ValidationError("Account not found")
  }
  if (!user.mustResetPassword) {
    // Not in a forced-reset state — use the normal change-password flow,
    // which verifies the current password.
    throw new ValidationError("Password reset is not required for this account")
  }

  const passwordHash = await hashPassword(body.newPassword)

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash, mustResetPassword: false },
    }),
    db.passwordResetOtp.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        detail: { event: "password.initial-reset" },
      },
    }),
  ])

  return ok({ ok: true })
})
