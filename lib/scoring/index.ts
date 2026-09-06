/**
 * IPHMH consultation scoring.
 *
 * Everything under `lib/scoring/` is pure — no Prisma, no fetch, no React — so
 * it is safe to call from a server component, a route handler or a job, and
 * trivially unit-testable.
 *
 * This is a WELLNESS score (higher is healthier) over the RMO consultation. The
 * public-site quiz in `components/public/assessment/` is a separate RISK score
 * running the opposite way. Do not merge them, and do not display them side by
 * side without labelling which direction each runs.
 */
export {
  scoreForAdmin, scoreForPatient, suggestQuestionScores, type QuestionSuggestion,
} from "./engine"
export { flattenAnswers } from "./normalize"
export {
  DEFAULT_MANUAL_MAX, FIELD_SECTION, MANUAL_SCORES_KEY, isScorableField,
  readManualScores, type ManualScores,
} from "./manual"
export { isSectionApplicable, resolveSex } from "./applicability"
export {
  DENOMINATOR_MODE, PATIENT_COMPLETENESS_THRESHOLD, SCORING_CONFIG,
  SCORING_OPEN_QUESTIONS,
} from "./config"
export { LEGACY_SCORING_VERSION, SCORING_VERSION } from "./version"
export type {
  Answers, PatientContext, PatientScoreResult, RedFlagRef, ScoreResult,
  SectionConfig, SectionKey, SectionScore, Sex,
} from "./types"
