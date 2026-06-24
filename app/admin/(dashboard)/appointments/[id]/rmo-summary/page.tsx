"use client"

/**
 * RMO Summary — read-only review screen for the doctor.
 *
 * Reached from the appointment kebab -> "RMO Summary" (Dr. Yuvraaj's
 * appointment list). Shows the patient's most recent RMO intake, section by
 * section, plus the latest vitals reading — without starting the appointment
 * (no consultation row is created; data comes from the read-only
 * /api/appointments/[id]/rmo-summary endpoint).
 */

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AlertCircle, ArrowLeft, Loader2, PlayCircle, Printer, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RMO_FIELDS, SECTION_KEY, SECTION_LABEL, SECTION_ORDER } from "@/lib/rmo-fields"

/** Print-sheet palette — matches the prescription letterhead. */
const SHEET_INK = "#1C2B27"
const SHEET_GREEN = "#1F3D33"
const SHEET_GOLD = "#B08D44"

function ageFrom(dob: string): string {
  if (!dob) return ""
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return ""
  const years = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
  return years > 0 && years < 130 ? `${years} yrs` : ""
}

interface VitalReading {
  id: string
  systolic: number | null
  diastolic: number | null
  heartRate: number | null
  weightKg: number | null
  temperatureF: number | null
  spo2: number | null
  notes: string | null
  recordedAt: string
  recordedBy: { id: string; fullName: string } | null
}

interface RmoSummaryApi {
  patient: { id: string; fullName: string; patientNumber: string } | null
  rmoSummary: {
    id: string
    status: string
    createdAt: string
    sections?: Record<string, Record<string, unknown>> | null
  } | null
}

