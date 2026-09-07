"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Info } from "lucide-react"

import type { SectionScore } from "./types"

/**
 * Collapsed diagnostics for the clinical/eng team.
 *
 * Its whole purpose is to stop the unresolved parts of the rulebook degrading
 * silently. A section whose rules do not sum to the source document's declared
 * total, or that carries rules nobody has signed off, says so here rather than
 * just producing a quietly wrong number.
 *
 * Admin-only. Never rendered for a PATIENT.
 */
export function ScoringDiagnostics({
  sections,
  scoringVersion,
}: {
  sections: SectionScore[]
  scoringVersion: string
}) {
  const [open, setOpen] = useState(false)

  const unconfirmed = sections.filter((s) => s.unconfirmed > 0)
  const indeterminate = sections.filter((s) => s.indeterminate > 0)
  if (unconfirmed.length === 0 && indeterminate.length === 0) return null

  return (
    <div className="rounded-xl border border-dashed border-[#D0D5DD] dark:border-[#374151]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-[#667085]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[#667085]" />
        )}
        <Info className="h-4 w-4 text-[#667085]" />
        <span className="text-sm font-semibold text-[#344054] dark:text-[#CBD5E1]">
          Scoring diagnostics
        </span>
        <span className="ml-auto text-xs text-[#667085] dark:text-[#94A3B8]">
          v{scoringVersion}
        </span>
      </button>

      {open ? (
        <div className="px-4 pb-4 space-y-4 text-xs text-[#475467] dark:text-[#94A3B8]">
          {unconfirmed.length > 0 ? (
            <div>
              <p className="font-semibold text-[#344054] dark:text-[#CBD5E1] mb-1.5">
                Rules awaiting sign-off
              </p>
              <p className="mb-2">
                Point values inferred from the document&apos;s stated convention
                but not verified item by item. Treat these section totals as
                provisional.
              </p>
              <ul className="space-y-1">
                {unconfirmed.map((s) => (
                  <li key={s.key}>
                    {s.name} — <span className="font-semibold">{s.unconfirmed}</span>{" "}
                    unconfirmed
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {indeterminate.length > 0 ? (
            <div>
              <p className="font-semibold text-[#344054] dark:text-[#CBD5E1] mb-1.5">
                Questions excluded from completeness
              </p>
              <p className="mb-2">
                Bare checkboxes with no explicit &quot;None&quot;: a healthy
                patient ticks nothing, which the form stores identically to never
                having asked. Counting them as unanswered would cap a complete
                intake at 72%.
              </p>
              <ul className="space-y-1">
                {indeterminate.map((s) => (
                  <li key={s.key}>
                    {s.name} — <span className="font-semibold">{s.indeterminate}</span>{" "}
                    indeterminate
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="pt-2 border-t border-[#EAECF0] dark:border-[#374151]">
            Eight further sections (GPE, Men&apos;s Sexual Health, Systemic
            Examination, Energy, PSS-10, Past Medical, Past Surgical, Personal
            Habits) are not scored at all pending sign-off, and contribute to
            neither the score nor the denominator. See{" "}
            <code className="font-mono">docs/api-scoring.md</code>.
          </p>
        </div>
      ) : null}
    </div>
  )
}
