import type { Answers, SectionConfig, SectionScore } from "./types"
import { scoreRule } from "./rules"
import { DEFAULT_MANUAL_MAX, FIELD_SECTION, type ManualScores } from "./manual"
import { clamp } from "./utils"

/**
 * Score one section.
 *
 * A manual score entered by the RMO always beats the derived one — the engine's
 * value is a suggestion, not a verdict. Manual scores also reach fields the
 * config has no rule for at all, which is how the eight sections the source
 * document never resolved (GPE, Men's Sexual Health, PSS-10, ...) can be scored
 * without inventing point values for them.
 *
 * `mode` decides the denominator. Under "answered" a question nobody answered
 * is excluded from both sides, so `maxScore` is the total available on the
 * questions actually put to the patient. Under "all" every applicable question
 * counts, and an unanswered one scores zero.
 */
export function scoreSection(
  config: SectionConfig,
  answers: Answers,
  manual: ManualScores,
  mode: "answered" | "all",
): SectionScore {
  const out: SectionScore = {
    key: config.key,
    name: config.name,
    score: 0,
    maxScore: 0,
    answered: 0,
    applicable: 0,
    indeterminate: 0,
    manual: 0,
    redFlags: [],
    unconfirmed: 0,
  }

  const covered = new Set<string>()

  for (const rule of config.rules) {
    covered.add(rule.field)
    const override = manual[rule.field]

    if (override !== undefined) {
      // Hand-entered. Counts as answered even when the question itself is
      // blank — the RMO judged it, which is the whole point of the override.
      out.score += clamp(override, 0, rule.max)
      out.maxScore += rule.max
      out.answered += rule.items ?? 1
      out.applicable += rule.items ?? 1
      out.manual += 1
      continue
    }

    const r = scoreRule(rule, answers[rule.field])
    out.applicable += r.applicable
    out.answered += r.answered
    out.indeterminate += r.indeterminate

    if (r.points === null) {
      if (mode === "all") out.maxScore += rule.max
    } else {
      out.score += r.points
      out.maxScore += r.max
      if (!rule.confirmed) out.unconfirmed += 1
    }

    if (r.redFlag) {
      out.redFlags.push({
        field: rule.field,
        label: rule.label,
        section: config.key,
        severity: r.redFlag,
      })
    }
  }

  // Manually scored fields this section has no rule for. Out of 10 — the
  // document's universal per-item value.
  for (const [field, value] of Object.entries(manual)) {
    if (covered.has(field)) continue
    if (FIELD_SECTION.get(field) !== config.key) continue
    out.score += clamp(value, 0, DEFAULT_MANUAL_MAX)
    out.maxScore += DEFAULT_MANUAL_MAX
    out.answered += 1
    out.applicable += 1
    out.manual += 1
  }

  // Defensive: a config with overlapping buckets could in principle overshoot.
  out.score = clamp(out.score, 0, out.maxScore)
  return out
}
