/**
 * Zod schemas for the Department API surface (BE-31).
 *
 * Three schemas are exported, mirroring the staff + patient validators:
 *   - `createDepartmentSchema`     — POST  /api/departments
 *   - `updateDepartmentSchema`     — PATCH /api/departments/:id   (partial)
 *   - `listDepartmentsQuerySchema` — GET   /api/departments       (query string)
 *
 * Default service pricing
 * -----------------------
 * The BE-31 spec calls for "default service pricing per department". We
 * model this as a JSONB column on `Department` whose value is a map of
 * `serviceCode -> priceCents` (positive integer paise). Until BE-37
 * introduces a proper `ServicePrice` table this is the source of truth
 * the appointment + invoice surfaces will read from.
 *
 * The schema validates:
 *   - keys are non-empty snake-case-ish slugs (≤64 chars, [a-z0-9_-]);
 *   - values are non-negative integers ≤ 100_000_000 (₹1cr cap, sanity
 *     guard against accidentally storing rupees instead of paise);
 *   - the map itself has ≤32 entries (Sprint-1 hand-curated lists are
 *     tiny — if we need more we should be in BE-37 territory).
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

/**
 * `slug` — URL-safe identifier. Lowercase letters, digits, and hyphens.
 * Must start and end with an alphanumeric char so we don't accept
 * leading / trailing punctuation. Length 1–80 mirrors the column.
 */
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Required")
  .max(80)
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "Slug must be lowercase alphanumerics and hyphens",
  )

/**
 * `defaultPricing` — JSONB map of service code → price in paise.
 * Keys: 1–64 chars, `[a-z0-9_-]` only.
 * Values: integer ≥0, ≤1e8 (1 crore paise = ₹100k — well above any
 * plausible single-service ticket; guards against the unit-mismatch
 * footgun where someone stores rupees by accident).
 *
 * `null` is accepted on PATCH to mean "clear the field"; on CREATE the
 * caller may omit the key entirely.
 */
const PRICING_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/
const MAX_PRICING_ENTRIES = 32
const MAX_PRICE_CENTS = 100_000_000

const defaultPricingSchema = z
  .record(z.string(), z.number().int().min(0).max(MAX_PRICE_CENTS))
  .superRefine((val, ctx) => {
    const keys = Object.keys(val)
    if (keys.length > MAX_PRICING_ENTRIES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultPricing has too many entries (max ${MAX_PRICING_ENTRIES})`,
      })
    }
    for (const k of keys) {
      if (!PRICING_KEY_RE.test(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [k],
          message: "Pricing keys must match [a-z0-9][a-z0-9_-]{0,63}",
        })
      }
    }
  })

// ---------------------------------------------------------------------------
// createDepartmentSchema
// ---------------------------------------------------------------------------

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  slug: slugSchema,
  description: trimmedOptional(2_000),
  defaultPricing: defaultPricingSchema.optional(),
})

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>

// ---------------------------------------------------------------------------
// updateDepartmentSchema
// ---------------------------------------------------------------------------

/**
 * Partial update. `defaultPricing` accepts `null` to clear the column;
 * `isActive` is exposed so an ADMIN can un-archive a soft-deleted
 * department without going through the DB directly.
 */
export const updateDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  description: z
    .union([z.string().trim().max(2_000), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  defaultPricing: z.union([defaultPricingSchema, z.null()]).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>

// ---------------------------------------------------------------------------
// listDepartmentsQuerySchema
// ---------------------------------------------------------------------------

/**
 * Tri-state filter for `includeInactive`:
 *   - omitted / "false" → only active rows (default)
 *   - "true"             → active + inactive
 *   - "only"             → only inactive (admin housekeeping)
 */
const includeInactiveParam = z
  .enum(["true", "false", "only"])
  .optional()
  .transform((v) => v ?? "false")

export const listDepartmentsQuerySchema = z
  .object({
    q: trimmedOptional(200),
    includeInactive: includeInactiveParam,
    cursor: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .pipe(z.number().int().positive().max(100).optional()),
  })
  .transform((v) => ({
    q: v.q,
    includeInactive: v.includeInactive,
    cursor: v.cursor,
    limit: v.limit,
  }))

export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>
