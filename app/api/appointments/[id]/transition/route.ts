/**
 * `/api/appointments/[id]/transition` (BE-27).
 *
 *   POST — apply a status transition.
 *          REQUESTED  -> CONFIRMED | CANCELLED
 *          CONFIRMED  -> COMPLETED | CANCELLED | NO_SHOW
 *          COMPLETED / CANCELLED / NO_SHOW are terminal.
 *
 * On CANCELLED, `cancelledAt` is stamped to `now()` and `cancelledReason`
 * is recorded. Other transitions leave those columns untouched.
 *
 * Auth: any WRITE_ROLES member (ADMIN / DOCTOR / RMO / RECEPTION),
 * enforced in the service layer.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  appointmentIdParamSchema,
  transitionAppointmentSchema,
} from "@/lib/validation/appointment"
import { transitionAppointment } from "@/lib/services/appointment"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = appointmentIdParamSchema.parse(await params)
  const body = transitionAppointmentSchema.parse(await req.json())
  const appointment = await transitionAppointment(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(appointment)
})
