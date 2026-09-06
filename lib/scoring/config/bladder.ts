import type { SectionConfig } from "../types"

/** Bladder Habits — declared 70 = 7 items x 10. */
export const bladder: SectionConfig = {
  key: "bladder",
  name: "Bladder Habits",
  declaredMax: 70,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__frequency_times_per_day",
      label: "Frequency (times per day)", max: 10, kind: "numericRange", confirmed: false,
      buckets: [{ max: 4, points: 5 }, { min: 4, max: 8, points: 10 }, { min: 8, points: 5 }],
    },
    {
      field: "personal_history__urgency",
      label: "Urgency", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, increased: 5 },
    },
    {
      field: "personal_history__color_consistency",
      label: "Colour & consistency", max: 10, kind: "choice", confirmed: false,
      map: { clear: 10, straw: 10, dark: 5, cloudy: 5 },
    },
    {
      field: "personal_history__flow",
      label: "Flow", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, weak: 5, strained: 5 },
    },
    {
      field: "personal_history__blood_in_urine",
      label: "Blood in urine", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 2,
      redFlagWhen: (v) => v !== "none", redFlagSeverity: "high",
    },
    {
      field: "personal_history__bladder_other_symptoms",
      label: "Other symptoms", max: 10, kind: "choice", confirmed: false,
      map: { none: 10 }, fallback: 5,
    },
    {
      field: "personal_history__bladder_volume",
      label: "Volume", max: 10, kind: "choice", confirmed: false,
      map: {
        "normal averages (200 - 400ml per urination)": 10,
        "low volume": 5,
        "large volume": 5,
      },
    },
  ],
  note:
    "`bladder_odour` (Odourless / Foul odour) is captured but not counted here — " +
    "7 items already reach the declared 70. Confirm which seven the document scores.",
}
