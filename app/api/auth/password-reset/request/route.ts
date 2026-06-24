/**
 * `POST /api/auth/password-reset/request`
 *
 * Step 1 of the email-OTP password-reset flow (BE-05).
 *
 *   Body  : { email: string }
 *   200   : { data: { ok: true } }     -- always, regardless of whether the
 *                                         email is registered. This is the
 *                                         enumeration-resistance guarantee:
 *                                         clients cannot tell from this
 *                                         endpoint whether an account exists.
 *   400   : { error } when the body is malformed JSON or fails Zod.
 *   500   : never intentionally — provider failures are swallowed and logged
 *           so the response shape stays invariant.
 *
 * Behaviour when the email DOES match a user:
 *   - generate a 6-digit OTP,
 *   - bcrypt-hash it,
 *   - insert a PasswordResetOtp row with expiresAt = now + 15 min,
 *   - send the OTP via the email helper (best-effort).
 *
 * Rate-limit: 5 OTP requests per user per rolling hour. Counted via the
 * PasswordResetOtp table. Sprint-2 hardening item: move this to Redis with
 * a token bucket; the DB counter is a holding pattern.
 */

import bcrypt from "bcryptjs"

import { defineHandler, ok } from "@/lib/api"
import { db } from "@/lib/db"
import { sendMail } from "@/lib/email"
import { requestResetSchema } from "@/lib/validation/password-reset"

/** Bcrypt cost factor for OTPs. Lower than for passwords because the OTP
 *  is single-use, short-lived, and the verify endpoint is rate-limited; we
 *  trade a little hash strength for response latency. */
const OTP_BCRYPT_COST = 10

/** OTP lifetime — 15 minutes per spec. */
const OTP_TTL_MS = 15 * 60 * 1000

/** Max OTP requests allowed per user per rolling hour. */
const MAX_REQUESTS_PER_HOUR = 5

const RATE_WINDOW_MS = 60 * 60 * 1000

/** Generate a cryptographically-random 6-digit numeric OTP (zero-padded). */
function generateOtp(): string {
  // 1_000_000 evenly spans the 6-digit range. Math.random is forbidden here
  // because it is predictable; use Web Crypto.
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  const n = arr[0]! % 1_000_000
  return n.toString().padStart(6, "0")
}

export const POST = defineHandler(async ({ req }) => {
  const body = requestResetSchema.parse(await req.json())

  // Look up the user. We do NOT branch the response on this — we always
  // return 200 to prevent email enumeration. The work only happens when
  // a match exists.
  const user = await db.user.findUnique({
    where: { email: body.email },
    select: { id: true, isActive: true },
  })

  if (user && user.isActive) {
    // Rate-limit check: count rows in the last hour.
    const since = new Date(Date.now() - RATE_WINDOW_MS)
    const recent = await db.passwordResetOtp.count({
      where: { userId: user.id, createdAt: { gte: since } },
    })

    if (recent < MAX_REQUESTS_PER_HOUR) {
      const otp = generateOtp()
      console.log(`\n🔑 [TESTING] OTP generated for ${body.email}: ${otp}\n`)
      const otpHash = await bcrypt.hash(otp, OTP_BCRYPT_COST)
      const expiresAt = new Date(Date.now() + OTP_TTL_MS)

      await db.passwordResetOtp.create({
        data: { userId: user.id, otpHash, expiresAt },
      })

      // Best-effort send. Provider failures are logged but do not leak to
      // the caller — see the file header for the enumeration argument.
      await sendMail({
        to: body.email,
        subject: "Your IPHMH password reset code",
        text:
          `Your IPHMH password reset code is ${otp}.\n` +
          `It expires in 15 minutes. If you did not request this, you can ignore this email.`,
      })
    }
    // If rate-limited, silently drop. The caller still sees 200.
  }

  return ok({ ok: true })
})
