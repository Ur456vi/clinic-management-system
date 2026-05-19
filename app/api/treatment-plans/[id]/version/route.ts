/**
 * `/api/treatment-plans/[id]/version` action route (BE-25).
 *
 *   POST — clone a plan (DRAFT, SIGNED, or REVOKED) into a fresh DRAFT.
 *          Copies header + items, increments `version`, sets
 *          `previousVersionId` to the source row. The cloning user
 *          becomes `createdById` on the new plan. Sign / revoke stamps
 *          are reset on the clone.
 *          Roles: ADMIN / DOCTOR.
 *
 * Body: empty.
 *
 * Response: 201 Created with the new plan in the `data` envelope plus a
 * `Location` header pointing at the new resource.
 *
 * Error cases:
 *   - 404 — source plan id not found
 *   - 403 — caller is not ADMIN / DOCTOR
 */

import { created, defineHandler, requireSession } from "@/lib/api"
import { treatmentPlanIdParamSchema } from "@/lib/validation/treatment-plan"
import { versionPlan } from "@/lib/services/treatment-plan"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = treatmentPlanIdParamSchema.parse(await params)
  const plan = await versionPlan(id, {
    userId: session.userId,
    role: session.role,
  })
  return created(plan, `/api/treatment-plans/${plan.id}`)
})
