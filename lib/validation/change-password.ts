/**
 * Zod schema for the authenticated change-password endpoint
 * (`POST /api/me/password`).
 *
 * Distinct from the password-reset flow (BE-05) — this is for a logged-in
 * user who knows their current password and wants to rotate it, with no
 * email OTP. The new-password rules mirror the reset flow (min 8, max 128).
 */

import { z } from "zod"

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(128, { message: "Password must be at most 128 characters" }),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must differ from the current password",
    path: ["newPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Forced first-login reset (`POST /api/me/password/initial`). The user is
 * already authenticated with their temp password, so no `currentPassword`
 * is required — only the new one.
 */
export const initialPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be at most 128 characters" }),
})

export type InitialPasswordInput = z.infer<typeof initialPasswordSchema>
