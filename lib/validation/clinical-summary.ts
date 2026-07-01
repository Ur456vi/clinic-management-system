/**
 * Zod schemas for the ClinicalSummary API surface.
 *
 * A clinical summary is a dated entry (title + date) that holds one or more
 * uploaded documents. The S3 objects are uploaded by the client via the
 * presigned-PUT flow (`POST /api/files/upload-url`) first; the attach body
 * just describes the resulting key + metadata so we can persist a file row.
 *
 *   - `createClinicalSummarySchema`     — POST  /api/clinical-summaries
 *   - `listClinicalSummariesQuerySchema`— GET   /api/clinical-summaries
 *   - `attachClinicalSummaryFileSchema` — POST  /api/clinical-summaries/:id/files
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

export const createClinicalSummarySchema = z.object({
  patientId: uuid,
  title: z.string().trim().min(1, "Required").max(200),
  summaryDate: isoDateTime,
  notes: z.string().trim().max(5000).optional(),
})

export type CreateClinicalSummaryInput = z.infer<
  typeof createClinicalSummarySchema
>

export const listClinicalSummariesQuerySchema = z.object({
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

export type ListClinicalSummariesQuery = z.infer<
  typeof listClinicalSummariesQuerySchema
>

export const clinicalSummaryIdParamSchema = z.object({ id: uuid })

/** Route params for a single file under a clinical summary. */
export const clinicalSummaryFileParamSchema = z.object({
  id: uuid,
  fileId: uuid,
})

/**
 * Body for `POST /api/clinical-summaries/:id/files`.
 *
 * The S3 object has already been uploaded by the client via the presigned-PUT
 * flow (`POST /api/files/upload-url`); this body describes the key + optional
 * metadata so we can persist it as a `ClinicalSummaryFile` row.
 */
export const attachClinicalSummaryFileSchema = z.object({
  key: z.string().trim().min(1, "Required").max(1024),
  contentType: z.string().trim().min(1).max(200).optional(),
  sizeBytes: z.number().int().nonnegative().max(25 * 1024 * 1024).optional(),
  /** Original filename for display + download disposition. */
  filename: z.string().trim().min(1).max(255).optional(),
})

export type AttachClinicalSummaryFileBody = z.infer<
  typeof attachClinicalSummaryFileSchema
>
