/**
 * `/api/refills/[id]/transition`.
 *
 *   POST — apply a status transition (staff only).
 *          PENDING  -> APPROVED | DECLINED
 *          APPROVED -> FULFILLED | DECLINED
 *          FULFILLED / DECLINED are terminal.
 *
 * Side-effects (see `transitionRefillRequest`): stamps the matching
 * lifecycle timestamp + decider, and fires a best-effort patient
 * notification. Auth: any WRITE_ROLES member, enforced in the service.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  refillRequestIdParamSchema,
  transitionRefillRequestSchema,
} from "@/lib/validation/refill-request"
import { transitionRefillRequest } from "@/lib/services/refill-request"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = refillRequestIdParamSchema.parse(await params)
  const body = transitionRefillRequestSchema.parse(await req.json())
  const row = await transitionRefillRequest(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(row)
})
