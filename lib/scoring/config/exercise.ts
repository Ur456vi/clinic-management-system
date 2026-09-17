import type { SectionConfig } from "../types"

/**
 * Exercise Regimen — declared 60 = 6 scored items x 10.
 * Items (c), (d), (e) and (i) are descriptive (which exercises, with whom).
 */
export const exercise: SectionConfig = {
  key: "exercise",
  name: "Exercise Regimen",
  declaredMax: 60,
  reconciles: true,
  active: true,
  rules: [
    {
      // Document (a): Never to Sedentary 2 / Irregular 5 / Regular 10.
      field: "personal_history__exercise_sedentary",
      label: "Exercise regularity", max: 10, kind: "choice", confirmed: false,
      map: { regular: 10, irregular: 5, "never to sedentary": 2 },
    },
    {
      field: "personal_history__exercise_days_per_week",
      label: "Days per week", max: 10, kind: "choice", confirmed: false,
      map: { "2-3 days": 5, "4-5 days": 10, ">5 days": 10 },
    },
    {
      field: "personal_history__exercise_time_to_recovery",
      label: "Time to recovery", max: 10, kind: "choice", confirmed: false,
      map: { "30-45 mins": 10, "1 hr": 5, "> 1 hr": 2 },
    },
    {
      field: "personal_history__exercise_joint_pains",
      label: "Joint / back pain after exercise", max: 10, kind: "choice", confirmed: false,
      map: { none: 10, present: 5 },
    },
    {
      // Document (h): None OR Profuse 5 / Mild-Moderate 10. The form offers only
      // the two 5-point extremes, so this item cannot currently earn its 10.
      field: "personal_history__exercise_perspiration",
      label: "Perspiration on exercise", max: 10, kind: "choice", confirmed: false,
      map: { none: 5, profuse: 5, "mild - moderate": 10 },
    },
    {
      field: "personal_history__exercise_hr_variability",
      label: "HR variability", max: 10, kind: "choice", confirmed: false,
      map: { "45 - 100ms": 10, "< 45ms": 5 },
    },
  ],
  note:
    "The six scored items are the document's (a), (b), (f), (g), (h) and (j). " +
    "(c) duration, (d) self/trainer, (e) types and (i) heart rate are " +
    "descriptive — the document assigns them no points — so `exercise_duration`, " +
    "`exercise_trainer`, `exercise_types` and the indoor/outdoor selects are not " +
    "scored. Two form gaps remain: B-7, `exercise_sedentary` is missing the " +
    "'Never to Sedentary' option (2 points); and `exercise_perspiration` is " +
    "missing 'Mild - Moderate', the only value that earns item (h) its 10.",
}
