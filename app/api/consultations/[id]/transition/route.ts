/**
 * `POST /api/consultations/[id]/transition` (BE-15).
 *
 * Drives a consultation through the explicit state machine:
 *
 *   DRAFT       -> RMO_DONE      (RMO completed intake; doctor pickup queued)
 *   RMO_DONE    -> IN_PROGRESS   (doctor claimed the case)
 *   IN_PROGRESS -> SIGNED        (doctor signed the chart; terminal)
 *
 * Anything else returns 409 Conflict. Role gating, audit log writes and
 * the doctor-handoff notification fan-out all live in
 * `lib/services/consultation.ts#transitionConsultation`.
 *
 * Request body:
 *   { "to": "RMO_DONE" | "IN_PROGRESS" | "SIGNED", "notes"?: string }
 *
 * Returns the updated consultation in the standard `{ data }` envelope.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  consultationIdParamSchema,
  transitionConsultationSchema,
} from "@/lib/validation/consultation"
import { transitionConsultation } from "@/lib/services/consultation"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = consultationIdParamSchema.parse(await params)
  const body = transitionConsultationSchema.parse(await req.json())
  const consultation = await transitionConsultation(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(consultation)
})
