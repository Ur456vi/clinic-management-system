/**
 * `/api/treatment-plans/[id]` item routes (BE-24).
 *
 *   GET   — fetch one plan with items + author/signer/patient summary.
 *           Writes a READ audit row. Roles: ADMIN / DOCTOR / RMO /
 *           RECEPTION (enforced in service).
 *   PATCH — partial update of header + replace items. DRAFT-only.
 *           Roles: ADMIN / DOCTOR (enforced in service).
 *
 * Status transitions live on `[id]/sign` — this route never flips
 * `status`, `signedAt`, or `signedById`.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  treatmentPlanIdParamSchema,
  updateTreatmentPlanSchema,
} from "@/lib/validation/treatment-plan"
import { getPlan, updatePlan } from "@/lib/services/treatment-plan"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = treatmentPlanIdParamSchema.parse(await params)
  const plan = await getPlan(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(plan)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = treatmentPlanIdParamSchema.parse(await params)
  const body = updateTreatmentPlanSchema.parse(await req.json())
  const plan = await updatePlan(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(plan)
})