export default function RmoSummaryPage() {
  const params = useParams<{ id: string }>()
  const appointmentId = params.id

  const [data, setData] = useState<RmoSummaryApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("")
  const [latestVital, setLatestVital] = useState<VitalReading | null | undefined>(undefined)
  // Portal target (document.body) only exists after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setError(null)
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/rmo-summary`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json?.data ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load RMO summary")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  const patientId = data?.patient?.id

  const fetchVitals = useCallback(async () => {
    if (!patientId) return
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals?limit=1`, {
        credentials: "include",
      })
      if (!res.ok) {
        setLatestVital(null)
        return
      }
      const json = await res.json()
      const rows: VitalReading[] = Array.isArray(json?.data) ? json.data : []
      setLatestVital(rows[0] ?? null)
    } catch {
      setLatestVital(null)
    }
  }, [patientId])

  useEffect(() => {
    void fetchVitals()
  }, [fetchVitals])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading RMO summary…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Couldn&apos;t load RMO summary</p>
        <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{error}</p>
        <Link href="/admin/yuvraaj-appointments">
          <Button variant="outline">Back to appointments</Button>
        </Link>
      </div>
    )
  }

  const secs = (data.rmoSummary?.sections ?? {}) as Record<string, Record<string, unknown>>
  const val = (f: { s: string; n: string }) => {
    const v = secs?.[SECTION_KEY[f.s]]?.[f.n]
    return v == null ? "" : String(v)
  }
  // Sections that actually have captured data — used by the print sheet
  // (concise, filled-only). The on-screen review below shows ALL sections.
  const dataSections = SECTION_ORDER.filter((sec) =>
    RMO_FIELDS.some((f) => f.s === sec && val(f).trim() !== ""),
  )
  const current = SECTION_ORDER.includes(activeTab) ? activeTab : SECTION_ORDER[0]

  // Drug allergies — surfaced as a prominent banner above the summary so the
  // doctor can't miss them. Sourced from the RMO intake's "Known Allergies".
  const allergies = val({ s: "medical_history", n: "medical_history__known_allergies" }).trim()

  // Group a section's visible fields by subsection (registry `sub`), in order.
  // Filled-only — used by the print sheet, which should stay concise.
  const groupBySub = (sec: string) => {
    const visible = RMO_FIELDS.filter((f) => f.s === sec && val(f).trim() !== "")
    const groups: { sub: string; fields: typeof RMO_FIELDS }[] = []
    for (const f of visible) {
      const sub = f.sub ?? ""
      const last = groups[groups.length - 1]
      if (last && last.sub === sub) last.fields.push(f)
      else groups.push({ sub, fields: [f] })
    }
    return groups
  }

  // Group ALL of a section's fields by subsection — used by the on-screen
  // review so every question shows (answered or not), like the consultation
  // Summary tab. Empty values render as "Not provided".
  const groupAllBySub = (sec: string) => {
    const groups: { sub: string; fields: typeof RMO_FIELDS }[] = []
    for (const f of RMO_FIELDS.filter((x) => x.s === sec)) {
      const sub = f.sub ?? ""
      const last = groups[groups.length - 1]
      if (last && last.sub === sub) last.fields.push(f)
      else groups.push({ sub, fields: [f] })
    }
    return groups
  }
  const sectionFields = (sec: string) => RMO_FIELDS.filter((f) => f.s === sec)
  const sectionAnswered = (sec: string) =>
    sectionFields(sec).filter((f) => val(f).trim() !== "").length

  const sex = val({ s: "demographics", n: "demographics__sex" })
  const dob = val({ s: "demographics", n: "demographics__date_of_birth" })
  const occupation = val({ s: "demographics", n: "demographics__occupation" })
  const capturedOn = data.rmoSummary
    ? new Date(data.rmoSummary.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—"
  const v = latestVital && typeof latestVital === "object" ? latestVital : null

  return (
    <div className="flex flex-col gap-6 max-w-[1000px]">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/admin/yuvraaj-appointments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#6B2B26]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Appointments
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print summary
          </Button>
          <Link href={`/admin/appointments/${appointmentId}/consultation`}>
            <Button className="bg-[#6B2B26] hover:bg-[#54201D] text-white flex items-center gap-2">
              <PlayCircle className="h-4 w-4" /> Start appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* ──────────────────── On-screen interactive view ──────────────────── */}
      <div className="rmo-screen flex flex-col gap-6">
        {/* Identity header */}
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">RMO Consultation Summary</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#667085] dark:text-[#94A3B8]">
            <User className="h-4 w-4" />
            {data.patient ? (
              <Link
                href={`/admin/patients/${data.patient.id}`}
                className="font-medium text-[#101828] dark:text-[#F9FAFB] hover:text-[#6B2B26]"
              >
                {data.patient.fullName}
              </Link>
            ) : (
              <span>Unknown patient</span>
            )}
            {data.patient ? (
              <span className="text-[#98A2B3] dark:text-[#94A3B8]">#{data.patient.patientNumber}</span>
            ) : null}
            <span className="text-[#98A2B3] dark:text-[#94A3B8]">· Captured {capturedOn}</span>
          </div>
        </div>

        {/* Drug / allergy alert — big + bold, above the summary */}
        <div
          className={`rounded-xl border-2 px-5 py-4 ${
            allergies
              ? "border-[#FDA29B] bg-[#FEF3F2] dark:border-[#7A271A] dark:bg-[#55160C]"
              : "border-[#EAECF0] bg-[#F9FAFB] dark:border-[#374151] dark:bg-[#111827]"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-6 w-6 flex-shrink-0 ${allergies ? "text-[#D92D20]" : "text-[#98A2B3]"}`} />
            <span
              className={`text-sm font-bold uppercase tracking-wide ${
                allergies ? "text-[#B42318]" : "text-[#667085] dark:text-[#94A3B8]"
              }`}
            >
              Drug Allergies
            </span>
          </div>
          <p
            className={`mt-1 text-2xl font-extrabold leading-tight whitespace-pre-wrap break-words ${
              allergies ? "text-[#B42318]" : "text-[#475467] dark:text-[#CBD5E1]"
            }`}
          >
            {allergies || "No known drug allergies recorded"}
          </p>
        </div>

        {/* Latest vitals */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Latest Vitals</h2>
          {latestVital === undefined ? (
            <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" />
              Loading…
            </div>
          ) : !v ? (
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">No vitals recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <VitalStat label="Blood pressure" value={v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : "—"} unit="mmHg" />
              <VitalStat label="Heart rate" value={v.heartRate ?? "—"} unit="bpm" />
              <VitalStat label="Weight" value={v.weightKg ?? "—"} unit="kg" />
              <VitalStat label="Temp" value={v.temperatureF ?? "—"} unit="°F" />
              <VitalStat label="SpO₂" value={v.spo2 ?? "—"} unit="%" />
              <VitalStat
                label="Recorded"
                value={new Date(v.recordedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                unit={v.recordedBy?.fullName ?? ""}
              />
            </div>
          )}
        </div>

        {/* RMO intake sections (tabbed) */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">RMO Consultation Intake</h2>
          {!data.rmoSummary ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] dark:border-[#374151] p-6 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
              No RMO intake recorded for this patient yet.
            </div>
          ) : (
            <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
              {/* Sub-tab strip — every section, with a dot flagging captured data. */}
              <div className="flex flex-wrap gap-1.5 p-3 bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
                {SECTION_ORDER.map((s) => {
                  const active = current === s
                  const filled = RMO_FIELDS.some((f) => f.s === s && val(f).trim() !== "")
                  return (
                    <button
                      key={s}
                      onClick={() => setActiveTab(s)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? "bg-[#6B2B26] text-white"
                          : "text-[#667085] dark:text-[#94A3B8] hover:bg-white hover:text-[#101828]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          filled
                            ? active
                              ? "bg-white"
                              : "bg-[#0E8C6A]"
                            : active
                              ? "bg-white/40"
                              : "bg-[#D0D5DD] dark:bg-[#475569]"
                        }`}
                      />
                      {SECTION_LABEL[s]}
                    </button>
                  )
                })}
              </div>

              {/* Active panel — answered badge + grouped fields, blanks shown. */}
              <div className="p-5">
                {(() => {
                  const total = sectionFields(current).length
                  const answered = sectionAnswered(current)
                  const complete = answered === total && total > 0
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                          {SECTION_LABEL[current]}
                        </h3>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={
                            complete
                              ? { background: "#E4F3EC", color: "#0E8C6A" }
                              : answered === 0
                                ? { background: "#F2F4F7", color: "#98A2B3" }
                                : { background: "#FEF6E7", color: "#B25E09" }
                          }
                        >
                          {answered} / {total} answered
                        </span>
                      </div>
                      <div className="flex flex-col gap-6">
                        {groupAllBySub(current).map((g, gi) => (
                          <div key={gi}>
                            {g.sub ? (
                              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B2B26] dark:text-[#A5B4FC] mb-1.5">
                                {g.sub}
                              </h4>
                            ) : null}
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                              {g.fields.map((f) => {
                                const value = val(f).trim()
                                return (
                                  <div
                                    key={f.n}
                                    className="flex flex-col gap-0.5 py-2.5 border-b border-[#EAECF0] dark:border-[#374151]"
                                  >
                                    <dt className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">{f.l}</dt>
                                    <dd className="text-sm whitespace-pre-wrap break-words">
                                      {value ? (
                                        <span className="text-[#101828] dark:text-[#F9FAFB]">{value}</span>
                                      ) : (
                                        <span className="italic text-[#98A2B3] dark:text-[#64748B]">Not provided</span>
                                      )}
                                    </dd>
                                  </div>
                                )
                              })}
                            </dl>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Print-only A4 sheet — portaled to <body> so it escapes the
          dashboard's h-screen / overflow chrome and paginates cleanly. ── */}
      {mounted
        ? createPortal(
            <div className="rmo-sheet-portal">
              <div
                className="rmo-sheet"
                style={{ color: "#101828", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif" }}
              >
        {/* Letterhead */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            borderBottom: `2px solid ${SHEET_GOLD}`,
            paddingBottom: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                border: `2px solid ${SHEET_GOLD}`,
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Image src="/dr-yuvraaj-logo.png" alt="IHMH" width={40} height={40} style={{ objectFit: "contain" }} />
            </div>
            <div>
              <p style={{ fontSize: 8, letterSpacing: "0.18em", fontWeight: 600, color: "#3D4A45", margin: 0 }}>INSTITUTE OF</p>
              <p style={{ fontSize: 13, lineHeight: 1.1, fontWeight: 700, color: SHEET_GREEN, margin: 0 }}>
                HORMONAL &amp; METABOLIC HEALTH
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: SHEET_INK, margin: 0 }}>RMO Consultation Summary</p>
            <p style={{ fontSize: 9, color: "#4A5650", margin: 0 }}>Preliminary intake — RMO / Junior Doctor</p>
          </div>
        </div>

        {/* Patient strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "2px 24px",
            fontSize: 10.5,
            border: "1px solid #D8D2C2",
            borderRadius: 5,
            padding: "8px 12px",
            marginBottom: 12,
          }}
        >
          <div>
            <b>Patient:</b> {data.patient?.fullName ?? "—"}
          </div>
          <div>
            <b>Reg #:</b> {data.patient?.patientNumber ?? "—"}
          </div>
          <div>
            <b>Sex / Age:</b> {[sex, ageFrom(dob)].filter(Boolean).join(" · ") || "—"}
          </div>
          <div>
            <b>Captured:</b> {capturedOn}
          </div>
          {occupation ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <b>Occupation:</b> {occupation}
            </div>
          ) : null}
        </div>

        {/* Allergy banner */}
        <div
          style={{
            border: `1.5px solid ${allergies ? "#D92D20" : "#D8D2C2"}`,
            background: allergies ? "#FEF3F2" : "#F9FAFB",
            borderRadius: 6,
            padding: "8px 12px",
            marginBottom: 12,
            breakInside: "avoid",
          }}
        >
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: allergies ? "#B42318" : "#667085",
              margin: 0,
            }}
          >
            Drug Allergies
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
              color: allergies ? "#B42318" : "#475467",
              margin: "2px 0 0",
              whiteSpace: "pre-wrap",
            }}
          >
            {allergies || "No known drug allergies recorded"}
          </p>
        </div>

        {/* Latest vitals */}
        {v ? (
          <div style={{ marginBottom: 12, breakInside: "avoid" }}>
            <SheetBar>Latest Vitals</SheetBar>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 20px", fontSize: 10.5, padding: "6px 2px 0" }}>
              <span><b>BP:</b> {v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic} mmHg` : "—"}</span>
              <span><b>HR:</b> {v.heartRate != null ? `${v.heartRate} bpm` : "—"}</span>
              <span><b>Weight:</b> {v.weightKg != null ? `${v.weightKg} kg` : "—"}</span>
              <span><b>Temp:</b> {v.temperatureF != null ? `${v.temperatureF} °F` : "—"}</span>
              <span><b>SpO₂:</b> {v.spo2 != null ? `${v.spo2} %` : "—"}</span>
              <span style={{ color: "#5A655F" }}>
                Recorded {new Date(v.recordedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                {v.recordedBy?.fullName ? ` · ${v.recordedBy.fullName}` : ""}
              </span>
            </div>
          </div>
        ) : null}

        {/* Intake sections */}
        {!data.rmoSummary || dataSections.length === 0 ? (
          <p style={{ fontSize: 11, color: "#667085" }}>No RMO intake recorded for this patient yet.</p>
        ) : (
          dataSections.map((s) => (
            <div key={s} style={{ marginBottom: 10, breakInside: "avoid" }}>
              <SheetBar>{SECTION_LABEL[s]}</SheetBar>
              {groupBySub(s).map((g, gi) => (
                <div key={gi} style={{ marginTop: 6, breakInside: "avoid" }}>
                  {g.sub ? (
                    <p style={{ fontSize: 10, fontWeight: 700, color: SHEET_GREEN, margin: "4px 0 2px" }}>{g.sub}</p>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1px 18px" }}>
                    {g.fields.map((f) => (
                      <div
                        key={f.n}
                        style={{ display: "flex", gap: 6, fontSize: 10, lineHeight: "15px", padding: "1.5px 0", breakInside: "avoid" }}
                      >
                        <span style={{ color: "#5A655F", fontWeight: 600, flex: "0 0 44%" }}>{f.l}</span>
                        <span style={{ color: "#101828", flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{val(f)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 8,
            borderTop: "1px solid #D8D2C2",
            fontSize: 8.5,
            color: "#667085",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span>Confidential — for the named patient&apos;s care team only.</span>
          <span>RMO Consultation Summary · Captured {capturedOn}</span>
        </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Print rules: print only the portaled A4 sheet; hide every other
          top-level body node (dashboard chrome + the on-screen view). */}
      <style>{`
        .rmo-sheet-portal { display: none; }
        .rmo-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { size: A4; margin: 12mm; }
          body > *:not(.rmo-sheet-portal) { display: none !important; }
          .rmo-sheet-portal { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function SheetBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: SHEET_INK,
        color: "#fff",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 3,
        breakInside: "avoid",
      }}
    >
      {children}
    </div>
  )
}

function VitalStat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{label}</span>
      <span className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">
        {value}
        {unit ? <span className="text-xs font-normal text-[#98A2B3] dark:text-[#94A3B8] ml-1">{unit}</span> : null}
      </span>
    </div>
  )
}
