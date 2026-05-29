/**
 * `/api/appointments/[id]/consultation`
 *
 *   GET  — return the consultation linked to this appointment, or null.
 *   POST — "Start appointment": find-or-create the consultation for this
 *          booking and return it. Idempotent — re-starting an appointment
 *          returns the same consultation row (Appointment.consultationId is
 *          a 1:1 link) so a chart is never duplicated.
 *
 * The consultation `type` is derived from the assigned staff member's role:
 * an RMO booking opens an RMO intake consultation, everyone else opens a
 * MAIN (doctor) consultation. Creation goes through the BE-14 service so
 * role gating + audit logging stay centralised.
 */

import { ConsultationType, Role } from "@prisma/client"

import { defineHandler, ok, requireSession } from "@/lib/api"
import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"
import { appointmentIdParamSchema } from "@/lib/validation/appointment"
import {
  createConsultation,
  getConsultation,
} from "@/lib/services/consultation"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = appointmentIdParamSchema.parse(await params)

  const appt = await db.appointment.findUnique({
    where: { id },
    select: { consultationId: true },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  if (!appt.consultationId) return ok(null)

  const consultation = await getConsultation(appt.consultationId, {
    userId: session.userId,
    role: session.role,
  })
  return ok(consultation)
})

export const POST = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = appointmentIdParamSchema.parse(await params)

  const appt = await db.appointment.findUnique({
    where: { id },
    select: {
      consultationId: true,
      patientId: true,
      reason: true,
      staff: { select: { user: { select: { role: true } } } },
    },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  // Already started — return the existing chart.
  if (appt.consultationId) {
    const existing = await getConsultation(appt.consultationId, {
      userId: session.userId,
      role: session.role,
    })
    return ok(existing)
  }

  const type =
    appt.staff?.user?.role === Role.RMO
      ? ConsultationType.RMO
      : ConsultationType.MAIN

  const consultation = await createConsultation(
    {
      patientId: appt.patientId,
      type,
      summary: appt.reason ?? undefined,
    },
    { userId: session.userId, role: session.role },
  )

  await db.appointment.update({
    where: { id },
    data: { consultationId: consultation.id },
  })

  return ok(consultation)
})
