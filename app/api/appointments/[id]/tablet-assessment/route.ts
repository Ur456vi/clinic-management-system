/**
 * `POST /api/appointments/[id]/tablet-assessment`
 *
 * In-clinic kiosk submission. A walk-in patient fills the Health Assessment
 * quiz on a clinic tablet (handed over by reception/RMO); this records the
 * scored result as an `AssessmentSubmission` for the appointment's patient.
 *
 * Unlike the public `/api/assessment-booking` flow there is NO patient
 * upsert, NO slot picker, and NO new appointment — the patient already
 * exists and is already here. The submission is stamped "now" and pulls
 * contact details from the patient record, so the RMO/Doctor see the quiz
 * on this visit (the `/quiz` endpoint resolves the latest submission for
 * the patient).
 *
 * Staff-only (the tablet is a staff device); the per-appointment ownership
 * gate keeps a doctor/RMO from posting against another staff member's
 * appointment.
 */

import {
  AssessmentBand,
  AssessmentSubmissionStatus,
  Prisma,
  Role,
} from "@prisma/client"
import { randomUUID } from "node:crypto"
import { z } from "zod"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"
import { assertAppointmentAccess } from "@/lib/services/appointment"

type Params = { id: string }

/** Mirrors the public booking payload's `assessment` block (client-scored),
 *  plus the patient-declared `sex` used to pick the question set. */
const bodySchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  scoreOutOf: z.number().int().positive(),
  band: z.enum(["optimal", "mild", "moderate", "significant"]),
  topRisks: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        severity: z.enum(["High", "Moderate", "Low"]),
      }),
    )
    .max(6),
  suggestedFocus: z.array(z.object({ key: z.string(), label: z.string() })).max(6),
  byCategory: z.record(z.string(), z.number().int().min(0)),
  answers: z.record(z.string(), z.unknown()),
  sex: z.enum(["male", "female", "other"]).nullable(),
})

const BAND_MAP: Record<z.infer<typeof bodySchema>["band"], AssessmentBand> = {
  optimal: AssessmentBand.OPTIMAL,
  mild: AssessmentBand.MILD,
  moderate: AssessmentBand.MODERATE,
  significant: AssessmentBand.SIGNIFICANT,
}

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireRole(Role.ADMIN, Role.RECEPTION, Role.RMO, Role.DOCTOR)
  const { id } = await params
  const body = bodySchema.parse(await req.json())

  const appt = await db.appointment.findUnique({
    where: { id },
    select: {
      staffId: true,
      patient: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    },
  })
  if (!appt || !appt.patient) {
    throw new NotFoundError("Appointment or patient not found")
  }

  // Walk-in tablet is a staff device — only the assigned staff (or
  // admin/reception) may record a quiz against this appointment.
  await assertAppointmentAccess(appt.staffId, session)

  const now = new Date()
  const preferredTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`

  const inserted = await db.assessmentSubmission.create({
    data: {
      patientId: appt.patient.id,
      // Snapshot contact from the patient record (no re-entry on the tablet).
      contactName: appt.patient.fullName,
      contactEmail: appt.patient.email ?? "",
      contactPhone: appt.patient.phone ?? "",
      contactSex: body.sex,
      preferredAt: now,
      preferredTime,
      notes: "In-clinic tablet assessment (walk-in)",
      totalScore: body.totalScore,
      scoreOutOf: body.scoreOutOf,
      band: BAND_MAP[body.band],
      byCategory: body.byCategory as unknown as Prisma.InputJsonValue,
      topRisks: body.topRisks as unknown as Prisma.InputJsonValue,
      suggestedFocus: body.suggestedFocus as unknown as Prisma.InputJsonValue,
      answers: body.answers as Prisma.InputJsonValue,
      bookingRef: `BOOK-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: AssessmentSubmissionStatus.COMPLETED,
    },
    select: { id: true, bookingRef: true },
  })

  return ok({ submissionId: inserted.id, bookingRef: inserted.bookingRef })
})
