"use client"

/**
 * Printable Prescription & Clinical Plan for the MAIN (Dr. Yuvraaj)
 * consultation.
 *
 * Reached from the Doctor Consultation workspace ("Print prescription").
 * Renders every captured consultation section in the approved IHMH
 * prescription layout (numbered sections, two-column body, signature
 * block, contact footer) and prints via the browser print dialog — the
 * `rx-root` visibility trick hides the admin chrome so only the sheet
 * lands on paper.
 *
 * Data comes from the same find-or-create consultation endpoint the
 * workspace uses; all values are read from `Consultation.sections`
 * (see lib/main-fields.ts for the field registry).
 */

import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { groupSelectedByPanel, parseSelectedTests } from "@/lib/test-catalog"

interface Consultation {
  id: string
  type: "RMO" | "MAIN"
  status: string
  sections?: Record<string, Record<string, unknown>> | null
  patient: { id: string; fullName: string; patientNumber: string } | null
  /** Last save — used as the stable "report generated" stamp. */
  updatedAt?: string
}

const INK = "#1C2B27" // near-black green for headers
const GREEN = "#1F3D33" // deep brand green
const GOLD = "#B08D44"
const CREAM = "#F6F1E7"

/** Clinic constants — single source for the printed letterhead/footer.
 * Replace the XXXX placeholders with the live registration & contact once
 * confirmed; every print reads from here. */
const CLINIC = {
  kmcReg: "XXXXXX",
  phone: "+91 XXXXX XXXXX",
  website: "www.ihmh.in",
  email: "care@ihmh.in",
  address: "Institute of Hormonal & Metabolic Health, Bengaluru, Karnataka",
} as const

/* ── helpers ─────────────────────────────────────────────────────── */

function fmtDate(value: string): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

function ageFrom(dob: string): string {
  if (!dob) return ""
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return ""
  const diff = Date.now() - d.getTime()
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  return `${years} Years`
}

function lines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

type TableRow = Record<string, string>

function parseRows(value: string): TableRow[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.map((r) =>
      r && typeof r === "object"
        ? Object.fromEntries(Object.entries(r).map(([k, x]) => [k, x == null ? "" : String(x)]))
        : {},
    )
  } catch {
    return []
  }
}

/* ── building blocks ─────────────────────────────────────────────── */

