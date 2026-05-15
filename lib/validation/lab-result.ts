/**
 * Zod schemas for the LabResult API surface (BE-16).
 *
 * Per-panel rows; the per-analyte payload lives in the `analytes` array.
 * Each analyte is `{ name, value, unit?, refLow?, refHigh?, flag? }`.
 *
 *   - `value` is a number (lab numeric result). Qualitative results
 *     (POSITIVE/NEGATIVE) are out-of-scope for Sprint 1.
 *   - `flag` is OPTIONAL on input. The service layer overwrites it from
 *     `refLow`/`refHigh` so callers that round-trip stored data don't
 *     accidentally desync flag vs. reference range.
 *   - We do NOT validate analyte names against a controlled vocabulary
 *     yet — that lives in BE-18's reference-range engine.
 */

import { z } from "zod"
import { LabPanel } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

/** Out-of-range flag computed from refLow/refHigh. */
export const labFlagSchema = z.enum(["HIGH", "LOW", "NORMAL"])
export type LabFlag = z.infer<typeof labFlagSchema>

export const analyteInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  value: z.number().finite(),
  unit: z.string().trim().max(40).optional(),
  refLow: z.number().finite().optional(),
  refHigh: z.number().finite().optional(),
  /** Ignored on input — the service layer recomputes it. */
  flag: labFlagSchema.optional(),
})

export type AnalyteInput = z.infer<typeof analyteInputSchema>

export const panelEnum = z.nativeEnum(LabPanel)

const isoDateTime = z
  .string()
  .datetime({ offset: true, message: "Must be an ISO-8601 datetime" })

export const createLabResultSchema = z.object({
  patientId: uuid,
  panel: panelEnum,
  analytes: z.array(analyteInputSchema).default([]),
  orderedById: uuid.optional(),
  notes: z.string().trim().max(2000).optional(),
  attachmentKey: z.string().trim().max(512).optional(),
  collectedAt: isoDateTime.optional(),
  reportedAt: isoDateTime.optional(),
})

export type CreateLabResultInput = z.infer<typeof createLabResultSchema>

export const updateLabResultSchema = z.object({
  panel: panelEnum.optional(),
  analytes: z.array(analyteInputSchema).optional(),
  orderedById: uuid.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  attachmentKey: z.string().trim().max(512).nullable().optional(),
  collectedAt: isoDateTime.nullable().optional(),
  reportedAt: isoDateTime.nullable().optional(),
})

export type UpdateLabResultInput = z.infer<typeof updateLabResultSchema>

export const labResultIdParamSchema = z.object({ id: uuid })

export const listLabResultsQuerySchema = z.object({
  patientId: uuid.optional(),
  panel: panelEnum.optional(),
  cursor: uuid.optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
})

export type ListLabResultsQuery = z.infer<typeof listLabResultsQuerySchema>
