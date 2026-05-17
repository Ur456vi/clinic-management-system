/**
 * Zod schemas for the InfusionLog API surface (BE-26).
 *
 * Exports:
 *   - `createInfusionLogSchema`        — POST  /api/infusion-logs
 *   - `updateInfusionLogSchema`        — PATCH /api/infusion-logs/:id
 *   - `transitionInfusionLogSchema`    — POST  /api/infusion-logs/:id/transition
 *   - `listInfusionLogsQuerySchema`    — GET   /api/infusion-logs
 *   - `infusionLogIdParamSchema`       — :id path param
 *
 * Validation rules of note:
 *   - all times are ISO 8601 strings → `Date`;
 *   - `agents` is a loose-but-typed JSON array of
 *     `{ name: string; dose: number; unit: string; sequence: number }`;
 *   - `completedAt` (when supplied at create time alongside `startedAt`)
 *     must be strictly after `startedAt`;
 *   - status filter follows the BE-12 comma-separated convention;
 *   - cursor / limit follow the BE-07 contract (default 20, max 100).
 *
 * Service-layer (`lib/services/infusion-log.ts`) trusts inputs once parsed.
 */

import { z } from "zod"
import { InfusionStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

/** Accept ISO 8601 date/datetime strings; coerce to `Date`. */
const isoDateTime = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be an ISO 8601 date-time string",
  })
  .transform((v) => new Date(v))

const statusEnum = z.nativeEnum(InfusionStatus)

/**
 * Status filter: single value or comma-separated list. Empty collapses to
 * `undefined` so callers can pass `status=` to mean "no filter".
 *
 *   ?status=SCHEDULED                  -> [SCHEDULED]
 *   ?status=SCHEDULED,IN_PROGRESS      -> [SCHEDULED, IN_PROGRESS]
 *   ?status=                           -> undefined
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
// Allowed transitions (BE-26)
// ---------------------------------------------------------------------------

/**
 * Exhaustive transition table. Keys are the current status; values are
 * the statuses we'll accept as `to` on
 * `POST /api/infusion-logs/:id/transition`.
 *
 *   SCHEDULED   -> IN_PROGRESS | ABORTED
 *   IN_PROGRESS -> COMPLETED   | ABORTED
 *   COMPLETED / ABORTED are terminal.
 *
 * Service layer throws `ValidationError` for anything outside this table.
 */
export const ALLOWED_INFUSION_TRANSITIONS: Record<
  InfusionStatus,
  readonly InfusionStatus[]
> = {
  SCHEDULED: [InfusionStatus.IN_PROGRESS, InfusionStatus.ABORTED],
  IN_PROGRESS: [InfusionStatus.COMPLETED, InfusionStatus.ABORTED],
  COMPLETED: [],
  ABORTED: [],
}

// ---------------------------------------------------------------------------
// `agents` JSON array
// ---------------------------------------------------------------------------

/**
 * One agent in the infusion's `agents` array. The shape is intentionally
 * loose-but-typed — the integrative protocol library (BE-26 follow-up)
 * will tighten units and dose ranges later.
 */
export const infusionAgentSchema = z.object({
  name: z.string().trim().min(1, "Required").max(200),
  dose: z.number().finite().nonnegative(),
  unit: z.string().trim().min(1, "Required").max(50),
  sequence: z.number().int().nonnegative(),
})

export type InfusionAgentInput = z.infer<typeof infusionAgentSchema>

const agentsArray = z
  .array(infusionAgentSchema)
  .min(1, "At least one agent is required")
  .max(50)

// ---------------------------------------------------------------------------
// createInfusionLogSchema
// ---------------------------------------------------------------------------

/**
 * Body for `POST /api/infusion-logs`. `status` is server-assigned
 * (defaults to `SCHEDULED`) — clients cannot pre-set it here; use the
 * transition endpoint instead.
 *
 * `completedAt` is accepted at create time for back-fill (the clinic
 * sometimes records a completed infusion after the fact); when supplied
 * it must be strictly after `startedAt`.
 */
export const createInfusionLogSchema = z
  .object({
    patientId: uuid,
    consultationId: uuid.optional(),
    staffId: uuid,
    protocol: z.string().trim().min(1, "Required").max(200),
    agents: agentsArray,
    startedAt: isoDateTime,
    completedAt: isoDateTime.optional(),
    reaction: trimmedOptional(2000),
    notes: trimmedOptional(2000),
  })
  .refine(
    (v) =>
      v.completedAt === undefined ||
      v.completedAt.getTime() > v.startedAt.getTime(),
    { message: "completedAt must be after startedAt", path: ["completedAt"] },
  )

export type CreateInfusionLogInput = z.infer<typeof createInfusionLogSchema>

// ---------------------------------------------------------------------------
// updateInfusionLogSchema
// ---------------------------------------------------------------------------

/**
 * Body for `PATCH /api/infusion-logs/:id`. Status changes go through the
 * transition endpoint to keep the audit trail clean.
 *
 * Nullable fields accept `null` to clear; `undefined` leaves them alone.
 */
export const updateInfusionLogSchema = z
  .object({
    consultationId: uuid.nullable().optional(),
    protocol: z.string().trim().min(1).max(200).optional(),
    agents: agentsArray.optional(),
    startedAt: isoDateTime.optional(),
    completedAt: isoDateTime.nullable().optional(),
    reaction: z.string().trim().max(2000).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (v) => {
      if (v.startedAt && v.completedAt) {
        return v.completedAt.getTime() > v.startedAt.getTime()
      }
      // Cross-field check against the existing row when only one side is
      // supplied happens in the service layer.
      return true
    },
    { message: "completedAt must be after startedAt", path: ["completedAt"] },
  )

export type UpdateInfusionLogInput = z.infer<typeof updateInfusionLogSchema>

// ---------------------------------------------------------------------------
// transitionInfusionLogSchema
// ---------------------------------------------------------------------------

/**
 * Body for `POST /api/infusion-logs/:id/transition`. `to` is the target
 * status; `reason` is free-text supporting context (mandatory in policy
 * for ABORTED but the schema keeps it optional — service-layer logic can
 * tighten later).
 */
export const transitionInfusionLogSchema = z.object({
  to: statusEnum,
  reason: trimmedOptional(500),
})

export type TransitionInfusionLogInput = z.infer<
  typeof transitionInfusionLogSchema
>

// ---------------------------------------------------------------------------
// listInfusionLogsQuerySchema
// ---------------------------------------------------------------------------

/**
 * Query string for `GET /api/infusion-logs`.
 *
 *   patientId       — exact match
 *   staffId         — exact match
 *   status          — single value or comma-separated list
 *   from / to       — ISO datetimes; inclusive lower bound (gte) on
 *                     `startedAt`, exclusive upper (lt)
 *   cursor          — opaque cursor (id of last row of previous page)
 *   limit           — page size (default 20, max 100)
 */
export const listInfusionLogsQuerySchema = z
  .object({
    patientId: uuid.optional(),
    staffId: uuid.optional(),
    status: statusListParam,
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
    cursor: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    limit: limitParam,
  })
  .refine(
    (v) => {
      if (v.from && v.to) return v.to.getTime() >= v.from.getTime()
      return true
    },
    { message: "`to` must be >= `from`", path: ["to"] },
  )

export type ListInfusionLogsQuery = z.infer<typeof listInfusionLogsQuerySchema>

// ---------------------------------------------------------------------------
// :id param
// ---------------------------------------------------------------------------

export const infusionLogIdParamSchema = z.object({ id: uuid })
