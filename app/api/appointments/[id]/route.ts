/**
 * `/api/appointments/[id]` item routes (BE-27).
 *
 *   GET   — fetch one appointment with patient + staff summary (READ audit row).
 *   PATCH — partial update of time/reason/notes. Re-runs the slot-conflict
 *           check when either time bound changes. Status changes go
 *           through `/api/appointments/[id]/transition` instead.
 *
 * Both require an authenticated session; role gates and audit writes
 * live in `lib/services/appointment.ts`.
 */

import { defineHandler, ok, requireSession } from "@/lib/api"
import {
  appointmentIdParamSchema,
  updateAppointmentSchema,
} from "@/lib/validation/appointment"
import {
  getAppointment,
  updateAppointment,
} from "@/lib/services/appointment"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = appointmentIdParamSchema.parse(await params)
  const appointment = await getAppointment(id, {
    userId: session.userId,
    role: session.role,
  })
  return ok(appointment)
})

export const PATCH = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireSession()
  const { id } = appointmentIdParamSchema.parse(await params)
  const body = updateAppointmentSchema.parse(await req.json())
  const appointment = await updateAppointment(id, body, {
    userId: session.userId,
    role: session.role,
  })
  return ok(appointment)
})
