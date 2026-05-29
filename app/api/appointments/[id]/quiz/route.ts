/**
 * `GET /api/appointments/[id]/quiz`
 *
 * Convenience endpoint for the appointment's "View quiz Assessment" action.
 * Resolves the appointment's patient and returns that patient's most recent
 * assessment submission in full (score, band, per-category subtotals, top
 * risks, suggested focus, and the raw per-question answers). Returns
 * `{ data: null }` when the patient has never taken the quiz.
 */

import { Role } from "@prisma/client"

import { defineHandler, NotFoundError, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION)
  const { id } = await params

  const appt = await db.appointment.findUnique({
    where: { id },
    select: { patientId: true },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  const row = await db.assessmentSubmission.findFirst({
    where: { patientId: appt.patientId },
    orderBy: { createdAt: "desc" },
    include: {
      patient: {
        select: { id: true, patientNumber: true, fullName: true },
      },
    },
  })

  if (!row) return ok(null)

  return ok({
    id: row.id,
    bookingRef: row.bookingRef,
    patient: row.patient,
    contactSex: row.contactSex,
    preferredAt: row.preferredAt.toISOString(),
    preferredTime: row.preferredTime,
    notes: row.notes,
    totalScore: row.totalScore,
    scoreOutOf: row.scoreOutOf,
    band: row.band,
    byCategory: row.byCategory,
    topRisks: row.topRisks,
    suggestedFocus: row.suggestedFocus,
    answers: row.answers,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  })
})
