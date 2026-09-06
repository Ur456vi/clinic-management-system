"use client"

import { pct } from "./format"

/**
 * One section's progress bar.
 *
 * The bar is decorative — the numeric `score / max` pair always accompanies it,
 * because colour alone must not carry the meaning. `role="progressbar"` with an
 * explicit label makes the same information available to a screen reader.
 *
 * `tone="traffic"` is the clinician's read (green / amber / red by ratio).
 * `tone="neutral"` is for surfaces shown to patients, where a red bar on a
 * wellness questionnaire reads as a diagnosis rather than a score.
 */
export function ScoreBar({
  label,
  score,
  maxScore,
  tone = "traffic",
}: {
  label: string
  score: number
  maxScore: number
  tone?: "traffic" | "neutral"
}) {
  const percent = pct(score, maxScore)
  const width = percent ?? 0

  const fill =
    tone === "neutral"
      ? "#6B2B26"
      : percent === null || percent >= 80
        ? "#027A48"
        : percent >= 50
          ? "#B54708"
          : "#B42318"

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={maxScore}
      aria-valuetext={percent === null ? "Not assessed" : `${score} of ${maxScore}, ${percent} percent`}
      className="h-2 w-full rounded-full bg-[#EAECF0] dark:bg-[#374151] overflow-hidden"
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${width}%`, background: fill }}
      />
    </div>
  )
}
