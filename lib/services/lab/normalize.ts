/**
 * Test-name normalization for matching our catalog names against the partner
 * test master. Deliberately lossy: upper-cases, strips punctuation/brackets,
 * and collapses whitespace so "Blood Glucose [ F/PP/PG- Any One ]" and
 * "BLOOD GLUCOSE (F/PP/PG - ANY ONE)" resolve to the same key. Exact-match
 * only after normalization — fuzzy scoring is intentionally out of scope
 * (curate ambiguous cases via LabTestMapping instead).
 */
export function normalizeTestName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[[\]()]/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
