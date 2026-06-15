/**
 * Zod schemas for the Appointment API surface (BE-27).
 *
 * Exports:
 *   - `createAppointmentSchema`     — POST  /api/appointments
 *   - `updateAppointmentSchema`     — PATCH /api/appointments/:id
 *   - `transitionAppointmentSchema` — POST  /api/appointments/:id/transition
 *   - `listAppointmentsQuerySchema` — GET   /api/appointments
 *   - `appointmentIdParamSchema`    — :id path param
 *
 * Validation rules of note:
 *   - all times are ISO 8601 strings → `Date`;
 *   - `endsAt > startsAt` is enforced at the schema level;
 *   - status filter accepts a comma-separated list (matches BE-12 style);
 *   - `from`/`to` are ISO date strings on `startsAt`;
 *   - cursor/limit follow the BE-07 contract (`limit` default 20, max 100).
 *
 * Service-layer (`lib/services/appointment.ts`) trusts inputs once parsed.
 */

import { z } from "zod"
import { AppointmentStatus } from "@prisma/client"

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

const statusEnum = z.nativeEnum(AppointmentStatus)

/**
 * Status filter: single value or comma-separated list. Empty collapses
 * to `undefined` so callers can pass `status=` to mean "no filter".
 *
 *   ?status=REQUESTED                 -> [REQUESTED]
 *   ?status=REQUESTED,CONFIRMED       -> [REQUESTED, CONFIRMED]
 *   ?status=                          -> undefined
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
// Allowed transitions (BE-27)
// ---------------------------------------------------------------------------

/**
 * Exhaustive transition table. Keys are the current status; values are the
 * statuses we'll accept as `to` on `POST /api/appointments/:id/transition`.
 *
 *   REQUESTED  -> CONFIRMED | CANCELLED
 *   CONFIRMED  -> COMPLETED | CANCELLED | NO_SHOW
 *   COMPLETED / CANCELLED / NO_SHOW are terminal.
 *
 * Service layer throws `ValidationError` for anything outside this table.
 */
export const ALLOWED_APPOINTMENT_TRANSITIONS: Record<
  AppointmentStatus,
  readonly AppointmentStatus[]
> = {
  REQUESTED: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  CONFIRMED: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

// ---------------------------------------------------------------------------
// createAppointmentSchema
// ---------------------------------------------------------------------------

/**
 * Body for `POST /api/appointments`. `status` is server-assigned
 * (REQUESTED) — clients cannot pre-set it here; use the transition
 * endpoint instead.
 */
export const createAppointmentSchema = z
  .object({
    patientId: uuid,
    staffId: uuid,
    departmentId: uuid.optional(),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    reason: trimmedOptional(500),
    notes: trimmedOptional(2000),
  })
  .refine((v) => v.endsAt.getTime() > v.startsAt.getTime(), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  })

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

// ---------------------------------------------------------------------------
// updateAppointmentSchema
// ---------------------------------------------------------------------------

/**
 * Body for `PATCH /api/appointments/:id`. Only time-window and free-text
 * fields are mutable here; status changes go through the transition
 * endpoint to keep the audit trail clean.
 *
 * `reason` / `notes` accept `null` to clear the field; `undefined` leaves
 * it alone.
 */
