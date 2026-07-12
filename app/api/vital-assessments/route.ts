/**
 * `/api/vital-assessments`
 *
 *   GET  — list a patient's vital assessments (newest first). `?patientId=…`
 *          required. READ_ROLES gate (in the service).
 *   POST — create a new vital assessment. WRITE_ROLES gate.
 *
 * The patient-chart "Vital Assessment" tab — captures of the IPHMH Patient
 * Assessment Sheet (anthropometrics + vitals).
 */

import { created, defineHandler, ok, requireSession } from "@/lib/api"
import {
  createVitalAssessmentSchema,
  listVitalAssessmentsQuerySchema,
} from "@/lib/validation/vital-assessment"
import {
  createVitalAssessment,
  listVitalAssessments,
} from "@/lib/services/vital-assessment"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const { searchParams } = new URL(req.url)
  const query = listVitalAssessmentsQuerySchema.parse({
    patientId: searchParams.get("patientId") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })
  const result = await listVitalAssessments(query, {
    userId: session.userId,
    role: session.role,
  })
  return ok({ items: result.items, nextCursor: result.nextCursor })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createVitalAssessmentSchema.parse(await req.json())
  const record = await createVitalAssessment(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(record)
})
