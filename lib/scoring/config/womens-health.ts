import type { ScoreRule, SectionConfig } from "../types"

/**
 * The eleven "core symptom" dropdowns. Each is one 10-point item under
 * assumption A-3: "None" scores 10, any named symptom scores 5.
 *
 * These are the controls M-1 repaired — every one of them used to give its
 * "None" option the same stored value as a symptom, which made 110 of these
 * points unscoreable and any pre-fix answer ambiguous (see
 * `AMBIGUOUS_LEGACY_VALUES` in `normalize.ts`).
 */
const CORE_SYMPTOMS: Array<[field: string, label: string]> = [
  ["womens_health_vasomotor", "Vasomotor"],
  ["womens_health_neuropsychological", "Neuropsychological"],
  ["womens_health_sleep_related", "Sleep related"],
  ["womens_health_sexual_health", "Sexual health"],
  ["womens_health_energy", "Energy"],
  ["womens_health_body_composition", "Body composition"],
  ["womens_health_related_past_medical_history", "Related past medical history"],
  ["womens_health_medication_history", "Medication history"],
  ["womens_health_bone_health", "Bone health"],
  ["womens_health_urogenital_health", "Urogenital health"],
]

const coreSymptomRule = ([field, label]: [string, string]): ScoreRule => ({
  field: `personal_history__${field}`,
  label,
  max: 10,
  kind: "choice",
  confirmed: true,
  map: { none: 10 },
  fallback: 5,
})

/** Women's Health & Menstrual History — declared 170, female patients. */
export const womensHealth: SectionConfig = {
  key: "womensHealth",
  name: "Women's Health & Menstrual History",
  declaredMax: 170,
  appliesWhen: "female",
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__womens_health_age_of_menarche",
      label: "Age of menarche", max: 10, kind: "choice", confirmed: false,
      map: { "12-13yrs": 10, "<12yrs": 5, ">13yrs": 5 },
    },
    {
      field: "personal_history__womens_health_current_menstrual_status",
      label: "Current menstrual status", max: 10, kind: "choice", confirmed: false,
      map: { regular: 10, irregular: 5, stopped: 5 },
    },
    {
      // Document (e): NVD 10 / LSCS 5 / any prepartum, partum or postpartum
      // complication 2. B-18: the control is free text, so it is hand-scored.
      field: "personal_history__womens_health_pregnancies",
      label: "Number of pregnancies", max: 10, kind: "manual", confirmed: false,
    },
    {
      field: "personal_history__womens_health_miscarriages",
      label: "Miscarriages / MTP", max: 10, kind: "choice", confirmed: false,
      map: {
        no: 10,
        "miscarriages (spontaneous abortions)": 5,
        "medical termination of pregnancy (mtp)": 5,
      },
    },
    {
      field: "personal_history__womens_health_pcos",
      label: "History of PCOS", max: 10, kind: "choice", confirmed: false,
      map: { no: 10, yes: 5 },
    },
    ...CORE_SYMPTOMS.map(coreSymptomRule),
    {
      // Kept apart from CORE_SYMPTOMS: here "None" is ambiguous. It plausibly
      // means "no findings", but "No Screening Done" is the actual deviation and
      // a completed screening is the healthy answer — the opposite polarity to
      // every other core-symptom dropdown.
      field: "personal_history__womens_health_cancer_screening_status",
      label: "Cancer screening status", max: 10, kind: "choice", confirmed: false,
      map: {
        "last mammogram": 10, "pap smear": 10, "pelvic exam": 10,
        none: 10, "no screening done": 5,
      },
    },
    {
      // Core symptom (xii), Quality of Life: "How much are these symptoms
      // affecting your daily life?" Free text, so hand-scored.
      field: "personal_history__womens_health_quality_of_life_impact",
      label: "Quality of life impact", max: 10, kind: "manual", confirmed: false,
    },
  ],
  note:
    "Seventeen items reach the declared 170: the document's (a) menarche, " +
    "(b) current status, (e) pregnancies, (f) infertility/miscarriages/MTP and " +
    "(g) PCOS, plus the twelve core symptoms (i)-(xii) of item (h). (c) LMP and " +
    "(d) cycle changes are descriptive, and `womens_health_vasomotor_frequency` " +
    "qualifies (h)(i), so none of the three is scored. B-17 resolves against the " +
    "document rather than the form: infertility is not a separate item — it " +
    "shares item (f) with miscarriages and MTP, which is the control we score. " +
    "B-19 / A-3 remains open: the document lists each core symptom as its own " +
    "normal-or-present question, but the form asks each as one mutually exclusive " +
    "dropdown, so two co-existing symptoms are unrepresentable.",
}
