import type { Answers, SectionConfig, SectionScore } from "./types"
import { scoreRule } from "./rules"
import { type ManualScores } from "./manual"
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
 * `mode` decides the denominator.
 *
 *   "all"      — the section is marked out of the document's own total, so
 *                Bowel always reads `/ 110`. This is what the brief asks for
 *                ("Bowel Score: 90 / 110") and it keeps one patient's section
 *                comparable with another's. An unanswered question simply does
 *                not earn its points; `completeness` is what says why.
 *   "answered" — only the questions actually put to the patient count, so a
 *                partial intake is not punished. The denominator then moves
 *                between patients and is NOT comparable across them.
 *
 * Either way the denominator can never exceed `declaredMax`: every scorable
 * field is one the config names, and `config.test.ts` asserts the rules sum to
 * the document's total.
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

  for (const rule of config.rules) {
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

  // Mark the section out of the document's own total rather than out of the
  // questions that happened to be answered. See the `mode` note above.
  if (mode === "all") out.maxScore = config.declaredMax

  // Defensive: a config with overlapping buckets could in principle overshoot.
  out.score = clamp(out.score, 0, out.maxScore)
  return out
}
