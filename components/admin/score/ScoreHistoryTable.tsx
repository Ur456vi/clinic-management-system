"use client"

import { AlertTriangle, Minus, TrendingDown, TrendingUp } from "lucide-react"

import { fraction, pct, type ScoreHistoryEntry } from "./types"

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

/**
 * Consultation history with the change against the previous visit.
 *
 * A null `delta` is rendered as an explicit "not comparable" rather than a dash,
 * because the two are different claims: the API returns null precisely when the
 * denominators differ, and quietly showing nothing invites the reader to
 * subtract the totals themselves.
 */
export function ScoreHistoryTable({ entries }: { entries: ScoreHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
        No previous consultations scored.
      </p>
    )
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-[#EAECF0] dark:border-[#374151]">
          {["Date", "Score", "Change", "Completeness", ""].map((h) => (
            <th
              key={h}
              className="py-2 text-xs font-medium uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
        {entries.map((e) => {
          const percent = pct(e.overallScore, e.overallMaxScore)
          return (
            <tr key={e.consultationId}>
              <td className="py-3 text-sm text-[#101828] dark:text-[#F9FAFB]">
                {dateFmt(e.date)}
              </td>
              <td className="py-3 text-sm tabular-nums text-[#101828] dark:text-[#F9FAFB]">
                <span className="font-semibold">
                  {fraction(e.overallScore, e.overallMaxScore)}
                </span>
                {percent !== null ? (
                  <span className="text-[#667085] dark:text-[#94A3B8]"> ({percent}%)</span>
                ) : null}
              </td>
              <td className="py-3 text-sm">
                {e.delta === null ? (
                  <span
                    className="text-xs text-[#667085] dark:text-[#94A3B8]"
                    title="The two consultations assessed different questions, so their totals are not comparable. Compare the percentages instead."
                  >
                    not comparable
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: e.delta > 0 ? "#ECFDF3" : e.delta < 0 ? "#FEF3F2" : "#F2F4F7",
                      color: e.delta > 0 ? "#027A48" : e.delta < 0 ? "#B42318" : "#344054",
                    }}
                  >
                    {e.delta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : e.delta < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {e.delta > 0 ? "+" : ""}
                    {e.delta}
                  </span>
                )}
              </td>
              <td className="py-3 text-sm text-[#667085] dark:text-[#94A3B8] tabular-nums">
                {Math.round(e.completeness * 100)}%
              </td>
              <td className="py-3 text-right">
                {e.redFlagCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B42318]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {e.redFlagCount}
                  </span>
                ) : null}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
