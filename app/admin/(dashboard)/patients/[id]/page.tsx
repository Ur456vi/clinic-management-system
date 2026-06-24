"use client"

/**
 * Patient detail — 360° patient view (operations-tracker layout) + edit.
 *
 * Reuses the app's dashboard chrome (sidebar + top bar). The view is a
 * patient header band, KPI cards and a tabbed body (Clinical Summary /
 * Program & Refills / Consultations / Labs / Follow-Ups / Billing / Vitals)
 * driven by real data: /api/patients/[id] (profile), /api/appointments
 * (bookings), /api/patients/[id]/vitals, and /api/patients/[id]/timeline
 * (unified consultation/lab/plan/invoice feed). The Program + Refill panels
 * are representative until backing models exist (flagged in-UI).
 *
 * ?edit=1 switches to the in-place edit form (PATCH /api/patients/[id]).
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  CalendarClock,
  ShieldCheck,
  Pencil,
  Loader2,
  AlertCircle,
  Save,
  X,
  Stethoscope,
  FlaskConical,
  Syringe,
  Pill,
  RefreshCw,
  Activity,
  CreditCard,
  ClipboardList,
  MoreVertical,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import RefillManager from "@/components/admin/RefillManager"
import LabReportUploadModal from "@/components/admin/LabReportUploadModal"

/* ── palette (IHMH green / gold accents) ─────────────────────────── */
const GREEN = "#1F3D33"
const GOLD = "#B0852C"
const INK = "#16302A"

type Status = "ACTIVE" | "INACTIVE" | "ARCHIVED"

interface PatientApi {
  id: string
  patientNumber: string
  fullName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  sex: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED" | null
  occupation: string | null
  placeOfResidence: string | null
  address: string | null
  status: Status
  createdAt: string
  updatedAt: string
}

type ApptStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

interface ActivityAppt {
  id: string
  startsAt: string
  status: ApptStatus
  reason: string | null
  staff: { id: string; fullName: string; specialization: string | null } | null
  department: { id: string; name: string } | null
}

type TimelineEvent = {
  id: string
  type: "consultation" | "labResult" | "treatmentPlan" | "appointment" | "invoice"
  occurredAt: string
  summary: string
  ref: { id: string } & Record<string, unknown>
}

