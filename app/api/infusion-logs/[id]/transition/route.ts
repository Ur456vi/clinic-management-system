/**
 * `/api/infusion-logs/[id]/transition` (BE-26).
 *
 *   POST — apply a status transition.
 *          SCHEDULED   -> IN_PROGRESS | ABORTED
 *          IN_PROGRESS -> COMPLETED   | ABORTED
 *          COMPLETED / ABORTED are terminal.
 *
 * Side-effects (see `transitionInfusionLog`):
 *   - SCHEDULED -> IN_PROGRESS  : refresh `startedAt = now()` if the
 *                                 stored value is in the future.
 *   - IN_PROGRESS -> COMPLETED  : stamp `completedAt = now()` if unset.
 *   - * -> ABORTED              : stamp `completedAt = now()` if unset
 *                                 and record `reaction` from `reason`.
 *
 * Auth: any WRITE_ROLES member (ADMIN / DOCTOR / RMO / INFUSION_SPECIALIST),
 * enforced in the service layer.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  infusionLogIdParamSchema,
  transitionInfusionLogSchema,
} from "@/lib/validation/infusion-log"
import { transitionInfusionLog } from "@/lib/services/infusion-log"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = infusionLogIdParamSchema.parse(await params)
  const body = transitionInfusionLogSchema.parse(await req.json())
  const log = await transitionInfusionLog(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(log)
})
