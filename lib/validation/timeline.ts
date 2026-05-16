/**
 * Zod schema for the patient timeline query string (BE-21).
 *
 *   GET /api/patients/:id/timeline?limit=<n>&cursor=<iso8601>
 *
 *   - `limit`  defaults to 50, clamped to [1, 200]. The spec calls out
 *     200 as the hard max (this is a read-only aggregate so we want a
 *     sane upper bound to keep the cross-source fan-out cheap).
 *   - `cursor` is an ISO-8601 timestamp; the endpoint returns events
 *     with `occurredAt < cursor`. We deliberately pick a timestamp
 *     cursor (not an opaque id) because the feed is a union of rows
 *     from multiple tables — there's no single-column id that orders
 *     the merged stream.
 *
 * Parsed via `.parse()` so a `ZodError` bubbles up to the route's
 * `errorResponse()` mapper.
 */

import { z } from "zod"

export const DEFAULT_TIMELINE_LIMIT = 50
export const MAX_TIMELINE_LIMIT = 200

export const timelineQuerySchema = z.object({
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return DEFAULT_TIMELINE_LIMIT
      const n = typeof v === "number" ? v : Number(v)
      if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMELINE_LIMIT
      return Math.min(Math.floor(n), MAX_TIMELINE_LIMIT)
    }),
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : v))
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), {
      message: "cursor must be an ISO 8601 timestamp",
    })
    .transform((v) => (v === undefined ? undefined : new Date(v))),
})

export type TimelineQuery = z.infer<typeof timelineQuerySchema>
