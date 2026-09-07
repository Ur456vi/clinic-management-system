/** Shared score formatting. Used by both the admin and patient surfaces. */

/** Percentage 0–100, or null when there is nothing to divide by. */
export function pct(score: number, max: number): number | null {
  if (max <= 0) return null
  return Math.round((score / max) * 100)
}

/** `1,204 / 1,620` — grouped for readability at four digits. */
export function fraction(score: number, max: number): string {
  return `${score.toLocaleString("en-GB")} / ${max.toLocaleString("en-GB")}`
}

/** `06 Sep 2026`. */
export function scoreDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
