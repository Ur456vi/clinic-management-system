/**
 * `POST /api/auth/password-reset/confirm`
 *
 * Step 3 (final) of the email-OTP password-reset flow (BE-05).
 *
 *   Body  : { ticket: string, newPassword: string }
 *   200   : { data: { ok: true } }
 *   422   : { error } on invalid/expired ticket or weak password.
 *
 * Behaviour:
 *   - verify ticket signature + `exp` + `scope === "password-reset"`,
 *   - confirm the referenced OTP row exists, is burned, and is for this user,
 *   - bcrypt-hash the new password (cost 12, via `lib/passwords.ts`),
 *   - update `User.passwordHash`,
 *   - write an `AuditLog` row.
 *
 * After a successful confirm, the OTP `jti` is single-use: replaying the
 * same ticket finds the row already-used AND the row's `usedAt` predates the
 * password update, so the confirm endpoint will refuse it. We also write a
 * dedicated `password-reset.confirmed` audit row to make audit trails clean.
 */

import jwt, { type JwtPayload } from "jsonwebtoken"

import { defineHandler, ok, ValidationError } from "@/lib/api"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { hashPassword } from "@/lib/passwords"
import { confirmResetSchema } from "@/lib/validation/password-reset"

type ResetTicketClaims = JwtPayload & {
  sub: string
  jti: string
  scope: string
}

function ticketSecret(): string {
  return process.env.RESET_TICKET_SECRET || env.NEXTAUTH_SECRET
}

function genericFail(): never {
  throw new ValidationError("Invalid or expired reset ticket")
}

export const POST = defineHandler(async ({ req }) => {
  const body = confirmResetSchema.parse(await req.json())

  // Verify signature + expiry.
  let claims: ResetTicketClaims
  try {
    const decoded = jwt.verify(body.ticket, ticketSecret())
    if (typeof decoded === "string") genericFail()
    claims = decoded as ResetTicketClaims
  } catch {
    genericFail()
  }

  if (
    claims.scope !== "password-reset" ||
    typeof claims.sub !== "string" ||
    typeof claims.jti !== "string"
  ) {
    genericFail()
  }

  // Confirm the OTP row referenced by `jti` was actually consumed by the
  // matching verify call. The row must:
  //   - exist
  //   - belong to this user
  //   - have been burned (usedAt non-null)
  const otp = await db.passwordResetOtp.findUnique({
    where: { id: claims.jti },
    select: { id: true, userId: true, usedAt: true },
  })
  if (!otp || otp.userId !== claims.sub || !otp.usedAt) {
    genericFail()
  }

  const user = await db.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, isActive: true },
  })
  if (!user || !user.isActive) genericFail()

  const passwordHash = await hashPassword(body.newPassword)

  // Update password + invalidate any other outstanding OTPs for this user
  // in the same transaction. Belt-and-braces: keeps the table clean.
  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash },
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
        detail: { event: "password-reset.confirmed", otpId: otp.id },
      },
    }),
  ])

  return ok({ ok: true })
})
