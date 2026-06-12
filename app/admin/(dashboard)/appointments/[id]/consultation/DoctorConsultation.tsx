"use client"

/**
 * MAIN (Dr. Yuvraaj) consultation workspace.
 *
 * Rendered by the start-appointment page when the linked consultation is of
 * type MAIN (i.e. the appointment is assigned to a doctor, not an RMO). The
 * RMO intake form lives in `page.tsx`; this is the doctor's distinct flow:
 *
 *   Patient Detail -> Infusion, Rehab & Aesthetic -> Test -> Final Prescription
 *
 * Editable sections persist to `Consultation.sections` via PATCH
 * /api/consultations/:id, keyed by the field registry in lib/main-fields.ts.
 * The RMO intake is reviewed on its own screen
 * (/admin/appointments/[id]/rmo-summary), linked from the header.
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, CalendarPlus, ChevronDown, FileText, Loader2, Plus, Save, Trash2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { MAIN_FIELDS, MAIN_SECTIONS, type MainControl, type TableColumn } from "@/lib/main-fields"

export interface DoctorConsult {
  id: string
  type: "RMO" | "MAIN"
  status: string
  sections?: Record<string, Record<string, unknown>> | null
  patient: { id: string; fullName: string; patientNumber: string } | null
}

interface Props {
  appointmentId: string
  consult: DoctorConsult
}

const inputCls =
  "w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
const areaCls =
  "w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"

export default function DoctorConsultation({ appointmentId, consult }: Props) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState(MAIN_SECTIONS[0].slug)
  const [saving, setSaving] = useState(false)

  // Flatten previously-saved MAIN sections back into the flat form map.
  const [form, setForm] = useState<Record<string, string>>(() => {
    const flat: Record<string, string> = {}
    const secs = (consult.sections ?? {}) as Record<string, Record<string, unknown>>
    for (const f of MAIN_FIELDS) {
      const v = secs?.[f.key]?.[f.n]
      if (v != null) flat[f.n] = String(v)
    }
    return flat
  })

  const setField = (n: string, v: string) => setForm((p) => ({ ...p, [n]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const sections: Record<string, Record<string, string>> = {}
      for (const f of MAIN_FIELDS) {
        const v = form[f.n]
        if (v == null || v === "") continue
        ;(sections[f.key] ??= {})[f.n] = v
      }
      const res = await fetch(`/api/consultations/${consult.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      notify.success("Consultation saved")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      notify.error("Couldn't save consultation", { description: message })
    } finally {
      setSaving(false)
    }
  }

  const patientId = consult.patient?.id

  const bookFollowUp = async () => {
    await save()
    const q = new URLSearchParams({ role: "DOCTOR", doctor: "Yuvraaj" })
    if (patientId) q.set("patientId", patientId)
    router.push(`/admin/appointments/add?${q.toString()}`)
  }

  const section = MAIN_SECTIONS.find((s) => s.slug === activeSection) ?? MAIN_SECTIONS[0]

  const renderControl = (c: MainControl) => {
    const value = form[c.n] ?? ""
    if (c.kind === "table") {
      return (
        <div key={c.n} className="flex flex-col gap-1.5 col-span-2">
          <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">{c.l}</label>
          <TableControl
            columns={c.columns}
            addLabel={c.addLabel}
            value={value}
            onChange={(v) => setField(c.n, v)}
          />
          {c.hint ? <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{c.hint}</p> : null}
        </div>
      )
    }
    return (
      <div key={c.n} className={`flex flex-col gap-1.5 ${c.full ? "col-span-2" : ""}`}>
        <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">{c.l}</label>
        {c.kind === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => setField(c.n, e.target.value)}
            placeholder={c.placeholder}
            rows={c.rows ?? 3}
            className={areaCls}
          />
        ) : c.kind === "select" ? (
          <div className="relative">
            <select
              value={value}
              onChange={(e) => setField(c.n, e.target.value)}
              className={`${inputCls} pr-10 appearance-none`}
            >
              <option value="">{c.placeholder ?? "Select"}</option>
              {c.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
          </div>
        ) : (
          <input
            type={c.kind === "date" ? "date" : "text"}
            value={value}
            onChange={(e) => setField(c.n, e.target.value)}
            placeholder={c.placeholder}
            className={inputCls}
          />
        )}
        {c.hint ? <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{c.hint}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] pb-28">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#2E37A4] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Appointments
          </Link>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Doctor Consultation</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#667085] dark:text-[#94A3B8]">
            <User className="h-4 w-4" />
            {consult.patient ? (
              <Link
                href={`/admin/patients/${consult.patient.id}`}
                className="font-medium text-[#101828] dark:text-[#F9FAFB] hover:text-[#2E37A4]"
              >
                {consult.patient.fullName}
              </Link>
            ) : (
              <span>Unknown patient</span>
            )}
            {consult.patient ? <span className="text-[#98A2B3] dark:text-[#94A3B8]">#{consult.patient.patientNumber}</span> : null}
          </div>
        </div>
        <Link href={`/admin/appointments/${appointmentId}/rmo-summary`}>
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> View RMO Summary
          </Button>
        </Link>
      </div>

      {/* Body */}
      <div className="flex gap-6">
        <aside className="w-[240px] flex-shrink-0">
          <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
            {MAIN_SECTIONS.map((s) => (
              <button
                key={s.slug}
                onClick={() => setActiveSection(s.slug)}
                className={`w-full text-left px-6 py-4 text-sm font-medium transition-all border-b border-[#EAECF0] dark:border-[#374151] last:border-b-0 ${
                  activeSection === s.slug
                    ? "bg-[#F9FAFB] dark:bg-[#111827] text-[#2E37A4] dark:text-[#A5B4FC] border-l-4 border-l-[#2E37A4]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 hover:text-[#101828]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-8">
            <div className="max-w-[800px]">
              {/* Section header */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">{section.label}</h2>
                <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">{section.description}</p>
              </div>

              <div className="space-y-10">
                {section.groups.map((g, gi) => (
                  <div key={gi} className={gi > 0 ? "pt-8 border-t border-[#EAECF0] dark:border-[#374151]" : ""}>
                    {g.title ? <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">{g.title}</h3> : null}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6">{g.controls.map(renderControl)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#EAECF0] dark:border-[#374151] bg-white dark:bg-[#1F2937]/95 backdrop-blur px-8 py-4 flex items-center justify-end gap-3 ml-[84px] lg:ml-[280px]">
        <Button
          onClick={() => void save()}
          disabled={saving}
          className="bg-[#027A48] hover:bg-[#04643c] text-white flex items-center gap-2 mr-auto"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save consultation
        </Button>
        <Button onClick={bookFollowUp} className="bg-[#2E37A4] hover:bg-[#1d246b] text-white flex items-center gap-2">
          <CalendarPlus className="h-4 w-4" /> Book follow-up
        </Button>
      </div>
    </div>
  )
}

/* ── structured-table control ────────────────────────────────────── */

type TableRow = Record<string, string>

/** Tolerant parse of a table control's stored JSON value. */
function parseRows(value: string): TableRow[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.map((r) =>
      r && typeof r === "object"
        ? Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v == null ? "" : String(v)]))
        : {},
    )
  } catch {
    return []
  }
}

/**
 * Repeating-row editor for `table` controls (Supplements, Infusion plans…).
 * Rows serialize to a JSON string so they persist through the same
 * string-per-field save path as every other control.
 */
function TableControl({
  columns,
  addLabel,
  value,
  onChange,
}: {
  columns: TableColumn[]
  addLabel?: string
  value: string
  onChange: (v: string) => void
}) {
  const rows = parseRows(value)

  const commit = (next: TableRow[]) => {
    // Store "" when empty so save() skips the field entirely.
    onChange(next.length === 0 ? "" : JSON.stringify(next))
  }

  const setCell = (ri: number, key: string, v: string) => {
    const next = rows.map((r, i) => (i === ri ? { ...r, [key]: v } : r))
    commit(next)
  }

  const addRow = () => {
    commit([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))])
  }

  const removeRow = (ri: number) => {
    commit(rows.filter((_, i) => i !== ri))
  }

  return (
    <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
      {rows.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-[#667085] dark:text-[#94A3B8]"
                >
                  {c.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {rows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((c) => (
                  <td key={c.key} className="px-1.5 py-1.5 align-top">
                    <input
                      type="text"
                      value={row[c.key] ?? ""}
                      onChange={(e) => setCell(ri, c.key, e.target.value)}
                      placeholder={c.placeholder}
                      className="w-full h-10 px-2.5 border border-transparent hover:border-[#D0D5DD] dark:hover:border-[#374151] rounded-lg bg-transparent text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] focus:bg-white dark:focus:bg-[#1F2937] transition-all"
                    />
                  </td>
                ))}
                <td className="px-1.5 py-1.5 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(ri)}
                    aria-label="Remove row"
                    className="p-2 text-[#98A2B3] hover:text-[#B42318] rounded-md hover:bg-[#FEF3F2] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="px-4 py-4 text-sm text-[#667085] dark:text-[#94A3B8]">
          No entries yet.
        </p>
      )}
      <div className="border-t border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] px-3 py-2">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> {addLabel ?? "Add row"}
        </button>
      </div>
    </div>
  )
}
