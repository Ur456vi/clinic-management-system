/**
 * `/api/appointments/[id]/rmo-summary`
 *
 *   GET — read-only: the latest RMO intake recorded for this appointment's
 *   patient, plus minimal patient info for the page header. Unlike
 *   `/api/appointments/[id]/consultation`, this never creates a chart, so
 *   the doctor can review the RMO summary from the appointment list without
 *   starting the appointment.
 */

import { ConsultationType, Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"
import { appointmentIdParamSchema } from "@/lib/validation/appointment"
import { assertAppointmentAccess } from "@/lib/services/appointment"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireRole(Role.ADMIN, Role.DOCTOR, Role.RMO)
  const { id } = appointmentIdParamSchema.parse(await params)

  const appt = await db.appointment.findUnique({
    where: { id },
    select: {
      staffId: true,
      patient: { select: { id: true, fullName: true, patientNumber: true } },
    },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  // Non-admin staff may only read summaries for their own appointments.
  await assertAppointmentAccess(appt.staffId, session)

  const rmoSummary = appt.patient
    ? await db.consultation.findFirst({
        where: { patientId: appt.patient.id, type: ConsultationType.RMO },
        orderBy: { createdAt: "desc" },
        select: { id: true, sections: true, status: true, createdAt: true },
      })
    : null

  return ok({ patient: appt.patient, rmoSummary })
})
