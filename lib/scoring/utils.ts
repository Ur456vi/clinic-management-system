export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Ratio in 0..1. Returns 0 rather than NaN when the denominator is 0. */
export const ratio = (n: number, d: number) => (d <= 0 ? 0 : clamp(n / d, 0, 1))

/**
 * Parse the leading numeric run out of a free-text answer.
 *
 * The form has a lot of `type="text"` where a number is meant, so real answers
 * look like "3", "3-4", "about 3", "94%" and "2 to 3". We take the first number
 * we can find and ignore the rest; anything with no digits at all is unanswered.
 */
export function safeNumber(raw: string): number | null {
  const m = raw.match(/-?\d+(?:\.\d+)?/)
  if (!m) return null
  const n = Number(m[0])
  return Number.isFinite(n) ? n : null
}

/**
 * Split a checkbox group back into its values.
 *
 * `onFormChange` joins with `", "` (comma + space), so we split on that exact
 * separator — several option labels contain their own commas.
 */
export function splitMulti(raw: string): string[] {
  return raw.split(", ").map((s) => s.trim()).filter(Boolean)
}
