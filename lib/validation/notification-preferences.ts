/**
 * Per-user notification preferences (`/api/me/notification-preferences`).
 *
 * Stored as a JSONB blob on `User.notificationPrefs`. A null/absent column
 * means "all defaults" — every channel on. The schema is intentionally
 * small; add channels here as new event types ship.
 */

import { z } from "zod"

export const NOTIFICATION_PREFS_DEFAULTS = {
  appointments: true,
  labResults: true,
  prescriptions: true,
} as const

export type NotificationPrefs = {
  appointments: boolean
  labResults: boolean
  prescriptions: boolean
}

/** PATCH body — every channel optional; only provided keys are updated. */
export const updateNotificationPrefsSchema = z
  .object({
    appointments: z.boolean(),
    labResults: z.boolean(),
    prescriptions: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one preference to update",
  })

export type UpdateNotificationPrefsInput = z.infer<
  typeof updateNotificationPrefsSchema
>

/**
 * Coerce whatever is stored in the JSONB column into a complete, typed
 * prefs object — unknown/missing keys fall back to the all-on defaults.
 */
export function resolveNotificationPrefs(stored: unknown): NotificationPrefs {
  const s =
    stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {}
  const pick = (k: keyof NotificationPrefs): boolean =>
    typeof s[k] === "boolean" ? (s[k] as boolean) : NOTIFICATION_PREFS_DEFAULTS[k]
  return {
    appointments: pick("appointments"),
    labResults: pick("labResults"),
    prescriptions: pick("prescriptions"),
  }
}
