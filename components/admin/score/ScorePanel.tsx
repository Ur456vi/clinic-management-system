"use client"

import { AlertCircle, Loader2, Gauge } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RedFlagList } from "./RedFlagList"
import { ScoreCard } from "./ScoreCard"
import { ScoreHistoryTable } from "./ScoreHistoryTable"
import { ScoringDiagnostics } from "./ScoringDiagnostics"
import { SectionScoreList } from "./SectionScoreList"
import type { ConsultationScore, ScoreHistoryEntry } from "./types"

const CARD =
  "bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6"

/**
 * The clinician-facing score panel, shared by the patient detail tab and the
 * doctor's RMO summary screen so the two cannot drift apart.
 *
 * Presentational only — the host owns fetching, because the two surfaces get
 * the score from different endpoints.
 */
export function ScorePanel({
  score,
  history = [],
  loading = false,
  error = null,
  onRetry,
  showHistory = true,
}: {
  score: ConsultationScore | null
  history?: ScoreHistoryEntry[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  showHistory?: boolean
}) {
  if (loading) {
    return (
      <div className={`${CARD} flex flex-col items-center justify-center py-12`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-4" />
        <p className="text-sm font-medium text-[#667085] dark:text-[#94A3B8]">
          Calculating score...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${CARD} flex flex-col items-center justify-center py-12`}>
        <AlertCircle className="h-8 w-8 mb-4 text-[#d92d20]" />
        <p className="text-sm font-medium text-[#d92d20] mb-4">{error}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    )
  }

  // No RMO consultation at all — an empty state, never a zero score. A patient
  // who has not been assessed has no score; they do not have a score of nought.
  if (!score) {
    return (
      <div className={`${CARD} flex flex-col items-center justify-center py-12 text-center`}>
        <Gauge className="h-8 w-8 mb-4 text-[#D0D5DD]" />
        <p className="text-sm font-medium text-[#667085] dark:text-[#94A3B8]">
          No scored RMO consultation for this patient yet.
        </p>
      </div>
    )
  }

  const assessed = score.sections.filter((s) => s.answered > 0)
  const notAssessed = score.sections.filter((s) => s.answered === 0)
  const latestDelta = history.length > 0 ? history[0].delta : null

  return (
    <div className="space-y-5">
      <ScoreCard
        score={score.totalScore}
        maxScore={score.maxScore}
        delta={latestDelta}
        completeness={score.completeness}
        redFlagCount={score.redFlagCount}
        asOf={new Date(score.consultationDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={CARD}>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#101828] dark:text-[#F9FAFB] mb-4">
            Section scores
          </h3>
          <SectionScoreList sections={assessed} />
          {notAssessed.length > 0 ? (
            <p className="mt-5 pt-4 border-t border-[#EAECF0] dark:border-[#374151] text-xs text-[#667085] dark:text-[#94A3B8]">
              Not assessed in this consultation:{" "}
              {notAssessed.map((s) => s.name).join(", ")}.
            </p>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className={CARD}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#101828] dark:text-[#F9FAFB] mb-4">
              Red flags
            </h3>
            <RedFlagList sections={score.sections} />
          </div>

          {showHistory ? (
            <div className={CARD}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#101828] dark:text-[#F9FAFB] mb-4">
                Previous consultations
              </h3>
              <ScoreHistoryTable entries={history} />
            </div>
          ) : null}
        </div>
      </div>

      <ScoringDiagnostics
        sections={score.sections}
        scoringVersion={score.scoringVersion}
      />
    </div>
  )
}
