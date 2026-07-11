/**
 * Zod schemas for the Infusion API surface (patient-chart Infusion tab).
 *
 * An infusion session is the lightweight per-session record captured from the
 * patient chart: a name, the calendar day, free-text start/end clock labels,
 * an eventful/uneventful flag, and an optional note. Distinct from the BE-26
 * `InfusionLog` protocol log (`lib/validation/infusion-log.ts`).
 *
 *   - `createInfusionSchema`     — POST  /api/infusions
 *   - `updateInfusionSchema`     — PATCH /api/infusions/:id
 *   - `listInfusionsQuerySchema` — GET   /api/infusions
 *   - `infusionIdParamSchema`    — :id path param
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

/** Free-text clock label (e.g. "12:00 Pm"); empty collapses to undefined. */
const clockLabel = z
  .string()
  .trim()
  .max(50)
  .optional()
  .transform((v) => (v === "" ? undefined : v))

/**
 * Optional single summary-file fields (PDF / DOCX / image / Excel). The browser
 * uploads the file to S3 first (presign → PUT via /api/files/upload-url) and
 * passes the resulting object key + metadata here. `null` clears the file.
 */
const summaryFileFields = {
  summaryKey: z.string().trim().min(1).max(1024).nullable().optional(),
  summaryMime: z.string().trim().max(255).nullable().optional(),
  summaryFilename: z.string().trim().max(255).nullable().optional(),
  summarySizeBytes: z.number().int().positive().nullable().optional(),
}

export const createInfusionSchema = z.object({
  patientId: uuid,
  name: z.string().trim().min(1, "Required").max(200),
  date: isoDateTime,
  startTime: clockLabel,
  endTime: clockLabel,
  eventful: z.boolean().optional(),
  note: z.string().trim().max(5000).optional(),
  ...summaryFileFields,
})

export type CreateInfusionInput = z.infer<typeof createInfusionSchema>

/**
 * Body for `PATCH /api/infusions/:id`. Every field optional; nullable fields
 * accept `null` to clear, `undefined` to leave alone.
 */
export const updateInfusionSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  date: isoDateTime.optional(),
  startTime: z.string().trim().max(50).nullable().optional(),
  endTime: z.string().trim().max(50).nullable().optional(),
  eventful: z.boolean().optional(),
  note: z.string().trim().max(5000).nullable().optional(),
  ...summaryFileFields,
})

export type UpdateInfusionInput = z.infer<typeof updateInfusionSchema>

export const listInfusionsQuerySchema = z.object({
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

export type ListInfusionsQuery = z.infer<typeof listInfusionsQuerySchema>

export const infusionIdParamSchema = z.object({ id: uuid })
