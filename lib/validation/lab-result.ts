/**
 * Zod schemas for the LabResult API surface (BE-16).
 *
 * Three schemas are exported:
 *   - `createLabResultSchema`        — POST  /api/lab-results
 *   - `updateLabResultSchema`        — PATCH /api/lab-results/:id
 *   - `listLabResultsQuerySchema`    — GET   /api/lab-results
 *
 * The per-analyte payload is intentionally permissive — `value` accepts a
 * string OR a number because labs return both ("13.4 g/dL" numeric vs.
 * "POSITIVE" categorical). Reference ranges (`refLow` / `refHigh`) are
 * numeric only; the service layer's flag-computation helper is a no-op
 * when either side is missing.
 *
 * The route's `id` path param is validated by `labResultIdParamSchema`.
 */

import { z } from "zod"
import { LabFlag } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

/** ISO 8601 date-time string, parsed to a Date for the service layer. */
const isoDateTime = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be an ISO 8601 date-time string",
  })
  .transform((v) => new Date(v))

const flagEnum = z.nativeEnum(LabFlag)

/**
 * One row of `analytes`. Mirrors the JSON shape documented in
 * `prisma/schema.prisma` on the LabResult model.
 *
 * `value` is a string-or-number union so a non-numeric lab ("POSITIVE",
 * "Trace", "Not detected") rides through untouched. Reference ranges are
 * numeric only.
 */
export const analyteSchema = z.object({
  name: z.string().trim().min(1, "Required").max(200),
  value: z.union([z.string().trim().max(500), z.number()]),
  unit: z.string().trim().max(50).optional(),
  refLow: z.number().finite().optional(),
  refHigh: z.number().finite().optional(),
  flag: flagEnum.optional(),
})

export type AnalyteInput = z.infer<typeof analyteSchema>

const analytesArray = z.array(analyteSchema).max(500)

export const createLabResultSchema = z.object({
  patientId: uuid,
  consultationId: uuid.optional(),
  panelName: z.string().trim().min(1, "Required").max(200),
  collectedAt: isoDateTime,
  reportedAt: isoDateTime.optional(),
  orderingDoctorId: uuid.optional(),
  labName: z.string().trim().max(200).optional(),
  analytes: analytesArray.default([]),
  summary: z.string().trim().max(2000).optional(),
  attachmentKey: z.string().trim().max(1024).optional(),
  attachmentMime: z.string().trim().max(200).optional(),
})

export type CreateLabResultInput = z.infer<typeof createLabResultSchema>

export const updateLabResultSchema = z.object({
  consultationId: uuid.nullable().optional(),
  panelName: z.string().trim().min(1).max(200).optional(),
  collectedAt: isoDateTime.optional(),
  reportedAt: isoDateTime.nullable().optional(),
  orderingDoctorId: uuid.nullable().optional(),
  labName: z.string().trim().max(200).nullable().optional(),
  analytes: analytesArray.optional(),
  summary: z.string().trim().max(2000).nullable().optional(),
  attachmentKey: z.string().trim().max(1024).nullable().optional(),
  attachmentMime: z.string().trim().max(200).nullable().optional(),
})

export type UpdateLabResultInput = z.infer<typeof updateLabResultSchema>

/**
 * GET /api/lab-results query string. Either `patientId` or `consultationId`
 * must be supplied — the route returns 400 if both are missing (enforced
 * via `.refine`).
 */
export const listLabResultsQuerySchema = z
  .object({
    patientId: uuid.optional(),
    consultationId: uuid.optional(),
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
  .refine((v) => Boolean(v.patientId || v.consultationId), {
    message: "Either patientId or consultationId is required",
    path: ["patientId"],
  })

export type ListLabResultsQuery = z.infer<typeof listLabResultsQuerySchema>

export const labResultIdParamSchema = z.object({ id: uuid })

/**
 * Body for `PUT /api/lab-results/:id/attachment` (BE-20).
 *
 * The S3 object has already been uploaded by the client via the BE-19
 * presigned-PUT flow (`POST /api/files/upload-url`); this body just
 * describes the key + optional metadata so we can persist it on the
 * `LabResult` row.
 */
export const attachLabResultBodySchema = z.object({
  key: z.string().trim().min(1, "Required").max(1024),
  contentType: z.string().trim().min(1).max(200).optional(),
  sizeBytes: z.number().int().nonnegative().max(25 * 1024 * 1024).optional(),
})

export type AttachLabResultBody = z.infer<typeof attachLabResultBodySchema>
