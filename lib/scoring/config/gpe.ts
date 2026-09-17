import type { SectionConfig } from "../types"

/**
 * Document 4(c) — seven findings, "10 points for each" not present.
 * Verbatim from the form's checkbox group.
 */
export const GPE_SCARS = [
  "Scars", "Bruises", "Naevi", "Facial Puffiness", "Infraorbital Puffiness",
  "Periorbital Puffiness", "Nasal Allergic Crease",
] as const

/** Document 4(d) — seven findings, "10 points for each Not Present". */
export const GPE_BUCCOPHARYNGEAL = [
  "Thrush", "Aphthous Ulcers", "Glossitis", "Leukoplakia", "Hyperpigmentation",
  "Geographic Tongue", "Fissured Tongue",
] as const

/** Document 4(a) — thirteen pathological facies, "10 points for each ... Not Present". */
export const GPE_FACIES = [
  "Facial expressions", "Myasthenic Facies", "Mask Facies", "Hypothyroid Facies",
  "Diabetic Facies", "Cushingoid Facies", "Trisomy 21 Facies", "Acromegalic Facies",
  "Thyrotoxic Facies", "Leonine", "Adenoid", "Mitral", "Facial Tics",
] as const

/** Document 5(b) — ten abnormal gait patterns. */
export const GPE_GAIT_PATTERNS = [
  "Antalgic", "Scissors", "Shuffling", "Ataxic", "Festinating", "Steppage",
  "Trendelenburg", "Choreiform", "Magnetic", "Stooping",
] as const

/**
 * General Physical Examination — declared 600.
 *
 * F-2 asked how 600 is reached, because no uniform reading produces it. It is
 * reached by honouring the document's own "10 points for each" wording on
 * exactly the four enumerated lists, and by not scoring item (19) Tongue, to
 * which the document assigns no points:
 *
 *     23 single items      x  10  = 230
 *     13 pathological facies x 10 = 130
 *      7 scars / puffiness   x 10 =  70
 *      7 buccopharyngeal     x 10 =  70
 *     10 gait patterns       x 10 = 100
 *                                  ----
 *                                   600
 *
 * Two of those four lists are real checkbox groups in the form and score
 * themselves. The other two — facies and gait patterns — are single-select
 * dropdowns, so one answer cannot express thirteen (or ten) independent
 * findings; they are hand-scored as a block until the controls become checkbox
 * groups. That is the same shape as defect B-19 in Women's Health.
 */
