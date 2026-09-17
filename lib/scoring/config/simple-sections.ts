import type { SectionConfig } from "../types"

/**
 * Energy — declared 50, a single six-tier item. The only question in the whole
 * document that is not out of 10.
 */
export const energy: SectionConfig = {
  key: "energy",
  name: "Energy",
  declaredMax: 50,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__energy_pattern",
      label: "Energy pattern", max: 50, kind: "manual", confirmed: false,
    },
  ],
  note:
    "B-4: the document defines six tiers (energetic all day 50 / dwindles pm 40 / " +
    "wakes tired 30 / tired all day 20 / lethargic 10 / generalized weakness 6). " +
    "`energy_pattern` offers five unrelated options (high / fluctuating / low / " +
    "morning / evening) with no defensible mapping onto them, so the item is " +
    "hand-scored out of 50 rather than guessed. M-3 rebuilds the control as the " +
    "document's six tiers, after which this becomes an ordinary `choice` rule.",
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
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__body_weight_stability",
      label: "Stability", max: 10, kind: "choice", confirmed: false,
      map: { stable: 10, "fluctuating (< 1-2kgs )": 5, "fluctuating (> 1-2kgs )": 2 },
    },
    {
      field: "personal_history__body_weight_gain",
      label: "Weight change — gain", max: 5, kind: "manual", confirmed: false,
    },
    {
      field: "personal_history__body_weight_loss",
      label: "Weight change — loss", max: 5, kind: "manual", confirmed: false,
    },
  ],
  note:
    "A-1: the document's (b) weight gain and (c) weight loss share one trailing " +
    "scale (intended gain 5 / intended loss 10 / unintended either 2), so they " +
    "are one 10-point item — the only reading that yields the declared 20. The " +
    "form splits it across two controls, so it is scored as two halves of 5. " +
    "B-9: both controls capture Proportionate/Disproportionate rather than the " +
    "document's Intended/Unintended axis, so neither can be derived; hand-scored " +
    "until M-16 rebuilds them.",
}

/** Miscellaneous — declared 50. */
export const misc: SectionConfig = {
  key: "misc",
  name: "Miscellaneous",
  declaredMax: 50,
  reconciles: true,
  active: true,
  rules: [
    {
      field: "personal_history__perspiration",
      label: "Perspiration", max: 10, kind: "manual", confirmed: false,
    },
    {
      // A-2: two axes, frequency AND severity, each out of 10.
      field: "personal_history__body_odor",
      label: "Body odour (frequency + severity)", max: 20, kind: "manual",
      confirmed: false, items: 2,
    },
    {
      field: "personal_history__halitosis_bad_breath",
      label: "Halitosis (frequency + severity)", max: 20, kind: "manual",
      confirmed: false, items: 2,
    },
  ],
  note:
    "A-2: the declared 50 is only reachable if body odour and halitosis are each " +
    "scored on TWO axes — the document prints a frequency scale (never-or-very-" +
    "rare 10 / often-or-very-often 5 / perpetual 2) and a severity scale (mild 10 " +
    "/ moderate 5 / severe 2) on separate lines for both. B-12: the form captures " +
    "one present/absent select each, so neither axis can be derived; hand-scored " +
    "out of 20 until M-15 splits the controls. B-11: `perspiration` offers " +
    "normal/excessive/minimal where the document scores frequency " +
    "(never-or-very-rare 5 / seldom 10 / often-or-very-often 5) — a different " +
    "axis, so it is hand-scored too.",
}

/** Personal Hygiene — declared 50 = 5 x 10. */
export const hygiene: SectionConfig = {
  key: "hygiene",
  name: "Personal Hygiene",
  declaredMax: 50,
  reconciles: true,
  active: true,
  rules: [
    {
      // Document (a). The form spreads this across eight free-text controls
      // (frequency summer/winter, HR variability, rash, giddiness, LOC,
      // flushing, falls); the frequency box stands for the item.
      field: "personal_history__hygiene_bathing_summers",
      label: "Bathing & showering", max: 10, kind: "manual", confirmed: false,
    },
    {
      // Document (b). Likewise spread across eight free-text controls.
      field: "personal_history__hygiene_brushing_frequency",
      label: "Brushing & oral hygiene", max: 10, kind: "manual", confirmed: false,
    },
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
    "Five items: the document's (a) bathing, (b) brushing, (c) underclothes, " +
    "(d) nails, (e) towels. B-10: 16 of the 19 controls are `type=\"text\"`, so " +
    "(a) and (b) are hand-scored — the remaining 14 free-text boxes are the " +
    "document's own qualifier lists inside those two items and are not scored " +
    "separately. F-8 also queries whether item (a) really deducts to 2 where " +
    "every comparable deviation elsewhere is 5.",
}
