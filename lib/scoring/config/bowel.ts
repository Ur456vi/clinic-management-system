import type { SectionConfig } from "../types"

/**
 * Bowels / Gut Considerations — declared 110 = 11 items x 10.
 *
 * `regularity`, `frequency_per_day` and `blood_in_stool` carry the point values
 * spelled out in the implementation plan. The remaining eight follow the
 * document's stated convention (best 10 / deviation 5 / red flag 2) and stay
 * unconfirmed until the source document is available to check item by item.
 */
export const bowel: SectionConfig = {
  key: "bowel",
  name: "Bowel / Gut Considerations",
  declaredMax: 110,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__regularity",
      label: "Regularity", max: 10, kind: "choice", confirmed: true,
      map: { regular: 10, constipation: 0, "frequent diarrhea": 0 },
    },
    {
      field: "personal_history__frequency_per_day",
      label: "Frequency (per day)", max: 10, kind: "numericRange", confirmed: true,
      buckets: [{ max: 3, points: 10 }, { min: 3, max: 6, points: 5 }, { min: 6, points: 0 }],
    },
    {
      field: "personal_history__consistency",
      label: "Consistency", max: 10, kind: "choice", confirmed: false,
      map: { soft: 10, hard: 5, liquid: 5 },
    },
    {
      field: "personal_history__color",
      label: "Colour", max: 10, kind: "choice", confirmed: false,
      map: { brown: 10, yellow: 5, clay: 2, black: 2 },
      redFlagWhen: ["clay", "black"], redFlagSeverity: "moderate",
    },
    {
      field: "personal_history__blood_in_stool",
      label: "Blood in stool", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 2,
      redFlagWhen: (v) => v !== "none", redFlagSeverity: "high",
    },
    {
      field: "personal_history__bowel_other_symptoms",
      label: "Other symptoms (worms / tags / abscesses)", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 2,
      redFlagWhen: (v) => v !== "none", redFlagSeverity: "moderate",
    },
    {
      field: "personal_history__bowel_odour",
      label: "Odour", max: 10, kind: "choice", confirmed: false,
      map: { odourless: 10, "foul smelling": 5 },
    },
    {
      field: "personal_history__bowel_early_satiety",
      label: "Early satiety", max: 10, kind: "present", confirmed: false,
      whenPresent: 5,
    },
    {
      field: "personal_history__bowel_burning_sensation",
      label: "Oesophageal / epigastric burning", max: 10, kind: "present", confirmed: true,
      whenPresent: 2, redFlagWhen: () => true, redFlagSeverity: "moderate",
    },
    {
      field: "personal_history__bowel_bloating",
      label: "Bloating", max: 10, kind: "present", confirmed: true,
      whenPresent: 2, redFlagWhen: () => true, redFlagSeverity: "moderate",
    },
    {
      // Not scored, and deliberately so: `bowel_characteristic_odour` qualifies
      // item (f) Odour, and `bowel_others` duplicates item (g), already scored
      // through `bowel_other_symptoms`. Giving either a rule would mark the
      // section out of 130 against a documented 110.
      field: "personal_history__bowel_constipation_diarrhoea",
      label: "Constipation alternating with diarrhoea", max: 10, kind: "present", confirmed: true,
      whenPresent: 2, redFlagWhen: () => true, redFlagSeverity: "moderate",
    },
  ],
  note:
    "B-20: early satiety, burning, bloating and constipation-alternating are bare " +
    "checkboxes / free text with no explicit 'None', so an unticked box is " +
    "indistinguishable from an unasked question and counts as unanswered.",
}
