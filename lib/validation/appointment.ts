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
// availabilityQuerySchema (BE-23)
// ---------------------------------------------------------------------------

/**
 * Query string for `GET /api/appointments/availability`.
 *
 *   staffId        — required; the staff member whose calendar to scan
 *   from / to      — required; ISO datetimes bounding the window to scan
 *   durationMins   — required; granularity of a candidate slot in minutes
 *
 * The service layer additionally enforces `to - from <= 14 days` and the
 * working-hours overlay (09:00–18:00 local for Sprint 1).
 */
export const availabilityQuerySchema = z
  .object({
    staffId: uuid,
    from: isoDateTime,
    to: isoDateTime,
    durationMins: z
      .string()
      .trim()
      .transform((v) => Number(v))
      .pipe(z.number().int().positive().min(5).max(480)),
  })
  .refine((v) => v.to.getTime() > v.from.getTime(), {
    message: "`to` must be after `from`",
    path: ["to"],
  })

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>

// ---------------------------------------------------------------------------
// bookAppointmentSchema (BE-23 — patient self-book)
// ---------------------------------------------------------------------------

/**
 * Body for `POST /api/appointments/book`.
 *
 * The route handler derives the patient from the session for PATIENT
 * callers (via `Patient.userId`). ADMIN / RECEPTION callers may pass an
 * explicit `patientId` to book on a patient's behalf; the service layer
 * enforces that role gate.
 *
 * `status` is server-assigned (REQUESTED) — same shape as
 * `POST /api/appointments`.
 */
export const bookAppointmentSchema = z
  .object({
    staffId: uuid,
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    reason: trimmedOptional(500),
    notes: trimmedOptional(2000),
    /** Admin/Reception only — book on behalf of an existing patient. */
    patientId: uuid.optional(),
  })
  .refine((v) => v.endsAt.getTime() > v.startsAt.getTime(), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  })

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>
