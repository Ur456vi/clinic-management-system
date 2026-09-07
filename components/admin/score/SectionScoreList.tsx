"use client"

import { AlertTriangle } from "lucide-react"

import { ScoreBar } from "@/components/score/ScoreBar"
import { fraction, pct, type SectionScore } from "./types"

/**
 * The section rows.
 *
 * A section with nothing answered renders "Not assessed" rather than 0 / 0 —
 * an unassessed section and a section scoring zero are clinically different
 * statements, and only one of them is true.
 */
export function SectionScoreList({
  sections,
  tone = "traffic",
}: {
  sections: SectionScore[]
  tone?: "traffic" | "neutral"
}) {
  if (sections.length === 0) {
    return (
      <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
        No sections were assessed in this consultation.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {sections.map((s) => {
        const assessed = s.answered > 0
        const percent = pct(s.score, s.maxScore)
        return (
          <li key={s.key}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-sm text-[#344054] dark:text-[#CBD5E1] flex items-center gap-1.5">
                {s.name}
                {s.redFlags.length > 0 ? (
                  <AlertTriangle
                    className="h-3.5 w-3.5 text-[#B42318]"
                    aria-label={`${s.redFlags.length} red flag${s.redFlags.length === 1 ? "" : "s"}`}
                  />
                ) : null}
              </span>
              <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] shrink-0 tabular-nums">
                {assessed ? fraction(s.score, s.maxScore) : "Not assessed"}
                {assessed && percent !== null ? (
                  <span className="ml-2 font-normal text-[#667085] dark:text-[#94A3B8]">
                    {percent}%
                  </span>
                ) : null}
              </span>
            </div>
            <ScoreBar
              label={s.name}
              score={assessed ? s.score : 0}
              maxScore={assessed ? s.maxScore : 0}
              tone={tone}
            />
          </li>
        )
      })}
    </ul>
  )
}
