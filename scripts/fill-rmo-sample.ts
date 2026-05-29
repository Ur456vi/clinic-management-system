/**
 * One-off (DEV/DEMO): fill the latest RMO consultation for the test patient
 * with sample values across ALL sections, so the summary + hand-off email
 * show the complete RMO capture. Run: source .env then
 * `npx tsx scripts/fill-rmo-sample.ts`
 */
import { db } from "@/lib/db"
import { RMO_FIELDS, SECTION_KEY } from "@/lib/rmo-fields"

const APPT_ID = "ea6ced27-0eb2-442c-8f5c-f28b2ebe993a"

function sample(label: string): string {
  const l = label.toLowerCase()
  if (l.includes("date")) return "2026-06-01"
  if (l.includes("name")) return "Sunita Singh"
  if (l.includes("age")) return "34"
  if (l.includes("relationship")) return "Parent"
  if (l.includes("sex")) return "Male"
  if (l.includes("occupation")) return "Software Engineer"
  if (l.includes("residence") || l.includes("location") || l.includes("address"))
    return "Mumbai, India"
  if (l.includes("ethnicity")) return "South Asian"
  if (l.includes("marriage")) return "No"
  if (l.includes("transport")) return "Car"
  if (l.includes("frequency") || l.includes("hours")) return "Moderate"
  if (l.includes("drug")) return "None"
  if (l.includes("allerg")) return "No known allergies"
  if (l.includes("medication") || l.includes("supplement")) return "None current"
  if (
    l.includes("history") ||
    l.includes("condition") ||
    l.includes("procedure") ||
    l.includes("admission")
  )
    return "No significant findings reported"
  if (l.includes("status")) return "Stable"
  if (l.includes("duration")) return "Ongoing"
  if (l.includes("referral")) return "Self-referred"
  return "Within normal limits"
}

async function main() {
  const appt = await db.appointment.findUnique({
    where: { id: APPT_ID },
    select: { patientId: true },
  })
  if (!appt) throw new Error("appointment not found")

  const consult = await db.consultation.findFirst({
    where: { patientId: appt.patientId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })
  if (!consult) throw new Error("consultation not found")

  const sections: Record<string, Record<string, string>> = {}
  for (const f of RMO_FIELDS) {
    const key = SECTION_KEY[f.s]
    ;(sections[key] ??= {})[f.n] = sample(f.l)
  }

  await db.consultation.update({
    where: { id: consult.id },
    data: { sections },
  })
  const total = Object.values(sections).reduce((n, s) => n + Object.keys(s).length, 0)
  console.log(`Filled consultation ${consult.id} with ${total} sample fields across ${Object.keys(sections).length} sections`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
