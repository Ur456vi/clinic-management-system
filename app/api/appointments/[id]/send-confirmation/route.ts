/**
 * `POST /api/appointments/[id]/send-confirmation`
 *
 * Fires the appointment hand-off emails after a booking is created:
 *   - the patient gets an HTML confirmation (doctor, date, time);
 *   - the assigned doctor gets an HTML hand-off with the appointment details,
 *     the patient's latest RMO consultation summary, and their full health-
 *     assessment quiz.
 *
 * Best-effort: email failures are logged but never fail the request, so a
 * flaky mail provider can't block the booking flow.
 */

import { Role } from "@prisma/client"

import { defineHandler, logger, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"
import { sendMail } from "@/lib/email"
import {
  patientAppointmentEmail,
  doctorAppointmentEmail,
  type QuizInfo,
} from "@/lib/email-templates"

type Params = { id: string }

export const POST = defineHandler<Params>(async ({ params }) => {
  await requireRole(Role.ADMIN, Role.DOCTOR, Role.RMO, Role.RECEPTION)
  const { id } = await params

  const appt = await db.appointment.findUnique({
    where: { id },
    select: {
      startsAt: true,
      endsAt: true,
      reason: true,
      patientId: true,
      patient: { select: { fullName: true, patientNumber: true, email: true } },
      staff: { select: { fullName: true, user: { select: { email: true } } } },
    },
  })
  if (!appt) throw new NotFoundError("Appointment not found")

  // Latest RMO consultation for this patient (the summary the RMO filled).
  const consultation = await db.consultation.findFirst({
    where: { patientId: appt.patientId },
    orderBy: { createdAt: "desc" },
    select: { sections: true },
  })

  // Latest health-assessment quiz for this patient.
  const submission = await db.assessmentSubmission.findFirst({
    where: { patientId: appt.patientId },
    orderBy: { createdAt: "desc" },
    select: {
      totalScore: true,
      scoreOutOf: true,
      band: true,
      byCategory: true,
      topRisks: true,
      suggestedFocus: true,
      answers: true,
      contactSex: true,
    },
  })

  const info = {
    patientName: appt.patient?.fullName ?? "Patient",
    patientNumber: appt.patient?.patientNumber ?? null,
    doctorName: appt.staff?.fullName ?? "your doctor",
    startsAt: appt.startsAt,
    endsAt: appt.endsAt,
    reason: appt.reason,
  }

  const quiz: QuizInfo | null = submission
    ? {
        totalScore: submission.totalScore,
        scoreOutOf: submission.scoreOutOf,
        band: String(submission.band),
        byCategory: (submission.byCategory ?? {}) as Record<string, number>,
        topRisks: (submission.topRisks ?? []) as QuizInfo["topRisks"],
        suggestedFocus: (submission.suggestedFocus ?? []) as QuizInfo["suggestedFocus"],
        answers: (submission.answers ?? {}) as Record<string, unknown>,
        contactSex: submission.contactSex,
      }
    : null

  const sections = (consultation?.sections ?? null) as Record<
    string,
    Record<string, unknown>
  > | null

  const results: Record<string, unknown> = {}

  // Patient confirmation.
  if (appt.patient?.email) {
    const mail = patientAppointmentEmail(info)
    const r = await sendMail({ to: appt.patient.email, ...mail })
    results.patient = r
    if (!r.ok) logger.warn({ msg: "patient confirmation email failed", err: r.error })
  } else {
    results.patient = { ok: false, error: "no patient email" }
  }

  // Doctor hand-off with RMO summary + quiz.
  const doctorEmail = appt.staff?.user?.email
  if (doctorEmail) {
    const mail = doctorAppointmentEmail(info, sections, quiz)
    const r = await sendMail({ to: doctorEmail, ...mail })
    results.doctor = r
    if (!r.ok) logger.warn({ msg: "doctor hand-off email failed", err: r.error })
  } else {
    results.doctor = { ok: false, error: "no doctor email" }
  }

  return ok({ sent: results })
})
