/**
 * `/api/treatment-plans/[id]/revoke` action route (BE-25).
 *
 *   POST — flip a SIGNED plan to REVOKED. Stamps `revokedAt`, `revokedById`,
 *          and (optionally) `revokeReason` atomically with the audit-log
 *          row. Roles: ADMIN, or DOCTOR who signed/authored the plan.
 *
 * Body: optional `{ "reason"?: string }`. Empty body and `{}` are both
 * accepted — the service stores NULL for missing/blank reasons.
 *
 * Error cases:
 *   - 404 — plan id not found
 *   - 400 — plan is DRAFT or already REVOKED (cannot transition)
 *   - 403 — DOCTOR caller is not the signer/author of the plan
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  revokeTreatmentPlanSchema,
  treatmentPlanIdParamSchema,
} from "@/lib/validation/treatment-plan"
import { revokePlan } from "@/lib/services/treatment-plan"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = treatmentPlanIdParamSchema.parse(await params)

  // Body is optional — clients may POST with no body at all.
  const raw = await req.text()
  const parsed = raw.length === 0
    ? { reason: undefined }
    : revokeTreatmentPlanSchema.parse(JSON.parse(raw))

  const plan = await revokePlan(
    id,
    { userId: session.userId, role: session.role },
    parsed.reason,
  )
  return ok(plan)
})
