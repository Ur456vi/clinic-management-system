"use client"

/**
 * MAIN (Dr. Yuvraaj) consultation workspace.
 *
 * Rendered by the start-appointment page when the linked consultation is of
 * type MAIN (i.e. the appointment is assigned to a doctor, not an RMO). The
 * RMO intake form lives in `page.tsx`; this is the doctor's distinct flow:
 *
 *   Patient Detail -> RMO Summary -> Infusion, Rehab & Aesthetic -> Test ->
 *   Final Prescription
 *
 * Editable sections persist to `Consultation.sections` via PATCH
 * /api/consultations/:id, keyed by the field registry in lib/main-fields.ts.
 * The RMO Summary section is read-only, rendered from the `rmoSummary` blob
 * the consultation API attaches for MAIN charts.
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, CalendarPlus, ChevronDown, Loader2, Save, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { MAIN_FIELDS, MAIN_SECTIONS, type MainControl } from "@/lib/main-fields"
import { RMO_FIELDS, SECTION_KEY, SECTION_LABEL, SECTION_ORDER } from "@/lib/rmo-fields"

interface RmoSummary {
  id: string
  status: string
  createdAt: string
  sections?: Record<string, Record<string, unknown>> | null
}

export interface DoctorConsult {
  id: string
  type: "RMO" | "MAIN"
  status: string
  sections?: Record<string, Record<string, unknown>> | null
  patient: { id: string; fullName: string; patientNumber: string } | null
  rmoSummary?: RmoSummary | null
}

interface Props {
  appointmentId: string
  consult: DoctorConsult
  quiz: {
    totalScore: number
    scoreOutOf: number
    band: string
    topRisks: { key: string; label: string; severity: string }[]
  } | null
}

const inputCls =
  "w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
const areaCls =
  "w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"

export default function DoctorConsultation({ appointmentId, consult, quiz }: Props) {
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

  // RMO Summary: sub-tabs over the captured RMO sections + quiz.
  const rmoSecs = (consult.rmoSummary?.sections ?? {}) as Record<string, Record<string, unknown>>
  const rmoVal = (f: { s: string; n: string }) => {
    const v = rmoSecs?.[SECTION_KEY[f.s]]?.[f.n]
    return v == null ? "" : String(v)
  }
  const rmoDataSections = useMemo(
    () => SECTION_ORDER.filter((sec) => RMO_FIELDS.some((f) => f.s === sec && rmoVal(f).trim() !== "")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consult.rmoSummary],
  )
  const [rmoTab, setRmoTab] = useState("")

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

              {section.key === null ? (
                /* RMO Summary — read-only */
                <div>
                  {consult.rmoSummary ? (
                    <p className="text-sm text-[#344054] dark:text-[#CBD5E1] mb-4">
                      Captured by the RMO on{" "}
                      <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                        {new Date(consult.rmoSummary.createdAt).toLocaleDateString()}
                      </span>
                      .
                    </p>
                  ) : null}

                  {(() => {
                    const tabs: { key: string; label: string }[] = [
                      ...rmoDataSections.map((s) => ({ key: s, label: SECTION_LABEL[s] })),
                      ...(quiz ? [{ key: "__quiz", label: "Quiz Assessment" }] : []),
                    ]
                    if (tabs.length === 0) {
                      return (
                        <div className="rounded-xl border border-dashed border-[#D0D5DD] dark:border-[#374151] p-6 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
                          No RMO intake recorded for this patient yet.
                        </div>
                      )
                    }
                    const current = tabs.some((t) => t.key === rmoTab) ? rmoTab : tabs[0].key
                    return (
                      <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
                        <div className="flex flex-wrap gap-1.5 p-3 bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
                          {tabs.map((t) => (
                            <button
                              key={t.key}
                              onClick={() => setRmoTab(t.key)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                current === t.key
                                  ? "bg-[#2E37A4] text-white"
                                  : "text-[#667085] dark:text-[#94A3B8] hover:bg-white hover:text-[#101828]"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                        <div className="p-5">
                          {current === "__quiz" && quiz ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Health Assessment Quiz</h3>
                                <span className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">
                                  {quiz.totalScore}
                                  <span className="text-xs font-normal text-[#667085] dark:text-[#94A3B8]"> / {quiz.scoreOutOf}</span>
                                  <span className="ml-2 text-xs font-semibold text-[#3538CD]">{quiz.band}</span>
                                </span>
                              </div>
                              {quiz.topRisks?.length ? (
                                <div className="flex flex-wrap gap-2">
                                  {quiz.topRisks.map((r) => (
                                    <span
                                      key={r.key}
                                      className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#FEF3F2] text-[#B42318]"
                                    >
                                      {r.label} · {r.severity}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-[#667085] dark:text-[#94A3B8]">No elevated risk areas.</p>
                              )}
                              <Link
                                href={`/admin/appointments/${appointmentId}/quiz`}
                                className="inline-block mt-3 text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                              >
                                View full quiz assessment →
                              </Link>
                            </div>
                          ) : (
                            <dl className="divide-y divide-[#EAECF0] dark:divide-[#374151] -my-1">
                              {RMO_FIELDS.filter((f) => f.s === current && rmoVal(f).trim() !== "").map((f) => (
                                <div key={f.n} className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                                  <dt className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">{f.l}</dt>
                                  <dd className="sm:col-span-2 text-sm text-[#101828] dark:text-[#F9FAFB] whitespace-pre-wrap break-words">
                                    {rmoVal(f)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                /* Editable sections */
                <div className="space-y-10">
                  {section.groups.map((g, gi) => (
                    <div key={gi} className={gi > 0 ? "pt-8 border-t border-[#EAECF0] dark:border-[#374151]" : ""}>
                      {g.title ? <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">{g.title}</h3> : null}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-6">{g.controls.map(renderControl)}</div>
                    </div>
                  ))}
                </div>
              )}
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