function SectionHeader({ no, title, sub }: { no: number; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-0">
      <span
        className="flex items-center justify-center w-7 h-7 rounded-full text-white text-sm font-bold flex-shrink-0"
        style={{ background: INK }}
      >
        {no}
      </span>
      <div
        className="flex-1 text-white text-[12px] font-bold tracking-wide uppercase px-4 py-2"
        style={{ background: INK, borderRadius: "4px 16px 4px 4px" }}
      >
        {title}
        {sub ? <span className="font-normal normal-case opacity-80"> {sub}</span> : null}
      </div>
    </div>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border rounded-lg bg-white p-4 ${className}`}
      style={{ borderColor: "#D8D2C2", boxShadow: "0 1px 2px rgba(28,43,39,0.06)" }}
    >
      {children}
    </div>
  )
}

function MiniHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-bold tracking-wider uppercase text-white px-3 py-1.5 rounded-sm mb-2"
      style={{ background: GREEN }}
    >
      {children}
    </div>
  )
}

function KV({ k, v: value }: { k: string; v: string }) {
  return (
    <div className="flex" style={{ fontSize: 11, lineHeight: "18px" }}>
      <span className="font-semibold" style={{ color: "#3D4A45", width: "42%" }}>
        {k}
      </span>
      <span className="w-3 text-[#98A2B3]">:</span>
      <span className="flex-1 font-medium" style={{ color: "#101828" }}>
        {value || "—"}
      </span>
    </div>
  )
}

function Bullets({ text, checks = false }: { text: string; checks?: boolean }) {
  const items = lines(text)
  if (items.length === 0) return <p className="text-[11px] text-[#98A2B3]">—</p>
  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[11px] leading-4" style={{ color: "#28342F" }}>
          <span className="mt-[1px] flex-shrink-0" style={{ color: checks ? "#1E7A4F" : GOLD }}>
            {checks ? "✓" : "•"}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function RxTable({ columns, rows }: { columns: { key: string; label: string }[]; rows: TableRow[] }) {
  return (
    <table className="w-full text-[10.5px] border-collapse">
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              className="text-left text-white font-semibold px-2.5 py-1.5 border"
              style={{ background: "#222E3A", borderColor: "#222E3A" }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-2.5 py-2 border text-[#98A2B3]" style={{ borderColor: "#D8D2C2" }}>
              —
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 ? "#FAF7F0" : "#fff" }}>
              {columns.map((c) => (
                <td key={c.key} className="px-2.5 py-1.5 border align-top" style={{ borderColor: "#D8D2C2", color: "#28342F" }}>
                  {r[c.key] || "—"}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

/* ── page ────────────────────────────────────────────────────────── */

export default function PrescriptionPage() {
  const params = useParams<{ id: string }>()
  const appointmentId = params.id

  const [consult, setConsult] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setError(null)
      try {
        // Read-only GET — viewing a prescription must never create a chart
        // (the POST variant find-or-creates the consultation row).
        const res = await fetch(`/api/appointments/${appointmentId}/consultation`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        if (!cancelled) {
          setConsult((data as Consultation | null) ?? null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load prescription")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] mb-3" />
        <p className="text-sm font-medium">Preparing prescription…</p>
      </div>
    )
  }

  if (error || !consult || consult.type !== "MAIN") {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828]">Couldn&apos;t load prescription</p>
        <p className="text-xs text-[#667085] max-w-md">
          {error ?? "This appointment has no doctor (MAIN) consultation to print."}
        </p>
        <Link href="/admin/appointments">
          <Button variant="outline">Back to appointments</Button>
        </Link>
      </div>
    )
  }

  const S = (consult.sections ?? {}) as Record<string, Record<string, unknown>>
  const v = (key: string, n: string) => {
    const x = S?.[key]?.[n]
    return x == null ? "" : String(x)
  }
  const pd = (n: string) => v("patientDetail", `patientDetail__${n}`)
  const ira = (n: string) => v("infusionRehabAesthetic", `infusionRehabAesthetic__${n}`)
  const ts = (n: string) => v("test", `test__${n}`)
  const fp = (n: string) => v("finalPrescription", `finalPrescription__${n}`)

  const patient = consult.patient
  const consultDate = pd("consultation_date")
  const mode = pd("consultation_mode")
  const supplements = parseRows(fp("supplements_rows"))
  const infusions = parseRows(ira("infusion_rows"))

  // Stable, deterministic prescription identity — derived from persisted data
  // so two prints of the same record are identical. The "report generated"
  // stamp is the consultation's last-save time, not render time.
  const generated = consult.updatedAt ? new Date(consult.updatedAt) : null
  const rxYear = (generated ?? (consultDate ? new Date(consultDate) : null))?.getFullYear()
  const rxId = `IHMH-P-${rxYear ?? "—"}-${consult.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`

  return (
    <div className="flex flex-col gap-4">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between">
        <Link
          href={`/admin/appointments/${appointmentId}/consultation`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#2E37A4]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to consultation
        </Link>
        <Button onClick={() => window.print()} className="bg-[#1F3D33] hover:bg-[#15291F] text-white flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print prescription
        </Button>
      </div>

      {/* ── Prescription sheet (fixed design width; scrolls on screen, scales on print) ── */}
      <div className="overflow-x-auto">
      <div className="rx-root" style={{ background: CREAM, color: "#101828", width: 1040 }}>
        {/* Header */}
        <div className="px-6 pt-5 pb-3" style={{ display: "grid", gridTemplateColumns: "250px 1fr 235px", gap: "16px", alignItems: "start" }}>
          <div className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-white"
              style={{ width: 60, height: 60, border: `2px solid ${GOLD}` }}
            >
              <Image src="/dr-yuvraaj-logo.png" alt="IHMH" width={52} height={52} className="object-contain" />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.2em] font-semibold" style={{ color: "#3D4A45" }}>
                INSTITUTE OF
              </p>
              <p className="text-[15px] leading-5 font-bold font-serif" style={{ color: GREEN }}>
                HORMONAL &<br />METABOLIC HEALTH
              </p>
              <p className="text-[7px] tracking-[0.14em] font-semibold mt-0.5" style={{ color: GOLD }}>
                PRECISION MEDICINE · PREVENTIVE CARE · REGENERATIVE SCIENCE
              </p>
            </div>
          </div>

          <div className="text-center" style={{ minWidth: 0 }}>
            <h1 className="font-bold font-serif tracking-wide" style={{ color: "#161D1A", fontSize: 21 }}>
              PRESCRIPTION &amp; CLINICAL PLAN
            </h1>
            <span
              className="inline-block text-white text-[10px] font-bold tracking-[0.15em] px-5 py-1 rounded-full mt-1"
              style={{ background: GREEN }}
            >
              MAIN CONSULTATION
            </span>
            <p className="mt-1.5 text-[26px] leading-7" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", color: "#161D1A" }}>
              Dr. Yuvraaj Singh
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "#28342F" }}>
              MD (Internal Medicine) &nbsp;|&nbsp; Critical Care Specialist
            </p>
            <p className="text-[9px]" style={{ color: "#4A5650" }}>
              Fellowship Trained in Endocrinology &amp; Metabolic Medicine (A4M, USA)
            </p>
          </div>

          <div className="border rounded-md bg-white divide-y self-start" style={{ borderColor: GOLD, fontSize: "9.5px" }}>
            <p className="px-2.5 py-1.5 flex justify-between gap-2">
              <span className="font-bold">PRESCRIPTION ID :</span>
              <span>{rxId}</span>
            </p>
            <p className="px-2.5 py-1.5 flex justify-between gap-2 border-t" style={{ borderColor: "#E5DFD0" }}>
              <span className="font-bold">CONSULTATION DATE :</span>
              <span>{fmtDate(consultDate)}</span>
            </p>
            <p className="px-2.5 py-1.5 flex justify-between gap-2 border-t" style={{ borderColor: "#E5DFD0" }}>
              <span className="font-bold">REPORT GENERATED :</span>
              <span>
                {generated
                  ? `${fmtDate(generated.toISOString())} | ${generated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
                  : "—"}
              </span>
            </p>
            <p className="px-2.5 py-1.5 flex items-center gap-3 border-t" style={{ borderColor: "#E5DFD0" }}>
              <span className="font-bold" style={{ color: GOLD }}>MODE :</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 border text-center leading-3" style={{ borderColor: "#98A2B3" }}>
                  {mode === "In-Clinic" || mode === "In-Person" ? "✓" : ""}
                </span>
                In-Clinic
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 border text-center leading-3" style={{ borderColor: "#98A2B3" }}>
                  {mode === "Online" ? "✓" : ""}
                </span>
                Online
              </span>
            </p>
          </div>
        </div>
        <div className="mx-6 border-b-2 mb-4" style={{ borderColor: GOLD }} />

        {/* Body — two columns */}
        <div className="grid grid-cols-2 gap-4 px-6">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">
            {/* 1. Patient demographics */}
            <div>
              <SectionHeader no={1} title="Patient Demographics" />
              <Card className="mt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <KV k="Name" v={patient?.fullName ?? ""} />
                  <KV k="Registration ID" v={patient?.patientNumber ?? ""} />
                  <KV k="Age / DOB" v={pd("dob") ? `${ageFrom(pd("dob"))} | ${fmtDate(pd("dob"))}` : ""} />
                  <KV k="Occupation" v={pd("occupation")} />
                  <KV k="Gender" v={pd("gender")} />
                  <KV k="Referred By" v={pd("referred_by")} />
                  <KV k="Contact" v={pd("contact")} />
                  <KV k="Email" v={pd("email")} />
                </div>
                <div
                  className="flex justify-between mt-3 pt-2 border-t text-[10px] font-semibold"
                  style={{ borderColor: "#E5DFD0", color: "#3D4A45" }}
                >
                  <span>Registration Date: {fmtDate(pd("registration_date"))}</span>
                  <span>Main Consultation Date: {fmtDate(consultDate)}</span>
                </div>
              </Card>
            </div>

            {/* 2. Preliminary consultation summary */}
            <div>
              <SectionHeader no={2} title="Preliminary Consultation Summary" sub="(Junior Doctor)" />
              <Card className="mt-2">
                <div
                  className="flex justify-between text-[10px] font-semibold pb-2 mb-3 border-b"
                  style={{ borderColor: "#E5DFD0", color: "#3D4A45" }}
                >
                  <span>📅 Assessment Date: {fmtDate(pd("assessment_date"))}</span>
                  <span>
                    🕐 Reviewed By: {pd("reviewed_by") || "—"}
                    {pd("reviewed_on") ? ` on ${fmtDate(pd("reviewed_on"))}` : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <MiniHeading>A. Chief Concerns Reported</MiniHeading>
                    <Bullets text={pd("chief_concerns")} />
                  </div>
                  <div>
                    <MiniHeading>B. Relevant Medical History</MiniHeading>
                    <Bullets text={pd("relevant_medical_history")} />
                    <p className="text-[10.5px] font-bold mt-2" style={{ color: "#28342F" }}>
                      Family History:
                    </p>
                    <p className="text-[10.5px]" style={{ color: "#28342F" }}>
                      {pd("family_history") || "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 3. Baseline assessment & physical exam */}
            <div>
              <SectionHeader no={3} title="Baseline Assessment & Physical Exam" sub="(Junior Doctor)" />
              <Card className="mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <MiniHeading>A. Vitals</MiniHeading>
                    <div className="space-y-1.5">
                      <KV k="Blood Pressure" v={pd("vitals_bp") ? `${pd("vitals_bp")} mmHg` : ""} />
                      <KV k="Heart Rate" v={pd("vitals_pulse") ? `${pd("vitals_pulse")} bpm` : ""} />
                      <KV k="Respiratory Rate" v={pd("vitals_rr") ? `${pd("vitals_rr")} /min` : ""} />
                      <KV k="SpO₂" v={pd("vitals_spo2") ? `${pd("vitals_spo2")} %` : ""} />
                      <KV k="Temperature" v={pd("vitals_temp") ? `${pd("vitals_temp")} °F` : ""} />
                    </div>
                  </div>
                  <div>
                    <MiniHeading>B. Anthropometrics &amp; Body Composition</MiniHeading>
                    <p className="text-[9.5px] font-semibold mb-1" style={{ color: "#3D4A45" }}>
                      📅 Measured on: {fmtDate(pd("anthro_measured_on"))}
                    </p>
                    <div className="space-y-1">
                      <KV k="Height" v={pd("vitals_height") ? `${pd("vitals_height")} cm` : ""} />
                      <KV k="Weight" v={pd("vitals_weight") ? `${pd("vitals_weight")} kg` : ""} />
                      <KV k="BMI" v={pd("anthro_bmi") ? `${pd("anthro_bmi")} kg/m²` : ""} />
                      <KV k="Body Fat %" v={pd("anthro_body_fat") ? `${pd("anthro_body_fat")} %` : ""} />
                      <KV k="Waist Circumference" v={pd("anthro_waist") ? `${pd("anthro_waist")} cm` : ""} />
                      <KV k="Hip Circumference" v={pd("anthro_hip") ? `${pd("anthro_hip")} cm` : ""} />
                      <KV k="Waist–Hip Ratio" v={pd("anthro_whr")} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t" style={{ borderColor: "#E5DFD0" }}>
                  <p className="text-[10.5px] font-bold mb-1" style={{ color: "#28342F" }}>
                    C. Systemic Exam <span className="font-normal">(Preliminary)</span>
                  </p>
                  <p className="text-[10.5px] leading-5" style={{ color: "#28342F" }}>
                    <b>CVS:</b> {pd("exam_cvs") || "—"} &nbsp;|&nbsp; <b>RS:</b> {pd("exam_rs") || "—"}
                    <br />
                    <b>P/A:</b> {pd("exam_pa") || "—"} &nbsp;|&nbsp; <b>CNS:</b> {pd("exam_cns") || "—"}
                  </p>
                </div>
              </Card>
            </div>

            {/* Treatment planning (rehab / aesthetic notes) */}
            {(ira("rehab_plan") || ira("aesthetic_plan") || ira("treatment_notes")) && (
              <div>
                <SectionHeader no={4} title="Rehab & Aesthetic Plan" />
                <Card className="mt-2 space-y-2">
                  {ira("rehab_plan") ? (
                    <p className="text-[10.5px]" style={{ color: "#28342F" }}>
                      <b>Rehabilitation:</b> {ira("rehab_plan")}
                    </p>
                  ) : null}
                  {ira("aesthetic_plan") ? (
                    <p className="text-[10.5px]" style={{ color: "#28342F" }}>
                      <b>Aesthetic:</b> {ira("aesthetic_plan")}
                    </p>
                  ) : null}
                  {ira("treatment_notes") ? (
                    <p className="text-[10.5px]" style={{ color: "#28342F" }}>
                      <b>Notes:</b> {ira("treatment_notes")}
                    </p>
                  ) : null}
                </Card>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">
            {/* 5. Main consultation */}
            <div>
              <SectionHeader no={5} title="Main Consultation with Dr. Yuvraaj Singh" />
              <Card className="mt-2 p-0 overflow-hidden">
                <div
                  className="flex flex-wrap justify-between gap-2 text-[10px] font-semibold px-4 py-2 border-b"
                  style={{ background: "#EFF3F8", borderColor: "#D8D2C2", color: "#28342F" }}
                >
                  <span>📅 Consultation Date: {fmtDate(consultDate)}</span>
                  <span>🕐 Duration: {pd("consultation_duration") ? `${pd("consultation_duration")} minutes` : "—"}</span>
                  <span>🧭 Mode: {mode || "—"}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="border rounded-md p-3" style={{ borderColor: "#C9D6E4", background: "#F4F8FC" }}>
                    <p className="text-[10.5px] font-bold mb-1.5" style={{ color: "#1D3A57" }}>
                      A. ADDITIONAL HISTORY &amp; CLINICAL NOTES <span className="font-normal">(By Dr. Yuvraaj Singh)</span>
                    </p>
                    <Bullets text={pd("additional_clinical_notes") || pd("history_presenting")} />
                  </div>
                  <div className="border rounded-md p-3" style={{ borderColor: "#C9D6E4", background: "#F4F8FC" }}>
                    <p className="text-[10.5px] font-bold mb-1.5" style={{ color: "#1D3A57" }}>
                      B. CLINICAL IMPRESSION
                    </p>
                    <p className="text-[10.5px] italic leading-4" style={{ color: "#28342F" }}>
                      {fp("clinical_impression") || fp("diagnosis") || "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 6. Investigations ordered */}
            <div>
              <SectionHeader no={6} title="Investigations Ordered" />
              <Card className="mt-2">
                {(() => {
                  const groups = groupSelectedByPanel(parseSelectedTests(ts("selected_tests")))
                  if (groups.length === 0)
                    return <p className="text-[11px]" style={{ color: "#98A2B3" }}>No investigations ordered.</p>
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {groups.map(({ panel, tests }) => (
                        <div key={panel.id} className="border rounded-md p-2.5" style={{ borderColor: GOLD, background: "#FBF6EC" }}>
                          <p className="text-[10px] font-bold tracking-wide mb-1.5" style={{ color: GREEN }}>
                            {panel.name}
                          </p>
                          <ul className="space-y-0.5">
                            {tests.map((t) => (
                              <li key={t} className="flex items-start gap-1.5 text-[10.5px] leading-4" style={{ color: "#28342F" }}>
                                <span style={{ color: GOLD }}>•</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )
                })()}
                <p className="text-[9.5px] font-medium mt-2.5 flex items-center gap-1.5" style={{ color: "#3D4A45" }}>
                  🔒 {ts("sample_collection") || "Sample collection at IHMH Lab"} &nbsp;|&nbsp;{" "}
                  {ts("report_turnaround") || "Reports in 48–72 hrs"}
                  {ts("priority") ? <> &nbsp;|&nbsp; Priority: {ts("priority")}</> : null}
                </p>
                {ts("test_notes") ? (
                  <p className="text-[9.5px] mt-1" style={{ color: "#3D4A45" }}>
                    {ts("test_notes")}
                  </p>
                ) : null}
              </Card>
            </div>

            {/* 7. Initiation plan */}
            <div>
              <SectionHeader no={7} title="Initiation Plan" sub="(To Begin After Today)" />
              <Card className="mt-2 space-y-3">
                <div>
                  <p className="text-[10.5px] font-bold mb-1.5" style={{ color: "#28342F" }}>
                    A. SUPPLEMENTS &amp; NUTRACEUTICALS
                  </p>
                  <RxTable
                    columns={[
                      { key: "product", label: "Product / Supplement" },
                      { key: "dose", label: "Dose" },
                      { key: "timing", label: "Timing" },
                      { key: "duration", label: "Duration" },
                    ]}
                    rows={supplements}
                  />
                </div>
                {fp("medications") ? (
                  <div>
                    <p className="text-[10.5px] font-bold mb-1" style={{ color: "#28342F" }}>
                      MEDICATIONS
                    </p>
                    <Bullets text={fp("medications")} />
                  </div>
                ) : null}
                <div>
                  <p className="text-[10.5px] font-bold mb-1.5" style={{ color: "#28342F" }}>
                    B. INFUSION / INJECTABLE <span className="font-normal">(Scheduled at Clinic)</span>
                  </p>
                  <RxTable
                    columns={[
                      { key: "therapy", label: "Therapy" },
                      { key: "dose", label: "Dose" },
                      { key: "schedule", label: "Schedule" },
                      { key: "purpose", label: "Purpose" },
                    ]}
                    rows={infusions}
                  />
                </div>
              </Card>
            </div>

          </div>
        </div>

        {/* 8. Follow-up + signature */}
        <div className="px-6 mt-4" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
          <div>
            <SectionHeader no={8} title="Follow-up & Next Steps" />
            <Card className="mt-2">
              <div className="grid grid-cols-[200px_1fr] gap-4">
                <div>
                  <p className="text-[10.5px] font-bold" style={{ color: "#28342F" }}>
                    Review Lab Reports With:
                  </p>
                  <p className="text-[10.5px] font-semibold mt-1" style={{ color: "#28342F" }}>
                    📅 {fp("follow_up_with") || "Dr. Yuvraaj Singh"} on
                  </p>
                  <p className="text-[10.5px] font-bold" style={{ color: GREEN }}>
                    {fmtDate(fp("follow_up_date"))}{" "}
                    <span className="font-normal" style={{ color: "#3D4A45" }}>
                      (or once reports available)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10.5px] font-bold mb-1" style={{ color: "#28342F" }}>
                    Next Steps:
                  </p>
                  <Bullets text={fp("follow_up_notes")} checks />
                </div>
              </div>
            </Card>
          </div>

          <Card className="self-end text-center py-3">
            <p className="text-[24px] leading-7" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", color: "#161D1A" }}>
              Yuvraaj Singh
            </p>
            <div className="border-t mx-4 my-1.5" style={{ borderColor: "#D8D2C2" }} />
            <p className="text-[11px] font-bold" style={{ color: "#161D1A" }}>
              Dr. Yuvraaj Singh
            </p>
            <p className="text-[8.5px]" style={{ color: "#3D4A45" }}>
              MD (Internal Medicine)
              <br />
              Critical Care Specialist
              <br />
              Fellowship in Endocrinology &amp; Metabolic Medicine (A4M, USA)
              <br />
              KMC Reg. No.: {CLINIC.kmcReg}
            </p>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-4 text-white text-[9.5px]" style={{ background: "#161D1A" }}>
          <div className="flex items-center justify-between gap-4 px-6 py-3 flex-wrap">
            <span>📞 {CLINIC.phone}</span>
            <span>🌐 {CLINIC.website}</span>
            <span>✉️ {CLINIC.email}</span>
            <span>📍 {CLINIC.address}</span>
          </div>
          <p className="text-center italic pb-2 text-[8.5px]" style={{ color: "#C9C2B0" }}>
            This prescription is confidential and intended solely for the patient named above.
          </p>
        </div>
      </div>
      </div>

      {/* Print rules: show only the sheet, keep colors */}
      <style>{`
        .rx-root {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          @page {
            size: A4;
            margin: 6mm;
          }
          body * {
            visibility: hidden;
          }
          .rx-root,
          .rx-root * {
            visibility: visible;
          }
          .rx-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 1040px !important;
            zoom: 0.71;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
