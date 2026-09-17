import type { SectionConfig } from "../types"

/** Mentation — declared 80 = 8 x 10. */
export const mentation: SectionConfig = {
  key: "mentation",
  name: "Mentation",
  declaredMax: 80,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__mood",
      label: "Mood", max: 10, kind: "manual", confirmed: false,
    },
    {
      field: "personal_history__irritability",
      label: "Irritability", max: 10, kind: "choice", confirmed: false,
      map: { none: 10, rare: 5, frequent: 2 },
    },
    {
      field: "personal_history__forgetfulness",
      label: "Forgetfulness", max: 10, kind: "choice", confirmed: false,
      map: { none: 10, mild: 5, significant: 2 },
    },
    {
      field: "personal_history__concentration_focus",
      label: "Concentration & focus", max: 10, kind: "choice", confirmed: false,
      map: { good: 10, fair: 5, poor: 2 },
    },
    {
      field: "personal_history__tendencies",
      label: "Tendencies", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 2,
      redFlagWhen: (v) => v !== "none", redFlagSeverity: "high",
    },
    {
      field: "personal_history__brain_fog",
      label: "Brain fog", max: 10, kind: "choice", confirmed: false,
      map: { no: 10, yes: 5 },
    },
    {
      field: "personal_history__motivation",
      label: "Motivation", max: 10, kind: "choice", confirmed: false,
      map: { motivated: 10, none: 10, hopeless: 2 },
      redFlagWhen: ["hopeless"], redFlagSeverity: "moderate",
    },
    {
      field: "personal_history__depression_anxiety",
      label: "Depression & anxiety", max: 10, kind: "manual", confirmed: false,
    },
  ],
  note:
    "All eight document items are declared, so the section reconciles at 80, but " +
    "two are hand-scored because the form cannot derive them. B-3: `mood` is a " +
    "checkbox group (stable / anxious / depressed / irritable) where the document " +
    "defines one scale — Great 10 / Good 8 / Low or Mood Swings 5; that 8 is the " +
    "only 8 in the entire document, so the control cannot be approximated. " +
    "B-5: `depression_anxiety` is a free-text textarea where the document scores " +
    "None 10 / mild-intermittent 5 / frequent-severe 2. M-4 and M-5 replace both " +
    "controls, after which these become ordinary `choice` rules.",
}
