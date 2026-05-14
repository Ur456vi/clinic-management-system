/**
 * `POST /api/auth/password-reset/verify`
 *
 * Step 2 of the email-OTP password-reset flow (BE-05).
 *
 *   Body  : { email: string, otp: string }
 *   200   : { data: { ticket: string } }   -- short-lived JWT (5 min) the
 *                                             client passes back to `confirm`.
 *   422   : { error } on bad code, expired code, or too many attempts.
 *           We intentionally do NOT distinguish between "wrong email",
 *           "no OTP issued", and "wrong code" — same VALIDATION error
 *           shape for every failure mode to avoid leaking signal.
 *
 * Side-effects on success:
 *   - the OTP row is burned (`usedAt = now()`).
 *
 * Side-effects on mismatch:
 *   - the OTP row's `attempts` counter is bumped. After 5 attempts the
 *     row is dead — `verify` will keep returning 422 even for the correct
 *     code, forcing the user back to `request`.
 *
 * The ticket is a JWT signed with `RESET_TICKET_SECRET` (env), falling back
 * to `NEXTAUTH_SECRET` when not set. Claims:
 *   - sub : user id
 *   - jti : OTP row id (so `confirm` can verify the OTP was actually burned
 *           by THIS verify call, not a previous one)
 *   - exp : iat + 5 min
 */

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import { defineHandler, ok, ValidationError } from "@/lib/api"
import { db } from "@/lib/db"
import { env } from "@/lib/env"
import { verifyResetSchema } from "@/lib/validation/password-reset"

const TICKET_TTL_SECONDS = 5 * 60
const MAX_ATTEMPTS = 5

/** Resolve the signing secret. */
function ticketSecret(): string {
  return process.env.RESET_TICKET_SECRET || env.NEXTAUTH_SECRET
}

/** Generic failure — keep the message bland so we don't leak signal. */
function genericFail(): never {
  throw new ValidationError("Invalid or expired code")
}

export const POST = defineHandler(async ({ req }) => {
  const body = verifyResetSchema.parse(await req.json())

  const user = await db.user.findUnique({
    where: { email: body.email },
    select: { id: true, isActive: true },
  })
  if (!user || !user.isActive) genericFail()

  // Most recent un-burned OTP for this user.
  const row = await db.passwordResetOtp.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  })
  if (!row) genericFail()

  if (row.expiresAt.getTime() < Date.now()) genericFail()
  if (row.attempts >= MAX_ATTEMPTS) genericFail()

  const match = await bcrypt.compare(body.otp, row.otpHash)
  if (!match) {
    // Bump attempts then fail. Best-effort — don't block the response on
    // the audit write.
    try {
      await db.passwordResetOtp.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      })
    } catch {
      // swallow
    }
    genericFail()
  }

  // Burn the OTP atomically. If two concurrent verifies race, the second
  // one finds usedAt non-null on the next read and errs — acceptable.
  const burned = await db.passwordResetOtp.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (burned.count === 0) genericFail()

  // Mint the reset ticket.
  const ticket = jwt.sign(
    { sub: user.id, jti: row.id, scope: "password-reset" },
    ticketSecret(),
    { expiresIn: TICKET_TTL_SECONDS },
  )

  // Audit (best-effort).
  try {
    await db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        detail: { event: "password-reset.verified", otpId: row.id },
      },
    })
  } catch {
    // swallow
  }

  return ok({ ticket })
})
