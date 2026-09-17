import { SCORING_CONFIG } from "./config"
import type { ScoreRule, SectionKey } from "./types"

/**
 * Manual per-question scores entered by the RMO.
 *
 * Stored as one extra top-level key inside `Consultation.sections`:
 *
 *   { "personalHistory": { ...answers }, "scores": { "<field>": 10 } }
 *
 * JSONB, so this needs no schema change and no migration — which matters,
 * because `DATABASE_URL` points at the shared live UAT database.
 *
 * A manual score ALWAYS beats the derived one. That is the point: the engine's
 * value is a suggestion the RMO can overrule, and for the document items the
 * form cannot derive (`kind: "manual"` — free-text hygiene, the GPE finding
 * blocks, every Men's Sexual Health item) it is the only score there is.
 */

/** The section key the manual scores blob lives under. */
export const MANUAL_SCORES_KEY = "scores"

/**
 * Every scorable field, and the rule that defines it.
 *
 * The config is the single source of truth for what can be scored. A field
 * with no rule gets no score box and can never contribute to a denominator —
 * which is what keeps each section's total pinned to the document's number.
 * Deriving this from `RMO_FIELDS` instead is what previously let qualifier and
 * duplicate controls (`bowel_characteristic_odour`, `bowel_others`, ...) each
 * add a phantom 10 points, showing Bowel as 130 against a documented 110.
 */
export const FIELD_RULE: ReadonlyMap<string, ScoreRule> = new Map(
  SCORING_CONFIG.flatMap((s) => s.rules.map((r) => [r.field, r] as [string, ScoreRule])),
)

/** Field name -> its scored section, for every manually scorable field. */
export const FIELD_SECTION: ReadonlyMap<string, SectionKey> = new Map(
  SCORING_CONFIG.flatMap((s) =>
    s.rules.map((r) => [r.field, s.key] as [string, SectionKey]),
  ),
)

/** The ceiling for a hand-entered score on this field, or 0 if it has no rule. */
export function maxForField(field: string): number {
  return FIELD_RULE.get(field)?.max ?? 0
}

/**
 * Whether the RMO gets a score box for this control.
 *
 * True only for fields the config scores. Notes, `*_specify` helpers, free-text
 * qualifiers and duplicate controls have no rule and so are never offered one.
 */
export function isScorableField(name: string): boolean {
  return FIELD_RULE.has(name)
}

export type ManualScores = Record<string, number>

/**
 * Read and sanitise the manual scores blob.
 *
 * A value above the field's own maximum is dropped rather than clamped — it is
 * a bad edit or a stale row, and silently turning 20 into 10 would leave the
 * box reading 20 while the score counted 10. Dropping it makes the disagreement
 * visible instead.
 */
export function readManualScores(sections: unknown): ManualScores {
  const out: ManualScores = {}
  if (!sections || typeof sections !== "object") return out
  const blob = (sections as Record<string, unknown>)[MANUAL_SCORES_KEY]
  if (!blob || typeof blob !== "object") return out

  for (const [field, raw] of Object.entries(blob as Record<string, unknown>)) {
    let n: number
    if (typeof raw === "number") {
      n = raw
    } else {
      // An empty box means "no override, use the derived score" — NOT a
      // deliberate zero. `Number("")` is 0, so this has to be caught first.
      const text = String(raw).trim()
      if (text === "") continue
      n = Number(text)
    }
    const max = maxForField(field)
    if (max === 0) continue
    if (!Number.isFinite(n) || n < 0 || n > max) continue
    out[field] = n
  }
  return out
}
