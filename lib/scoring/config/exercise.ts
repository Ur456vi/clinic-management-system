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
      field: "personal_history__exercise_days_per_week",
      label: "Days per week", max: 10, kind: "choice", confirmed: false,
      map: { "2-3 days": 5, "4-5 days": 10, ">5 days": 10 },
    },
    {
      field: "personal_history__exercise_duration",
      label: "Duration of exercise", max: 10, kind: "choice", confirmed: false,
      map: { "20 mins": 5, "30 mins": 10, "45 mins": 10, "1 hr": 10, ">1 hr": 5 },
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
      field: "personal_history__exercise_perspiration",
      label: "Perspiration on exercise", max: 10, kind: "choice", confirmed: false,
      map: { none: 5, profuse: 10 },
    },
    {
      field: "personal_history__exercise_hr_variability",
      label: "HR variability", max: 10, kind: "choice", confirmed: false,
      map: { "45 - 100ms": 10, "< 45ms": 5 },
    },
  ],
  note:
    "B-7: `exercise_sedentary` is missing the document's 'Never to Sedentary' " +
    "option (2 points) and offers only irregular / regular, so it is not scored.",
}
