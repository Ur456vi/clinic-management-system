import type { SectionConfig } from "../types"

/**
 * Sections the source document does not pin down, or the form does not collect.
 *
 * Every one is declared rather than omitted so the admin diagnostics panel can
 * show WHAT is missing and WHY, instead of the section silently vanishing from
 * the score. All are `active: false`: they contribute nothing to the numerator
 * or the denominator until sign-off.
 */

/** Men's Sexual Health History — declared 190, male patients. F-1. */
export const mensHealth: SectionConfig = {
  key: "mensHealth",
  name: "Men's Sexual Health History",
  declaredMax: 190,
  appliesWhen: "male",
  reconciles: false,
  active: false,
  rules: [],
  note:
    "F-1 BLOCKING: two different decompositions of the document both total " +
    "exactly 190, and they imply different question counts — so partial " +
    "completion would score differently under each. The document author must " +
    "enumerate the scored items before this section can be built. The form does " +
    "collect 23 controls, so no data is being lost meanwhile.",
}

/** General Physical Examination — declared 600. F-2. */
export const gpe: SectionConfig = {
  key: "gpe",
  name: "General Physical Examination",
  declaredMax: 600,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "F-2 BLOCKING: no consistent reading of the document produces 600. Treating " +
    "every lettered item as one 10-point question gives 250; treating every named " +
    "finding as its own question gives 730. An explicit item list is required. " +
    "B-15 additionally converted `gpe_spo2` and `gpe_respiratory_rate` to free " +
    "text, so SpO2 banding (>90 = 10 / <90 = 5 / <85 = 2 red flag) needs numeric " +
    "parsing of arbitrary strings.",
}

/** Stress (PSS-10) — no declared total. F-3. */
export const PSS10_ITEMS = [
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10",
] as const

/** The five answer levels, verbatim from the form's radio groups. */
export const PSS10_LEVELS = ["Never", "very rare", "seldom", "often", "very often"] as const

export const stress: SectionConfig = {
  key: "stress",
  name: "Stress (PSS-10)",
  declaredMax: 0,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "F-3 BLOCKING: the document reproduces the ten PSS-10 questions and the five " +
    "answer levels but assigns no point values, names no reverse-scored items, " +
    "and declares no section total. Published PSS-10 reverse-scores items 4, 5, 7 " +
    "and 8 and runs 'higher = more stressed' — the OPPOSITE direction to every " +
    "other IPHMH section — so adding it to the overall total unmodified would " +
    "invert the meaning of the total. Not encoded without written confirmation. " +
    "The form does collect all ten answers (`personal_history__pss10_q1..q10`), " +
    "so filling this in later is a config-only change.",
}

/** Systemic Examination — declared 160. B-14. */
export const systemic: SectionConfig = {
  key: "systemic",
  name: "Systemic Examination",
  declaredMax: 160,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "B-14 BLOCKING: not collected. `RMO_SHOW_FULL_GPE = false` hides the " +
    "CVS / RS / P-A / CNS blocks and the matching field names sit in " +
    "`NON_RMO_FIELDS`, so all 160 points are uncollectable. Either re-enable the " +
    "block or drop the section from the denominator — this is M-11.",
}

/** Past Medical History — negative-only. F-4. */
export const pastMedical: SectionConfig = {
  key: "pastMedical",
  name: "Past Medical History",
  declaredMax: 0,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "F-4 BLOCKING: '-10 points for each co-morbidity' defines a deduction with no " +
    "base score, no maximum and no floor — nine co-morbidities would contribute " +
    "-90 to an otherwise positive total. Needs: (i) base 0 or an allowance, " +
    "(ii) whether a floor clamps at 0, (iii) whether it deducts from the section " +
    "or the overall score. B-13 also makes it uncountable: " +
    "`medical_history__medical_conditions` is a free-text textarea.",
}

/** Past Surgical History — negative-only. F-4. */
export const pastSurgical: SectionConfig = {
  key: "pastSurgical",
  name: "Past Surgical History",
  declaredMax: 0,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "F-4 BLOCKING, same as Past Medical History. B-13: " +
    "`medical_history__surgical_procedures` is a free-text textarea, so " +
    "indications cannot be counted.",
}

/** Personal Habits — total not declared. F-5. */
export const personalHabits: SectionConfig = {
  key: "personalHabits",
  name: "Personal Habits",
  declaredMax: 0,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "F-5: the document declares no total. One scored item is visible (cosmetics / " +
    "sunscreens, No = 10 / Yes = 5), implying a 10-point section. Confirm before " +
    "activating.",
}
