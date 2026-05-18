/**
 * `/api/treatment-plans/[id]/sign` action route (BE-24 + BE-29).
 *
 *   POST — flip a DRAFT plan to SIGNED. Stamps `signedAt` (server clock)
 *          + `signedById` (the actor) atomically with the audit-log row.
 *          On success, BE-29 materializes recurring appointments for any
 *          in-clinic plan items (IV / REHAB / AESTHETIC) and includes
 *          `appointmentsCreated` / `appointmentsSkipped` counters in the
 *          response envelope alongside the plan payload.
 *          Roles: ADMIN / DOCTOR.
 *
 * Body is empty. Re-signing a SIGNED or REVOKED plan throws 400.
 *
 * Response shape (data field):
 *   {
 *     ...<TreatmentPlan>,           // unchanged from BE-24 — backward compatible
 *     appointmentsCreated: number,  // BE-29, additive
 *     appointmentsSkipped: number,  // BE-29, additive
 *     appointmentIds: string[]      // BE-29, additive — ids of newly seeded rows
 *   }
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import { treatmentPlanIdParamSchema } from "@/lib/validation/treatment-plan"
import { signPlan } from "@/lib/services/treatment-plan"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = treatmentPlanIdParamSchema.parse(await params)
  const { plan, materialization } = await signPlan(id, {
    userId: session.userId,
    role: session.role,
  })
  // Envelope: spread the plan first so all BE-24 fields stay top-level and
  // backward-compatible. New BE-29 counters live alongside.
  return ok({
    ...plan,
    appointmentsCreated: materialization.created,
    appointmentsSkipped: materialization.skipped,
    appointmentIds: materialization.appointmentIds,
  })
})
