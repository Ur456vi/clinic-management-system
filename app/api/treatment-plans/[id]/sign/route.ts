/**
 * `/api/treatment-plans/[id]/sign` action route (BE-24).
 *
 *   POST — flip a DRAFT plan to SIGNED. Stamps `signedAt` (server clock)
 *          + `signedById` (the actor) atomically with the audit-log row.
 *          Roles: ADMIN / DOCTOR.
 *
 * Body is empty. Re-signing a SIGNED or REVOKED plan throws 400.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { treatmentPlanIdParamSchema } from "@/lib/validation/treatment-plan"
import { signPlan } from "@/lib/services/treatment-plan"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = treatmentPlanIdParamSchema.parse(await params)
  const plan = await signPlan(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(plan)
})
