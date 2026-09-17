import type { ScoreRule, SectionConfig } from "../types"

/**
 * The five free-text prostate qualifiers of document item (l). Each is its own
 * 10-point question, hand-scored because the controls are `type="text"`.
 */
const PROSTATE_DETAIL: Array<[field: string, label: string]> = [
  ["mens_health_prostate_frequency", "Prostate — frequency"],
  ["mens_health_prostate_urgency", "Prostate — urgency"],
  ["mens_health_prostate_hesitancy", "Prostate — hesitancy"],
  ["mens_health_prostate_poor_flow", "Prostate — poor flow"],
  ["mens_health_prostate_dribble", "Prostate — dribble"],
]

const prostateRule = ([field, label]: [string, string]): ScoreRule => ({
  field: `personal_history__${field}`,
  label,
  max: 10,
  kind: "manual",
  confirmed: false,
})

/**
 * Men's Sexual Health History — declared 190, male patients.
 *
 * F-1 asked which items the document scores, because two readings of it both
 * total exactly 190. They agree on the count: nineteen items of 10. They differ
 * only in how the sub-items of (b) and (c) are grouped, which changes nothing
 * about the total or about which controls carry a score. The section is
 * therefore scored on the nineteen controls below — every scorable control in
 * the form EXCEPT (h) children, (i) attempts at conception and (j) prior semen
 * analysis, the three the document explicitly leaves unscored.
 */
export const mensHealth: SectionConfig = {
  key: "mensHealth",
  name: "Men's Sexual Health History",
  declaredMax: 190,
  appliesWhen: "male",
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__mens_health_morning_erections",
      label: "Morning erections", max: 10, kind: "choice", confirmed: true,
      map: { yes: 10, "weak and intermittent": 5, no: 2 },
    },
    {
      // B-2: rows saved before the option value was repaired hold
      // "Normal - 10 points". Both spellings map to the same score.
      field: "personal_history__mens_health_libido_vs_erection",
      label: "Libido vs erection", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, "normal - 10 points": 10 }, fallback: 5,
    },
    {
      field: "personal_history__mens_health_sexual_desire",
      label: "Sexual desire reduced", max: 10, kind: "choice", confirmed: false,
      map: { no: 10, yes: 5 }, fallback: 5,
    },
    {
      field: "personal_history__mens_health_intimacy_interest",
      label: "Interest in intimacy", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10, declined: 5 },
    },
    {
      field: "personal_history__mens_health_ability_to_get_erection",
      label: "Ability to get an erection", max: 10, kind: "choice", confirmed: true,
      map: { normal: 10, difficulty: 5 },
    },
    {
      field: "personal_history__mens_health_ability_to_maintain_erection",
      label: "Ability to maintain an erection", max: 10, kind: "choice", confirmed: true,
      map: { yes: 10, no: 5 },
    },
    {
      field: "personal_history__mens_health_rigidity_for_penetration",
      label: "Rigidity sufficient for penetration", max: 10, kind: "choice", confirmed: true,
      map: { yes: 10, no: 5 },
    },
    {
      field: "personal_history__mens_health_relationship_satisfaction",
      label: "Relationship satisfaction", max: 10, kind: "choice", confirmed: true,
      map: { yes: 10, no: 5 },
    },
    {
      field: "personal_history__mens_health_performance_anxiety",
      label: "Performance anxiety", max: 10, kind: "choice", confirmed: true,
      map: { no: 10, yes: 5 },
    },
    {
      field: "personal_history__mens_health_stress_levels",
      label: "Stress levels", max: 10, kind: "choice", confirmed: true,
      map: { low: 10, high: 5 },
    },
    {
      field: "personal_history__mens_health_pornography_use",
      label: "Pornography use", max: 10, kind: "choice", confirmed: true,
      map: { no: 10, yes: 5 },
    },
    {
      // Inverted against its neighbours, and deliberately so: the document
      // scores "masturbation habits - No - 5 points / Yes - 10 points".
      field: "personal_history__mens_health_masturbation_habits",
      label: "Masturbation habits", max: 10, kind: "choice", confirmed: true,
      map: { yes: 10, no: 5 },
    },
    {
      field: "personal_history__mens_health_urinary_symptoms",
      label: "Urinary symptoms", max: 10, kind: "choice", confirmed: true,
      map: { no: 10, yes: 5 },
    },
    {
      field: "personal_history__mens_health_prostate_issues",
      label: "Prostate issues", max: 10, kind: "choice", confirmed: true,
      map: { no: 10, yes: 5 },
    },
    ...PROSTATE_DETAIL.map(prostateRule),
  ],
  note:
    "F-1 RESOLVED on the count, still open on the grouping. Both readings of the " +
    "document total 190 across nineteen 10-point items; they disagree only on " +
    "whether (b)'s 'Normal' is its own item and whether (c) is two questions or " +
    "three. Since every reading lands on the same nineteen controls, the section " +
    "reconciles either way — but the author should still confirm the grouping, " +
    "because it changes which questions a partial intake counts as missing. " +
    "(h) children, (i) conception attempts and (j) prior semen analysis carry no " +
    "points in the document and are not scored.",
}
