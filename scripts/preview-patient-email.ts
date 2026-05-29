/**
 * One-off: render the PATIENT appointment-confirmation email to a local HTML
 * file — no email is sent. Run: source .env then
 * `npx tsx scripts/preview-patient-email.ts`
 */
import { writeFileSync } from "node:fs"

import { db } from "@/lib/db"
import { patientAppointmentEmail } from "@/lib/email-templates"

const APPT_ID = "ea6ced27-0eb2-442c-8f5c-f28b2ebe993a"
const OUT = "patient-email-preview.html"

async function main() {
  const appt = await db.appointment.findUnique({
    where: { id: APPT_ID },
    select: {
      startsAt: true,
      endsAt: true,
      reason: true,
      patient: { select: { fullName: true, patientNumber: true } },
      staff: { select: { fullName: true } },
    },
  })
  if (!appt) throw new Error("appointment not found")

  const mail = patientAppointmentEmail({
    patientName: appt.patient?.fullName ?? "Patient",
    patientNumber: appt.patient?.patientNumber ?? null,
    doctorName: appt.staff?.fullName ?? "Dr. Yuvraaj Singh",
    startsAt: appt.startsAt,
    endsAt: appt.endsAt,
    reason: appt.reason,
  })

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
