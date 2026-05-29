/**
 * One-off: render the Dr. Yuvraaj hand-off email (RMO summary + full quiz) to
 * a local HTML file — no email is sent. Open the file in a browser to inspect.
 * Run: source .env then `npx tsx scripts/preview-doctor-email.ts`
 */
import { writeFileSync } from "node:fs"

import { db } from "@/lib/db"
import { doctorAppointmentEmail, type QuizInfo } from "@/lib/email-templates"

const APPT_ID = "ea6ced27-0eb2-442c-8f5c-f28b2ebe993a"
const OUT = "doctor-email-preview.html"

async function main() {
  const appt = await db.appointment.findUnique({
    where: { id: APPT_ID },
    select: {
      startsAt: true,
      endsAt: true,
      reason: true,
      patientId: true,
      patient: { select: { fullName: true, patientNumber: true } },
      staff: { select: { fullName: true } },
    },
  })
  if (!appt) throw new Error("appointment not found")

  const consultation = await db.consultation.findFirst({
    where: { patientId: appt.patientId },
    orderBy: { createdAt: "desc" },
    select: { sections: true },
  })
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

  const mail = doctorAppointmentEmail(
    {
      patientName: appt.patient?.fullName ?? "Patient",
      patientNumber: appt.patient?.patientNumber ?? null,
      doctorName: appt.staff?.fullName ?? "Dr. Yuvraaj Singh",
      startsAt: appt.startsAt,
      endsAt: appt.endsAt,
      reason: appt.reason,
    },
    sections,
    quiz,
  )

  writeFileSync(OUT, mail.html, "utf8")
  console.log(`Subject: ${mail.subject}`)
  console.log(`Wrote ${OUT}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
