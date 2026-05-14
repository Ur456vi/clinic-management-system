/**
 * Zod schemas for the password-reset OTP flow (BE-05).
 *
 * The flow is three endpoints:
 *
 *   POST /api/auth/password-reset/request   { email }
 *   POST /api/auth/password-reset/verify    { email, otp }
 *   POST /api/auth/password-reset/confirm   { ticket, newPassword }
 *
 * Each schema is the *only* place client input is validated. Service-layer
 * functions trust their inputs once they have been parsed through these
 * schemas. Use `.parse()` (not `.safeParse()`) so that a `ZodError` bubbles
 * up to the route's `errorResponse()` mapper.
 *
 * NOTE: To preserve constant-time behaviour at the `/request` endpoint
 * (we must not leak whether an email is registered), every parse failure
 * here should be treated identically by the caller — see the route file.
 */

import { z } from "zod"

/** Lowercased + trimmed email. */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Must be a valid email" })
  .max(254)

/** 6-digit numeric OTP, allowed to be padded with leading zeros. */
const otp = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "OTP must be a 6-digit number" })

/** Min 8 chars. Upper bound prevents bcrypt 72-byte truncation surprises. */
const newPassword = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password must be at most 128 characters" })

// ---------------------------------------------------------------------------
// request
// ---------------------------------------------------------------------------

export const requestResetSchema = z.object({
  email,
})

export type RequestResetInput = z.infer<typeof requestResetSchema>

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------

export const verifyResetSchema = z.object({
  email,
  otp,
})

export type VerifyResetInput = z.infer<typeof verifyResetSchema>

// ---------------------------------------------------------------------------
// confirm
// ---------------------------------------------------------------------------

export const confirmResetSchema = z.object({
  ticket: z.string().min(1, { message: "Ticket is required" }),
  newPassword,
})

export type ConfirmResetInput = z.infer<typeof confirmResetSchema>
