/**
 * Zod schemas for the Vital Assessment API surface (patient-chart "Vital
 * Assessment" tab). One record = one capture of the IPHMH Patient Assessment
 * Sheet: a date, an optional consultant, an optional note, and a map of the
 * sheet's field values (see `lib/vital-assessment-fields.ts`).
 *
 *   - `createVitalAssessmentSchema` — POST  /api/vital-assessments
 *   - `updateVitalAssessmentSchema` — PATCH /api/vital-assessments/:id
 *   - `listVitalAssessmentsQuerySchema` — GET /api/vital-assessments
 *   - `vitalAssessmentIdParamSchema` — :id path param
 */

import { z } from "zod"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

/** ISO 8601 date-time string, parsed to a Date for the service layer. */
const isoDateTime = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be an ISO 8601 date-time string",
  })
  .transform((v) => new Date(v))

/**
 * Map of measurement fieldKey -> value string. Unknown keys / empty values are
 * pruned in the service against the canonical field list; here we only bound
 * the shape (string keys, short string values).
 */
const measurements = z.record(z.string(), z.string().trim().max(100))

export const createVitalAssessmentSchema = z.object({
  patientId: uuid,
  assessedAt: isoDateTime,
  consultant: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(5000).nullable().optional(),
  measurements: measurements.optional(),
})

export type CreateVitalAssessmentInput = z.infer<typeof createVitalAssessmentSchema>

export const updateVitalAssessmentSchema = z.object({
  assessedAt: isoDateTime.optional(),
  consultant: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(5000).nullable().optional(),
  measurements: measurements.optional(),
})

export type UpdateVitalAssessmentInput = z.infer<typeof updateVitalAssessmentSchema>

export const listVitalAssessmentsQuerySchema = z.object({
  patientId: uuid,
  cursor: z.string().min(1).optional(),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined
      const n = typeof v === "number" ? v : Number(v)
      return Number.isFinite(n) ? n : undefined
    })
    .pipe(z.number().int().min(1).max(100).optional()),
})

export type ListVitalAssessmentsQuery = z.infer<typeof listVitalAssessmentsQuerySchema>

export const vitalAssessmentIdParamSchema = z.object({ id: uuid })