const APPT_STATUS_STYLE: Record<ApptStatus, { label: string; cls: string }> = {
  REQUESTED: { label: "Requested", cls: "bg-[#FFFAEB] text-[#B54708]" },
  CONFIRMED: { label: "Confirmed", cls: "bg-[#E4F3EC] text-[#0E8C6A]" },
  COMPLETED: { label: "Completed", cls: "bg-[#ECFDF3] text-[#027A48]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#FEF3F2] text-[#B42318]" },
  NO_SHOW: { label: "No show", cls: "bg-[#F2F4F7] text-[#475467]" },
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

type VitalFormState = {
  systolic: string
  diastolic: string
  heartRate: string
  weightKg: string
  temperatureF: string
  spo2: string
  notes: string
}

const EMPTY_VITAL_FORM: VitalFormState = {
  systolic: "",
  diastolic: "",
  heartRate: "",
  weightKg: "",
  temperatureF: "",
  spo2: "",
  notes: "",
}

type FormState = {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  sex: "" | "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
  occupation: string
  placeOfResidence: string
  address: string
  status: Status
}

function patientToForm(p: PatientApi): FormState {
  return {
    fullName: p.fullName ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? "",
    sex: p.sex ?? "",
    occupation: p.occupation ?? "",
    placeOfResidence: p.placeOfResidence ?? "",
    address: p.address ?? "",
    status: p.status,
  }
}

function formToPatch(f: FormState) {
  const optional = (v: string) => (v.trim() === "" ? undefined : v.trim())
  return {
    fullName: f.fullName.trim(),
    email: optional(f.email),
    phone: optional(f.phone),
    dateOfBirth: optional(f.dateOfBirth),
    sex: f.sex === "" ? undefined : f.sex,
    occupation: optional(f.occupation),
    placeOfResidence: optional(f.placeOfResidence),
    address: optional(f.address),
    status: f.status,
  }
}

function fmtDate(v: string | null, withTime = false): string {
  if (!v) return "—"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return "—"
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  return withTime ? `${date} • ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}` : date
}

function ageFrom(dob: string | null): string {
  if (!dob) return "—"
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return "—"
  const y = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${y} yrs`
}

type PlanItemApi = {
  id: string
  kind: string
  name: string
  dose: string | null
  frequency: string | null
  durationDays: number | null
  sequence: number
}
type PlanApi = {
  id: string
  title: string
  status: string
  signedAt: string | null
  createdAt: string
  items: PlanItemApi[]
}

const TABS = ["Clinical Summary", "Program & Refills", "Consultations", "Labs", "Follow-Ups", "Billing", "Vitals"]

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const search = useSearchParams()
  const router = useRouter()
  const editing = search?.get("edit") === "1"

  const [patient, setPatient] = useState<PatientApi | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [activity, setActivity] = useState<ActivityAppt[] | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [openRefills, setOpenRefills] = useState(0)
  const [plan, setPlan] = useState<PlanApi | null | undefined>(undefined)
  const [uploadLab, setUploadLab] = useState<{ id: string; name: string; hasReport: boolean } | null>(null)
  const [latestVital, setLatestVital] = useState<VitalReading | null | undefined>(undefined)
  const [vitalForm, setVitalForm] = useState<VitalFormState>(EMPTY_VITAL_FORM)
  const [vitalOpen, setVitalOpen] = useState(false)
  const [vitalSaving, setVitalSaving] = useState(false)
  const [tab, setTab] = useState("Clinical Summary")

  const fetchVitals = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}/vitals?limit=1`, { credentials: "include" })
      if (!res.ok) return setLatestVital(null)
      const json = await res.json()
      const rows: VitalReading[] = Array.isArray(json?.data) ? json.data : []
      setLatestVital(rows[0] ?? null)
    } catch {
      setLatestVital(null)
    }
  }, [id])

  const recordVital = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (vitalSaving) return
      const num = (v: string) => (v.trim() === "" ? undefined : Number(v))
      const payload = {
        systolic: num(vitalForm.systolic),
        diastolic: num(vitalForm.diastolic),
        heartRate: num(vitalForm.heartRate),
        weightKg: num(vitalForm.weightKg),
        temperatureF: num(vitalForm.temperatureF),
        spo2: num(vitalForm.spo2),
        notes: vitalForm.notes.trim() === "" ? undefined : vitalForm.notes.trim(),
      }
      if (![payload.systolic, payload.diastolic, payload.heartRate, payload.weightKg, payload.temperatureF, payload.spo2].some((x) => x !== undefined)) {
        notify.error("Enter at least one measurement")
        return
      }
      setVitalSaving(true)
      try {
        const res = await fetch(`/api/patients/${id}/vitals`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => null)
          throw new Error(j?.error?.message ?? "Couldn't save vitals")
        }
        notify.success("Vitals recorded")
        setVitalForm(EMPTY_VITAL_FORM)
        setVitalOpen(false)
        await fetchVitals()
      } catch (err) {
        notify.error("Couldn't save vitals", { description: err instanceof Error ? err.message : "Unknown error" })
      } finally {
        setVitalSaving(false)
      }
    },
    [id, vitalForm, vitalSaving, fetchVitals],
  )

  const fetchOne = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/patients/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data: PatientApi = json?.data ?? json
      setPatient(data)
      setForm(patientToForm(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patient")
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/appointments?patientId=${id}&limit=50`, { credentials: "include" })
      if (!res.ok) return setActivity([])
      const json = await res.json()
      const rows: ActivityAppt[] = Array.isArray(json?.data) ? json.data : []
      rows.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      setActivity(rows)
    } catch {
      setActivity([])
    }
  }, [id])

  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/patients/${id}/timeline?limit=100`, { credentials: "include" })
      if (!res.ok) return
      const json = await res.json()
      setEvents(json?.data?.items ?? json?.items ?? json?.data ?? [])
    } catch {
      /* timeline optional */
    }
  }, [id])

  // Open the lab report PDF in a new tab via a short-lived presigned URL.
  const viewLabReport = useCallback(async (labId: string) => {
    try {
      const res = await fetch(`/api/lab-results/${labId}/attachment`, { credentials: "include" })
      if (!res.ok) throw new Error()
      const json = await res.json()
      const url = json?.data?.downloadUrl ?? json?.data?.url
      if (!url) throw new Error()
      window.open(url, "_blank", "noopener")
    } catch {
      notify.error("Couldn't open the report")
    }
  }, [])

  // Open refill requests = those still awaiting fulfilment (PENDING/APPROVED).
  // There's no per-refill due-date model yet, so the KPI counts open requests
  // rather than a date window.
  const fetchRefills = useCallback(async () => {
    try {
      const res = await fetch(`/api/refills?patientId=${id}&limit=100`, { credentials: "include" })
      if (!res.ok) return setOpenRefills(0)
      const json = await res.json()
      const rows: { status: string }[] = Array.isArray(json?.data) ? json.data : []
      setOpenRefills(rows.filter((r) => r.status === "PENDING" || r.status === "APPROVED").length)
    } catch {
      setOpenRefills(0)
    }
  }, [id])

  // Latest SIGNED treatment plan drives the "Prescribed Program" card.
  const fetchPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/treatment-plans?patientId=${id}&status=SIGNED&limit=10`, { credentials: "include" })
      if (!res.ok) return setPlan(null)
      const json = await res.json()
      const rows: PlanApi[] = Array.isArray(json?.data) ? json.data : []
      // Most recently signed plan is the active program (list is newest-first).
      setPlan(rows[0] ?? null)
    } catch {
      setPlan(null)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchOne()
    void fetchActivity()
    void fetchVitals()
    void fetchTimeline()
    void fetchRefills()
    void fetchPlan()
  }, [fetchOne, fetchActivity, fetchVitals, fetchTimeline, fetchRefills, fetchPlan])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form || saving) return
    setSaving(true)
    setFieldErrors({})
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formToPatch(form)),
      })
      const json = await res.json()
      if (!res.ok) {
        const issues = json?.error?.issues
        if (Array.isArray(issues)) {
          const map: Record<string, string> = {}
          for (const issue of issues) {
            const path = Array.isArray(issue.path) ? issue.path.join(".") : ""
            if (path) map[path] = issue.message
          }
          setFieldErrors(map)
        }
        throw new Error(json?.error?.message ?? "Save failed")
      }
      notify.success("Patient updated")
      router.push(`/admin/patients/${id}`)
      await fetchOne()
    } catch (err) {
      notify.error("Couldn't save patient", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setSaving(false)
    }
  }

  const byType = useMemo(() => {
    const g = { consultation: [], labResult: [], treatmentPlan: [], appointment: [], invoice: [] } as Record<TimelineEvent["type"], TimelineEvent[]>
    for (const e of events) g[e.type].push(e)
    return g
  }, [events])

  // Derived "Prescribed Program" metrics from the active signed plan. Program
  // length comes from the longest item duration (falls back to 12 weeks when
  // the plan items carry no duration); the week + progress are from sign date.
  const program = useMemo(() => {
    if (!plan) return null
    const items = [...(plan.items ?? [])].sort((a, b) => a.sequence - b.sequence)
    const maxDuration = items.reduce((m, it) => Math.max(m, it.durationDays ?? 0), 0)
    const totalWeeks = maxDuration > 0 ? Math.ceil(maxDuration / 7) : 12
    const start = new Date(plan.signedAt ?? plan.createdAt).getTime()
    const daysElapsed = Math.max(0, Math.floor((Date.now() - start) / 86400000))
    const totalDays = totalWeeks * 7
    const weekNo = Math.max(1, Math.min(totalWeeks, Math.floor(daysElapsed / 7) + 1))
    const pct = totalDays > 0 ? Math.max(0, Math.min(100, Math.round((daysElapsed / totalDays) * 100))) : 0
    return { title: plan.title, items, totalWeeks, weekNo, pct }
  }, [plan])

  const now = Date.now()
  const upcoming = (activity ?? []).filter((a) => new Date(a.startsAt).getTime() >= now && (a.status === "REQUESTED" || a.status === "CONFIRMED")).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
  const lastConsult = byType.consultation[0]

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" /> Loading patient…
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <p className="text-sm font-semibold text-[#B42318]">{error ?? "Patient not found"}</p>
          <Link href="/admin/patients" className="text-sm text-[#6B2B26] dark:text-[#A5B4FC] hover:underline font-semibold">← Back to all patients</Link>
        </div>
      </div>
    )
  }

  /* ── Edit mode ── */
  if (editing && form) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/patients" className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Edit patient</h1>
            <p className="text-xs text-[#98A2B3] dark:text-[#94A3B8] mt-1">Patient #{patient.patientNumber}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name" required error={fieldErrors.fullName}><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Patient name" className={inputCls} /></Field>
            <Field label="Email" error={fieldErrors.email}><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" className={inputCls} /></Field>
            <Field label="Phone" error={fieldErrors.phone}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" className={inputCls} /></Field>
            <Field label="Date of birth" error={fieldErrors.dateOfBirth}><input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className={inputCls} /></Field>
            <Field label="Sex" error={fieldErrors.sex}>
              <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as FormState["sex"] })} className={inputCls}>
                <option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option><option value="UNDISCLOSED">Undisclosed</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} className={inputCls}>
                <option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="ARCHIVED">Archived</option>
              </select>
            </Field>
            <Field label="Occupation" error={fieldErrors.occupation}><input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Occupation" className={inputCls} /></Field>
            <Field label="Place of residence" error={fieldErrors.placeOfResidence}><input value={form.placeOfResidence} onChange={(e) => setForm({ ...form, placeOfResidence: e.target.value })} placeholder="City / region" className={inputCls} /></Field>
            <Field label="Address" wide error={fieldErrors.address}><textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, locality, city, postal code" className="rounded-lg border border-[#D0D5DD] dark:border-[#374151] p-3 text-sm w-full bg-white dark:bg-[#1F2937]" /></Field>
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <Button type="submit" disabled={saving} className="bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
              </Button>
              <Link href={`/admin/patients/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#101828]"><X className="h-4 w-4" /> Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    )
  }

  /* ── 360° patient view ── */
  const kpis = [
    { icon: Stethoscope, label: "CONSULTATIONS", value: byType.consultation.length, sub: "Recorded", bg: "#EEF4F1", fg: GREEN },
    { icon: CalendarClock, label: "FOLLOW-UPS", value: (activity ?? []).length, sub: "Bookings", bg: "#EFF4FF", fg: "#2E5AAC" },
    { icon: Syringe, label: "INFUSIONS", value: 0, sub: "Done", bg: "#E9F6F2", fg: "#0E8C6A" },
    { icon: FlaskConical, label: "LAB REPORTS", value: byType.labResult.length, sub: "Ordered", bg: "#F1EEFB", fg: "#6A4FB0" },
    { icon: RefreshCw, label: "REFILLS DUE", value: openRefills, sub: "Open requests", bg: "#FDEFE4", fg: "#C2691E" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Patient header band */}
      <div className="rounded-2xl bg-white dark:bg-[#1F2937] p-5 flex items-start gap-5 flex-wrap" style={{ border: "1px solid #E7DFCD" }}>
        <Link href="/admin/patients" className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 flex-shrink-0" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: "#EEF4F1", color: GREEN }}>
          {patient.fullName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">{patient.fullName}</h1>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={patient.status === "ACTIVE" ? { background: "#E4F3EC", color: "#0E8C6A" } : { background: "#F2F4F7", color: "#475467" }}>
              {patient.status === "ACTIVE" ? "ACTIVE" : patient.status}
            </span>
          </div>
          <div className="mt-1.5 text-sm flex flex-wrap gap-x-5 gap-y-1 text-[#4A5A52] dark:text-[#94A3B8]">
            <span><b className="text-[#16302A] dark:text-[#F9FAFB]">Patient ID:</b> {patient.patientNumber}</span>
            <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {patient.phone ?? "—"}</span>
            <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {patient.email ?? "—"}</span>
            <span><b className="text-[#16302A] dark:text-[#F9FAFB]">Age:</b> {ageFrom(patient.dateOfBirth)}</span>
            <span><b className="text-[#16302A] dark:text-[#F9FAFB]">Sex:</b> {patient.sex ?? "—"}</span>
          </div>
        </div>
        <div className="text-sm space-y-2 sm:border-l sm:pl-5" style={{ borderColor: "#E7DFCD" }}>
          <p><span className="block text-xs text-[#8A9A92]">Registered</span>{fmtDate(patient.createdAt)}</p>
          <p><span className="block text-xs text-[#8A9A92]">Last Consultation</span>{lastConsult ? fmtDate(lastConsult.occurredAt) : "—"}</p>
          <p><span className="block text-xs text-[#8A9A92]">Next Visit</span>{upcoming[0] ? fmtDate(upcoming[0].startsAt, true) : "—"}</p>
        </div>
        <Link href={`/admin/patients/${id}?edit=1`}>
          <Button className="bg-[#6B2B26] hover:bg-[#54201D] text-white px-4 h-10 rounded-lg flex items-center gap-2 text-sm font-semibold"><Pencil className="h-4 w-4" /> Edit</Button>
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white dark:bg-[#1F2937] p-4" style={{ border: "1px solid #E7DFCD" }}>
            <span className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>
              <k.icon style={{ width: 18, height: 18, color: k.fg }} />
            </span>
            <p className="mt-2.5 text-2xl font-bold leading-none text-[#101828] dark:text-[#F9FAFB]">{k.value}</p>
            <p className="text-[11px] font-semibold tracking-wide mt-1 text-[#8A9A92]">{k.label}</p>
            <p className="text-xs text-[#6B7B73] dark:text-[#94A3B8]">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 flex-wrap border-b" style={{ borderColor: "#E7DFCD" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors" style={tab === t ? { color: GREEN, borderColor: GREEN } : { color: "#8A9A92", borderColor: "transparent" }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Clinical Summary" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Panel title="Contact & Profile" icon={ShieldCheck} className="lg:col-span-2">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={patient.email ?? "—"} />
              <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={patient.phone ?? "—"} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date of birth" value={fmtDate(patient.dateOfBirth)} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Registered" value={fmtDate(patient.createdAt)} />
              <DetailRow icon={<ShieldCheck className="h-4 w-4" />} label="Status" value={patient.status} />
              <DetailRow icon={<ShieldCheck className="h-4 w-4" />} label="Sex" value={patient.sex ?? "—"} />
              {patient.occupation ? <DetailRow icon={<ShieldCheck className="h-4 w-4" />} label="Occupation" value={patient.occupation} /> : null}
              {patient.placeOfResidence ? <DetailRow icon={<ShieldCheck className="h-4 w-4" />} label="Place of residence" value={patient.placeOfResidence} /> : null}
              {patient.address ? (
                <div className="md:col-span-2 border-t border-[#F2F4F7] dark:border-[#374151] pt-4">
                  <dt className="text-xs uppercase text-[#667085] dark:text-[#94A3B8] font-semibold tracking-wider mb-1">Address</dt>
                  <dd className="text-sm text-[#344054] dark:text-[#CBD5E1] whitespace-pre-wrap">{patient.address}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>
          <Panel title="Recent Activity" icon={Activity}>
            {events.length === 0 ? <Empty text="No activity yet." /> : (
              <ul className="flex flex-col gap-3">
                {events.slice(0, 7).map((e) => (
                  <li key={e.id} className="flex gap-3 border-l-2 pl-3" style={{ borderColor: "#E7DFCD" }}>
                    <ActivityIcon type={e.type} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">{e.summary}</p>
                      <p className="text-xs text-[#8A9A92]">{fmtDate(e.occurredAt, true)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : tab === "Program & Refills" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <Panel title="Prescribed Program" icon={ClipboardList}>
            {plan === undefined ? (
              <Empty text="Loading program…" />
            ) : !program ? (
              <Empty text="No active program prescribed yet. Sign a treatment plan to start one." />
            ) : (
              <>
                <h4 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">{program.title}</h4>
                <div className="flex gap-2 mt-2">
                  <Chip>{program.totalWeeks} Weeks Program</Chip>
                  <Chip tone="green">Active – Week {program.weekNo}</Chip>
                </div>
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E7DFCD" }}>
                    {program.items.length === 0 ? (
                      <div className="px-4 py-2.5">
                        <span className="text-xs text-[#6B7B73] dark:text-[#94A3B8]">No items in this program.</span>
                      </div>
                    ) : (
                      program.items.slice(0, 4).map((it, i) => (
                        <div key={it.id} className="flex flex-col px-4 py-2.5" style={i > 0 ? { borderTop: "1px solid #EFE8D8" } : undefined}>
                          <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{it.name}</span>
                          <span className="text-xs text-[#6B7B73] dark:text-[#94A3B8]">
                            {[it.dose, it.frequency].filter(Boolean).join(" · ") || it.kind}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  <ProgressRing pct={program.pct} weekNo={program.weekNo} totalWeeks={program.totalWeeks} />
                </div>
                {program.items.length > 4 ? (
                  <p className="text-[11px] mt-3 text-[#98A2B3]">+{program.items.length - 4} more item{program.items.length - 4 === 1 ? "" : "s"} in this program</p>
                ) : null}
              </>
            )}
          </Panel>
          <Panel title="Upcoming Bookings & Sessions" icon={CalendarClock}>
            {upcoming.length === 0 ? <Empty text="No upcoming bookings." /> : (
              <div className="flex flex-col gap-2.5">
                {upcoming.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl px-3.5 py-3" style={{ background: "#F4F7F5", border: "1px solid #E7DFCD" }}>
                    <span className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E7EFEA" }}><Calendar className="h-4 w-4" style={{ color: GREEN }} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">{a.staff?.fullName ?? "Appointment"}{a.department ? ` · ${a.department.name}` : ""}</p>
                      <p className="text-xs text-[#6B7B73] dark:text-[#94A3B8]">{fmtDate(a.startsAt, true)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${APPT_STATUS_STYLE[a.status]?.cls ?? ""}`}>{APPT_STATUS_STYLE[a.status]?.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Refill Requests" icon={RefreshCw} full>
            <RefillManager patientId={id} />
          </Panel>
        </div>
      ) : tab === "Consultations" ? (
        <ListPanel title="Consultations" icon={Stethoscope} items={byType.consultation} empty="No consultations recorded." />
      ) : tab === "Labs" ? (
        <Panel title="Labs & Diagnostics" icon={FlaskConical} full>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-[#8A9A92]"><th className="text-left font-semibold py-2">Test</th><th className="text-left font-semibold py-2">Ordered On</th><th className="text-left font-semibold py-2">Status</th><th className="text-right font-semibold py-2">Report</th></tr></thead>
            <tbody>
              {byType.labResult.length === 0 ? <tr><td colSpan={4} className="py-3 text-sm text-[#98A2B3]">No lab reports yet.</td></tr> : byType.labResult.map((l) => {
                const hasReport = l.ref.hasAttachment === true || !!l.ref.reportedAt
                const orderedOn = (typeof l.ref.collectedAt === "string" ? l.ref.collectedAt : null) ?? l.occurredAt
                return (
                  <tr key={l.id} style={{ borderTop: "1px solid #EFE8D8" }}>
                    <td className="py-2.5">
                      <div className="font-medium text-[#101828] dark:text-[#F9FAFB]">{(l.ref.panelName as string) || l.summary}</div>
                      {l.summary && l.summary !== l.ref.panelName ? (
                        <div className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5">{l.summary}</div>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-[#6B7B73] dark:text-[#94A3B8]">{fmtDate(orderedOn)}</td>
                    <td className="py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={hasReport ? { background: "#E4F3EC", color: "#0E8C6A" } : { background: "#E5EEF9", color: "#2E5AAC" }}>{hasReport ? "Completed" : "Active"}</span></td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {hasReport ? (
                          <button type="button" onClick={() => void viewLabReport(l.ref.id as string)} className="text-xs font-semibold hover:underline px-1.5" style={{ color: GREEN }}>View</button>
                        ) : null}
                        <button type="button" onClick={() => setUploadLab({ id: l.ref.id as string, name: (l.ref.panelName as string) || l.summary, hasReport })} aria-label="Report actions" className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#6B7B73] hover:bg-gray-100 dark:hover:bg-[#111827]">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Panel>
      ) : tab === "Follow-Ups" ? (
        <Panel title="Follow-Ups & Bookings" icon={CalendarClock} full>
          {(activity ?? []).length === 0 ? <Empty text="No bookings yet." /> : (
            <ul className="divide-y" style={{ borderColor: "#EFE8D8" }}>
              {(activity ?? []).map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">{a.staff?.fullName ?? "Unassigned"}{a.department ? ` · ${a.department.name}` : ""}</p>
                    <p className="text-xs text-[#8A9A92]">{fmtDate(a.startsAt, true)}{a.reason ? ` · ${a.reason}` : ""}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${APPT_STATUS_STYLE[a.status]?.cls ?? ""}`}>{APPT_STATUS_STYLE[a.status]?.label}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : tab === "Billing" ? (
        <Panel
          title="Billing & Payments"
          icon={CreditCard}
          aside="+ Create invoice"
          asideOnClick={() => router.push(`/admin/invoices/add?patientId=${id}`)}
          full
        >
          {byType.invoice.length === 0 ? (
            <Empty text="No invoices yet." />
          ) : (
            <ul className="divide-y" style={{ borderColor: "#EFE8D8" }}>
              {byType.invoice.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <Link href={`/admin/invoices/${e.ref.id}`} className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] hover:underline truncate">
                    {e.summary}
                  </Link>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-[#8A9A92]">{fmtDate(e.occurredAt, true)}</span>
                    <Link href={`/admin/invoices/${e.ref.id}`} className="text-xs font-semibold hover:underline" style={{ color: GREEN }}>
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        // Vitals
        <Panel title="Vitals" icon={Activity} aside={vitalOpen ? "Cancel" : "Record reading"} asideOnClick={() => setVitalOpen((v) => !v)} full>
          {latestVital === undefined ? (
            <div className="flex items-center gap-2 text-sm text-[#667085]"><Loader2 className="h-4 w-4 animate-spin text-[#6B2B26]" /> Loading…</div>
          ) : latestVital === null ? (
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">No vitals recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <VitalStat label="Blood pressure" value={latestVital.systolic && latestVital.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : "—"} unit="mmHg" />
              <VitalStat label="Heart rate" value={latestVital.heartRate ?? "—"} unit="bpm" />
              <VitalStat label="Weight" value={latestVital.weightKg ?? "—"} unit="kg" />
              <VitalStat label="Temp" value={latestVital.temperatureF ?? "—"} unit="°F" />
              <VitalStat label="SpO₂" value={latestVital.spo2 ?? "—"} unit="%" />
              <VitalStat label="Recorded" value={fmtDate(latestVital.recordedAt)} unit={latestVital.recordedBy?.fullName ?? ""} />
            </div>
          )}
          {vitalOpen ? (
            <form onSubmit={recordVital} className="mt-5 pt-5 border-t border-[#EAECF0] dark:border-[#374151] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <VitalInput label="Systolic" value={vitalForm.systolic} onChange={(v) => setVitalForm({ ...vitalForm, systolic: v })} />
              <VitalInput label="Diastolic" value={vitalForm.diastolic} onChange={(v) => setVitalForm({ ...vitalForm, diastolic: v })} />
              <VitalInput label="Heart rate" value={vitalForm.heartRate} onChange={(v) => setVitalForm({ ...vitalForm, heartRate: v })} />
              <VitalInput label="Weight (kg)" value={vitalForm.weightKg} onChange={(v) => setVitalForm({ ...vitalForm, weightKg: v })} />
              <VitalInput label="Temp (°F)" value={vitalForm.temperatureF} onChange={(v) => setVitalForm({ ...vitalForm, temperatureF: v })} />
              <VitalInput label="SpO₂ (%)" value={vitalForm.spo2} onChange={(v) => setVitalForm({ ...vitalForm, spo2: v })} />
              <div className="col-span-2 sm:col-span-3 lg:col-span-5">
                <label className="flex flex-col gap-1.5 text-sm"><span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Notes</span><input value={vitalForm.notes} onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })} className={inputCls} placeholder="Optional" /></label>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={vitalSaving} className="bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white h-10 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 w-full justify-center">{vitalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</Button>
              </div>
            </form>
          ) : null}
        </Panel>
      )}

      {uploadLab ? (
        <LabReportUploadModal
          labResultId={uploadLab.id}
          labName={uploadLab.name}
          hasReport={uploadLab.hasReport}
          onClose={() => setUploadLab(null)}
          onUploaded={() => { void fetchTimeline() }}
        />
      ) : null}
    </div>
  )
}

/* ── components ───────────────────────────────────────────────────── */

function Panel({ title, icon: Icon, aside, asideOnClick, full, className = "", children }: { title: string; icon: typeof Activity; aside?: string; asideOnClick?: () => void; full?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-[#1F2937] p-5 ${full ? "xl:col-span-2" : ""} ${className}`} style={{ border: "1px solid #E7DFCD" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4" style={{ color: GREEN }} /><h3 className="text-sm font-bold tracking-wide uppercase text-[#101828] dark:text-[#F9FAFB]">{title}</h3></div>
        {aside ? (asideOnClick ? <button type="button" onClick={asideOnClick} className="text-xs font-semibold hover:underline" style={{ color: GOLD }}>{aside}</button> : <span className="text-xs font-semibold" style={{ color: GOLD }}>{aside}</span>) : null}
      </div>
      {children}
    </div>
  )
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "green" }) {
  return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md" style={tone === "green" ? { background: "#E4F3EC", color: "#0E8C6A" } : { background: "#F1EEE4", color: "#7A6A3C" }}>{children}</span>
}

function ProgressRing({ pct, weekNo, totalWeeks }: { pct: number; weekNo: number; totalWeeks: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center">
      <svg width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="#EFE8D8" strokeWidth="9" />
        <circle cx="46" cy="46" r={r} fill="none" stroke={GREEN} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 46 46)" />
        <text x="46" y="44" textAnchor="middle" fontSize="18" fontWeight="700" fill={INK}>{pct}%</text>
        <text x="46" y="60" textAnchor="middle" fontSize="9" fill="#8A9A92">Week {weekNo} of {totalWeeks}</text>
      </svg>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm py-3 text-[#98A2B3] dark:text-[#94A3B8]">{text}</p>
}

const ACT: Record<TimelineEvent["type"], { icon: typeof Activity; color: string }> = {
  consultation: { icon: Stethoscope, color: "#1F3D33" },
  labResult: { icon: FlaskConical, color: "#6A4FB0" },
  treatmentPlan: { icon: Pill, color: "#B0852C" },
  appointment: { icon: CalendarClock, color: "#2E5AAC" },
  invoice: { icon: CreditCard, color: "#0E8C6A" },
}
function ActivityIcon({ type }: { type: TimelineEvent["type"] }) {
  const a = ACT[type]
  return <span className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 -ml-[13px] bg-white dark:bg-[#1F2937]" style={{ border: "1px solid #E7DFCD" }}><a.icon className="h-3 w-3" style={{ color: a.color }} /></span>
}

function ListPanel({ title, icon, items, empty }: { title: string; icon: typeof Activity; items: TimelineEvent[]; empty: string }) {
  return (
    <Panel title={title} icon={icon} full>
      {items.length === 0 ? <Empty text={empty} /> : (
        <ul className="divide-y" style={{ borderColor: "#EFE8D8" }}>
          {items.map((e) => (
            <li key={e.id} className="py-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">{e.summary}</span>
              <span className="text-xs text-[#8A9A92]">{fmtDate(e.occurredAt, true)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function VitalStat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-[#667085] dark:text-[#94A3B8]">{label}</span>
      <span className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">{value}{unit ? <span className="text-xs font-normal text-[#98A2B3] dark:text-[#94A3B8] ml-1">{unit}</span> : null}</span>
    </div>
  )
}

function VitalInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">{label}</span>
      <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-lg border border-[#D0D5DD] dark:border-[#374151] px-3 text-sm w-full bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]" />
    </label>
  )
}

const inputCls = "h-10 rounded-lg border border-[#D0D5DD] dark:border-[#374151] px-3 text-sm w-full bg-white dark:bg-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"

function Field({ label, required, wide, error, children }: { label: string; required?: boolean; wide?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-[#344054] dark:text-[#CBD5E1] font-medium">{label}{required ? <span className="text-[#B42318]"> *</span> : null}</span>
      {children}
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </label>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#667085] dark:text-[#94A3B8] mt-0.5">{icon}</div>
      <div><dt className="text-xs uppercase text-[#667085] dark:text-[#94A3B8]">{label}</dt><dd className="text-[#101828] dark:text-[#F9FAFB] font-medium">{value}</dd></div>
    </div>
  )
}