export const gpe: SectionConfig = {
  key: "gpe",
  name: "General Physical Examination",
  declaredMax: 600,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__gpe_appearance_attitude",
      label: "Appearance / attitude", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10, "any deviation from normal": 5 },
    },
    {
      field: "personal_history__gpe_attention_span",
      label: "Attention span", max: 10, kind: "choice", confirmed: true,
      map: { good: 10, distracted: 5 },
    },
    {
      field: "personal_history__gpe_short_term_memory_span",
      label: "Short-term memory span", max: 10, kind: "choice", confirmed: true,
      map: { "good and sharp": 10, poor: 5 },
    },
    {
      field: "personal_history__gpe_facies",
      label: "Facies (13 pathological facies)", max: 130, kind: "manual",
      confirmed: false, items: GPE_FACIES.length,
    },
    {
      field: "personal_history__gpe_lips",
      label: "Lips", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10 }, fallback: 5,
    },
    {
      field: "personal_history__gpe_scars_bruises_naevi",
      label: "Scars / bruises / naevi / puffiness", max: 70, kind: "multiSelect",
      confirmed: true, items: GPE_SCARS.length, options: [...GPE_SCARS],
      absentPoints: 10, presentPoints: 5,
    },
    {
      field: "personal_history__gpe_buccopharyngeal_mucosa",
      label: "Buccopharyngeal mucosa", max: 70, kind: "multiSelect",
      confirmed: true, items: GPE_BUCCOPHARYNGEAL.length,
      options: [...GPE_BUCCOPHARYNGEAL], absentPoints: 10, presentPoints: 5,
    },
    {
      field: "personal_history__gpe_dental_formula",
      label: "Dental formula", max: 10, kind: "manual", confirmed: false,
    },
    {
      field: "personal_history__gpe_dental_caries",
      label: "Dental caries", max: 10, kind: "manual", confirmed: false,
    },
    {
      field: "personal_history__gpe_gingivitis",
      label: "Gingivitis", max: 10, kind: "choice", confirmed: true,
      map: { "not present": 10, mild: 5, moderate: 5, severe: 2 },
    },
    {
      // Document 5(a): normal stance and swing phases present = 10.
      field: "personal_history__gpe_gait_stance_swing",
      label: "Gait — stance & swing phases", max: 10, kind: "choice", confirmed: true,
      map: { present: 10, "not present": 5 },
    },
    {
      field: "personal_history__gpe_gait_abnormal_pattern",
      label: "Gait — abnormal patterns (10 patterns)", max: 100, kind: "manual",
      confirmed: false, items: GPE_GAIT_PATTERNS.length,
    },
    {
      field: "personal_history__gpe_pallor",
      label: "Pallor", max: 10, kind: "choice", confirmed: true,
      map: { "not present": 10, present: 5 },
    },
    {
      field: "personal_history__gpe_icterus",
      label: "Icterus", max: 10, kind: "choice", confirmed: true,
      map: { "not present": 10, present: 5, "deep jaundice": 2 },
    },
    {
      field: "personal_history__gpe_cyanosis",
      label: "Cyanosis", max: 10, kind: "choice", confirmed: true,
      map: { "not present": 10, "present — peripheral": 5, "present — central": 2 },
      redFlagWhen: ["present — central"], redFlagSeverity: "moderate",
    },
    {
      field: "personal_history__gpe_lymphadenopathy",
      label: "Lymphadenopathy", max: 10, kind: "choice", confirmed: true,
      map: { "not present": 10, "present (solitary)": 5, "present (multiple)": 2 },
    },
    {
      field: "personal_history__gpe_edema",
      label: "Edema", max: 10, kind: "choice", confirmed: true,
      map: { "not present": 10, anasarca: 2 }, fallback: 5,
    },
    {
      // A checkbox group (None + 8 findings), so the stored value is a joined
      // list. "None" alone is the healthy answer; any finding scores 5.
      field: "personal_history__gpe_nail_changes",
      label: "Nail changes", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 5,
    },
    {
      field: "personal_history__gpe_skin_hyperpigmentation",
      label: "Skin hyperpigmentation", max: 10, kind: "choice", confirmed: true,
      map: { none: 10, present: 5 },
    },
    {
      field: "personal_history__gpe_hair_changes",
      label: "Hair changes", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 5,
    },
    {
      field: "personal_history__gpe_pulse",
      label: "Pulse", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10, "atrial fibrillation": 2, "unintended bradycardia": 2 },
      redFlagWhen: ["atrial fibrillation", "unintended bradycardia"],
      redFlagSeverity: "high",
    },
    {
      field: "personal_history__gpe_bp",
      label: "Blood pressure", max: 10, kind: "choice", confirmed: true,
      map: {
        "normal for age and gender": 10, fluctuations: 5,
        "accelerated htn": 2, hypotension: 2,
      },
      redFlagWhen: ["accelerated htn", "hypotension"], redFlagSeverity: "moderate",
    },
    {
      field: "personal_history__gpe_body_temperature",
      label: "Body temperature", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10, abnormal: 5 },
    },
    {
      field: "personal_history__gpe_hydration_status",
      label: "Hydration status", max: 10, kind: "choice", confirmed: true,
      map: { adequate: 10, dehydration: 5, "severe dehydration": 2 },
      redFlagWhen: ["severe dehydration"], redFlagSeverity: "moderate",
    },
    {
      // B-15: the select was replaced with free text, so this cannot be banded.
      field: "personal_history__gpe_respiratory_rate",
      label: "Respiratory rate", max: 10, kind: "manual", confirmed: false,
    },
    {
      // B-15: free text too, but a percentage parses, so it still bands.
      field: "personal_history__gpe_spo2",
      label: "SpO2", max: 10, kind: "numericRange", confirmed: true,
      buckets: [
        { max: 85, points: 2, redFlag: "high" },
        { min: 85, max: 90, points: 5 },
        { min: 90, points: 10 },
      ],
    },
    {
      field: "personal_history__gpe_ent_examination",
      label: "ENT examination", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10, "abnormalities present": 5 },
    },
  ],
  note:
    "F-2 RESOLVED arithmetically: 23 single items (230) + facies (130) + scars " +
    "and puffiness (70) + buccopharyngeal (70) + gait patterns (100) = 600, " +
    "honouring the document's '10 points for each' on exactly its four " +
    "enumerated lists and leaving item (19) Tongue unscored as the document " +
    "does. The author should confirm this decomposition. Two form gaps remain: " +
    "`gpe_facies` and `gpe_gait_abnormal_pattern` are single selects where the " +
    "document wants 13 and 10 independent findings, so both blocks are " +
    "hand-scored (same shape as B-19). B-15: `gpe_respiratory_rate` was " +
    "converted to free text and can no longer be banded.",
}
