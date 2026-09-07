"use client"

import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react"

import { ScoreBar } from "@/components/score/ScoreBar"
import { fraction, pct } from "./types"

/**
 * Overall score headline.
 *
 * Mirrors the assessment detail card in
 * `app/admin/(dashboard)/assessments/[id]/page.tsx` so the two score surfaces
 * read as one product — with the delta pill's polarity flipped, because this is
 * a WELLNESS score where up is good and that one is a RISK score where up is
 * bad. Do not copy the colours across without flipping them.
 */
export function ScoreCard({
  score,
  maxScore,
  delta,
  completeness,
  redFlagCount,
  asOf,
  tone = "traffic",
}: {
  score: number
  maxScore: number
  delta?: number | null
  completeness?: number
  redFlagCount?: number
  asOf?: string
  tone?: "traffic" | "neutral"
}) {
  const percent = pct(score, maxScore)

  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#667085] dark:text-[#94A3B8]">
            Overall
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-bold text-[#101828] dark:text-[#F9FAFB]">
              {score.toLocaleString("en-GB")}
            </span>
            <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
              / {maxScore.toLocaleString("en-GB")}
            </span>
            {percent !== null ? (
              <span className="text-sm font-semibold text-[#667085] dark:text-[#94A3B8]">
                ({percent}%)
              </span>
            ) : null}
          </div>
        </div>

        {delta !== undefined && delta !== null ? (
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{
              // Higher is healthier here, so a rise is the good outcome.
              background: delta > 0 ? "#ECFDF3" : delta < 0 ? "#FEF3F2" : "#F2F4F7",
              color: delta > 0 ? "#027A48" : delta < 0 ? "#B42318" : "#344054",
            }}
            title="Change since the previous consultation"
          >
            {delta > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : delta < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <ScoreBar label="Overall score" score={score} maxScore={maxScore} tone={tone} />
      </div>

      {(completeness !== undefined || redFlagCount || asOf) ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-[#667085] dark:text-[#94A3B8]">
          {asOf ? <span>{asOf}</span> : null}
          {completeness !== undefined ? (
            // Shown next to the score on purpose: 95% at 30% completeness is
            // not a healthy patient, it is a thin assessment.
            <span>
              Completeness{" "}
              <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                {Math.round(completeness * 100)}%
              </span>
            </span>
          ) : null}
          {redFlagCount ? (
            <span className="inline-flex items-center gap-1 font-semibold text-[#B42318]">
              <AlertTriangle className="h-3.5 w-3.5" />
              {redFlagCount} red flag{redFlagCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Compact one-liner for a table cell. Always carries its denominator. */
export function ScoreCell({ score, maxScore }: { score: number; maxScore: number }) {
  const percent = pct(score, maxScore)
  return (
    <span className="text-sm text-[#101828] dark:text-[#F9FAFB]">
      <span className="font-semibold">{fraction(score, maxScore)}</span>
      {percent !== null ? (
        <span className="text-[#667085] dark:text-[#94A3B8]"> ({percent}%)</span>
      ) : null}
    </span>
  )
}
