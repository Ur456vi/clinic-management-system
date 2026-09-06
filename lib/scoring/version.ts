/**
 * Bumped whenever a rule, point value or applicability decision changes.
 *
 * Scores are derived on read (see docs in `engine.ts`), so bumping this changes
 * every historical score too. That is deliberate — but it means the version must
 * be stamped onto anything that is cached or shown next to a date, so a reader
 * can tell which rulebook produced a number.
 *
 * Changelog:
 *   0.1.0 — initial engine. Sections that reconcile against the source document
 *           are active; F-1/F-2/F-3/F-4 sections are declared but inactive
 *           pending sign-off (see `SCORING_OPEN_QUESTIONS`).
 */
export const SCORING_VERSION = "0.1.0"

/**
 * Rows written before the Phase 1 data-capture fixes (M-1, M-2, motivation
 * registry) contain values the engine cannot disambiguate. Stamp these so a
 * pre-fix consultation is never read as a clinical finding.
 */
export const LEGACY_SCORING_VERSION = "0.9.0-legacy"
