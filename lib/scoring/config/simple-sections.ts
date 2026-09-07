import type { SectionConfig } from "../types"

/** Energy — declared 50, a single six-tier item. */
export const energy: SectionConfig = {
  key: "energy",
  name: "Energy",
  declaredMax: 50,
  reconciles: false,
  active: false,
  rules: [],
  note:
    "B-4 BLOCKING: the document defines six tiers (energetic all day 50 / dwindles " +
    "pm 40 / wakes tired 30 / tired all day 20 / lethargic 10 / generalized " +
    "weakness 6). `energy_pattern` offers five unrelated options " +
    "(high / fluctuating / low / morning / evening) with no defensible mapping. " +
    "Inactive until M-3 rebuilds the control.",
}

/** Libido / Sex Drive — declared 10, one item. */
export const libido: SectionConfig = {
  key: "libido",
  name: "Libido / Sex Drive",
  declaredMax: 10,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__libido_level",
      label: "Libido level", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, increased: 5, decreased: 5 },
    },
  ],
}

/** Body Temperature & Temperature Tolerance — declared 30 = 3 x 10. */
export const temperature: SectionConfig = {
  key: "temperature",
  name: "Body Temperature & Tolerance",
  declaredMax: 30,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__temperature_extremities",
      label: "Extremities", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, "generally cold": 5, "warm and flushed": 5 },
    },
    {
      field: "personal_history__temperature_tolerance",
      label: "Tolerance", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, "heat intolerance": 5, "cold intolerance": 5 },
    },
    {
      field: "personal_history__temperature_discernibility",
      label: "Discernibility", max: 10, kind: "choice", confirmed: false,
      map: { normal: 10, "cannot discern": 5, numbness: 5 },
    },
  ],
}

/** Body Weight — declared 20. Assumption A-1 folds gain and loss into one item. */
export const bodyWeight: SectionConfig = {
  key: "bodyWeight",
  name: "Body Weight",
  declaredMax: 20,
  reconciles: false,
  active: true,
  rules: [
    {
      field: "personal_history__body_weight_stability",
      label: "Stability", max: 10, kind: "choice", confirmed: false,
      map: { stable: 10, "fluctuating (< 1-2kgs )": 5, "fluctuating (> 1-2kgs )": 2 },
    },
  ],
  note:
    "B-9 BLOCKING for the second item: the document scores weight change on an " +
    "Intended/Unintended axis (intended gain 5 / intended loss 10 / unintended " +
    "either 2). `body_weight_gain` and `body_weight_loss` instead capture " +
    "Proportionate/Disproportionate, which is a different question. Only " +
    "Stability is scored, so the rules sum to 10 against a declared 20. " +
    "Assumption A-1 (gain+loss are one 10-point item) is unverified.",
}

/** Miscellaneous — declared 50. */
export const misc: SectionConfig = {
  key: "misc",
  name: "Miscellaneous",
  declaredMax: 50,
  reconciles: false,
  active: true,
  rules: [
    {
      field: "personal_history__body_odor",
      label: "Body odour", max: 10, kind: "choice", confirmed: false,
      map: { "not present": 10, present: 5 },
    },
    {
      field: "personal_history__halitosis_bad_breath",
      label: "Halitosis", max: 10, kind: "choice", confirmed: false,
      map: { "not present": 10, present: 5 },
    },
  ],
  note:
    "B-11: `perspiration` offers normal/excessive/minimal but the document scores " +
    "frequency (never-or-very-rare 5 / seldom 10 / often-or-very-often 5) — a " +
    "different axis, so it is not scored. B-12 / A-2: the declared 50 is only " +
    "reachable if body odour and halitosis are each scored on two axes " +
    "(frequency AND severity); the form captures one present/absent select each, " +
    "so the rules sum to 20 against a declared 50.",
}

/** Personal Hygiene — declared 50 = 5 x 10. */
export const hygiene: SectionConfig = {
  key: "hygiene",
  name: "Personal Hygiene",
  declaredMax: 50,
  reconciles: false,
  active: true,
  rules: [
    {
      field: "personal_history__hygiene_change_underclothes",
      label: "Change of underclothes", max: 10, kind: "choice", confirmed: false,
      map: { daily: 10, "once in few days": 5 },
    },
    {
      field: "personal_history__hygiene_cutting_nails",
      label: "Cutting of nails", max: 10, kind: "choice", confirmed: false,
      map: { periodically: 10, irregular: 5 },
    },
    {
      field: "personal_history__hygiene_towels",
      label: "Towels", max: 10, kind: "choice", confirmed: false,
      map: { separate: 10, common: 5, "same used": 5 },
    },
  ],
  note:
    "B-10 BLOCKING: 17 of the 20 Personal Hygiene controls are `type=\"text\"` " +
    "(bathing frequency, brushing, dental caries, gingival bleeds, falls in " +
    "bathroom, ...). Only the three selects above can be scored, so the rules sum " +
    "to 30 against a declared 50. F-8 also queries whether item (a) really " +
    "deducts to 2 where every comparable deviation elsewhere is 5.",
}
