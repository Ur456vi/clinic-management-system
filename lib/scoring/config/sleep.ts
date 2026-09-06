import type { SectionConfig } from "../types"

/** The 16 parasomnia checkboxes, verbatim from the consultation form. */
export const PARASOMNIAS = [
  "Sleep Walking", "Bed Wetting", "Nightmares", "Drooling of Saliva", "Sleep Paralysis",
  "Talking in Sleep", "Daytime Somnolence", "Night Sweats", "Grinding of Teeth",
  "Eyelids Stuck Together in the Morning?", "Too much Sleep crust in the morning?",
  "Vivid Dreams", "Hallucinations", "Post-Nasal Drip", "Hypnogogic or Hypnic jerks",
  "Any Involuntary limb jerks during sleep",
] as const

/**
 * Sleep — declared 230 = (7 x 10) + (16 parasomnias x 10).
 *
 * Only six single-answer controls in the form map onto the document's lettered
 * items; the seventh is undetermined (F-7 notes the document letters two items
 * `(f)`), so the rules below sum to 220, not 230.
 */
export const sleep: SectionConfig = {
  key: "sleep",
  name: "Sleep",
  declaredMax: 230,
  reconciles: false,
  active: true,
  rules: [
    {
      field: "personal_history__quality_of_sleep",
      label: "Quality of sleep", max: 10, kind: "choice", confirmed: false,
      map: { good: 10, interrupted: 5, poor: 2 },
    },
    {
      field: "personal_history__sleep_duration_hours",
      label: "Sleep duration (hours)", max: 10, kind: "numericRange", confirmed: true,
      buckets: [
        { max: 4, points: 2, redFlag: "high" },
        { min: 4, max: 7, points: 5 },
        { min: 7, points: 10 },
      ],
    },
    {
      field: "personal_history__snoring",
      label: "Snoring", max: 10, kind: "choice", confirmed: true,
      map: { none: 10, light: 5, deep: 5, "position-related": 5, "apneic spells": 2 },
      redFlagWhen: ["apneic spells"], redFlagSeverity: "high",
    },
    {
      field: "personal_history__decubitus",
      label: "Preferred decubitus", max: 10, kind: "choice", confirmed: false,
      map: { supine: 10, "left lateral": 10, "right lateral": 10, prone: 5 },
    },
    {
      field: "personal_history__pillow",
      label: "Height and number of pillows", max: 10, kind: "choice", confirmed: false,
      map: { "no pillows": 10, "less than 3 inches": 10, "more than 3 inches": 5 },
    },
    {
      field: "personal_history__mattress",
      label: "Mattress quality", max: 10, kind: "choice", confirmed: false,
      map: { orthopedic: 10, "semi-hard": 10, hard: 5, soft: 5, "floor or wood hard": 5 },
    },
    {
      field: "personal_history__parasomnias_select_all_that_apply",
      label: "Parasomnias", max: 160, kind: "multiSelect", confirmed: true,
      items: PARASOMNIAS.length,
      options: [...PARASOMNIAS],
      absentPoints: 10,
      presentPoints: 5,
    },
  ],
  note:
    "F-7: the document letters two Sleep items '(f)'. Six single-answer controls " +
    "map cleanly; the seventh 10-point item cannot be identified, so the rules " +
    "sum to 220 against a declared 230.",
}
