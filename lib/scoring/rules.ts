import type { RedFlagSeverity, ScoreRule } from "./types"
import { isAmbiguousLegacy, normalizeValue } from "./normalize"
import { clamp, safeNumber, splitMulti } from "./utils"

/**
 * The result of scoring one rule. This type never leaves `lib/scoring/` —
 * `engine.ts` aggregates it away before anything is serialised, because the
 * brief forbids exposing per-question points on any surface.
 */
export type RuleOutcome = {
  /** null when the question was not answered (or cannot be disambiguated). */
  points: number | null
  /** Points available for the questions that were answered. */
  max: number
  /** Questions answered / questions asked — >1 only for `multiSelect`. */
  answered: number
  applicable: number
  /**
   * Questions whose blank answer is genuinely ambiguous, so they are excluded
   * from the completeness denominator. See `UNANSWERED`.
   */
  indeterminate: number
  redFlag: RedFlagSeverity | null
}

/**
 * A control with no stored value.
 *
 * For `choice` and `numericRange` that unambiguously means nobody answered, so
 * it counts against completeness.
 *
 * For `present` and `multiSelect` it does NOT. Those controls are bare
 * checkboxes with no explicit "None" (defect B-20), so a healthy patient ticks
 * nothing and `save()` drops the field — indistinguishable from never being
 * asked. Counting them as unanswered caps completeness at 72% for a patient who
 * answered every question perfectly, which would make any completeness gate
 * unreachable. They are reported as `indeterminate` instead, and drop out of
 * the denominator until M-14 gives them real None/Present controls.
 */
const UNANSWERED = (rule: ScoreRule): RuleOutcome => {
  const n = rule.items ?? 1
  const blankIsAmbiguous = rule.kind === "present" || rule.kind === "multiSelect"
  return {
    points: null,
    max: 0,
    answered: 0,
    applicable: blankIsAmbiguous ? 0 : n,
    indeterminate: blankIsAmbiguous ? n : 0,
    redFlag: null,
  }
}

function flagFor(rule: ScoreRule, normalised: string): RedFlagSeverity | null {
  const when = rule.redFlagWhen
  if (!when) return null
  const hit = typeof when === "function" ? when(normalised) : when.includes(normalised)
  return hit ? (rule.redFlagSeverity ?? "moderate") : null
}

function scoreChoice(rule: ScoreRule, normalised: string): RuleOutcome {
  const mapped = rule.map?.[normalised]
  const points = mapped ?? rule.fallback ?? 0
  return {
    points: clamp(points, 0, rule.max),
    max: rule.max,
    answered: 1,
    applicable: 1,
    indeterminate: 0,
    redFlag: flagFor(rule, normalised),
  }
}

function scoreNumericRange(rule: ScoreRule, raw: string): RuleOutcome {
  const n = safeNumber(raw)
  // Free text with no digits ("occasionally") cannot be bucketed. Treating it
  // as zero would read as a clinical finding, so it counts as unanswered.
  if (n === null) return UNANSWERED(rule)
  const bucket = (rule.buckets ?? []).find(
    (b) => (b.min === undefined || n >= b.min) && (b.max === undefined || n < b.max),
  )
  if (!bucket) {
    return {
      points: clamp(rule.fallback ?? 0, 0, rule.max),
      max: rule.max, answered: 1, applicable: 1, indeterminate: 0, redFlag: null,
    }
  }
  return {
    points: clamp(bucket.points, 0, rule.max),
    max: rule.max,
    answered: 1,
    applicable: 1,
    indeterminate: 0,
    redFlag: bucket.redFlag ?? null,
  }
}

/**
 * A checkbox group where every option is its own pass/fail question.
 *
 * An empty field is ambiguous — "nothing ticked" and "never asked" look
 * identical once `save()` drops empty values — so the whole block counts as
 * unanswered. Any value at all means the RMO worked the block, and every
 * unticked option is then a genuine "absent".
 */
function scoreMultiSelect(rule: ScoreRule, raw: string): RuleOutcome {
  const options = rule.options ?? []
  const selected = new Set(splitMulti(raw).map(normalizeValue))
  const present = rule.presentPoints ?? 0
  const absent = rule.absentPoints ?? 0

  let points = 0
  let flagged = false
  for (const option of options) {
    const isOn = selected.has(normalizeValue(option))
    points += isOn ? present : absent
    if (isOn && flagFor(rule, normalizeValue(option))) flagged = true
  }
  return {
    points: clamp(points, 0, rule.max),
    max: rule.max,
    answered: options.length,
    applicable: options.length,
    indeterminate: 0,
    redFlag: flagged ? (rule.redFlagSeverity ?? "moderate") : null,
  }
}

/**
 * A bare checkbox with no explicit "None" control (defect B-20). Ticked means
 * the symptom is present; unticked is indistinguishable from unanswered, so it
 * scores nothing rather than silently awarding the healthy value.
 */
function scorePresent(rule: ScoreRule, normalised: string): RuleOutcome {
  return {
    points: clamp(rule.whenPresent ?? 0, 0, rule.max),
    max: rule.max,
    answered: 1,
    applicable: 1,
    indeterminate: 0,
    redFlag: flagFor(rule, normalised),
  }
}

/**
 * A document item the form cannot derive. Never produces a derived score — the
 * RMO's hand-entered value is the only one there is — but it still declares the
 * item so the section reconciles against the document's total.
 */
function scoreManual(rule: ScoreRule): RuleOutcome {
  return {
    points: null,
    max: 0,
    answered: 0,
    applicable: rule.items ?? 1,
    indeterminate: 0,
    redFlag: null,
  }
}

/** Minutes since midnight for "HH:MM", or null if unparseable. */
function minutesOf(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function scoreTimeWindow(rule: ScoreRule, raw: string): RuleOutcome {
  const at = minutesOf(raw)
  if (at === null) return UNANSWERED(rule)
  const start = minutesOf(rule.windowStart ?? "")
  const end = minutesOf(rule.windowEnd ?? "")
  if (start === null || end === null) return UNANSWERED(rule)

  // A window like 21:00-23:30 is a plain range; one like 22:00-06:00 wraps.
  const inside =
    start <= end ? at >= start && at <= end : at >= start || at <= end

  return {
    points: clamp(inside ? rule.max : (rule.fallback ?? 0), 0, rule.max),
    max: rule.max,
    answered: 1,
    applicable: 1,
    indeterminate: 0,
    redFlag: null,
  }
}

export function scoreRule(rule: ScoreRule, raw: string | undefined): RuleOutcome {
  // A manual item has no derived value at all, answered or not.
  if (rule.kind === "manual") return scoreManual(rule)

  if (raw === undefined || raw.trim() === "") return UNANSWERED(rule)

  const normalised = normalizeValue(raw)
  // A pre-M-1 Women's Health row where "None" and a symptom share one value.
  if (isAmbiguousLegacy(rule.field, normalised)) return UNANSWERED(rule)

  switch (rule.kind) {
    case "choice":
      return scoreChoice(rule, normalised)
    case "numericRange":
      return scoreNumericRange(rule, raw)
    case "multiSelect":
      return scoreMultiSelect(rule, raw)
    case "present":
      return scorePresent(rule, normalised)
    case "timeWindow":
      return scoreTimeWindow(rule, raw)
  }
}