export const updateAppointmentSchema = z
  .object({
    startsAt: isoDateTime.optional(),
    endsAt: isoDateTime.optional(),
    reason: z.string().trim().max(500).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (v) => {
      if (v.startsAt && v.endsAt) {
        return v.endsAt.getTime() > v.startsAt.getTime()
      }
      // Cross-field check against the existing row when only one side is
      // supplied happens in the service layer.
      return true
    },
    { message: "endsAt must be after startsAt", path: ["endsAt"] },
  )

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>

// ---------------------------------------------------------------------------
// transitionAppointmentSchema
// ---------------------------------------------------------------------------

/**
 * Body for `POST /api/appointments/:id/transition`. `to` is the target
 * status; `reason` is required-ish for CANCELLED in policy but the
 * schema keeps it optional — service-layer logic can tighten later.
 */
export const transitionAppointmentSchema = z.object({
  to: statusEnum,
  reason: trimmedOptional(500),
})

export type TransitionAppointmentInput = z.infer<
  typeof transitionAppointmentSchema
>

// ---------------------------------------------------------------------------
// listAppointmentsQuerySchema
// ---------------------------------------------------------------------------

/**
 * Query string for `GET /api/appointments`.
 *
 *   patientId       — exact match
 *   staffId         — exact match
 *   departmentId    — exact match
 *   status          — single value or comma-separated list
 *   from / to       — ISO datetimes; inclusive lower bound, exclusive upper
 *   cursor          — opaque cursor (id of last row of previous page)
 *   limit           — page size (default 20, max 100)
 */
export const listAppointmentsQuerySchema = z
  .object({
    patientId: uuid.optional(),
    staffId: uuid.optional(),
    departmentId: uuid.optional(),
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

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>

// ---------------------------------------------------------------------------
// :id param
// ---------------------------------------------------------------------------

export const appointmentIdParamSchema = z.object({ id: uuid })

// ---------------------------------------------------------------------------
// Availability + patient-self booking (BE-23)
// ---------------------------------------------------------------------------

/**
 * `GET /api/appointments/availability` query params. Bound to ≤ 14 days
 * per call to keep slot enumeration bounded.
 */
export const availabilityQuerySchema = z
  .object({
    staffId: uuid,
    from: isoDateTime,
    to: isoDateTime,
    /** Slot length in minutes. Defaults to 30 (the standard consult slot). */
    durationMins: z
      .string()
      .optional()
      .transform((v) =>
        v === undefined || v === "" ? 30 : Number(v),
      )
      .pipe(z.number().int().positive().max(240)),
  })
  .refine((v) => v.to.getTime() > v.from.getTime(), {
    message: "`to` must be after `from`",
    path: ["to"],
  })
  .refine(
    (v) => v.to.getTime() - v.from.getTime() <= 14 * 24 * 60 * 60 * 1000,
    {
      message: "Availability window cannot exceed 14 days",
      path: ["to"],
    },
  )

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>

/**
 * `POST /api/appointments/book` body. Two flows share this schema:
 *
 *  - **Self-book:** authenticated patient calls with no `patientId`; the
 *    service derives the patient via `Patient.userId`.
 *  - **On-behalf:** ADMIN / RECEPTION calls with an explicit `patientId`.
 *    The route handler gates this branch by role; the schema accepts it
 *    optionally either way.
 *
 * Wire format mirrors the staff-side create schema in field names so the
 * patient-portal booking widget can share the same form types.
 */
/**
 * Optional scored Health Assessment, attached when the patient takes the
 * quiz as part of booking (portal quiz-first flow). Client-scored — same
 * shape the public booking + in-clinic kiosk submit use.
 */
export const bookAssessmentSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  scoreOutOf: z.number().int().positive(),
  band: z.enum(["optimal", "mild", "moderate", "significant"]),
  topRisks: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        severity: z.enum(["High", "Moderate", "Low"]),
      }),
    )
    .max(6),
  suggestedFocus: z.array(z.object({ key: z.string(), label: z.string() })).max(6),
  byCategory: z.record(z.string(), z.number().int().min(0)),
  answers: z.record(z.string(), z.unknown()),
  sex: z.enum(["male", "female", "other"]).nullable(),
})

export const bookAppointmentSchema = z
  .object({
    patientId: uuid.optional(),
    staffId: uuid,
    scheduledAt: isoDateTime,
    durationMins: z.number().int().positive().max(240).default(30),
    reason: trimmedOptional(500),
    notes: trimmedOptional(2000),
    assessment: bookAssessmentSchema.optional(),
  })

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>

// ---------------------------------------------------------------------------
// Plan-link decoder (BE-29)
// ---------------------------------------------------------------------------

/**
 * Shape of the plan-link marker embedded in `Appointment.notes` for
 * appointments synthesized by `materializeAppointmentsForPlan` (BE-29).
 *
 * The marker is a single line of JSON written as the FIRST line of the
 * notes field. Reception staff may append free-text below it on a
 * subsequent line; the parser tolerates that and ignores anything past
 * the first newline.
 */
export type AppointmentPlanLink = {
  planId: string
  planItemId: string
  sequence: number
}

/**
 * Decode the plan-link from an appointment's `notes`. Returns `null` for:
 *   - notes that are `null` / empty,
 *   - notes whose first line isn't valid JSON,
 *   - JSON whose shape doesn't match (missing fields, wrong types).
 *
 * Deliberately permissive: this is a best-effort lookup used by the FE
 * timeline view to fold the appointment back under its parent plan; an
 * invalid marker should not throw.
 */
export function parsePlanLinkFromNotes(
  notes: string | null,
): AppointmentPlanLink | null {
  if (!notes) return null
  const firstLine = notes.split("\n", 1)[0]?.trim()
  if (!firstLine || firstLine[0] !== "{") return null
  let parsed: unknown
  try {
    parsed = JSON.parse(firstLine)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") return null
  const obj = parsed as Record<string, unknown>
  if (
    typeof obj.planId !== "string" ||
    typeof obj.planItemId !== "string" ||
    typeof obj.sequence !== "number"
  ) {
    return null
  }
  return {
    planId: obj.planId,
    planItemId: obj.planItemId,
    sequence: obj.sequence,
  }
}
