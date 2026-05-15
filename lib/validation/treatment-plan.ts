/**
 * Zod schemas for the TreatmentPlan API surface (BE-24).
 *
 * Exports:
 *   - `createTreatmentPlanSchema`  — POST  /api/treatment-plans
 *   - `updateTreatmentPlanSchema`  — PATCH /api/treatment-plans/:id
 *   - `listTreatmentPlansQuerySchema` — GET /api/treatment-plans
 *   - `treatmentPlanIdParamSchema` — :id path param
 *   - `planItemSchema`             — single line item shape
 *
 * The `items` payload is a flat list across the five `PlanItemKind`
 * buckets — Sprint 1 keeps the per-kind structured fields loose; the
 * protocol library (BE-26) will tighten them.
 *
 * Status transitions are intentionally NOT in PATCH — signing flips the
 * row via the dedicated `/sign` endpoint, which records `signedAt` /
 * `signedById` atomically.
 */

import { z } from "zod"
import { PlanItemKind, TreatmentPlanStatus } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

const kindEnum = z.nativeEnum(PlanItemKind)
const statusEnum = z.nativeEnum(TreatmentPlanStatus)

/**
 * One line item on a plan. `name` is the only required field — the rest
 * are clinical extras that callers fill in opportunistically.
 */
export const planItemSchema = z.object({
  kind: kindEnum,
  name: z.string().trim().min(1).max(200),
  dose: trimmedOptional(200),
  frequency: trimmedOptional(200),
  durationDays: z.number().int().positive().max(3650).optional(),
  instructions: trimmedOptional(2000),
  sequence: z.number().int().min(0).max(10000).optional(),
})

export type PlanItemInput = z.infer<typeof planItemSchema>

export const createTreatmentPlanSchema = z.object({
  patientId: uuid,
  title: z.string().trim().min(1).max(200),
  summary: trimmedOptional(2000),
  items: z.array(planItemSchema).max(200).optional().default([]),
})

export type CreateTreatmentPlanInput = z.infer<
  typeof createTreatmentPlanSchema
>

/**
 * PATCH body — all fields optional. When `items` is present it REPLACES
 * the existing item list (delete-then-insert in a transaction). Omit
 * `items` to leave them untouched.
 *
 * `summary` set to `null` clears the field; `undefined` leaves it.
 */
export const updateTreatmentPlanSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  summary: z.string().trim().max(2000).nullable().optional(),
  items: z.array(planItemSchema).max(200).optional(),
})

export type UpdateTreatmentPlanInput = z.infer<
  typeof updateTreatmentPlanSchema
>

const limitParam = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
  .pipe(z.number().int().positive().max(100).optional())

export const listTreatmentPlansQuerySchema = z.object({
  patientId: uuid.optional(),
  status: statusEnum.optional(),
  cursor: uuid.optional(),
  limit: limitParam,
})

export type ListTreatmentPlansQuery = z.infer<
  typeof listTreatmentPlansQuerySchema
>

export const treatmentPlanIdParamSchema = z.object({ id: uuid })

/** Allowed transitions for the lifecycle helper (used by /sign + later /revoke). */
export const ALLOWED_PLAN_TRANSITIONS: Record<
  TreatmentPlanStatus,
  readonly TreatmentPlanStatus[]
> = {
  DRAFT: ["SIGNED", "REVOKED"],
  SIGNED: ["REVOKED"],
  REVOKED: [],
}
