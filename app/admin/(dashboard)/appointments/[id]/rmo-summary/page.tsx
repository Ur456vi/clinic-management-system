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

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { AlertCircle, ArrowLeft, Loader2, PlayCircle, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RMO_FIELDS, SECTION_KEY, SECTION_LABEL, SECTION_ORDER } from "@/lib/rmo-fields"

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
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-3" />
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
  const dataSections = SECTION_ORDER.filter((sec) =>
    RMO_FIELDS.some((f) => f.s === sec && val(f).trim() !== ""),
  )
  const current = dataSections.includes(activeTab) ? activeTab : dataSections[0]

  return (
    <div className="flex flex-col gap-6 max-w-[1000px]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/yuvraaj-appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#2E37A4] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Appointments
          </Link>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">RMO Summary</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#667085] dark:text-[#94A3B8]">
            <User className="h-4 w-4" />
            {data.patient ? (
              <Link
                href={`/admin/patients/${data.patient.id}`}
                className="font-medium text-[#101828] dark:text-[#F9FAFB] hover:text-[#2E37A4]"
              >
                {data.patient.fullName}
              </Link>
            ) : (
              <span>Unknown patient</span>
            )}
            {data.patient ? (
              <span className="text-[#98A2B3] dark:text-[#94A3B8]">#{data.patient.patientNumber}</span>
            ) : null}
            {data.rmoSummary ? (
              <span className="text-[#98A2B3] dark:text-[#94A3B8]">
                · Captured {new Date(data.rmoSummary.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            ) : null}
          </div>
        </div>
        <Link href={`/admin/appointments/${appointmentId}/consultation`}>
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white flex items-center gap-2">
            <PlayCircle className="h-4 w-4" /> Start appointment
          </Button>
        </Link>
      </div>

      {/* Latest vitals */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Latest Vitals</h2>
        {latestVital === undefined ? (
          <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" />
            Loading…
          </div>
        ) : latestVital === null ? (
          <p className="text-sm text-[#667085] dark:text-[#94A3B8]">No vitals recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <VitalStat label="Blood pressure" value={latestVital.systolic && latestVital.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : "—"} unit="mmHg" />
            <VitalStat label="Heart rate" value={latestVital.heartRate ?? "—"} unit="bpm" />
            <VitalStat label="Weight" value={latestVital.weightKg ?? "—"} unit="kg" />
            <VitalStat label="Temp" value={latestVital.temperatureF ?? "—"} unit="°F" />
            <VitalStat label="SpO₂" value={latestVital.spo2 ?? "—"} unit="%" />
            <VitalStat
              label="Recorded"
              value={new Date(latestVital.recordedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              unit={latestVital.recordedBy?.fullName ?? ""}
            />
          </div>
        )}
      </div>

      {/* RMO intake sections */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">RMO Consultation Intake</h2>
        {!data.rmoSummary || dataSections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D0D5DD] dark:border-[#374151] p-6 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
            No RMO intake recorded for this patient yet.
          </div>
        ) : (
          <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
            <div className="flex flex-wrap gap-1.5 p-3 bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
              {dataSections.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveTab(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    current === s
                      ? "bg-[#2E37A4] text-white"
                      : "text-[#667085] dark:text-[#94A3B8] hover:bg-white hover:text-[#101828]"
                  }`}
                >
                  {SECTION_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="p-5">
              <dl className="divide-y divide-[#EAECF0] dark:divide-[#374151] -my-1">
                {RMO_FIELDS.filter((f) => f.s === current && val(f).trim() !== "").map((f) => (
                  <div key={f.n} className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-3">
                    <dt className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">{f.l}</dt>
                    <dd className="sm:col-span-2 text-sm text-[#101828] dark:text-[#F9FAFB] whitespace-pre-wrap break-words">
                      {val(f)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
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
