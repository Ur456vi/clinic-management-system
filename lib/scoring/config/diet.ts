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
      field: "personal_history__snacking",
      label: "Snacking", max: 10, kind: "choice", confirmed: true,
      map: { no: 10, yes: 5 },
    },
    {
      // F-9: the only inverted scale in the document. Intermittent fasting is the
      // clinical ideal, so it outranks "regular". Confirmed intentional in the plan.
      field: "personal_history__fasting",
      label: "Fasting", max: 10, kind: "choice", confirmed: true,
      map: { intermittent: 10, regular: 5, "never to very rare": 2 },
    },
    {
      // Document (j): Immediate 2 / 15-20 mins 5 / 30 mins to >30 mins 10.
      // The longer the gap after waking, the better — not a typo.
      field: "personal_history__time_to_first_oral_intake",
      label: "Time to first oral intake after waking", max: 10, kind: "choice", confirmed: true,
      map: { immediate: 2, "15-20 mins": 5, "30 mins to > 30 mins (specify time)": 10 },
    },
    {
      // Document (k): Immediate 2 / 30 mins - 1hr 5 / 1-2 hrs or >2 hrs 10.
      field: "personal_history__time_between_last_oral_intake_and_sleep",
      label: "Time between last oral intake and sleep", max: 10, kind: "choice", confirmed: true,
      map: {
        immediate: 2, "30 mins - 1hr": 5,
        "1-2 hrs or >2 hrs (specify time duration)": 10,
      },
    },
  ],
  note:
    "The ten scored items are the document's (a)-(g) and (i)-(k). (h) Hot " +
    "Beverages and (l) Diet Plan are descriptive — the document assigns them no " +
    "points — and `gap_between_meals`, `snacking_type`, `hot_beverages_cups` and " +
    "`fasting_hours` are qualifiers inside other items. None is scored, which is " +
    "what holds the section at the declared 100.",
}
