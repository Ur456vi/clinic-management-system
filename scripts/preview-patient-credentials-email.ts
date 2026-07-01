/**
 * One-off: render the NEW-patient booking confirmation email (with portal
 * login credentials) to a local HTML file — no email is sent.
 * Run: `npx tsx scripts/preview-patient-credentials-email.ts`
 */
import { writeFileSync } from "node:fs"

import { patientBookingNewAccountEmail } from "@/lib/email-templates"

const mail = patientBookingNewAccountEmail({
  patientName: "varun pratap singh",
  dateStr: "Monday, June 1, 2026",
  timeStr: "10:00",
  startsAt: new Date("2026-06-01T10:00:00Z"),
  endsAt: new Date("2026-06-01T10:30:00Z"),
  loginUrl: "https://app.vyara.health/login",
  email: "varunpratapsingh191@gmail.com",
  tempPassword: "Xk7p-9Qm2",
})

writeFileSync("patient-credentials-email-preview.html", mail.html, "utf8")
console.log(`Subject: ${mail.subject}`)
console.log("Wrote patient-credentials-email-preview.html")
