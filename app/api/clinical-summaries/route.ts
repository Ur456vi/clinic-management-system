/**
 * `/api/clinical-summaries`
 *
 *   GET  — list a patient's clinical summaries (newest first). `?patientId=…`
 *          required. READ_ROLES gate (in the service).
 *   POST — create a new summary entry (title + date + optional notes). Files
 *          are uploaded + attached afterwards via `/[id]/files`. WRITE_ROLES.
 */

import { created, defineHandler, ok, requireSession } from "@/lib/api"
import {
  createClinicalSummarySchema,
  listClinicalSummariesQuerySchema,
} from "@/lib/validation/clinical-summary"
import {
  createClinicalSummary,
  listClinicalSummaries,
} from "@/lib/services/clinical-summary"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const { searchParams } = new URL(req.url)
  const query = listClinicalSummariesQuerySchema.parse({
    patientId: searchParams.get("patientId") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })
  const result = await listClinicalSummaries(query, {
    userId: session.userId,
    role: session.role,
  })
  return ok({ items: result.items, nextCursor: result.nextCursor })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createClinicalSummarySchema.parse(await req.json())
  const summary = await createClinicalSummary(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(summary)
})
