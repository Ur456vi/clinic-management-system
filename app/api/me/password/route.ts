/**
 * `POST /api/me/password`
 *
 * Authenticated change-password for the calling user (staff or patient).
 * Unlike the email-OTP reset flow (BE-05), this requires the current
 * password and rotates the hash in place.
 *
 *   Body : { currentPassword: string, newPassword: string }
 *   200  : { data: { ok: true } }
 *   401  : not signed in
 *   422  : wrong current password / weak or unchanged new password
 *
 * Writes an `AuditLog` row (`event: "password.changed"`) so the rotation
 * is traceable, mirroring the reset-confirm handler.
 */

import { defineHandler, ok, requireSession, ValidationError } from "@/lib/api"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/passwords"
import { changePasswordSchema } from "@/lib/validation/change-password"

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = changePasswordSchema.parse(await req.json())

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true, isActive: true },
  })
  if (!user || !user.isActive) {
    throw new ValidationError("Account not found")
  }

  const matches = await verifyPassword(body.currentPassword, user.passwordHash)
  if (!matches) {
    throw new ValidationError("Current password is incorrect")
  }

  const passwordHash = await hashPassword(body.newPassword)

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash, mustResetPassword: false },
    }),
    // Invalidate any outstanding reset OTPs — a deliberate rotation should
    // close any half-finished reset the user may have started.
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
        detail: { event: "password.changed" },
      },
    }),
  ])

  return ok({ ok: true })
})
