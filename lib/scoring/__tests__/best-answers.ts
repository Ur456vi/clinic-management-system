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
  for (const section of SCORING_CONFIG) {
    if (!section.active) continue
    if (section.appliesWhen === "female" && sex !== "FEMALE") continue
    if (section.appliesWhen === "male" && sex !== "MALE") continue
    Object.assign(out, bestAnswersFor(section))
  }
  return out
}
