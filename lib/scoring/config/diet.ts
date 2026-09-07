import type { SectionConfig } from "../types"

/**
 * Dietary Considerations — declared 100 = 10 scored items x 10.
 * Items (h) snacking type and (l) diet plan are descriptive, not scored.
 */
export const diet: SectionConfig = {
  key: "diet",
  name: "Dietary Considerations",
  declaredMax: 100,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__meal_time",
      label: "Meal time", max: 10, kind: "choice", confirmed: false,
      map: {
        regular: 10, "3 meals": 10, "2 meals": 5, irregular: 5,
        "1 meal (specify which meal and timings)": 2,
      },
    },
    {
      field: "personal_history__gap_between_meals",
      label: "Gap between meals (hours)", max: 10, kind: "numericRange", confirmed: false,
      buckets: [{ max: 3, points: 5 }, { min: 3, max: 6, points: 10 }, { min: 6, points: 5 }],
    },
    {
      field: "personal_history__portions",
      label: "Portions", max: 10, kind: "choice", confirmed: false,
      map: { "100 - 300gms": 10, "500gms to >500gms": 5 },
    },
    {
      field: "personal_history__in_betweens",
      label: "In-betweens", max: 10, kind: "choice", confirmed: false,
      map: { "never to very rare": 10, intermittently: 5, regularly: 2 },
    },
    {
      field: "personal_history__major_component_of_diet",
      label: "Major component of diet", max: 10, kind: "choice", confirmed: false,
      map: { "balanced diet": 10, protein: 5, fats: 5, carbs: 5 },
    },
    {
      field: "personal_history__intake_of_fruits_and_vegetables",
      label: "Intake of fruits and vegetables", max: 10, kind: "choice", confirmed: false,
      map: { "staple to regularly": 10, intermittently: 5, "never to very rare": 2 },
    },
    {
      field: "personal_history__oils_used_for_cooking",
      label: "Oils used for cooking", max: 10, kind: "choice", confirmed: false,
      map: {
        "olive oil": 10, "coconut oil": 10,
        "seed oils (sunflower / mustard / sesame etc)": 5, "vegetable oils": 5,
      },
    },
    {
      field: "personal_history__hot_beverages",
      label: "Hot beverages", max: 10, kind: "choice", confirmed: false,
      map: { none: 10, tea: 5, coffee: 5, "tea and coffee": 5 },
    },
    {
      // F-9: the only inverted scale in the document. Intermittent fasting is the
      // clinical ideal, so it outranks "regular". Confirmed intentional in the plan.
      field: "personal_history__fasting",
      label: "Fasting", max: 10, kind: "choice", confirmed: true,
      map: { intermittent: 10, regular: 5, "never to very rare": 2 },
    },
    {
      field: "personal_history__time_to_first_oral_intake",
      label: "Time to first oral intake after waking", max: 10, kind: "choice", confirmed: false,
      map: { immediate: 5, "15-20 mins": 10, "30 mins to > 30 mins (specify time)": 5 },
    },
  ],
  note:
    "`time_between_last_oral_intake_and_sleep` is captured and looks scored in " +
    "the document (its option label leaked '5 points' before M-2), but ten items " +
    "already reach the declared 100. Confirm which ten the document scores.",
}
