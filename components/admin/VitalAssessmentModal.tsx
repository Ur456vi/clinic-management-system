"use client"

/**
 * Vital Assessment editor — opened from the patient's "Vital Assessment" tab.
 * Captures the IPHMH Patient Assessment Sheet: date + consultant + note and
 * the 26 sheet rows, grouped by position (Standing / Sitting / Supine).
 *
 *   - CREATE (no `assessment`): POST /api/vital-assessments
 *   - EDIT   (`assessment` set): PATCH /api/vital-assessments/:id
 */

import { useCallback, useMemo, useState } from "react"
import { Loader2, X } from "lucide-react"

import { notify } from "@/lib/notify"
import {
  VITAL_ASSESSMENT_FIELDS,
  type VitalField,
  type VitalFieldPosition,
} from "@/lib/vital-assessment-fields"

export type VitalAssessmentEditable = {
  id: string
  assessedAt: string
  consultant: string | null
  note: string | null
  measurements: Record<string, string>
}

function toDateInputValue(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ""
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Split the ordered field list into consecutive same-position runs so the two
 *  "Standing" blocks (steps 1-16 and step 26) render as separate sections. */
const SECTIONS: { position: VitalFieldPosition; fields: VitalField[] }[] = (() => {
  const out: { position: VitalFieldPosition; fields: VitalField[] }[] = []
  for (const f of VITAL_ASSESSMENT_FIELDS) {
    const last = out[out.length - 1]
    if (last && last.position === f.position) last.fields.push(f)
    else out.push({ position: f.position, fields: [f] })
  }
  return out
})()

const fieldCls =
  "h-10 px-3 rounded-lg border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm text-[#101828] dark:text-[#F9FAFB] outline-none focus:border-[#1F3D33]"

export default function VitalAssessmentModal({
  patientId,
  assessment,
  onClose,
  onChanged,
}: {
  patientId: string
  /** When set, opens in EDIT mode for an existing assessment. */
  assessment?: VitalAssessmentEditable | null
  onClose: () => void
  onChanged: () => void
}) {
  const isEdit = !!assessment

  const [assessedAt, setAssessedAt] = useState(toDateInputValue(assessment?.assessedAt ?? null))
  const [consultant, setConsultant] = useState(assessment?.consultant ?? "")
  const [note, setNote] = useState(assessment?.note ?? "")
  const [values, setValues] = useState<Record<string, string>>(assessment?.measurements ?? {})
  const [saving, setSaving] = useState(false)

  const setField = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const filledCount = useMemo(
    () => Object.values(values).filter((v) => v && v.trim()).length,
    [values],
  )

  const save = useCallback(async () => {
    if (saving) return
    if (!assessedAt) {
      notify.error("Pick a date")
      return
    }
    setSaving(true)
    try {
      // Prune empty values so the stored map only holds filled rows.
      const measurements: Record<string, string> = {}
      for (const [k, v] of Object.entries(values)) {
        if (v && v.trim()) measurements[k] = v.trim()
      }
      const payload = {
        assessedAt: new Date(`${assessedAt}T00:00:00`).toISOString(),
        consultant: consultant.trim() || null,
        note: note.trim() || null,
        measurements,
      }
      const res = await fetch(
        isEdit ? `/api/vital-assessments/${assessment!.id}` : "/api/vital-assessments",
        {
          method: isEdit ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? payload : { patientId, ...payload }),
        },
      )
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't save the assessment")
      notify.success(isEdit ? "Vital assessment updated" : "Vital assessment added")
      onChanged()
      onClose()
    } catch (err) {
      notify.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }, [saving, assessedAt, consultant, note, values, isEdit, assessment, patientId, onChanged, onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16,24,40,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">Vital Assessment</h3>
            <p className="text-xs text-[#98A2B3] mt-0.5">Patient Assessment Sheet · {filledCount} of 26 filled</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#98A2B3] hover:bg-gray-100 dark:hover:bg-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Header fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Date</span>
            <input type="date" value={assessedAt} onChange={(e) => setAssessedAt(e.target.value)} className={fieldCls} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Consultant</span>
            <input
              value={consultant}
              onChange={(e) => setConsultant(e.target.value)}
              placeholder="e.g. Dr. Yuvraaj Singh"
              className={fieldCls}
            />
          </label>
        </div>

        {/* Measurement sections */}
        {SECTIONS.map((section, i) => (
          <div key={`${section.position}-${i}`} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F3D33] dark:text-[#A5B4FC]">
                {section.position}
              </span>
              <span className="h-px flex-1 bg-[#EFE8D8] dark:bg-[#374151]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {section.fields.map((f) => (
                <label key={f.key} className="flex flex-col gap-1 text-sm">
                  <span className="text-[#475467] dark:text-[#CBD5E1] text-xs">
                    <span className="text-[#98A2B3]">{f.step}.</span> {f.label}
                    {f.unit ? <span className="text-[#98A2B3]"> ({f.unit})</span> : null}
                  </span>
                  <input
                    value={values[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={fieldCls}
                    inputMode={f.key.startsWith("bp") || f.key === "hyperFlexibilityTest" ? "text" : "decimal"}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* Note */}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Note:"
            className="px-3 py-2 rounded-lg border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm text-[#101828] dark:text-[#F9FAFB] outline-none focus:border-[#1F3D33] resize-none"
          />
        </label>

        <div className="flex items-center justify-end gap-2 pt-1 sticky bottom-0 bg-white dark:bg-[#1F2937]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-[#475467] dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-60"
            style={{ background: "#1F3D33" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save changes" : "Save assessment"}
          </button>
        </div>
      </div>
    </div>
  )
}
