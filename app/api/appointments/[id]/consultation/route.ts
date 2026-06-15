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
import { assertAppointmentAccess } from "@/lib/services/appointment"
import {
  createConsultation,
  getConsultation,
} from "@/lib/services/consultation"

type Params = { id: string }

/**
 * Latest RMO intake for this patient, surfaced read-only inside the doctor's
 * MAIN consultation ("RMO Summary" tab). Returns null when no RMO chart
 * exists yet (e.g. a patient booked straight in with the doctor).
 */
async function latestRmoSummary(patientId: string) {
  return db.consultation.findFirst({
    where: { patientId, type: ConsultationType.RMO },
    orderBy: { createdAt: "desc" },
    select: { id: true, sections: true, status: true, createdAt: true },
  })
}

/**
 * Appointment slot info surfaced on the consultation so the doctor's
 * "Consultation Details" can pre-fill the date + booked duration.
 */
function apptInfo(appt: { startsAt: Date; endsAt: Date }) {
  return {
    date: appt.startsAt.toISOString(),
    durationMinutes: Math.max(
      0,
      Math.round((appt.endsAt.getTime() - appt.startsAt.getTime()) / 60000),
    ),
  }
}

export const GET = defineHandler<Params>(async ({ params }) => {
  const session = await requireSession()
  const { id } = appointmentIdParamSchema.parse(await params)

  const appt = await db.appointment.findUnique({
    where: { id },
    select: { consultationId: true, staffId: true, startsAt: true, endsAt: true },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  // Non-admin staff may only read consultations on their own appointments.
  await assertAppointmentAccess(appt.staffId, session)

  if (!appt.consultationId) return ok(null)

  const consultation = await getConsultation(appt.consultationId, {
    userId: session.userId,
    role: session.role,
  })
  const appointment = apptInfo(appt)

  // The doctor's MAIN chart carries the patient's latest RMO intake so the
  // "RMO Summary" tab can render it without a second round-trip.
  if (consultation.type === ConsultationType.MAIN) {
    const rmoSummary = await latestRmoSummary(consultation.patientId)
    return ok({ ...consultation, appointment, rmoSummary })
  }
  return ok({ ...consultation, appointment })
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
      staffId: true,
      startsAt: true,
      endsAt: true,
      staff: { select: { user: { select: { role: true } } } },
    },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  // Only the assigned staff member (or admin/reception) may start or
  // resume the consultation for this appointment.
  await assertAppointmentAccess(appt.staffId, session)

  const appointment = apptInfo(appt)

  // Already started — return the existing chart.
  if (appt.consultationId) {
    const existing = await getConsultation(appt.consultationId, {
      userId: session.userId,
      role: session.role,
    })
    if (existing.type === ConsultationType.MAIN) {
      const rmoSummary = await latestRmoSummary(existing.patientId)
      return ok({ ...existing, appointment, rmoSummary })
    }
    return ok({ ...existing, appointment })
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

  if (consultation.type === ConsultationType.MAIN) {
    const rmoSummary = await latestRmoSummary(consultation.patientId)
    return ok({ ...consultation, appointment, rmoSummary })
  }
  return ok({ ...consultation, appointment })
})
