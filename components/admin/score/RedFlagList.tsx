"use client"

import { AlertTriangle } from "lucide-react"

import type { SectionScore } from "./types"

/**
 * Red flags, admin-only.
 *
 * Deliberately never rendered in the patient portal: surfacing "blood in stool"
 * or "suicidal tendencies" to a patient in a self-service screen, with no
 * clinician present, is a clinical decision rather than a technical one, and
 * the default is hidden.
 *
 * Flags carry the question's label but never its stored answer — the value is
 * PHI and adds nothing the clinician cannot see in the intake itself.
 */
export function RedFlagList({ sections }: { sections: SectionScore[] }) {
  const flags = sections.flatMap((s) =>
    s.redFlags.map((f) => ({ ...f, sectionName: s.name })),
  )

  if (flags.length === 0) {
    return (
      <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
        No red flags raised.
      </p>
    )
  }

  // High severity first — that is the reading order that matters clinically.
  const ordered = [...flags].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1,
  )

  return (
    <ul className="space-y-2">
      {ordered.map((f) => (
        <li
          key={`${f.section}:${f.field}`}
          className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
          style={{ background: f.severity === "high" ? "#FEF3F2" : "#FFFAEB" }}
        >
          <AlertTriangle
            className="h-4 w-4 mt-0.5 shrink-0"
            style={{ color: f.severity === "high" ? "#B42318" : "#B54708" }}
          />
          <span className="text-sm">
            <span className="font-semibold text-[#101828]">{f.sectionName}</span>
            <span className="text-[#475467]"> — {f.label}</span>
          </span>
          <span
            className="ml-auto text-[11px] font-bold uppercase tracking-wide shrink-0 mt-0.5"
            style={{ color: f.severity === "high" ? "#B42318" : "#B54708" }}
          >
            {f.severity}
          </span>
        </li>
      ))}
    </ul>
  )
}
