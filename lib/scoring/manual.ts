import { RMO_FIELDS } from "@/lib/rmo-fields"
import type { SectionKey } from "./types"

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
 * value is a suggestion the RMO can overrule, and for the sections the source
 * document never resolved (GPE, Men's Sexual Health, PSS-10, Systemic
 * Examination, Energy, Past Medical, Past Surgical, Personal Habits) it is the
 * only score there is.
 */

/** The section key the manual scores blob lives under. */
export const MANUAL_SCORES_KEY = "scores"

/**
 * Default ceiling for a manually scored question that has no config rule.
 *
 * 10 is the document's universal per-item value — every scored question in
 * every section is out of 10, with the sole exception of the Energy tiers.
 */
export const DEFAULT_MANUAL_MAX = 10

/**
 * Registry `sub` -> scored section. Fields whose `sub` is absent here belong to
 * no scored section (Appetite, Marital Status, Work History, ...) and are not
 * offered a score box, so a score can never be orphaned.
 */
export const SUB_TO_SECTION: Record<string, SectionKey> = {
  "Bowels": "bowel",
  "Sleep": "sleep",
  "Bladder Habits": "bladder",
  "Energy Levels": "energy",
  "Libido / Sex Drive": "libido",
  "Mentation": "mentation",
  "Dietary Considerations": "diet",
  "Exercise Regimen": "exercise",
  "Body Weight": "bodyWeight",
  "Personal Hygiene": "hygiene",
  "Body Temperature & Temperature Tolerance": "temperature",
  "Stress - The Percieved Stress Scale (PSS-10)": "stress",
  "Women's Health & Menstrual History": "womensHealth",
  "Men's Sexual Health History": "mensHealth",
  "Miscellaneous": "misc",
  "General Physical Examination": "gpe",
}

/** Field name -> its scored section, for every manually scorable field. */
export const FIELD_SECTION: ReadonlyMap<string, SectionKey> = new Map(
  RMO_FIELDS.flatMap((f) => {
    const key = f.sub ? SUB_TO_SECTION[f.sub] : undefined
    return key ? [[f.n, key] as [string, SectionKey]] : []
  }),
)

/**
 * Fields that carry no clinical answer and are never scored: free-text notes
 * and the "specify" helpers that qualify another control's answer.
 */
export function isScorableField(name: string, label: string): boolean {
  if (!FIELD_SECTION.has(name)) return false
  if (label === "Note" || /_note$/.test(name)) return false
  if (/_specify$/.test(name)) return false
  return true
}

export type ManualScores = Record<string, number>

/**
 * Read and sanitise the manual scores blob.
 *
 * Anything not a finite number in [0, 100] is dropped rather than clamped —
 * a nonsense value is a bug or a bad edit, and silently turning it into a
 * plausible score would hide that.
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
    if (!Number.isFinite(n) || n < 0 || n > 100) continue
    if (!FIELD_SECTION.has(field)) continue
    out[field] = n
  }
  return out
}
