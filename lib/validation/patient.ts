/**
 * Zod schemas for the Patient API surface.
 *
 * Three schemas are exported:
 *   - `createPatientSchema`  — POST /api/patients
 *   - `updatePatientSchema`  — PATCH /api/patients/:id (partial)
 *   - `listPatientsQuerySchema` — GET /api/patients query string
 *
 * Each schema is the *only* place client input is validated. Service-layer
 * functions trust their inputs once they have been parsed through these
 * schemas. Use `.parse()` (not `.safeParse()`) so that a `ZodError` bubbles
 * up to the route's `errorResponse()` mapper.
 */

import { z } from "zod"
import { PatientStatus, Sex } from "@prisma/client"

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

/** Trim then treat empty string as "absent" so optional fields are forgiving. */
const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

/** Accept ISO 8601 date strings; coerce to Date. */
const isoDate = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be an ISO 8601 date string",
  })
  .transform((v) => new Date(v))

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const sexEnum = z.nativeEnum(Sex)
const statusEnum = z.nativeEnum(PatientStatus)

// ---------------------------------------------------------------------------
// createPatientSchema
// ---------------------------------------------------------------------------

/**
 * Request body for `POST /api/patients`.
 *
 * Only `fullName` is required. All other fields can be supplied later via
 * PATCH. The route assigns `patientNumber` and `status` itself.
 */
export const createPatientSchema = z.object({
  fullName: z.string().trim().min(1, "Required").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Must be a valid email" })
    .max(254)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  phone: trimmedOptional(50),
  dateOfBirth: isoDate.optional(),
  sex: sexEnum.optional(),
  occupation: trimmedOptional(200),
  placeOfResidence: trimmedOptional(200),
  address: trimmedOptional(500),
  referralSource: trimmedOptional(200),
  primaryDoctorId: uuid.optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>

// ---------------------------------------------------------------------------
// updatePatientSchema
// ---------------------------------------------------------------------------

/**
 * Request body for `PATCH /api/patients/:id`. Every field is optional —
 * sending `{}` is a no-op (the service will still write an audit log, but
 * the diff will be empty).
 *
 * Adds `status` on top of the create fields so admins can toggle a patient
 * between ACTIVE / INACTIVE without going through soft-delete.
 */
export const updatePatientSchema = createPatientSchema
  .partial()
  .extend({
    status: statusEnum.optional(),
  })

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>

// ---------------------------------------------------------------------------
// listPatientsQuerySchema
// ---------------------------------------------------------------------------

/**
 * Status filter: accepts a single value or a comma-separated list. Each
 * token is trimmed and validated against the `PatientStatus` enum. An
 * empty list collapses to `undefined` so callers can pass `status=` to
 * mean "no filter".
 *
 * Examples:
 *   ?status=ACTIVE                 -> [ACTIVE]
 *   ?status=ACTIVE,INACTIVE        -> [ACTIVE, INACTIVE]
 *   ?status=                       -> undefined
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

/**
 * Query string for `GET /api/patients`.
 *
 * BE-12 added the short-form aliases `q`, `doctorId`, and `limit` to match
 * the cross-team query-param convention; the legacy `search`,
 * `primaryDoctorId`, and `take` names continue to work for backwards
 * compatibility with the FE clients that shipped against BE-07. If both
 * spellings are supplied the short form wins.
 */
export const listPatientsQuerySchema = z
  .object({
    // search term — `q` is the canonical name, `search` kept as alias
    q: trimmedOptional(200),
    search: trimmedOptional(200),

    // status — comma-separated allowed
    status: statusListParam,

    // assigned-doctor filter — `doctorId` canonical, `primaryDoctorId` alias
    doctorId: uuid.optional(),
    primaryDoctorId: uuid.optional(),

    cursor: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === "" ? undefined : v)),

    // page size — `limit` canonical, `take` kept as alias
    limit: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .pipe(z.number().int().positive().max(100).optional()),
    take: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .pipe(z.number().int().positive().max(100).optional()),
  })
  .transform((v) => ({
    // collapse aliases — short form wins when both are present
    search: v.q ?? v.search,
    status: v.status,
    primaryDoctorId: v.doctorId ?? v.primaryDoctorId,
    cursor: v.cursor,
    take: v.limit ?? v.take,
  }))

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>
