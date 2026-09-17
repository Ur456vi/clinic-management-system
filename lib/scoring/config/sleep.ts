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
 * The seventh lettered item is (c) Timing, "sleep time between 9-11:30pm and
 * wake time between 5-7am = 10 points, any deviation = 5". The form splits it
 * across two `type="time"` controls, so it is scored as two halves of 5 that
 * add back to the document's 10.
 */
export const sleep: SectionConfig = {
  key: "sleep",
  name: "Sleep",
  declaredMax: 230,
  reconciles: true,
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
      field: "personal_history__sleep_time",
      label: "Timing — sleep time", max: 5, kind: "timeWindow", confirmed: true,
      windowStart: "21:00", windowEnd: "23:30", fallback: 2.5,
    },
    {
      field: "personal_history__wake_time",
      label: "Timing — wake time", max: 5, kind: "timeWindow", confirmed: true,
      windowStart: "05:00", windowEnd: "07:00", fallback: 2.5,
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
    "F-7 (cosmetic): the document letters two Sleep items '(f)' — Mattress " +
    "Quality and Others (Parasomnias). The arithmetic confirms both are scored. " +
    "Item (c) Timing is one 10-point question in the document but two controls " +
    "in the form, so it is split 5 + 5; a deviation scores half of each half " +
    "(2.5), keeping the item's 10/5 shape.",
}
