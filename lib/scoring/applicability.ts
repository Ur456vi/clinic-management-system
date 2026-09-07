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
 * Gendered sections are applied by sex, but ALSO whenever they actually hold
 * answers. That second clause matters: if a clinician deliberately worked the
 * Women's Health block for a patient recorded as OTHER, the score must reflect
 * it rather than silently discarding the work. Applicability is data-driven
 * with a sex-based default, not sex alone.
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
  if (config.appliesWhen === "female" && sex === "FEMALE") return true
  if (config.appliesWhen === "male" && sex === "MALE") return true

  if (hasManual) return true
  return config.rules.some((r) => {
    const v = answers[r.field]
    return v !== undefined && v.trim() !== ""
  })
}
