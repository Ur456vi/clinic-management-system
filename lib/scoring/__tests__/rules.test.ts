import { describe, expect, it } from "vitest"
import type { ScoreRule } from "../types"
import { scoreRule } from "../rules"
import { normalizeValue } from "../normalize"
import { safeNumber, splitMulti } from "../utils"

const choice = (over: Partial<ScoreRule> = {}): ScoreRule => ({
  field: "personal_history__regularity",
  label: "Regularity", max: 10, kind: "choice", confirmed: true,
  map: { regular: 10, constipation: 5 },
  ...over,
})

describe("normalizeValue", () => {
  it("lowercases, trims and collapses whitespace", () => {
    expect(normalizeValue("  Foul   Smelling ")).toBe("foul smelling")
  })

  // B-2: historical rows literally contain the score in the stored value.
  it("strips a leaked ' - N points' suffix", () => {
    expect(normalizeValue("Normal - 10 points")).toBe("normal")
    expect(normalizeValue("30 mins - 1hr - 5 points")).toBe("30 mins - 1hr")
  })

  it("leaves a legitimate hyphenated value alone", () => {
    expect(normalizeValue("position-related")).toBe("position-related")
    expect(normalizeValue("1-2 hrs or >2 hrs")).toBe("1-2 hrs or >2 hrs")
  })
})

describe("safeNumber", () => {
  it.each([
    ["3", 3], ["3-4", 3], ["about 3", 3], ["94%", 94], ["94 %", 94], ["2.5", 2.5],
  ])("parses %s", (raw, want) => expect(safeNumber(raw)).toBe(want))

  it("returns null when there is no number at all", () => {
    expect(safeNumber("occasionally")).toBeNull()
  })
})

describe("splitMulti", () => {
  // Several option labels contain their own commas, so the separator is ", ".
  it("splits on the exact separator onFormChange writes", () => {
    expect(splitMulti("Nightmares, Night Sweats")).toEqual(["Nightmares", "Night Sweats"])
  })
})

describe("choice rules", () => {
  it("maps a known value", () => {
    expect(scoreRule(choice(), "Regular").points).toBe(10)
  })

  it("is case- and whitespace-insensitive", () => {
    expect(scoreRule(choice(), "  REGULAR ").points).toBe(10)
  })

  it("uses the fallback for an unknown value and still counts as answered", () => {
    const r = scoreRule(choice({ fallback: 2 }), "something we never shipped")
    expect(r.points).toBe(2)
    expect(r.answered).toBe(1)
  })

  it("scores zero, not undefined, when there is no map entry and no fallback", () => {
    expect(scoreRule(choice(), "unknown").points).toBe(0)
  })

  it("treats missing and empty as unanswered, not as zero", () => {
    for (const v of [undefined, "", "   "]) {
      const r = scoreRule(choice(), v)
      expect(r.points).toBeNull()
      expect(r.answered).toBe(0)
      expect(r.applicable).toBe(1)
    }
  })

  it("raises a red flag from a predicate", () => {
    const rule = choice({
      map: { none: 10 }, fallback: 2,
      redFlagWhen: (v) => v !== "none", redFlagSeverity: "high",
    })
    expect(scoreRule(rule, "frank blood (painful)").redFlag).toBe("high")
    expect(scoreRule(rule, "none").redFlag).toBeNull()
  })

  it("clamps a miscofigured map to the rule max", () => {
    expect(scoreRule(choice({ map: { regular: 999 } }), "Regular").points).toBe(10)
  })
})

describe("numericRange rules", () => {
  const rule: ScoreRule = {
    field: "personal_history__sleep_duration_hours",
    label: "Sleep duration", max: 10, kind: "numericRange", confirmed: true,
    buckets: [
      { max: 4, points: 2, redFlag: "high" },
      { min: 4, max: 7, points: 5 },
      { min: 7, points: 10 },
    ],
  }

  it.each([["8", 10], ["7", 10], ["6", 5], ["4", 5], ["3", 2]])(
    "buckets %s", (raw, want) => expect(scoreRule(rule, raw).points).toBe(want),
  )

  it("flags the red-flag bucket", () => {
    expect(scoreRule(rule, "3").redFlag).toBe("high")
    expect(scoreRule(rule, "8").redFlag).toBeNull()
  })

  // Free text with no digits cannot be bucketed. Scoring it zero would read as
  // a clinical finding, so it has to count as unanswered.
  it("treats unparseable free text as unanswered", () => {
    const r = scoreRule(rule, "varies a lot")
    expect(r.points).toBeNull()
    expect(r.answered).toBe(0)
  })
})

describe("multiSelect rules", () => {
  const rule: ScoreRule = {
    field: "personal_history__parasomnias_select_all_that_apply",
    label: "Parasomnias", max: 30, kind: "multiSelect", confirmed: true,
    items: 3, options: ["Sleep Walking", "Bed Wetting", "Nightmares"],
    absentPoints: 10, presentPoints: 5,
  }

  it("awards the healthy value for every unticked option", () => {
    const r = scoreRule(rule, "Nightmares")
    expect(r.points).toBe(25) // 10 + 10 + 5
    expect(r.answered).toBe(3)
  })

  it("scores each unticked option at the healthy value", () => {
    expect(scoreRule(rule, "Sleep Walking").points).toBe(25) // 5 + 10 + 10
    expect(scoreRule(rule, "Sleep Walking, Bed Wetting, Nightmares").points).toBe(15)
  })

  // Known limitation, same shape as B-20: "worked the block, found nothing"
  // stores the empty string and `save()` then drops the field entirely, so it is
  // indistinguishable from "never asked". A patient with no parasomnias at all
  // therefore forfeits the section rather than being credited 160 they earned.
  it("cannot distinguish an all-clear block from an unasked one", () => {
    expect(scoreRule(rule, "").points).toBeNull()
  })

  it("reports an entirely empty block as indeterminate, not as all-healthy", () => {
    // Neither "unanswered" nor "no parasomnias" can be claimed, so the block is
    // scored at nothing and kept out of the completeness denominator.
    const r = scoreRule(rule, "")
    expect(r.points).toBeNull()
    expect(r.answered).toBe(0)
    expect(r.applicable).toBe(0)
    expect(r.indeterminate).toBe(3)
  })

  it("ignores an option value the form no longer offers", () => {
    expect(scoreRule(rule, "Retired Option").points).toBe(30)
  })
})

describe("legacy ambiguity (B-1)", () => {
  // Pre-M-1 rows stored the symptom's value when the RMO picked "None", so the
  // two are indistinguishable. Guessing either way would be silently wrong.
  it("refuses to score a colliding Women's Health value", () => {
    const rule: ScoreRule = {
      field: "personal_history__womens_health_vasomotor",
      label: "Vasomotor", max: 10, kind: "choice", confirmed: true,
      map: { none: 10 }, fallback: 5,
    }
    expect(scoreRule(rule, "night sweats").points).toBeNull()
    expect(scoreRule(rule, "Hot flashes").points).toBe(5)
    expect(scoreRule(rule, "None").points).toBe(10)
  })

  it("only treats the value as ambiguous on its own field", () => {
    const elsewhere: ScoreRule = {
      field: "personal_history__snoring",
      label: "Snoring", max: 10, kind: "choice", confirmed: true,
      map: { "night sweats": 7 },
    }
    expect(scoreRule(elsewhere, "night sweats").points).toBe(7)
  })
})
