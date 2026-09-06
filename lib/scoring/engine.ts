import type {
  Answers, PatientContext, PatientScoreResult, ScoreResult, SectionConfig,
} from "./types"
import { DENOMINATOR_MODE, SCORING_CONFIG } from "./config"
import { isSectionApplicable } from "./applicability"
import { flattenAnswers } from "./normalize"
import { DEFAULT_MANUAL_MAX, FIELD_SECTION, readManualScores } from "./manual"
import { scoreSection } from "./section-scorer"
import { scoreRule } from "./rules"
import { ratio } from "./utils"
import { SCORING_VERSION } from "./version"

/**
 * Scores are derived from `Consultation.sections` on every read rather than
 * stored. That keeps a rule change from needing a backfill and makes it
 * impossible for a cached score to drift from the answers it claims to
 * summarise. The trade-off is that historical scores move when the rulebook
 * moves — if the clinical team needs the score frozen at signature, that is a
 * cache table plus a stamped `scoringVersion`, and the two policies are
 * mutually exclusive.
 */
function scoreAll(
  sections: unknown,
  patient: PatientContext,
  configs: readonly SectionConfig[] = SCORING_CONFIG,
): ScoreResult {
  const answers: Answers = flattenAnswers(sections)
  const manual = readManualScores(sections)

  const scored = configs
    .filter((c) => isSectionApplicable(c, answers, patient, manual))
    .map((c) => scoreSection(c, answers, manual, DENOMINATOR_MODE))

  const totalScore = scored.reduce((n, s) => n + s.score, 0)
  const maxScore = scored.reduce((n, s) => n + s.maxScore, 0)
  const answered = scored.reduce((n, s) => n + s.answered, 0)
  const applicable = scored.reduce((n, s) => n + s.applicable, 0)

  return {
    scoringVersion: SCORING_VERSION,
    totalScore,
    maxScore,
    sections: scored,
    redFlagCount: scored.reduce((n, s) => n + s.redFlags.length, 0),
    completeness: ratio(answered, applicable),
  }
}

/**
 * Admin / clinician view: section totals, red flags, completeness. Still no
 * per-question points — `RuleOutcome` never escapes `section-scorer.ts`.
 */
export function scoreForAdmin(sections: unknown, patient: PatientContext): ScoreResult {
  return scoreAll(sections, patient)
}

/**
 * Patient portal view. Deliberately thinner than the admin result: no red
 * flags, no completeness, no scoring version, no answered/applicable counts.
 *
 * Red flags stay out by product decision, not by oversight — surfacing
 * "blood in stool" or "suicidal tendencies" to a patient in a self-service
 * portal is a clinical call, and the default is hidden.
 */
export function scoreForPatient(
  sections: unknown,
  patient: PatientContext,
): PatientScoreResult {
  const full = scoreAll(sections, patient)
  return {
    totalScore: full.totalScore,
    maxScore: full.maxScore,
    sections: full.sections.map((s) => ({
      key: s.key,
      name: s.name,
      score: s.score,
      maxScore: s.maxScore,
    })),
  }
}

export type QuestionSuggestion = {
  /** The engine's score for the recorded answer, or null if it has none yet. */
  suggested: number | null
  max: number
  /** The RMO's own score, when they have entered one. */
  manual: number | null
  /** Whether a config rule exists at all — see the two null cases below. */
  derivable: boolean
}

/**
 * Per-question suggested scores, for the RMO's manual scoring screen.
 *
 * CLINICIAN-ONLY. This is the one function in the module that returns
 * question-level points, and it exists solely so the scoring form can pre-fill
 * a suggestion the RMO can overrule. It must never be reachable from a
 * patient-facing route — `scoreForPatient` is the only thing the portal calls,
 * and `serialization.test.ts` asserts the portal payload stays free of
 * question-level detail.
 *
 * `suggested` is null where the engine has no rule for that question (the eight
 * sections the source document never resolved), which is exactly where the
 * RMO's own number is the only score there is.
 */
export function suggestQuestionScores(
  sections: unknown,
  patient: PatientContext,
): Record<string, QuestionSuggestion> {
  const answers = flattenAnswers(sections)
  const manual = readManualScores(sections)
  const out: Record<string, QuestionSuggestion> = {}

  for (const config of SCORING_CONFIG) {
    if (!isSectionApplicable(config, answers, patient, manual) && config.active) continue
    for (const rule of config.rules) {
      const r = scoreRule(rule, answers[rule.field])
      out[rule.field] = {
        suggested: r.points,
        max: rule.max,
        manual: manual[rule.field] ?? null,
        // A rule exists, so a suggestion appears as soon as the question is
        // answered. Distinct from having no rule at all.
        derivable: true,
      }
    }
  }

  // Questions with no rule at all — manual is the only possible score.
  for (const [field] of FIELD_SECTION) {
    if (out[field]) continue
    out[field] = {
      suggested: null,
      max: DEFAULT_MANUAL_MAX,
      manual: manual[field] ?? null,
      // No rule: the source document never resolved this section, so the RMO's
      // own number is the only score there will ever be.
      derivable: false,
    }
  }
  return out
}
