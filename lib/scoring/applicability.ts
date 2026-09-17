import type { Answers, PatientContext, SectionConfig, Sex } from "./types"
import { FIELD_SECTION, type ManualScores } from "./manual"

/** Read the sex recorded on this consultation, if the RMO filled it in. */
function consultationSex(answers: Answers): Sex | null {
  const raw = answers["demographics__sex"]
  if (!raw) return null
  const v = raw.trim().toLowerCase()
  if (v.startsWith("f")) return "FEMALE"
  if (v.startsWith("m")) return "MALE"
  if (v.startsWith("o")) return "OTHER"
  return null
}

/**
 * Prefer the consultation's own value — it is the sex as of that visit — and
 * fall back to `Patient.sex`.
 */
export function resolveSex(answers: Answers, patient: PatientContext): Sex | null {
  return consultationSex(answers) ?? patient.sex ?? null
}

/**
 * Whether a section counts for this patient.
 *
 * A KNOWN sex decides on its own: a female patient gets Women's Health and not
 * Men's Sexual Health, whatever happens to be stored against the other block.
 * That is not defensive coding — the consultation form renders BOTH gendered
 * accordions to everyone (defect B-21), so an RMO working top to bottom fills
 * in the section that does not apply. Honouring that data put Men's Sexual
 * Health into a female patient's denominator and marked her out of 1,820
 * instead of 1,630. The brief is explicit: do not show a section's score to a
 * patient for whom that section was not applicable.
 *
 * Only when sex is OTHER, UNDISCLOSED or missing does the stored data decide.
 * There the clinician's choice to work a block IS the signal, and discarding it
 * would throw away real work.
 */
export function isSectionApplicable(
  config: SectionConfig,
  answers: Answers,
  patient: PatientContext,
  manual: ManualScores = {},
): boolean {
  // An inactive section becomes scoreable the moment the RMO scores it by
  // hand: `active: false` means "we cannot DERIVE this", not "ignore it".
  const hasManual = Object.keys(manual).some((f) => FIELD_SECTION.get(f) === config.key)
  if (!config.active && !hasManual) return false
  if (!config.appliesWhen || config.appliesWhen === "always") return true

  const sex = resolveSex(answers, patient)
  if (sex === "FEMALE" || sex === "MALE") {
    return config.appliesWhen === (sex === "FEMALE" ? "female" : "male")
  }

  if (hasManual) return true
  return config.rules.some((r) => {
    const v = answers[r.field]
    return v !== undefined && v.trim() !== ""
  })
}
