import type { SectionConfig } from "../types"
import { bowel } from "./bowel"
import { sleep } from "./sleep"
import { bladder } from "./bladder"
import { mentation } from "./mentation"
import { diet } from "./diet"
import { exercise } from "./exercise"
import { womensHealth } from "./womens-health"
import { bodyWeight, energy, hygiene, libido, misc, temperature } from "./simple-sections"
import {
  gpe, mensHealth, pastMedical, pastSurgical, personalHabits, stress, systemic,
} from "./unresolved"

/**
 * The whole rulebook, as data. Changing a point value is a config edit, never a
 * code edit — which is what lets a clinician review it without reading
 * TypeScript, and what makes `config.test.ts` able to check the whole thing.
 */
export const SCORING_CONFIG: readonly SectionConfig[] = Object.freeze([
  bowel, sleep, bladder, energy, libido, mentation, diet, exercise,
  bodyWeight, hygiene, temperature, womensHealth, misc,
  mensHealth, gpe, stress, systemic, pastMedical, pastSurgical, personalHabits,
])

/**
 * How the denominator is built.
 *
 *   "answered" — a question nobody answered is excluded from BOTH the numerator
 *                and the denominator, so a partial intake is not punished. This
 *                is the recommendation, paired with a visible completeness
 *                figure so a high score on a thin assessment is never mistaken
 *                for a thorough one.
 *   "all"      — every applicable question counts against the denominator, so an
 *                unanswered question scores zero and reads like a sick patient.
 *
 * Clinical lead's call. Kept here so changing it needs no code change.
 */
export const DENOMINATOR_MODE: "answered" | "all" = "answered"

/**
 * Below this, the patient portal shows "Assessment in progress" rather than a
 * score. Admin always sees the number alongside completeness.
 */
export const PATIENT_COMPLETENESS_THRESHOLD = 0.8

/** Everything still waiting on the document author. Drives the admin panel. */
export const SCORING_OPEN_QUESTIONS = SCORING_CONFIG.filter(
  (s) => !s.active || !s.reconciles || s.rules.some((r) => !r.confirmed),
).map((s) => ({
  key: s.key,
  name: s.name,
  active: s.active,
  reconciles: s.reconciles,
  declaredMax: s.declaredMax,
  ruleMax: s.rules.reduce((n, r) => n + r.max, 0),
  unconfirmed: s.rules.filter((r) => !r.confirmed).length,
  note: s.note ?? null,
}))
