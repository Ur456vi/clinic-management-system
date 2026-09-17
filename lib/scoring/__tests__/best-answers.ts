import type { Answers, ScoreRule, SectionConfig } from "../types"
import { SCORING_CONFIG } from "../config"

/** The value that scores highest for one rule, or null if it has none. */
function bestValue(rule: ScoreRule): string | null {
  switch (rule.kind) {
    case "choice": {
      const entries = Object.entries(rule.map ?? {})
      if (entries.length === 0) return null
      return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    }
    case "numericRange": {
      const buckets = rule.buckets ?? []
      if (buckets.length === 0) return null
      const best = buckets.reduce((a, b) => (b.points > a.points ? b : a))
      // Pick a number that lands inside the winning bucket.
      if (best.min !== undefined) return String(best.min)
      if (best.max !== undefined) return String(best.max - 1)
      return "1"
    }
    case "multiSelect":
      // Nothing ticked is the healthy answer, but an empty field is
      // indistinguishable from unanswered, so it cannot be expressed.
      return null
    case "present":
      // Ticking the box is always the unhealthy answer.
      return null
    case "timeWindow": {
      // Any instant inside the window earns the rule's full value.
      return rule.windowStart ?? null
    }
    case "manual":
      // No derived value exists — the RMO's hand score is the only one there is.
      return null
  }
}

/** A synthetic consultation where every answerable question has its best answer. */
export function bestAnswersFor(section: SectionConfig): Answers {
  const out: Answers = {}
  for (const rule of section.rules) {
    const v = bestValue(rule)
    if (v !== null) out[rule.field] = v
  }
  return out
}

/** Points reachable by `bestAnswersFor` — excludes rules with no expressible best. */
export function reachableMax(section: SectionConfig): number {
  return section.rules
    .filter((r) => bestValue(r) !== null)
    .reduce((n, r) => n + r.max, 0)
}

/**
 * A synthetic consultation good enough to clear the patient-portal
 * completeness threshold: every answerable question in every active section
 * that applies to this sex, at its healthiest value.
 *
 * Built from the config rather than hand-written so it cannot drift as sections
 * are activated.
 */
export function completeConsultationFor(sex: "MALE" | "FEMALE"): Answers {
  const out: Answers = {}
  for (const section of applicableSections(sex)) {
    Object.assign(out, bestAnswersFor(section))
  }
  return out
}

function applicableSections(sex: "MALE" | "FEMALE") {
  return SCORING_CONFIG.filter(
    (s) =>
      s.active &&
      !(s.appliesWhen === "female" && sex !== "FEMALE") &&
      !(s.appliesWhen === "male" && sex !== "MALE"),
  )
}

/**
 * Full marks, by hand, on every item the form cannot derive.
 *
 * A consultation is only complete once these are filled in too: a `manual` rule
 * is a real document item (the free-text hygiene questions, the GPE facies and
 * gait blocks, the six-tier Energy scale) that simply has no answer the engine
 * can read. Without them a perfectly worked intake never clears the
 * patient-portal completeness threshold.
 */
export function completeManualScoresFor(sex: "MALE" | "FEMALE"): Record<string, number> {
  const out: Record<string, number> = {}
  for (const section of applicableSections(sex)) {
    for (const rule of section.rules) {
      if (rule.kind === "manual") out[rule.field] = rule.max
    }
  }
  return out
}
