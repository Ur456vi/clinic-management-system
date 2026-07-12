/**
 * `/api/vital-assessments/[id]`
 *
 *   PATCH  — partial update of a vital assessment. WRITE_ROLES gate.
 *   DELETE — remove a vital assessment. DELETE_ROLES gate (ADMIN only).
 *
 * Role gates + audit writes live in `lib/services/vital-assessment.ts`.
 */

import { defineHandler, noContent, ok, requireSession } from "@/lib/api"
import {
  updateVitalAssessmentSchema,
  vitalAssessmentIdParamSchema,
} from "@/lib/validation/vital-assessment"
import {
  deleteVitalAssessment,
  updateVitalAssessment,
} from "@/lib/services/vital-assessment"

type Params = { id: string }

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = vitalAssessmentIdParamSchema.parse(await params)
  const body = updateVitalAssessmentSchema.parse(await req.json())
  const record = await updateVitalAssessment(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(record)
})

export const DELETE = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = vitalAssessmentIdParamSchema.parse(await params)
  await deleteVitalAssessment(id, {
    userId: session.userId,
    role: session.role,
  })
  return noContent()
})
