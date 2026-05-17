/**
 * Zod schemas for the Notification API surface (BE-45).
 *
 * Three schemas are exported:
 *   - `listNotificationsQuerySchema` — GET  /api/notifications
 *   - `notificationIdParamSchema`    — :id  path param on POST routes
 *   - (no body schemas: the two POST endpoints take no JSON payload)
 */

import { z } from "zod"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

/**
 * Truthy-string -> boolean. Accepts `"true" | "1" | "yes"` (case
 * insensitive) and treats everything else as `false`. We do NOT use
 * `z.boolean()` because the value arrives as a URL query string.
 */
const truthy = z
  .union([z.string(), z.boolean(), z.undefined()])
  .transform((v) => {
    if (typeof v === "boolean") return v
    if (typeof v === "undefined") return false
    const s = v.trim().toLowerCase()
    return s === "true" || s === "1" || s === "yes"
  })

/** Page size — string off the query string, clamped to [1, 100]. */
const limitParam = z
  .union([z.string(), z.undefined()])
  .transform((v) => {
    if (!v) return undefined
    const n = Number(v)
    if (!Number.isFinite(n) || n <= 0) return undefined
    return Math.min(Math.floor(n), 100)
  })

export const listNotificationsQuerySchema = z.object({
  /** When `?unread=true` (or `1` / `yes`), filter to unread rows only. */
  unread: truthy.optional(),
  /** Keyset cursor — the `id` of the last row from the previous page. */
  cursor: z.string().min(1).optional(),
  /** Page size, default 20, max 100. */
  limit: limitParam,
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>

export const notificationIdParamSchema = z.object({
  id: uuid,
})

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>
