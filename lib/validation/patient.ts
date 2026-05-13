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
 * Query string for `GET /api/patients`.
 *
 * `take` / `cursor` are parsed by `parsePagination()` from the BE-07 helpers
 * in the route, but we redeclare them here so the schema doubles as
 * machine-readable docs.
 */
export const listPatientsQuerySchema = z.object({
  search: trimmedOptional(200),
  status: statusEnum.optional(),
  primaryDoctorId: uuid.optional(),
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  take: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .pipe(z.number().int().positive().max(100).optional()),
})

export type ListPatientsQuery = z.infer<typeof listPatientsQuerySchema>
