/**
 * Zod schemas for the RefillRequest API surface.
 *
 * Exports:
 *   - `createRefillRequestSchema`      — POST  /api/refills          (staff)
 *   - `createSelfRefillRequestSchema`  — POST  /api/patient/me/refills (patient)
 *   - `transitionRefillRequestSchema`  — POST  /api/refills/:id/transition
 *   - `listRefillRequestsQuerySchema`  — GET   /api/refills
 *   - `refillRequestIdParamSchema`     — :id path param
 *
 * The lifecycle (PENDING → APPROVED → FULFILLED / DECLINED) is encoded in
 * `ALLOWED_REFILL_TRANSITIONS` and enforced by the service layer; the route
 * handlers stay thin. Mirrors the InfusionLog validation module.
 */

import { z } from "zod"
import { RefillRequestStatus } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

const statusEnum = z.nativeEnum(RefillRequestStatus)

/**
 * Status filter: single value or comma-separated list. Empty collapses to
 * `undefined` so callers can pass `status=` to mean "no filter".
 */
const statusListParam = z
  .string()
  .trim()
  .optional()
  .transform((raw) => {
    if (raw === undefined || raw === "") return undefined
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    return tokens.length === 0 ? undefined : tokens
  })
  .pipe(z.array(statusEnum).nonempty().optional())

const limitParam = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
  .pipe(z.number().int().positive().max(100).optional())

// ---------------------------------------------------------------------------
// Allowed transitions
// ---------------------------------------------------------------------------

/**
 * Exhaustive transition table. Keys are the current status; values are the
 * statuses accepted as `to` on `POST /api/refills/:id/transition`.
 *
 *   PENDING  -> APPROVED | DECLINED
 *   APPROVED -> FULFILLED | DECLINED
 *   FULFILLED / DECLINED are terminal.
 */
export const ALLOWED_REFILL_TRANSITIONS: Record<
  RefillRequestStatus,
  readonly RefillRequestStatus[]
> = {
  PENDING: [RefillRequestStatus.APPROVED, RefillRequestStatus.DECLINED],
  APPROVED: [RefillRequestStatus.FULFILLED, RefillRequestStatus.DECLINED],
  FULFILLED: [],
  DECLINED: [],
}

// ---------------------------------------------------------------------------
// Shared item fields
// ---------------------------------------------------------------------------

/**
 * The snapshot fields shared by both create paths. `itemName` is required;
 * `dose`/`frequency`/`note` are optional context. `planItemId` optionally
 * links back to the originating prescribed item — the service verifies it
 * belongs to the target patient and backfills the snapshot from it.
 */
const refillItemFields = {
  planItemId: uuid.optional(),
  itemName: z.string().trim().min(1, "Required").max(300),
  dose: trimmedOptional(200),
  frequency: trimmedOptional(200),
  note: trimmedOptional(1000),
}

/** Body for `POST /api/refills` (staff create on a patient's behalf). */
export const createRefillRequestSchema = z.object({
  patientId: uuid,
  ...refillItemFields,
})

export type CreateRefillRequestInput = z.infer<typeof createRefillRequestSchema>

/** Body for `POST /api/patient/me/refills` (patient self-service). */
export const createSelfRefillRequestSchema = z.object(refillItemFields)

export type CreateSelfRefillRequestInput = z.infer<
  typeof createSelfRefillRequestSchema
>

// ---------------------------------------------------------------------------
// transition
// ---------------------------------------------------------------------------

/**
 * Body for `POST /api/refills/:id/transition`. `to` is the target status;
 * `note` is the optional decision note surfaced back to the patient.
 */
export const transitionRefillRequestSchema = z.object({
  to: statusEnum,
  note: trimmedOptional(1000),
})

export type TransitionRefillRequestInput = z.infer<
  typeof transitionRefillRequestSchema
>

// ---------------------------------------------------------------------------
// list query
// ---------------------------------------------------------------------------

export const listRefillRequestsQuerySchema = z.object({
  patientId: uuid.optional(),
  status: statusListParam,
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  limit: limitParam,
})

export type ListRefillRequestsQuery = z.infer<
  typeof listRefillRequestsQuerySchema
>

// ---------------------------------------------------------------------------
// :id param
// ---------------------------------------------------------------------------

export const refillRequestIdParamSchema = z.object({ id: uuid })
