import type { Answers } from "./types"

/**
 * Values that leaked scoring text into the stored answer before M-2 fixed the
 * form. Historical rows still contain them, so strip the suffix on read.
 */
const POINTS_SUFFIX = /\s*-\s*\d+\s*points?\s*$/i

/**
 * Women's Health "None" options that shared a value with a real symptom before
 * M-1 fixed the form (defect B-1). A legacy row holding one of these is
 * genuinely ambiguous — it means either "None" or that symptom — so the engine
 * refuses to guess and treats the answer as unanswered.
 *
 * Keyed by field, because the same string is a perfectly valid answer elsewhere.
 */
export const AMBIGUOUS_LEGACY_VALUES: Record<string, string> = {
  personal_history__womens_health_vasomotor: "night sweats",
  personal_history__womens_health_neuropsychological: "memory issues",
  personal_history__womens_health_sleep_related: "non-restorative sleep",
  personal_history__womens_health_sexual_health: "arousal difficulty",
  personal_history__womens_health_energy: "afternoon crashes",
  personal_history__womens_health_body_composition: "loss of muscle",
  personal_history__womens_health_related_past_medical_history: "unexplained bleeding pv",
  personal_history__womens_health_medication_history:
    "pde-5 inhibitors (for pulmonary arterial hypertension)",
  personal_history__womens_health_bone_health: "height loss",
  personal_history__womens_health_urogenital_health: "incontinence",
  personal_history__womens_health_cancer_screening_status: "pelvic exam",
}

/** Lowercase, collapse whitespace, drop any leaked " - 10 points" suffix. */
export function normalizeValue(raw: string): string {
  return raw.replace(POINTS_SUFFIX, "").trim().replace(/\s+/g, " ").toLowerCase()
}

/**
 * Flatten `Consultation.sections` into `{ fieldName: value }`.
 *
 * Section keys are ignored on purpose. Some fields registered under
 * `examination_summary` still carry a `personal_history__` name prefix from an
 * older layout, so the field NAME is the only reliable key.
 */
export function flattenAnswers(sections: unknown): Answers {
  const out: Answers = {}
  if (!sections || typeof sections !== "object") return out
  for (const group of Object.values(sections as Record<string, unknown>)) {
    if (!group || typeof group !== "object") continue
    for (const [field, value] of Object.entries(group as Record<string, unknown>)) {
      if (typeof value !== "string") continue
      const trimmed = value.trim()
      if (trimmed === "") continue
      out[field] = trimmed
    }
  }
  return out
}

/** Whether this stored value can be scored at all for this field. */
export function isAmbiguousLegacy(field: string, normalised: string): boolean {
  return AMBIGUOUS_LEGACY_VALUES[field] === normalised
}
