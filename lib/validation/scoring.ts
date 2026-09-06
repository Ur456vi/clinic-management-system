/**
 * Zod schemas for the IPHMH scoring API surface.
 *
 * The scoring endpoints are read-only, so there are no body schemas — only
 * path params and list query options.
 */

import { z } from "zod"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

export const consultationScoreParamSchema = z.object({ id: uuid })

export const patientScoresParamSchema = z.object({ id: uuid })

export const scoreHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type ScoreHistoryQuery = z.infer<typeof scoreHistoryQuerySchema>
