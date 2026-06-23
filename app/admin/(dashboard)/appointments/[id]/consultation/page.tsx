"use client"

/**
 * Start-appointment RMO consultation workspace.
 *
 * Reached from the Appointments kebab -> "Start appointment" when the
 * booking is assigned to an RMO. Find-or-creates the consultation linked to
 * the appointment (idempotent), then presents the tab-based RMO intake form
 * (Informant -> Examination Summary), a Vitals tab (records readings against
 * the patient via /api/patients/[id]/vitals — same store as the Patient
 * Detail page), and a Summary tab. From here the RMO can book a follow-up
 * with themselves or hand the patient off to Dr. Yuvraaj.
 *
 * The rich form markup mirrors the approved Figma "RMO Consultation" design.
 */

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, Loader2, AlertCircle, ChevronDown, User, CalendarPlus, Stethoscope, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { RMO_FIELDS, SECTION_KEY, SECTION_LABEL, SECTION_ORDER } from "@/lib/rmo-fields"
import DoctorConsultation from "./DoctorConsultation"

const mainTabs = ["RMO Consultation", "Vitals", "Summary"] as const
const formSections = [
  "Informant",
  "Demographics",
  "Medical History",
  "Social History",
  "Personal History",
  "Examination Summary",
]


/** Section slug -> DB key (matches the RMO keys documented on Consultation.sections) and display label. */

type MainTab = (typeof mainTabs)[number]

interface Consultation {
  id: string
  type: "RMO" | "MAIN"
  status: string
  sections?: Record<string, Record<string, unknown>> | null
  patient: { id: string; fullName: string; patientNumber: string } | null
  rmoSummary?: {
    id: string
    status: string
    createdAt: string
    sections?: Record<string, Record<string, unknown>> | null
  } | null
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

/**
 * GPE (General Physical Examination), Clinical Signs, and Systemic Examination
 * live below the GPE header in the Examination Summary tab but are NOT part of
 * the RMO intake. They are hidden behind this flag and their fields are also
 * excluded from the RMO field registry (lib/rmo-fields.ts) so nothing below the
 * GPE header is collected, saved, or shown. Flip to `true` (and clear the
 * exclusion set in lib/rmo-fields.ts) to bring them back.
 */
const RMO_SHOW_FULL_GPE = false

export default function StartAppointmentConsultationPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const appointmentId = params.id

  const [consult, setConsult] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMainStep, setActiveMainStep] = useState<MainTab>("RMO Consultation")
  const [activeSection, setActiveSection] = useState("Informant")

  // Patient's latest quiz assessment (shown in the Summary tab).
  const [quiz, setQuiz] = useState<{
    totalScore: number
    scoreOutOf: number
    band: string
    byCategory: Record<string, number>
    topRisks: { key: string; label: string; severity: string }[]
  } | null>(null)

  // Active sub-tab within the Summary tab (a section slug or "__quiz").
  const [summaryTab, setSummaryTab] = useState("")

  // Captured form values, keyed by control name (e.g. "informant__informant_name").
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  // Mirror of `form` so the populate callback can read latest values without
  // re-running on every keystroke (which would fight the cursor).
  const formStateRef = useRef(form)
  formStateRef.current = form

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [activeSection, activeMainStep])

  useEffect(() => {
    let cancelled = false
    async function start() {
      setError(null)
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/consultation`, {
          method: "POST",
          credentials: "include",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        if (cancelled) return
        const c = data as Consultation
        setConsult(c)
        // Flatten any previously-saved sections back into the flat form map.
        const flat: Record<string, string> = {}
        const secs = (c.sections ?? {}) as Record<string, Record<string, unknown>>
        for (const f of RMO_FIELDS) {
          const v = secs?.[SECTION_KEY[f.s]]?.[f.n]
          if (v != null) flat[f.n] = String(v)
        }
        setForm(flat)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to start consultation"
        if (!cancelled) setError(message)
        notify.error("Couldn't start consultation", { description: message })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void start()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  // Load the patient's latest quiz assessment for the Summary tab.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/quiz`, {
          credentials: "include",
        })
        if (!res.ok) return
        const { data } = await res.json()
        if (!cancelled && data) setQuiz(data)
      } catch {
        /* quiz is optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  // Populate the form's uncontrolled controls from state whenever the <form>
  // node mounts. A stable callback ref (not an effect) fires on EVERY mount of
  // the form element: initial load, section switch (forced by
  // `key={activeSection}`), AND returning to the form after viewing another
  // main tab such as Summary. The old effect keyed on [activeSection, hydrated]
  // missed that last case — the form remounted with neither dep changing, so it
  // never re-ran and the saved data showed up blank on revisit.
  const populateForm = useCallback((root: HTMLFormElement | null) => {
    if (!root) return
    const values = formStateRef.current
    for (const el of Array.from(root.elements)) {
      const ctrl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      if (!ctrl.name) continue
      const v = values[ctrl.name]
      if (ctrl instanceof HTMLInputElement && ctrl.type === "radio") {
        ctrl.checked = v != null && ctrl.value === v
      } else if (ctrl instanceof HTMLInputElement && ctrl.type === "checkbox") {
        // Checkbox groups store a comma-joined set; tick each member present.
        const selected = (v ?? "").split(",").map((s) => s.trim())
        ctrl.checked = selected.includes(ctrl.value)
      } else if (ctrl instanceof HTMLSelectElement) {
        // The DB holds a mix of casings: older rows stored the option's label
        // ("Parent"), newer rows store its value ("parent"). A plain
        // `select.value = v` silently no-ops when the casing differs, leaving
        // the dropdown blank. Resolve tolerantly — exact value, then
        // case-insensitive value, then visible label — so both round-trip.
        if (v != null && v !== "") {
          const lc = v.toLowerCase()
          const opts = Array.from(ctrl.options)
          const match =
            opts.find((o) => o.value === v) ??
            opts.find((o) => o.value.toLowerCase() === lc) ??
            opts.find((o) => o.text.trim().toLowerCase() === lc)
          ctrl.value = match ? match.value : ""
        } else {
          ctrl.value = ""
        }
      } else if (v != null) {
        ctrl.value = v
      }
    }
  }, [])

  // Single delegated change handler for every control inside the RMO form.
  const onFormChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const t = e.target as unknown as HTMLInputElement
    if (!t.name) return
    // Checkbox groups share one name; keep a comma-joined set of checked values
    // so a multi-select ("select all that apply") round-trips instead of
    // collapsing to a single "on".
    if (t.type === "checkbox") {
      setForm((prev) => {
        const set = new Set(
          (prev[t.name] ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        )
        if (t.checked) set.add(t.value)
        else set.delete(t.value)
        return { ...prev, [t.name]: Array.from(set).join(", ") }
      })
      return
    }
    const value =
      t.type === "radio" ? (t.checked ? t.value : (form[t.name] ?? "")) : t.value
    setForm((prev) => ({ ...prev, [t.name]: value }))
  }

  const save = async () => {
    if (!consult) return
    setSaving(true)
    try {
      const sections: Record<string, Record<string, string>> = {}
      for (const f of RMO_FIELDS) {
        const v = form[f.n]
        if (v == null || v === "") continue
        const key = SECTION_KEY[f.s]
        ;(sections[key] ??= {})[f.n] = v
      }
      const res = await fetch(`/api/consultations/${consult.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      notify.success("RMO consultation saved")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed"
      notify.error("Couldn't save consultation", { description: message })
    } finally {
      setSaving(false)
    }
  }

  const patientId = consult?.patient?.id

  // Vitals tab — readings live on the patient (same store the Patient Detail
  // page uses), so the RMO sees the latest reading and can record a new one
  // without leaving the consultation.
  const [latestVital, setLatestVital] = useState<VitalReading | null | undefined>(undefined)
  const [vitalForm, setVitalForm] = useState<VitalFormState>(EMPTY_VITAL_FORM)
  const [vitalSaving, setVitalSaving] = useState(false)

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

  const recordVital = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (vitalSaving || !patientId) return
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
      if (
        ![payload.systolic, payload.diastolic, payload.heartRate, payload.weightKg, payload.temperatureF, payload.spo2].some(
          (x) => x !== undefined,
        )
      ) {
        notify.error("Enter at least one measurement")
        return
      }
      setVitalSaving(true)
      try {
        const res = await fetch(`/api/patients/${patientId}/vitals`, {
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
        await fetchVitals()
      } catch (err) {
        notify.error("Couldn't save vitals", {
          description: err instanceof Error ? err.message : "Unknown error",
        })
      } finally {
        setVitalSaving(false)
      }
    },
    [patientId, vitalForm, vitalSaving, fetchVitals],
  )

  const bookRmoFollowUp = async () => {
    await save() // persist RMO notes before leaving
    const q = new URLSearchParams({ role: "RMO" })
    if (patientId) q.set("patientId", patientId)
    router.push(`/admin/appointments/add?${q.toString()}`)
  }

  const bookDoctorAppointment = async () => {
    await save() // persist so the doctor hand-off email carries the RMO summary
    const q = new URLSearchParams({ role: "DOCTOR", doctor: "Yuvraaj" })
    if (patientId) q.set("patientId", patientId)
    router.push(`/admin/appointments/add?${q.toString()}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Starting consultation…</p>
      </div>
    )
  }

  if (error || !consult) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Couldn&apos;t start consultation</p>
        <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{error}</p>
        <Link href="/admin/appointments">
          <Button variant="outline">Back to appointments</Button>
        </Link>
      </div>
    )
  }

  // Dr. Yuvraaj's (MAIN) consultation is a distinct flow — Patient Detail,
  // RMO Summary, Infusion/Rehab/Aesthetic, Test, Final Prescription.
  if (consult.type === "MAIN") {
    return <DoctorConsultation appointmentId={appointmentId} consult={consult} />
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] h-[calc(100vh-136px)]">
      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#6B2B26] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Appointments
          </Link>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">RMO Consultation</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-[#667085] dark:text-[#94A3B8]">
            <User className="h-4 w-4" />
            {consult.patient ? (
              <Link
                href={`/admin/patients/${consult.patient.id}`}
                className="font-medium text-[#101828] dark:text-[#F9FAFB] hover:text-[#6B2B26]"
              >
                {consult.patient.fullName}
              </Link>
            ) : (
              <span>Unknown patient</span>
            )}
            {consult.patient ? (
              <span className="text-[#98A2B3] dark:text-[#94A3B8]">#{consult.patient.patientNumber}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Top tabs */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-2 flex gap-2 overflow-x-auto">
        {mainTabs.map((step) => (
          <button
            key={step}
            onClick={() => setActiveMainStep(step)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeMainStep === step
              ? "bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC]"
              : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 hover:text-[#101828]"
              }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex gap-6 items-start flex-1 min-h-0">
        {activeMainStep === "RMO Consultation" && (
          <aside className="w-[240px] flex-shrink-0 h-full overflow-y-auto pb-4">
            <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
              {formSections.map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`w-full text-left px-6 py-4 text-sm font-medium transition-all border-b border-[#EAECF0] dark:border-[#374151] last:border-b-0 ${activeSection === section
                    ? "bg-[#F9FAFB] dark:bg-[#111827] text-[#6B2B26] dark:text-[#A5B4FC] border-l-4 border-l-[#6B2B26]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-gray-50 hover:text-[#101828]"
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </aside>
        )}

        <div ref={scrollContainerRef} className="flex-1 min-w-0 h-full overflow-y-auto pb-28 pr-2">
          <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-8">
            <div className="max-w-[800px]">
              {activeMainStep === "RMO Consultation" ? (
                <form key={activeSection} ref={populateForm} onChange={onFormChange}>
                  {activeSection === "Informant" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Informant Details</h2>
                        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Information about who is providing patient details</p>
                      </div>

                      {/* Informant Subsection */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Informant</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                                Relationship to Patient<span className="text-red-500">*</span>
                              </label>
                              <input name="informant__relationship_to_patient"
                                type="text"
                                placeholder="Relationship to patient"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                                Informant Name<span className="text-red-500">*</span>
                              </label>
                              <input name="informant__informant_name"
                                type="text"
                                placeholder="Full name"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Person(s) in Attendance</h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Attendee Names</label>
                              <textarea name="informant__attendee_names"
                                placeholder="Names of relatives or friends present"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Relationship</label>
                              <input name="informant__relationship"
                                type="text"
                                placeholder="Relationship"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Demographics" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Demographics</h2>
                        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Basic patient information and contact details</p>
                      </div>

                      {/* Basic Information Subsection */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Basic Information</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                            {/* Date of Birth */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                                Date of Birth<span className="text-red-500">*</span>
                              </label>
                              <input name="demographics__date_of_birth"
                                type="date"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">System will calculate age in years and months</p>
                            </div>

                            {/* Sex */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                                Sex<span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="demographics__sex" value="Male" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Male</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="demographics__sex" value="Female" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Female</span>
                                </label>
                              </div>
                            </div>

                            {/* Occupation */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                                Occupation<span className="text-red-500">*</span>
                              </label>
                              <input name="demographics__occupation"
                                type="text"
                                placeholder="Current occupation"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Important for identifying occupational hazards and exposures</p>
                            </div>

                            {/* Place of Residence */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Place of Residence</label>
                              <textarea name="demographics__place_of_residence"
                                placeholder="Full address"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Geography matters for geographically induced diseases</p>
                            </div>
                          </div>
                        </div>

                        {/* Consultation Details */}
                        <div className="pt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Consultation Details</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                                Date of Consultation<span className="text-red-500">*</span>
                              </label>
                              <input name="demographics__date_of_consultation"
                                type="date"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Last Visit Date</label>
                              <input name="demographics__last_visit_date"
                                type="date"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Referral Source</label>
                              <div className="relative">
                                <select name="demographics__referral_source" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select referral source</option>
                                  <option value="doctor">Doctor</option>
                                  <option value="walk-in">Walk-in</option>
                                  <option value="relative">Relative</option>
                                  <option value="media">Media</option>
                                  <option value="other">Other</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">How did the patient find this practice</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Medical History" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Medical History</h2>
                        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Complete medical, surgical, family, and medication history</p>
                      </div>

                      <div className="space-y-6">
                        {/* Past Medical History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Past Medical History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Medical Conditions</label>
                              <textarea name="medical_history__medical_conditions"
                                placeholder="e.g., Type 2 DM, HTN with CAD - Post PTCA status, Hypothyroidism"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Include known conditions with dates of diagnosis and current status</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">ICU Admissions</label>
                              <textarea name="medical_history__icu_admissions"
                                placeholder="Indication, duration, ventilator or inotropes used"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Past Surgical History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Past Surgical History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8] rotate-180" />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Surgical Procedures</label>
                              <textarea name="medical_history__surgical_procedures"
                                placeholder="e.g., Post Cholecystectomy status - 2017, indication, outcome"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Include procedure name, date, indication, and outcome</p>
                            </div>
                          </div>
                        </div>

                        {/* Family History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Family History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Parents Status</label>
                                <div className="relative">
                                  <select name="medical_history__parents_status" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select status</option>
                                    <option value="living">Living</option>
                                    <option value="deceased">Deceased</option>
                                    <option value="unknown">Unknown</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Parental Medical History</label>
                                <textarea name="medical_history__parental_medical_history"
                                  placeholder="Significant conditions or causes of death"
                                  rows={2}
                                  className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Grandparents Medical History</label>
                              <textarea name="medical_history__grandparents_medical_history"
                                placeholder="If patient can recall"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Travel History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Travel History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Current Residence</label>
                                <div className="relative">
                                  <select name="medical_history__current_residence" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select residence</option>
                                    <option value="india">India</option>
                                    <option value="abroad">Abroad</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Travel Frequency</label>
                                <div className="relative">
                                  <select name="medical_history__travel_frequency" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select frequency</option>
                                    <option value="frequent international">Frequent International</option>
                                    <option value="occasional international">Occasional International</option>
                                    <option value="frequent domestic">Frequent Domestic</option>
                                    <option value="occasional domestic">Occasional Domestic</option>
                                    <option value="none">None</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Modes of Transport</label>
                              <input name="medical_history__modes_of_transport"
                                type="text"
                                placeholder="Usual modes of transportation"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Medication / Drug History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Medication / Drug History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8] rotate-180" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Current Medications</label>
                              <textarea name="medical_history__current_medications"
                                placeholder="Names, compositions, dosages, duration since initiation"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Previous Medications (Discontinued)</label>
                              <textarea name="medical_history__previous_medications"
                                placeholder="Include reason for discontinuing"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Supplements</label>
                              <textarea name="medical_history__supplements"
                                placeholder="Names, compositions, duration"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Illicit Drug Use</label>
                              <textarea name="medical_history__illicit_drug_use"
                                placeholder="Any use of illicit drugs"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Allergy History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Allergy History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8] rotate-180" />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Known Allergies</label>
                              <textarea name="medical_history__known_allergies"
                                placeholder="Drug / Food / Cosmetic / Plant allergies with reactions"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Social History" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Social History</h2>
                        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Lifestyle, work, and social factors</p>
                      </div>

                      <div className="space-y-10">
                        {/* Marital Status Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Marital Status</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Status</label>
                              <div className="relative">
                                <select name="social_history__status" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select status</option>
                                  <option value="single">Single</option>
                                  <option value="married">Married</option>
                                  <option value="divorced">Divorced</option>
                                  <option value="widowed">Widowed</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration</label>
                              <input name="social_history__duration"
                                type="text"
                                placeholder="Duration in years"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Consanguineous Marriage</label>
                              <div className="relative">
                                <select name="social_history__consanguineous_marriage" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="yes">Yes</option>
                                  <option value="no">No</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Ethnicity</label>
                              <input name="social_history__ethnicity"
                                type="text"
                                placeholder="To be filled manually"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Work History Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Work History</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Work Hours</label>
                              <input name="social_history__work_hours"
                                type="text"
                                placeholder="Hours per week"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Work Location</label>
                              <div className="relative">
                                <select name="social_history__work_location" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select location</option>
                                  <option value="office">Office</option>
                                  <option value="remote">Remote</option>
                                  <option value="field">Field</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Physically Strenuous</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="social_history__physically_strenuous" value="Yes" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="social_history__physically_strenuous" value="No" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">No</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Night Shifts</label>
                              <input name="social_history__night_shifts"
                                type="text"
                                placeholder="Duration and frequency"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Alcohol Consumption Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Alcohol Consumption</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Frequency</label>
                              <div className="relative">
                                <select name="social_history__frequency" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select frequency</option>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                  <option value="rarely">Rarely</option>
                                  <option value="never">Never</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration</label>
                              <div className="relative">
                                <select name="social_history__duration_2" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select duration</option>
                                  <option value="< 1 year">&lt; 1 year</option>
                                  <option value="1-5 years">1-5 years</option>
                                  <option value="5-10 years">5-10 years</option>
                                  <option value="> 10 years">&gt; 10 years</option>
                                  <option value="occasional">Occasional</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Type of Beverage</label>
                              <div className="relative">
                                <select name="social_history__type_of_beverage" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select type</option>
                                  <option value="malts">Malts</option>
                                  <option value="scotch">Scotch</option>
                                  <option value="whiskey">Whiskey</option>
                                  <option value="beer">Beer</option>
                                  <option value="wine">Wine</option>
                                  <option value="vodka">Vodka</option>
                                  <option value="gin">Gin</option>
                                  <option value="tequila">Tequila</option>
                                  <option value="rum">Rum</option>
                                  <option value="mixed">Mixed</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tobacco Use Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Tobacco Use</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Variety</label>
                              <div className="relative">
                                <select name="social_history__variety" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select type</option>
                                  <option value="none">None</option>
                                  <option value="cigarettes">Cigarettes</option>
                                  <option value="cigars">Cigars</option>
                                  <option value="chewing">Chewing Tobacco</option>
                                  <option value="vape">Vape</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Number per Day</label>
                              <input name="social_history__number_per_day"
                                type="text"
                                placeholder="Quantity"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">System will calculate pack years</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Years of Use</label>
                              <input name="social_history__years_of_use"
                                type="text"
                                placeholder="Duration in years"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Other Information Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Other Information</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pets at Home</label>
                              <input name="social_history__pets_at_home"
                                type="text"
                                placeholder="Animals / Birds (How many)"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Proximity / Exposure</label>
                              <input name="social_history__proximity_exposure"
                                type="text"
                                placeholder="Duration and level of contact"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Inherited Diseases</label>
                              <textarea name="social_history__inherited_diseases"
                                placeholder="What, how, and when detected"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Under Medical Care</label>
                              <input name="social_history__under_medical_care"
                                type="text"
                                placeholder="Doctor name, since when"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Children Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Children</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Number of Children</label>
                              <input name="social_history__number_of_children"
                                type="text"
                                placeholder="Number"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Ages / Years of Birth</label>
                              <input name="social_history__ages_years_of_birth"
                                type="text"
                                placeholder="e.g., 5, 8, 12"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Delivery Details</label>
                              <textarea name="social_history__delivery_details"
                                placeholder="NVD / LSCS / Complications"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sexual Life Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Sexual Life</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Partners</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="social_history__partners" value="Single Partner" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Single Partner</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="social_history__partners" value="Multiple Partners" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Multiple Partners</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Frequency</label>
                              <input name="social_history__frequency_2"
                                type="text"
                                placeholder="Frequency"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Protection</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="social_history__protection" value="Protected" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Protected</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="social_history__protection" value="Unprotected" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Unprotected</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Preferences</label>
                              <div className="relative">
                                <select name="social_history__preferences" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select preference</option>
                                  <option value="same sex">Same sex</option>
                                  <option value="opposite sex">Opposite sex</option>
                                  <option value="both">Both</option>
                                  <option value="prefer not to say">Prefer not to say</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Personal History" ? (
                    <>
                      {/* Form Section Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Personal History</h2>
                        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Detailed personal habits and daily functioning</p>
                      </div>

                      <div className="space-y-6">
                        {/* Appetite Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Appetite</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Appetite Level</label>
                              <div className="relative">
                                <select name="personal_history__appetite_level" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select appetite level</option>
                                  <option value="normal">Normal</option>
                                  <option value="increased">Increased</option>
                                  <option value="decreased">Decreased</option>
                                  <option value="variable">Variable</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Food Cravings</label>
                              <div className="relative">
                                <select name="personal_history__food_cravings" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select cravings</option>
                                  <option value="sweet">Sweet</option>
                                  <option value="salty">Salty</option>
                                  <option value="none">None</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__appetite_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bowels Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Bowels</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Regularity</label>
                                <div className="flex items-center gap-4 h-11">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="personal_history__regularity" value="Regular" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Regular</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="personal_history__regularity" value="Constipation" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Constipation</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="personal_history__regularity" value="Frequent Diarrhea" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Frequent Diarrhea</span>
                                  </label>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Frequency (per day)</label>
                                <input name="personal_history__frequency_per_day"
                                  type="text"
                                  placeholder="Average number"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Consistency</label>
                                <div className="relative">
                                  <select name="personal_history__consistency" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select consistency</option>
                                    <option value="soft">Soft</option>
                                    <option value="hard">Hard</option>
                                    <option value="liquid">Liquid</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Color</label>
                                <div className="relative">
                                  <select name="personal_history__color" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select color</option>
                                    <option value="brown">Brown</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="clay">Clay</option>
                                    <option value="black">Black</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Blood in Stool</label>
                              <div className="relative">
                                <select name="personal_history__blood_in_stool" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="streaks (painless)">Streaks (Painless)</option>
                                  <option value="streaks (painful)">Streaks (Painful)</option>
                                  <option value="frank blood (painless)">Frank Blood (Painless)</option>
                                  <option value="frank blood (painful)">Frank Blood (Painful)</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Other Symptoms</label>
                              <div className="relative">
                                <select name="personal_history__bowel_other_symptoms" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select symptom</option>
                                  <option value="none">None</option>
                                  <option value="worms">Worms</option>
                                  <option value="itching">Itching</option>
                                  <option value="anal tags">Anal tags</option>
                                  <option value="abscesses">Abscesses</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Odour</label>
                              <div className="relative">
                                <select name="personal_history__bowel_odour" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select odour</option>
                                  <option value="Odourless">Odourless</option>
                                  <option value="Foul Smelling">Foul Smelling</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Any Characteristic odour ?</label>
                              <input name="personal_history__bowel_characteristic_odour"
                                type="text"
                                placeholder="Specify characteristic odour"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Others</label>
                              <div className="flex flex-col gap-y-3">
                                {[
                                  "Any worms noted in the stools ?",
                                  "Any Itching around the anal region, especially at night ? (Pruritus Ani)",
                                  "Any Anal Tags, Warts",
                                  "Any H/o perineal Abscesses ?",
                                  "Urge or Stress Incontinence",
                                  "Any H/o Involuntary defecation ?",
                                  "None"
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input name="personal_history__bowel_others" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Early Satiety</label>
                              <div className="flex flex-col gap-y-3">
                                {[
                                  "Feeling of fullness after a few bites only",
                                  "Abdominal fullness or heaviness (discomfort) long after a meal"
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input name="personal_history__bowel_early_satiety" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">If present please specify</label>
                              <input name="personal_history__bowel_early_satiety_specify"
                                type="text"
                                placeholder="Specify details"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Burning sensation in the esophagus and epigastrium</label>
                              <div className="flex flex-col gap-y-3">
                                {[
                                  "Worsens with Food intake",
                                  "Alleviated after food intake",
                                  "None"
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input name="personal_history__bowel_burning_sensation" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Bloating</label>
                              <div className="flex flex-col gap-y-3">
                                {[
                                  "Immediately after a meal",
                                  "Few hours after a meal",
                                  "None"
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input name="personal_history__bowel_bloating" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Constipation alternating with episodes of Diarrhoea ?</label>
                              <input name="personal_history__bowel_constipation_diarrhoea"
                                type="text"
                                placeholder="description and duration"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__bowels_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sleep Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Sleep</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Quality of Sleep</label>
                                <div className="relative">
                                  <select name="personal_history__quality_of_sleep" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select quality</option>
                                    <option value="good">Good</option>
                                    <option value="interrupted">Interrupted</option>
                                    <option value="poor">Poor</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Sleep Duration (hours)</label>
                                <input name="personal_history__sleep_duration_hours"
                                  type="text"
                                  placeholder="Hours per night"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Sleep Time</label>
                                <input name="personal_history__sleep_time"
                                  type="time"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Wake Time</label>
                                <input name="personal_history__wake_time"
                                  type="time"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Snoring</label>
                              <div className="relative">
                                <select name="personal_history__snoring" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="light">Light</option>
                                  <option value="deep">Deep</option>
                                  <option value="apneic spells">Apneic spells</option>
                                  <option value="position-related">Position-related</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Preferred or default Decubitus</label>
                              <div className="relative">
                                <select name="personal_history__decubitus" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="supine">Supine</option>
                                  <option value="prone">Prone</option>
                                  <option value="left lateral">Left Lateral</option>
                                  <option value="right lateral">Right Lateral</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Height and No. of Pillows</label>
                              <div className="relative">
                                <select name="personal_history__pillow" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="no pillows">No Pillows</option>
                                  <option value="less than 3 inches">less than 3 Inches</option>
                                  <option value="more than 3 inches">More than 3 Inches</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Mattress Quality</label>
                              <div className="relative">
                                <select name="personal_history__mattress" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="floor or wood hard">Floor or wood hard</option>
                                  <option value="soft">Soft</option>
                                  <option value="semi-hard">Semi-Hard</option>
                                  <option value="hard">Hard</option>
                                  <option value="orthopedic">Orthopedic</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Parasomnias (select all that apply)</label>
                              <div className="grid grid-cols-2 gap-y-3">
                                {[
                                  "Sleep Walking", "Bed Wetting", "Nightmares", "Drooling of Saliva", "Sleep Paralysis",
                                  "Talking in Sleep", "Daytime Somnolence", "Night Sweats", "Grinding of Teeth", "Eyelids Stuck Together in the Morning?",
                                  "Too much Sleep crust in the morning?", "Vivid Dreams", "Hallucinations", "Post-Nasal Drip",
                                  "Hypnogogic or Hypnic jerks", "Any Involuntary limb jerks during sleep",
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input name="personal_history__parasomnias_select_all_that_apply" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__sleep_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bladder Habits Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Bladder Habits</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Frequency (times per day)</label>
                                <input name="personal_history__frequency_times_per_day"
                                  type="text"
                                  placeholder="Average number"
                                  className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Urgency</label>
                                <div className="flex items-center gap-6 h-11">
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="personal_history__urgency" value="Normal" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Normal</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="personal_history__urgency" value="Increased" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Increased</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Color & Consistency</label>
                                <div className="relative">
                                  <select name="personal_history__color_consistency" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select appearance</option>
                                    <option value="clear">Clear</option>
                                    <option value="straw">Straw yellow</option>
                                    <option value="dark">Dark yellow</option>
                                    <option value="cloudy">Cloudy</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Flow</label>
                                <div className="relative">
                                  <select name="personal_history__flow" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select flow</option>
                                    <option value="normal">Normal</option>
                                    <option value="weak">Weak</option>
                                    <option value="strained">Strained</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Blood in Urine</label>
                              <div className="relative">
                                <select name="personal_history__blood_in_urine" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="frank">Frank</option>
                                  <option value="painful">Painful</option>
                                  <option value="painless">Painless</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Other Symptoms</label>
                              <div className="relative">
                                <select name="personal_history__bladder_other_symptoms" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select symptom</option>
                                  <option value="none">None</option>
                                  <option value="burning">Burning</option>
                                  <option value="pain">Pain</option>
                                  <option value="itching">Itching</option>
                                  <option value="nocturia">Nocturia</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Volume</label>
                              <div className="relative">
                                <select name="personal_history__bladder_volume" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select volume</option>
                                  <option value="Normal averages (200 - 400ml per urination">Normal averages (200 - 400ml per urination</option>
                                  <option value="low volume">low volume</option>
                                  <option value="Large volume">Large volume</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Odour</label>
                              <div className="relative">
                                <select name="personal_history__bladder_odour" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select odour</option>
                                  <option value="Odourless">Odourless</option>
                                  <option value="Foul odour">Foul odour</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Any characteristic or identifiable odour ?</label>
                              <input name="personal_history__bladder_characteristic_odour"
                                type="text"
                                placeholder="Specify characteristic odour"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-3">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Others</label>
                              <div className="flex flex-col gap-y-3">
                                {[
                                  "Any Burning sensation while urinating ? (Burning Micturition)",
                                  "Painful Micturition (Penile or abdominal or scrotal pain)",
                                  "Itching sensation per urethra or around the genitals",
                                  "Night time urination ? (Nocturia) - Frequency (No. Of times during the night)",
                                  "H/o Giddiness during or after micturition ?",
                                  "Urge or Stress incontinence ?",
                                  "Any H/o Involuntary Micturition"
                                ].map((item) => (
                                  <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                    <input name="personal_history__bladder_others" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                    <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__bladder_habits_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Energy Levels Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Energy Levels</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Energy Pattern</label>
                              <div className="relative">
                                <select name="personal_history__energy_pattern" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select energy level</option>
                                  <option value="high">Consistently High</option>
                                  <option value="fluctuating">Fluctuating</option>
                                  <option value="low">Consistently Low</option>
                                  <option value="morning">Better in Morning</option>
                                  <option value="evening">Better in Evening</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__energy_levels_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Libido / Sex Drive Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Libido / Sex Drive</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Libido Level</label>
                              <div className="relative">
                                <select name="personal_history__libido_level" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select level</option>
                                  <option value="normal">Normal</option>
                                  <option value="increased">Increased</option>
                                  <option value="decreased">Decreased</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration / Pattern</label>
                              <input name="personal_history__duration_pattern"
                                type="text"
                                placeholder="Duration and pattern"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__libido_sex_drive_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Mentation Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Mentation</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Mood</label>
                                <div className="relative">
                                  <select name="personal_history__mood" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select mood</option>
                                    <option value="stable">Stable</option>
                                    <option value="anxious">Anxious</option>
                                    <option value="depressed">Depressed</option>
                                    <option value="irritable">Irritable</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Irritability</label>
                                <div className="relative">
                                  <select name="personal_history__irritability" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select frequency</option>
                                    <option value="none">None</option>
                                    <option value="rare">Rare</option>
                                    <option value="frequent">Frequent</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Forgetfulness</label>
                                <div className="relative">
                                  <select name="personal_history__forgetfulness" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select level</option>
                                    <option value="none">None</option>
                                    <option value="mild">Mild</option>
                                    <option value="significant">Significant</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Concentration & Focus</label>
                                <div className="relative">
                                  <select name="personal_history__concentration_focus" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select level</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Depression & Anxiety</label>
                              <textarea name="personal_history__depression_anxiety"
                                placeholder="Any depression, anxiety, or panic attacks"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Tendencies</label>
                              <div className="relative">
                                <select name="personal_history__tendencies" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select tendencies</option>
                                  <option value="none">None</option>
                                  <option value="aggression">Aggression</option>
                                  <option value="suicidal">Suicidal</option>
                                  <option value="withdrawal">Withdrawal</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Brain Fog</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="personal_history__brain_fog" value="Yes" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Yes</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="personal_history__brain_fog" value="No" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">No</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Motivation</label>
                              <div className="relative">
                                <select name="personal_history__motivation" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select motivation</option>
                                  <option value="motivated">Motivated</option>
                                  <option value="hopeless">Hopeless</option>
                                  <option value="none">None</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__mentation_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dietary Considerations Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Dietary Considerations</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Dietary Considerations</label>
                              <textarea name="personal_history__dietary_considerations"
                                placeholder="Dietary patterns, restrictions, preferences"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Exercise Regimen</label>
                              <textarea name="personal_history__exercise_regimen"
                                placeholder="Type, frequency, duration of exercise"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Personal Hygiene</label>
                              <textarea name="personal_history__personal_hygiene"
                                placeholder="Bathing / Brushing / Change of underclothes / Nail care"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            {form["personal_history__time_between_last_oral_intake_and_sleep"] === ">2 hrs" && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Specify time duration</label>
                                <input name="personal_history__time_between_last_oral_intake_and_sleep_specify" type="text" placeholder="specify time duration" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Personal Habits</label>
                              <input name="personal_history__personal_habits"
                                type="text"
                                placeholder="E.g. cosmetics, sunscreens, etc."
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__dietary_considerations_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Exercise Regimen Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Exercise Regimen</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Never to Sedantary</label>
                              <div className="relative">
                                <select name="personal_history__exercise_sedentary" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="irregular">Irregular</option>
                                  <option value="regular">Regular</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">No. Of Days per week</label>
                              <div className="relative">
                                <select name="personal_history__exercise_days_per_week" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="2-3 days">2 - 3 days</option>
                                  <option value="4-5 days">4 - 5 days</option>
                                  <option value=">5 days">&gt; 5 days</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration of exercises</label>
                              <div className="relative">
                                <select name="personal_history__exercise_duration" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="20 mins">20 mins</option>
                                  <option value="30 mins">30 mins</option>
                                  <option value="45 mins">45 mins</option>
                                  <option value="1 hr">1 hr</option>
                                  <option value=">1 hr">&gt;1 hr</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            {form["personal_history__exercise_duration"] === ">1 hr" && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Specify time</label>
                                <input name="personal_history__exercise_duration_specify" type="text" placeholder="specify time" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Trainer</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="personal_history__exercise_trainer" value="Self" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Self</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="personal_history__exercise_trainer" value="Professional Trainer" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Professional Trainer</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Types of exercises</label>
                              <div className="relative">
                                <select name="personal_history__exercise_types" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="indoor">Indoor</option>
                                  <option value="outdoor">Outdoor</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            {form["personal_history__exercise_types"] === "outdoor" && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Outdoor exercises</label>
                                <div className="relative">
                                  <select name="personal_history__exercise_outdoor_type" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="walk">Walk</option>
                                    <option value="brisk walk">Brisk Walk</option>
                                    <option value="jogging">Jogging</option>
                                    <option value="running">Running</option>
                                    <option value="stretches">Stretches</option>
                                    <option value="yoga">Yoga</option>
                                    <option value="pilates">Pilates</option>
                                    <option value="calisthenics">Calisthenics</option>
                                    <option value="weight training">Weight Training</option>
                                    <option value="martial arts">Martial Arts - Grappling etc</option>
                                    <option value="hiit">HIIT</option>
                                    <option value="trekking">Trekking</option>
                                    <option value="sport(s)">Sport(s)</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            )}
                            {form["personal_history__exercise_types"] === "indoor" && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Indoor exercises</label>
                                <div className="relative">
                                  <select name="personal_history__exercise_indoor_type" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="walk">Walk</option>
                                    <option value="brisk walk">Brisk Walk</option>
                                    <option value="jogging">Jogging</option>
                                    <option value="running">Running</option>
                                    <option value="stretches">Stretches</option>
                                    <option value="yoga">Yoga</option>
                                    <option value="pilates">Pilates</option>
                                    <option value="calisthenics">Calisthenics</option>
                                    <option value="weight training">Weight Training</option>
                                    <option value="martial arts">Martial Arts - Grappling etc</option>
                                    <option value="hiit">HIIT</option>
                                    <option value="trekking">Trekking</option>
                                    <option value="sport(s)">Sport(s)</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Time to recovery</label>
                              <div className="relative">
                                <select name="personal_history__exercise_time_to_recovery" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="30-45 mins">30-45 mins</option>
                                  <option value="1 hr">1 hr</option>
                                  <option value="> 1 hr">&gt; 1 hr</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            {form["personal_history__exercise_time_to_recovery"] === "> 1 hr" && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Specify time</label>
                                <input name="personal_history__exercise_recovery_specify" type="text" placeholder="specify time" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Joint pains / Back pain after exercise</label>
                              <div className="relative">
                                <select name="personal_history__exercise_joint_pains" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="present">Present</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Perspiration</label>
                              <div className="relative">
                                <select name="personal_history__exercise_perspiration" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="profuse">Profuse</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">HR Variability</label>
                              <div className="relative">
                                <select name="personal_history__exercise_hr_variability" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="45 - 100ms">45 - 100ms</option>
                                  <option value="< 45ms">&lt; 45ms</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__exercise_regimen_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Body Weight Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Body Weight</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Stability</label>
                                <div className="relative">
                                  <select name="personal_history__body_weight_stability" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Stable">Stable</option>
                                    <option value="Fluctuating (< 1-2kgs )">Fluctuating (&lt; 1-2kgs )</option>
                                    <option value="Fluctuating (> 1-2kgs )">Fluctuating (&gt; 1-2kgs )</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Weight Gain</label>
                                <div className="relative">
                                  <select name="personal_history__body_weight_gain" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Proportionate to degree of caloric intake and/or exercise">Proportionate to degree of caloric intake and/or exercise</option>
                                    <option value="Disproportionate to degree of caloric intake and/or exercise">Disproportionate to degree of caloric intake and/or exercise</option>
                                    <option value="Significant weight gain ? (>5 kgs in 3 months)">Significant weight gain ? (&gt;5 kgs in 3 months)</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Weight Loss</label>
                                <div className="relative">
                                  <select name="personal_history__body_weight_loss" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Proportionate to degree of caloric intake and/or exercise">Proportionate to degree of caloric intake and/or exercise</option>
                                    <option value="Disproportionate to degree of caloric intake and/or exercise">Disproportionate to degree of caloric intake and/or exercise</option>
                                    <option value="Significant weight loss (> 1/10th of initial body weight in 6 months)">Significant weight loss (&gt; 1/10th of initial body weight in 6 months)</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__body_weight_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Personal Hygiene Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Personal Hygiene</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            
                            <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Bathing</h4>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">No. Of times a day in summers</label>
                                <input name="personal_history__hygiene_bathing_summers" type="text" placeholder="No. of times" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">No of times a day in Winters</label>
                                <input name="personal_history__hygiene_bathing_winters" type="text" placeholder="No. of times" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                            </div>

                            <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Any deviation from Normal</h4>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Heart Rate variability with Cold and Hot Showers</label>
                                <input name="personal_history__hygiene_hr_variability_showers" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Rash or Allergy after showers</label>
                                <input name="personal_history__hygiene_rash_allergy_showers" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Giddiness or suffocation during showers</label>
                                <input name="personal_history__hygiene_giddiness_showers" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Any H/o Loss of consciousness or seizures during or immediately post shower</label>
                                <input name="personal_history__hygiene_loc_seizures_showers" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Flushing after a hot shower ?</label>
                                <input name="personal_history__hygiene_flushing_hot_shower" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">H/o Falls in the bathroom ?</label>
                                <input name="personal_history__hygiene_falls_bathroom" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                            </div>

                            <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Brushing and Oral Hygiene</h4>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">No. of times a day - 1-2 times</label>
                                <input name="personal_history__hygiene_brushing_frequency" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration</label>
                                <input name="personal_history__hygiene_brushing_duration" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">H/o Dental Caries</label>
                                <input name="personal_history__hygiene_dental_caries" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Gingival swelling</label>
                                <input name="personal_history__hygiene_gingival_swelling" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Gingival bleeds</label>
                                <input name="personal_history__hygiene_gingival_bleeds" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Loose tooth or Teeth ?</label>
                                <input name="personal_history__hygiene_loose_tooth" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Signs of Bone resorption from the jaws or alveoli</label>
                                <input name="personal_history__hygiene_bone_resorption" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Sensitivity (to Hot or Cold)</label>
                                <input name="personal_history__hygiene_teeth_sensitivity" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Change of underclothes</label>
                                <div className="relative">
                                  <select name="personal_history__hygiene_change_underclothes" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="daily">Daily or even multiple times a day- 10 points</option>
                                    <option value="once in few days">Once in few days</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cutting of Nails</label>
                                <div className="relative">
                                  <select name="personal_history__hygiene_cutting_nails" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="periodically">Periodically</option>
                                    <option value="irregular">Irregular</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Towels</label>
                                <div className="relative">
                                  <select name="personal_history__hygiene_towels" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="common">Common</option>
                                    <option value="separate">Separate from household and/or Fresh daily</option>
                                    <option value="same used">Same used</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__personal_hygiene_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Body Temperature & Temperature Tolerance Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Body Temperature & Temperature Tolerance</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Exteremities</label>
                              <div className="relative">
                                <select name="personal_history__temperature_extremities" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="normal">Normal</option>
                                  <option value="generally cold">Generally cold</option>
                                  <option value="warm and flushed">Warm and flushed</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Tolerance</label>
                              <div className="relative">
                                <select name="personal_history__temperature_tolerance" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="normal">Normal</option>
                                  <option value="heat intolerance">Heat Intolerance</option>
                                  <option value="cold intolerance">Cold Intolerance</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Discernibility</label>
                              <div className="relative">
                                <select name="personal_history__temperature_discernibility" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="normal">Normal</option>
                                  <option value="cannot discern">Any area of the skin or extremities (Palms and soles) that cannot discern hot or cold ?</option>
                                  <option value="numbness">Numbness ?</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__body_temperature_temperature_tolerance_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Stress - PSS-10 Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Stress - The Percieved Stress Scale (PSS-10)</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            {[
                              { id: "q1", text: "(1) How often are you upset because of an unexpected occurrence" },
                              { id: "q2", text: "(2) How often have you felt that you were unable to control the important things in your life" },
                              { id: "q3", text: "(3) How often do you feel nervous and stressed" },
                              { id: "q4", text: "(4) How often do you feel confident in being able to handle your personal problems" },
                              { id: "q5", text: "(5) How often do you feel things have gone your way" },
                              { id: "q6", text: "(6) How often have you felt that you could not cope with all the things you had to do" },
                              { id: "q7", text: "(7) How often have you been able to control irritations in your life" },
                              { id: "q8", text: "(8) How often have you felt you were on top of things" },
                              { id: "q9", text: "(9) How often have you been angered because of things that were outside of your control" },
                              { id: "q10", text: "(10) How often have you felt difficulties were piling up so high that you could not overcome or deal with them" }
                            ].map((q) => (
                              <div key={q.id} className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">{q.text}</label>
                                <div className="flex flex-wrap items-center gap-6">
                                  {["Never", "very rare", "seldom", "often", "very often"].map((opt) => (
                                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                      <input type="radio" name={"personal_history__pss10_" + q.id} value={opt} className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                      <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828] capitalize">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__stress_the_percieved_stress_scale_pss_10__note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Women's Health & Menstrual History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Women's Health & Menstrual History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Age of menarche</label>
                              <div className="relative">
                                <select name="personal_history__womens_health_age_of_menarche" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="12-13yrs">12-13yrs</option>
                                  <option value="<12yrs">&lt;12yrs</option>
                                  <option value=">13yrs">&gt;13yrs</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Current menstrual status</label>
                              <div className="relative">
                                <select name="personal_history__womens_health_current_menstrual_status" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="regular">Regular</option>
                                  <option value="irregular">Irregular</option>
                                  <option value="stopped">Stopped</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Last menstrual period (LMP)</label>
                              <input name="personal_history__womens_health_lmp" type="text" placeholder="Specify LMP" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cycle changes in last 1–3 years - specify</label>
                              <input name="personal_history__womens_health_cycle_changes" type="text" placeholder="Specify changes" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Number of pregnancies</label>
                              <div className="relative">
                                <select name="personal_history__womens_health_pregnancies" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="NVD">NVD</option>
                                  <option value="LSCS">LSCS</option>
                                  <option value="Any Complications Prepartum, partum, postpartum">Any Complications Prepartum, partum, postpartum</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Any Miscarriages / MTP ?</label>
                              <div className="relative">
                                <select name="personal_history__womens_health_miscarriages" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="No">No</option>
                                  <option value="Miscarriages (Spontaneous Abortions)">Miscarriages (Spontaneous Abortions)</option>
                                  <option value="Medical Termination of Pregnancy (MTP)">Medical Termination of Pregnancy (MTP)</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">History of PCOS</label>
                              <div className="relative">
                                <select name="personal_history__womens_health_pcos" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                  <option value="">Select option</option>
                                  <option value="No">No</option>
                                  <option value="Yes">Yes</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-[#EAECF0] dark:border-[#374151]">
                              <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Core symptoms</h4>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Vasomotor</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_vasomotor" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Hot flashes">Hot flashes</option>
                                      <option value="night sweats">night sweats</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Frequency/Severity</label>
                                  <input name="personal_history__womens_health_vasomotor_frequency"
                                    type="text"
                                    placeholder="Enter frequency/severity"
                                    className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Neuropsychological</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_neuropsychological" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Mood swings">Mood swings</option>
                                      <option value="Anxiety">Anxiety</option>
                                      <option value="Irritability">Irritability</option>
                                      <option value="Brain fog">Brain fog</option>
                                      <option value="Memory issues">Memory issues</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Sleep Related</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_sleep_related" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Difficulty falling asleep">Difficulty falling asleep</option>
                                      <option value="Night awakenings">Night awakenings</option>
                                      <option value="Non-restorative sleep">Non-restorative sleep</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Sexual Health</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_sexual_health" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Libido">Libido</option>
                                      <option value="Vaginal dryness">Vaginal dryness</option>
                                      <option value="Pain during intercourse">Pain during intercourse</option>
                                      <option value="Arousal difficulty">Arousal difficulty</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Energy</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_energy" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Fatigue">Fatigue</option>
                                      <option value="Afternoon crashes">Afternoon crashes</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Body Composition</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_body_composition" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Weight gain (especially abdominal)">Weight gain (especially abdominal)</option>
                                      <option value="Loss of muscle">Loss of muscle</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Related Past Medical History</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_related_past_medical_history" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="History of breast cancer">History of breast cancer</option>
                                      <option value="Family history (breast / ovarian / Endometrial cancer)">Family history (breast / ovarian / Endometrial cancer)</option>
                                      <option value="History of DVT / Clotting / Stroke / Cardiovascular disease">History of DVT / Clotting / Stroke / Cardiovascular disease</option>
                                      <option value="Unexplained bleeding PV">Unexplained bleeding PV</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Medication history</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_medication_history" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="HRT use (past or current)">HRT use (past or current)</option>
                                      <option value="OCP consumption">OCP consumption</option>
                                      <option value="Antidepressants">Antidepressants</option>
                                      <option value="Steroids">Steroids</option>
                                      <option value="PDE-5 Inhibitors (For Pulmonary Arterial Hypertension)">PDE-5 Inhibitors (For Pulmonary Arterial Hypertension)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Bone Health</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_bone_health" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="History of fractures">History of fractures</option>
                                      <option value="Back pain">Back pain</option>
                                      <option value="Height loss">Height loss</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Urogenital Health</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_urogenital_health" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Urinary urgency">Urinary urgency</option>
                                      <option value="Recurrent UTIs">Recurrent UTIs</option>
                                      <option value="Incontinence">Incontinence</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cancer Screening Status</label>
                                  <div className="relative">
                                    <select name="personal_history__womens_health_cancer_screening_status" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="No Screening Done">No Screening Done</option>
                                      <option value="Last mammogram">Last mammogram</option>
                                      <option value="Pap smear">Pap smear</option>
                                      <option value="Pelvic exam">Pelvic exam</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-[#EAECF0] dark:border-[#374151]">
                              <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Quality Of Life</h4>
                              <div className="grid grid-cols-1 gap-6">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">How much are these symptoms affecting your daily life?</label>
                                  <input name="personal_history__womens_health_quality_of_life_impact" type="text" placeholder="Specify impact" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__women_s_health_menstrual_history_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Men's Sexual Health History Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Men's Sexual Health History</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Morning erections present?</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_morning_erections" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="Weak and Intermittent">Weak and Intermittent</option>
                                    <option value="No">No</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Libido vs erection (differentiate)</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_libido_vs_erection" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Normal - 10 points">Normal - 10 points</option>
                                    <option value="onset (sudden vs gradual) - Erectile difficulty">onset (sudden vs gradual) - Erectile difficulty</option>
                                    <option value="Low libido">Low libido</option>
                                    <option value="Premature ejaculation">Premature ejaculation</option>
                                    <option value="Delayed ejaculation">Delayed ejaculation</option>
                                    <option value="Infertility">Infertility</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Has your sexual desire reduced?</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_sexual_desire" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                    <option value="Frequency of sexual thoughts?">Frequency of sexual thoughts?</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Interest in intimacy?</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_intimacy_interest" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Declined">Declined</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Ability to get erection?</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_ability_to_get_erection" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Difficulty">Difficulty</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Ability to maintain erection?</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_ability_to_maintain_erection" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Rigidity sufficient for penetration?</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_rigidity_for_penetration" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Relationship satisfaction</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_relationship_satisfaction" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Performance anxiety</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_performance_anxiety" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Stress levels</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_stress_levels" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Low">Low</option>
                                    <option value="High">High</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pornography use</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_pornography_use" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Masturbation habits</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_masturbation_habits" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Children?</label>
                                <input name="personal_history__mens_health_children" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Attempts at conception?</label>
                                <input name="personal_history__mens_health_conception_attempts" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Prior semen analysis?</label>
                                <input name="personal_history__mens_health_prior_semen_analysis" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Urinary symptoms</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_urinary_symptoms" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">(l) prostate issues</label>
                                <div className="relative">
                                  <select name="personal_history__mens_health_prostate_issues" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              {form["personal_history__mens_health_prostate_issues"] === "Yes" && (
                                <>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Frequency</label>
                                    <input name="personal_history__mens_health_prostate_frequency" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Urgency</label>
                                    <input name="personal_history__mens_health_prostate_urgency" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Hesitancy</label>
                                    <input name="personal_history__mens_health_prostate_hesitancy" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Poor Flow</label>
                                    <input name="personal_history__mens_health_prostate_poor_flow" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Dribble</label>
                                    <input name="personal_history__mens_health_prostate_dribble" type="text" placeholder="Specify" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__men_s_sexual_health_history_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* General Physical Examination Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">General Physical Examination</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Appearance / Attitude</label>
                                <div className="relative">
                                  <select name="personal_history__gpe_appearance_attitude" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Normal">Normal</option>
                                    <option value="Any deviation from Normal">Any deviation from Normal</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Attention Span</label>
                                <div className="relative">
                                  <select name="personal_history__gpe_attention_span" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Good">Good</option>
                                    <option value="Distracted">Distracted</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Short Term Memory Span</label>
                                <div className="relative">
                                  <select name="personal_history__gpe_short_term_memory_span" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                    <option value="">Select option</option>
                                    <option value="Good and Sharp">Good and Sharp</option>
                                    <option value="Poor">Poor</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>

                            {/* Face and other Head and Neck Features */}
                            <div className="pt-4 border-t border-[#EAECF0] dark:border-[#374151]">
                              <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Face and other Head and Neck Features</h4>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Facies</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_facies" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="None">None</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Facial expressions">Facial expressions</option>
                                      <option value="Myasthenic Facies - drooping of eyelids, angles of the mouth">Myasthenic Facies - drooping of eyelids, angles of the mouth</option>
                                      <option value="Mask Facies">Mask Facies</option>
                                      <option value="Hypothyroid Facies">Hypothyroid Facies</option>
                                      <option value="Diabetic Facies">Diabetic Facies</option>
                                      <option value="Cushingoid Facies">Cushingoid Facies</option>
                                      <option value="Trisomy 21 Facies">Trisomy 21 Facies</option>
                                      <option value="Acromegalic Facies">Acromegalic Facies</option>
                                      <option value="Thyrotoxic Facies">Thyrotoxic Facies</option>
                                      <option value="Leonine">Leonine</option>
                                      <option value="Adenoid">Adenoid</option>
                                      <option value="Mitral">Mitral</option>
                                      <option value="Facial Tics">Facial Tics</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Lips</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_lips" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Pursed">Pursed</option>
                                      <option value="Pinched">Pinched</option>
                                      <option value="Cheilitis">Cheilitis</option>
                                      <option value="Cleft Lip and Palate">Cleft Lip and Palate</option>
                                      <option value="Xerochilia">Xerochilia</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-3 col-span-2">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Scars / Bruises / Naevi / Facial Puffiness</label>
                                  <div className="flex flex-col gap-y-3">
                                    {[
                                      "Scars",
                                      "Bruises",
                                      "Naevi",
                                      "Facial Puffiness",
                                      "Infraorbital Puffiness",
                                      "Periorbital Puffiness",
                                      "Nasal Allergic Crease"
                                    ].map((item) => (
                                      <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input name="personal_history__gpe_scars_bruises_naevi" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                        <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-3 col-span-2">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Buccopharyngeal Mucosa</label>
                                  <div className="flex flex-col gap-y-3">
                                    {[
                                      "Normal",
                                      "Not Present",
                                      "Thrush",
                                      "Aphthous Ulcers",
                                      "Glossitis",
                                      "Leukoplakia",
                                      "Hyperpigmentation",
                                      "Geographic Tongue",
                                      "Fissured Tongue"
                                    ].map((item) => (
                                      <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input name="personal_history__gpe_buccopharyngeal_mucosa" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                        <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Dental Formula</label>
                                  <input name="personal_history__gpe_dental_formula" type="text" placeholder="e.g. 32/32" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Dental Caries</label>
                                  <input name="personal_history__gpe_dental_caries" type="text" placeholder="Location & extent" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Gingivitis</label>
                                  <div className="flex items-center gap-4 h-11">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <input type="radio" name="personal_history__gpe_gingivitis" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                      <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <input type="radio" name="personal_history__gpe_gingivitis" value="Mild" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                      <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Mild</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <input type="radio" name="personal_history__gpe_gingivitis" value="Moderate" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                      <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Moderate</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                      <input type="radio" name="personal_history__gpe_gingivitis" value="Severe" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                      <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Severe</span>
                                    </label>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration (if present)</label>
                                  <input name="personal_history__gpe_gingivitis_duration" type="text" placeholder="" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>
                              </div>
                            </div>

                            {/* Gait */}
                            <div className="pt-4 border-t border-[#EAECF0] dark:border-[#374151]">
                              <h4 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Gait</h4>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Normal Stance and Swing Phases</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_gait_stance_swing" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Present">Present</option>
                                      <option value="Not Present">Not Present</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* Pallor */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pallor</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_pallor" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Not Present">Not Present</option>
                                      <option value="Present">Present</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pallor — Degree</label>
                                  <input name="personal_history__gpe_pallor_degree" type="text" placeholder="Specify degree" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Icterus */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Icterus</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_icterus" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Not Present">Not Present</option>
                                      <option value="Present">Present</option>
                                      <option value="Deep Jaundice">Deep Jaundice</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Icterus — Degree</label>
                                  <input name="personal_history__gpe_icterus_degree" type="text" placeholder="Specify degree" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Icterus — Duration</label>
                                  <input name="personal_history__gpe_icterus_duration" type="text" placeholder="Specify duration" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Cyanosis */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cyanosis</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_cyanosis" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Not Present">Not Present</option>
                                      <option value="Present — Central">Present — Central</option>
                                      <option value="Present — Peripheral">Present — Peripheral</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cyanosis — Degree</label>
                                  <input name="personal_history__gpe_cyanosis_degree" type="text" placeholder="Specify degree" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Lymphadenopathy */}
                                <div className="flex flex-col gap-1.5 col-span-2">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Lymphadenopathy</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_lymphadenopathy" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Not Present">Not Present</option>
                                      <option value="Present (Solitary)">Present (Solitary)</option>
                                      <option value="Present (Multiple)">Present (Multiple)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-3 col-span-2">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Lymphadenopathy — Descriptive Details</label>
                                  <div className="flex flex-col gap-y-3">
                                    {[
                                      "Anatomical Area",
                                      "Tender",
                                      "Non-Tender",
                                      "Erythematous",
                                      "Non-Erythematous",
                                      "Single Node",
                                      "Multiple Nodes",
                                      "Small (less than 1 cm)",
                                      "Large (greater than 1 cm)",
                                      "Soft",
                                      "Firm",
                                      "Hard",
                                      "Fluctuant",
                                      "Non-Fluctuant",
                                      "Mobile",
                                      "Fixed",
                                      "Matted",
                                      "Non-Matted",
                                      "Overlying Skin Changes Present",
                                      "No Overlying Skin Changes"
                                    ].map((item) => (
                                      <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input name="personal_history__gpe_lymphadenopathy_description" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                        <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Lymphadenopathy — Duration</label>
                                  <input name="personal_history__gpe_lymphadenopathy_duration" type="text" placeholder="Specify duration" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Edema */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Edema</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_edema" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Not Present">Not Present</option>
                                      <option value="Present — Pitting">Present — Pitting</option>
                                      <option value="Present — Non-Pitting">Present — Non-Pitting</option>
                                      <option value="Present — Waxing-waning">Present — Waxing-waning</option>
                                      <option value="Present — Progressive">Present — Progressive</option>
                                      <option value="Anasarca">Anasarca</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Edema — Details</label>
                                  <input name="personal_history__gpe_edema_details" type="text" placeholder="Location / Extent / Degree" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Edema — Duration</label>
                                  <input name="personal_history__gpe_edema_duration" type="text" placeholder="Specify duration" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Nail Changes */}
                                <div className="flex flex-col gap-3 col-span-2">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Nail Changes</label>
                                  <div className="flex flex-col gap-y-3">
                                    {[
                                      "None",
                                      "Digital Clubbing",
                                      "Platynychia",
                                      "Horizontal Ridges",
                                      "Vertical Ridges",
                                      "Colour Changes",
                                      "White Spots",
                                      "Pitting",
                                      "Other findings — Any deviation from Normal"
                                    ].map((item) => (
                                      <label key={item} className="flex items-center gap-2 cursor-pointer group w-fit">
                                        <input name="personal_history__gpe_nail_changes" value={item} type="checkbox" className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC] focus:ring-[#2E37A4]/20" />
                                        <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">{item}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5 col-span-2">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Nail Changes — Details</label>
                                  <input name="personal_history__gpe_nail_changes_details" type="text" placeholder="Grade, Distribution and other details" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Skin Hyperpigmentation */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Skin Hyperpigmentation</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_skin_hyperpigmentation" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="None">None</option>
                                      <option value="Present">Present</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Skin Hyperpigmentation — Details</label>
                                  <input name="personal_history__gpe_skin_hyperpigmentation_details" type="text" placeholder="Location / Extent / Margins / Distribution / Appearance" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Gait Pattern</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_gait_abnormal_pattern" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Antalgic">Antalgic</option>
                                      <option value="Scissors">Scissors</option>
                                      <option value="Shuffling">Shuffling</option>
                                      <option value="Ataxic">Ataxic</option>
                                      <option value="Festinating">Festinating</option>
                                      <option value="Steppage">Steppage</option>
                                      <option value="Trendelenburg">Trendelenburg</option>
                                      <option value="Choreiform">Choreiform</option>
                                      <option value="Magnetic">Magnetic</option>
                                      <option value="Stooping">Stooping</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* Hair Changes */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Hair Changes</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_hair_changes" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="None">None</option>
                                      <option value="Alopecia">Alopecia</option>
                                      <option value="Thinning">Thinning</option>
                                      <option value="Hyper-Mineralization Changes">Hyper-Mineralization Changes</option>
                                      <option value="Hypo-Mineralization Changes">Hypo-Mineralization Changes</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* Pulse */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pulse</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_pulse" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Atrial Fibrillation">Atrial Fibrillation</option>
                                      <option value="Unintended Bradycardia">Unintended Bradycardia</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pulse — Details</label>
                                  <input name="personal_history__gpe_pulse_details" type="text" placeholder="Rate / Rhythm / Volume / Character / Peripheral pulses / Delays / HRV / ABI / Bruits" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* BP */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">BP</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_bp" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal for age and gender">Normal for age and gender</option>
                                      <option value="Fluctuations">Fluctuations</option>
                                      <option value="Accelerated HTN">Accelerated HTN</option>
                                      <option value="Hypotension">Hypotension</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">BP — Details</label>
                                  <input name="personal_history__gpe_bp_details" type="text" placeholder="Systolic / Diastolic / Auscultation Gap / Pulse Pressure / MAP" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Body Temperature */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Body Temperature (°F)</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_body_temperature" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Abnormal">Abnormal</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Body Temperature — Value (°F)</label>
                                  <input name="personal_history__gpe_body_temperature_value" type="text" placeholder="Enter temperature value" className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all" />
                                </div>

                                {/* Hydration Status */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Hydration Status</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_hydration_status" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Adequate">Adequate</option>
                                      <option value="Dehydration">Dehydration</option>
                                      <option value="Severe Dehydration">Severe Dehydration</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* Respiratory Rate */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Respiratory Rate</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_respiratory_rate" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Signs of COPD">Signs of COPD</option>
                                      <option value="Signs of Failure">Signs of Failure</option>
                                      <option value="Abnormal Pattern">Abnormal Pattern</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* SpO2 */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">SpO2</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_spo2" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value=">90%">&gt;90%</option>
                                      <option value="<90%">&lt;90%</option>
                                      <option value="<85%">&lt;85%</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* Tongue */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Tongue</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_tongue" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal Pattern">Normal Pattern</option>
                                      <option value="Coated">Coated</option>
                                      <option value="Glossitis">Glossitis</option>
                                      <option value="Leukoplakia">Leukoplakia</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                                {/* ENT Examination */}
                                <div className="flex flex-col gap-1.5">
                                  <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">ENT Examination</label>
                                  <div className="relative">
                                    <select name="personal_history__gpe_ent_examination" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all">
                                      <option value="">Select option</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Abnormalities Present">Abnormalities Present</option>
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                  </div>
                                </div>

                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__general_physical_examination_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Miscellaneous Accordion */}
                        <div className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden">
                          <div className="bg-white dark:bg-[#1F2937] px-6 py-4 flex items-center justify-between border-b border-[#EAECF0] dark:border-[#374151]">
                            <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Miscellaneous</h3>
                            <ChevronDown className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
                          </div>
                          <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Perspiration</label>
                                <div className="relative">
                                  <select name="personal_history__perspiration" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select option</option>
                                    <option value="normal">Normal</option>
                                    <option value="excessive">Excessive</option>
                                    <option value="minimal">Minimal</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Body Odor</label>
                                <div className="relative">
                                  <select name="personal_history__body_odor" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                    <option value="">Select option</option>
                                    <option value="present">Present</option>
                                    <option value="not present">Not Present</option>
                                  </select>
                                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Halitosis (Bad Breath)</label>
                              <div className="relative">
                                <select name="personal_history__halitosis_bad_breath" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="present">Present</option>
                                  <option value="not present">Not Present</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 pt-4 mt-6 border-t border-[#EAECF0] dark:border-[#374151]">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Note</label>
                              <textarea
                                name="personal_history__miscellaneous_note"
                                rows={3}
                                placeholder="Add a note..."
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : activeSection === "Examination Summary" ? (
                    <>
                      {/* Appearance & Mental Status Header */}
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Appearance & Mental Status</h2>
                        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">General appearance and cognitive assessment</p>
                      </div>

                      <div className="space-y-10">
                        {/* General Appearance Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">General Appearance</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Appearance / Attitude</label>
                              <textarea name="examination_summary__appearance_attitude"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Attention Span</label>
                              <div className="relative">
                                <select name="examination_summary__attention_span" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="normal">Normal</option>
                                  <option value="distracted">Distracted</option>
                                  <option value="poor">Poor</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Short Term Memory</label>
                              <div className="relative">
                                <select name="examination_summary__short_term_memory" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="intact">Intact</option>
                                  <option value="impaired">Impaired</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gait Assessment Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Gait Assessment</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Stance & Swing Phases</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__stance_swing_phases" value="Normal" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Normal</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__stance_swing_phases" value="Abnormal" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Abnormal</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Gait Pattern</label>
                              <div className="relative">
                                <select name="examination_summary__gait_pattern" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select gait pattern</option>
                                  <option value="normal">Normal</option>
                                  <option value="antalgic">Antalgic</option>
                                  <option value="ataxic">Ataxic</option>
                                  <option value="hemiplegic">Hemiplegic</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration (if abnormal)</label>
                              <input name="examination_summary__duration_if_abnormal"
                                type="text"
                                placeholder="Duration"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Head & Neck Features Header */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Head & Neck Features</h2>
                          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Facial features, oral cavity, and neck examination</p>
                        </div>

                        {/* Facial Features Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Facial Features</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Facies</label>
                              <div className="relative">
                                <select name="examination_summary__facies" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select facies type</option>
                                  <option value="normal">Normal</option>
                                  <option value="adenoid">Adenoid</option>
                                  <option value="cushingoid">Cushingoid</option>
                                  <option value="parkinsonian">Parkinsonian</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Facial Tics</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__facial_tics" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__facial_tics" value="Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Scars / Bruises / Naevi</label>
                              <textarea name="examination_summary__scars_bruises_naevi"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Facial Puffiness</label>
                              <div className="relative">
                                <select name="examination_summary__facial_puffiness" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select type</option>
                                  <option value="none">None</option>
                                  <option value="periorbital">Periorbital</option>
                                  <option value="generalized">Generalized</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lips & Mouth Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Lips & Mouth</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Lip Findings</label>
                              <div className="relative">
                                <select name="examination_summary__lip_findings" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select findings</option>
                                  <option value="normal">Normal</option>
                                  <option value="pursed">Pursed</option>
                                  <option value="cheilitis">Cheilitis</option>
                                  <option value="cleft lip">Cleft lip</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Buccopharyngeal Examination</label>
                              <div className="relative">
                                <select name="examination_summary__buccopharyngeal_examination" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="normal">Normal</option>
                                  <option value="thrush">Thrush</option>
                                  <option value="ulcers">Ulcers</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Tongue Pattern</label>
                              <div className="relative">
                                <select name="examination_summary__tongue_pattern" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select tongue pattern</option>
                                  <option value="normal">Normal</option>
                                  <option value="geographic">Geographic</option>
                                  <option value="fissured">Fissured</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Tongue Coating</label>
                              <input name="examination_summary__tongue_coating"
                                type="text"
                                placeholder="Color and thickness"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dental Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Dental</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Dental Formula</label>
                              <input name="examination_summary__dental_formula"
                                type="text"
                                placeholder="e.g., 32/32"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Dental Caries</label>
                              <input name="examination_summary__dental_caries"
                                type="text"
                                placeholder="Location and extent"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Gingivitis</label>
                              <div className="flex items-center gap-4 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__gingivitis" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__gingivitis" value="Mild" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Mild</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__gingivitis" value="Moderate" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Moderate</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__gingivitis" value="Severe" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Severe</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration (if present)</label>
                              <input name="examination_summary__duration_if_present"
                                type="text"
                                placeholder=""
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* ENT Examination Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">ENT Examination</h3>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">ENT Findings</label>
                            <textarea name="examination_summary__ent_findings"
                              placeholder="Ears, nose, throat examination findings"
                              rows={3}
                              className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                            />
                          </div>
                        </div>

                        {/* ── Not part of the RMO intake ────────────────────────────────
                            GPE, Clinical Signs, and Systemic Examination are disabled via
                            RMO_SHOW_FULL_GPE (see top of file); their fields are also dropped
                            from the RMO field registry so nothing here is collected or saved. */}
                        {RMO_SHOW_FULL_GPE && (
                          <>
                        {/* General Physical Examination (GPE) Header */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">General Physical Examination (GPE)</h2>
                          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Cardiovascular, respiratory, and other vital parameters</p>
                        </div>

                        {/* Pulse Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Pulse</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Rate (bpm)</label>
                              <input name="examination_summary__rate_bpm"
                                type="text"
                                placeholder="e.g., 72"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Rhythm</label>
                              <div className="relative">
                                <select name="examination_summary__rhythm" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select rhythm</option>
                                  <option value="regular">Regular</option>
                                  <option value="irregular">Irregularly Irregular</option>
                                  <option value="regular_irregular">Regularly Irregular</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Volume</label>
                              <div className="relative">
                                <select name="examination_summary__volume" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select volume</option>
                                  <option value="normal">Normal</option>
                                  <option value="low">Low</option>
                                  <option value="high">High</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Character</label>
                              <div className="relative">
                                <select name="examination_summary__character" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select character</option>
                                  <option value="normal">Normal</option>
                                  <option value="collapsing">Collapsing</option>
                                  <option value="slow rising">Slow rising</option>
                                  <option value="bounding">Bounding</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">All Peripheral Pulses & Adequately</label>
                              <input name="examination_summary__all_peripheral_pulses_adequately"
                                type="text"
                                placeholder="All present and equal"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Bruits</label>
                              <div className="relative">
                                <select name="examination_summary__bruits" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="not present">Not Present</option>
                                  <option value="present">Present</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Blood Pressure Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Blood Pressure</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Systolic (mmHg)</label>
                              <input name="examination_summary__systolic_mmhg"
                                type="text"
                                placeholder="e.g., 120"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Diastolic (mmHg)</label>
                              <input name="examination_summary__diastolic_mmhg"
                                type="text"
                                placeholder="e.g., 80"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pulse Pressure</label>
                              <input name="examination_summary__pulse_pressure"
                                type="text"
                                placeholder="Calculated automatically"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">MAP</label>
                              <input name="examination_summary__map"
                                type="text"
                                placeholder="Mean Arterial Pressure"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Auscultation Gap</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__auscultation_gap" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__auscultation_gap" value="Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Body Temperature & Hydration Status Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Body Temperature & Hydration Status</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Body Temperature (°F)</label>
                              <input name="examination_summary__body_temperature_f"
                                type="text"
                                placeholder="98.6"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Hydration Status</label>
                              <div className="relative">
                                <select name="examination_summary__hydration_status" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select status</option>
                                  <option value="good">Good</option>
                                  <option value="fair">Fair</option>
                                  <option value="dehydrated">Dehydrated</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Respiratory Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Respiratory</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Rate (per min)</label>
                              <input name="examination_summary__rate_per_min"
                                type="text"
                                placeholder="e.g., 16"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pattern</label>
                              <div className="relative">
                                <select name="examination_summary__pattern" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select pattern</option>
                                  <option value="normal">Normal</option>
                                  <option value="dyspneic">Dyspneic</option>
                                  <option value="tachypneic">Tachypneic</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">SpO2 (%)</label>
                              <input name="examination_summary__spo2"
                                type="text"
                                placeholder="98"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Signs of COPD</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__signs_of_copd" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__signs_of_copd" value="Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5 col-span-2">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Respiratory Failure Signs</label>
                              <textarea name="examination_summary__respiratory_failure_signs"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Clinical Signs Header */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Clinical Signs</h2>
                          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">Pallor, icterus, cyanosis, and other signs</p>
                        </div>

                        {/* Pallor Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Pallor</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Pallor</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__pallor" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__pallor" value="Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Degree (if present)</label>
                              <div className="relative">
                                <select name="examination_summary__degree_if_present" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">1*, 2*, 3*, 4*</option>
                                  <option value="1">1*</option>
                                  <option value="2">2*</option>
                                  <option value="3">3*</option>
                                  <option value="4">4*</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Icterus Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Icterus</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Icterus</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__icterus" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__icterus" value="Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Degree (if present)</label>
                              <div className="relative">
                                <select name="examination_summary__degree_if_present_2" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">1*, 2*, 3*, 4*, Deep Jaundice</option>
                                  <option value="1">1*</option>
                                  <option value="2">2*</option>
                                  <option value="3">3*</option>
                                  <option value="4">4*</option>
                                  <option value="deep">Deep Jaundice</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration</label>
                              <input name="examination_summary__duration"
                                type="text"
                                placeholder="Duration In Days"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cyanosis Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Cyanosis</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cyanosis</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__cyanosis" value="Not Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Not Present</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__cyanosis" value="Present" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Present</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Type (if present)</label>
                              <div className="relative">
                                <select name="examination_summary__type_if_present" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select type</option>
                                  <option value="central">Central</option>
                                  <option value="peripheral">Peripheral</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Degree</label>
                              <div className="relative">
                                <select name="examination_summary__degree" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select degree</option>
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lymphadenopathy Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Lymphadenopathy</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Anatomical Area</label>
                              <div className="relative">
                                <select name="examination_summary__anatomical_area" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select area</option>
                                  <option value="none">None</option>
                                  <option value="cervical">Cervical</option>
                                  <option value="axillary">Axillary</option>
                                  <option value="inguinal">Inguinal</option>
                                  <option value="multiple">Multiple</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Tenderness</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__tenderness" value="Tender" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Tender</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__tenderness" value="Non-tender" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Non-tender</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Size & Number</label>
                              <input name="examination_summary__size_number"
                                type="text"
                                placeholder="Size and number of nodes"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration</label>
                              <input name="examination_summary__duration_2"
                                type="text"
                                placeholder=""
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Edema Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Edema</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Location</label>
                              <input name="examination_summary__location"
                                type="text"
                                placeholder="Bilateral lower limbs / Facial"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Type</label>
                              <div className="flex items-center gap-6 h-11">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__type" value="Pitting" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Pitting</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input type="radio" name="examination_summary__type" value="Non-pitting" className="w-4 h-4 border-[#D0D5DD] dark:border-[#374151] text-[#6B2B26] dark:text-[#A5B4FC] focus:ring-[#6B2B26]/20" />
                                  <span className="text-sm text-[#344054] dark:text-[#CBD5E1] group-hover:text-[#101828]">Non-pitting</span>
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Degree</label>
                              <div className="relative">
                                <select name="examination_summary__degree_2" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select degree</option>
                                  <option value="1">1+</option>
                                  <option value="2">2+</option>
                                  <option value="3">3+</option>
                                  <option value="4">4+</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Duration</label>
                              <input name="examination_summary__duration_3"
                                type="text"
                                placeholder=""
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Nails, Skin & Hair Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Nails, Skin & Hair</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Digital Clubbing</label>
                              <input name="examination_summary__digital_clubbing"
                                type="text"
                                placeholder="Grade and distribution"
                                className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Nail Changes</label>
                              <div className="relative">
                                <select name="examination_summary__nail_changes" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="ridges">Ridges</option>
                                  <option value="color changes">Color changes</option>
                                  <option value="pitting">Pitting</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Skin Hyperpigmentation</label>
                              <textarea name="examination_summary__skin_hyperpigmentation"
                                placeholder="Location / Extent / Margins"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Hair Changes</label>
                              <div className="relative">
                                <select name="examination_summary__hair_changes" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select option</option>
                                  <option value="none">None</option>
                                  <option value="alopecia">Alopecia</option>
                                  <option value="thinning">Thinning</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Systemic Examination Header */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Systemic Examination</h2>
                          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">CVS, RS, P/A, and CNS examination findings</p>
                        </div>

                        {/* Cardiovascular System (CVS) Section */}
                        <div>
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Cardiovascular System (CVS)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Inspection</label>
                              <textarea name="examination_summary__cvs_inspection"
                                placeholder="Visible pulsations, chest deformities, scars"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Palpation</label>
                              <textarea name="examination_summary__cvs_palpation"
                                placeholder="Apical beat, thrills, heaves, parasternal impulse"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Percussion</label>
                              <textarea name="examination_summary__cvs_percussion"
                                placeholder="Cardiac dullness boundaries"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Auscultation</label>
                              <textarea name="examination_summary__cvs_auscultation"
                                placeholder="Heart sounds (S1, S2), murmurs, additional sounds"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Respiratory System (RS) Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Respiratory System (RS)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Inspection</label>
                              <textarea name="examination_summary__rs_inspection"
                                placeholder="Chest shape, respiratory rate, use of accessory muscles"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Palpation</label>
                              <textarea name="examination_summary__rs_palpation"
                                placeholder="Chest expansion, tactile fremitus, tracheal position"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Percussion</label>
                              <textarea name="examination_summary__rs_percussion"
                                placeholder="Resonance, dullness, hyperresonance"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Auscultation</label>
                              <textarea name="examination_summary__rs_auscultation"
                                placeholder="Breath sounds, crackles, wheezes, vocal resonance"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Per Abdomen (P/A) Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Per Abdomen (P/A)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Inspection</label>
                              <textarea name="examination_summary__pa_inspection"
                                placeholder="Shape, distension, scars, visible peristalsis, veins"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Palpation</label>
                              <textarea name="examination_summary__pa_palpation"
                                placeholder="Tenderness, guarding, rigidity, organomegaly, masses"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Percussion</label>
                              <textarea name="examination_summary__pa_percussion"
                                placeholder="Liver span, shifting dullness, free fluid"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Auscultation</label>
                              <textarea name="examination_summary__pa_auscultation"
                                placeholder="Bowel sounds, bruits, friction rubs"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Central Nervous System (CNS) Section */}
                        <div className="pt-8 border-t border-[#EAECF0] dark:border-[#374151]">
                          <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Central Nervous System (CNS)</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Consciousness Level</label>
                              <div className="relative">
                                <select name="examination_summary__consciousness_level" className="w-full h-11 pl-4 pr-10 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] appearance-none focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all">
                                  <option value="">Select level</option>
                                  <option value="alert">Alert</option>
                                  <option value="drowsy">Drowsy</option>
                                  <option value="stuporous">Stuporous</option>
                                  <option value="comatose">Comatose</option>
                                </select>
                                <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#667085] dark:text-[#94A3B8] pointer-events-none" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Higher Mental Functions (MMSE)</label>
                              <textarea name="examination_summary__higher_mental_functions_mmse"
                                placeholder="Orientation (time, place, person), memory, speech"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Cranial Nerves (I-XII)</label>
                              <textarea name="examination_summary__cranial_nerves"
                                placeholder="CN I to XII examination findings"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Motor System</label>
                              <textarea name="examination_summary__motor_system"
                                placeholder="Tone, power (grade 0-5), reflexes, coordination"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Sensory System</label>
                              <textarea name="examination_summary__sensory_system"
                                placeholder="Touch, pain, temperature, vibration, proprioception"
                                rows={3}
                                className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>
                          </>
                        )}
                      </div>
                    </>
                ) : null}
                </form>
              ) : activeMainStep === "Vitals" ? (
                /* Vitals tab */
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Vitals</h2>
                    <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
                      Record the patient&apos;s vitals for this visit. Readings are saved to the patient record.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] p-6 mb-6">
                    <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Latest reading</h3>
                    {latestVital === undefined ? (
                      <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" />
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

                  <h3 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Record new reading</h3>
                  <form onSubmit={recordVital} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <VitalInput label="Systolic (mmHg)" value={vitalForm.systolic} onChange={(v) => setVitalForm({ ...vitalForm, systolic: v })} />
                    <VitalInput label="Diastolic (mmHg)" value={vitalForm.diastolic} onChange={(v) => setVitalForm({ ...vitalForm, diastolic: v })} />
                    <VitalInput label="Heart rate (bpm)" value={vitalForm.heartRate} onChange={(v) => setVitalForm({ ...vitalForm, heartRate: v })} />
                    <VitalInput label="Weight (kg)" value={vitalForm.weightKg} onChange={(v) => setVitalForm({ ...vitalForm, weightKg: v })} />
                    <VitalInput label="Temp (°F)" value={vitalForm.temperatureF} onChange={(v) => setVitalForm({ ...vitalForm, temperatureF: v })} />
                    <VitalInput label="SpO₂ (%)" value={vitalForm.spo2} onChange={(v) => setVitalForm({ ...vitalForm, spo2: v })} />
                    <div className="col-span-2 sm:col-span-3">
                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Notes</span>
                        <input
                          value={vitalForm.notes}
                          onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })}
                          placeholder="Optional"
                          className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
                        />
                      </label>
                    </div>
                    <div className="col-span-2 sm:col-span-3 flex justify-end">
                      <Button
                        type="submit"
                        disabled={vitalSaving || !patientId}
                        className="bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white flex items-center gap-2"
                      >
                        {vitalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save vitals
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Summary tab */
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Consultation Summary</h2>
                    <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
                      Review the intake, then book the next step for this patient.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] p-6">
                    <p className="text-sm text-[#344054] dark:text-[#CBD5E1]">
                      Patient{" "}
                      <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                        {consult.patient?.fullName ?? "—"}
                      </span>
                      . Below is the complete RMO intake — every question, with answers
                      shown where captured and the rest marked unfilled. Use the actions
                      to schedule a follow-up RMO visit or refer the patient on to
                      Dr. Yuvraaj Singh for the main consultation.
                    </p>
                  </div>

                  {/* Tab-based summary: one sub-tab per section (+ Vitals/Quiz) */}
                  {(() => {
                    // Every section is shown — even with zero answers — so the
                    // summary reads as a complete intake checklist. A dot on the
                    // sub-tab flags which sections actually have data captured.
                    const tabs: { key: string; label: string; filled: boolean }[] = [
                      ...SECTION_ORDER.map((s) => ({
                        key: s,
                        label: SECTION_LABEL[s],
                        filled: RMO_FIELDS.some(
                          (f) => f.s === s && (form[f.n] ?? "").trim() !== "",
                        ),
                      })),
                      ...(latestVital ? [{ key: "__vitals", label: "Vitals", filled: true }] : []),
                      ...(quiz ? [{ key: "__quiz", label: "Quiz Assessment", filled: true }] : []),
                    ]
                    if (tabs.length === 0) {
                      return (
                        <div className="mt-6 rounded-xl border border-dashed border-[#D0D5DD] dark:border-[#374151] p-6 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
                          No consultation data captured yet. Fill in the RMO Consultation
                          tab and click Save.
                        </div>
                      )
                    }
                    const current = tabs.some((t) => t.key === summaryTab)
                      ? summaryTab
                      : tabs[0].key

                    return (
                      <div className="mt-6 rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
                        {/* Sub-tab strip */}
                        <div className="flex flex-wrap gap-1.5 p-3 bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
                          {tabs.map((t) => {
                            const active = current === t.key
                            const isSection = t.key !== "__vitals" && t.key !== "__quiz"
                            return (
                              <button
                                key={t.key}
                                onClick={() => setSummaryTab(t.key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  active
                                    ? "bg-[#6B2B26] text-white"
                                    : "text-[#667085] dark:text-[#94A3B8] hover:bg-white hover:text-[#101828]"
                                }`}
                              >
                                {isSection ? (
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${
                                      t.filled
                                        ? active
                                          ? "bg-white"
                                          : "bg-[#0E8C6A]"
                                        : active
                                          ? "bg-white/40"
                                          : "bg-[#D0D5DD] dark:bg-[#475569]"
                                    }`}
                                  />
                                ) : null}
                                {t.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Active panel */}
                        <div className="p-5">
                          {current === "__vitals" && latestVital ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                                  Latest Vitals
                                </h3>
                                <button
                                  onClick={() => setActiveMainStep("Vitals")}
                                  className="text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline"
                                >
                                  Record new reading →
                                </button>
                              </div>
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
                              {latestVital.notes ? (
                                <p className="mt-4 text-sm text-[#344054] dark:text-[#CBD5E1] whitespace-pre-wrap">
                                  <span className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">Notes: </span>
                                  {latestVital.notes}
                                </p>
                              ) : null}
                            </div>
                          ) : current === "__quiz" && quiz ? (
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                                  Health Assessment Quiz
                                </h3>
                                <span className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">
                                  {quiz.totalScore}
                                  <span className="text-xs font-normal text-[#667085] dark:text-[#94A3B8]">
                                    {" "}
                                    / {quiz.scoreOutOf}
                                  </span>
                                  <span className="ml-2 text-xs font-semibold text-[#3538CD]">
                                    {quiz.band}
                                  </span>
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
                                className="inline-block mt-3 text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline"
                              >
                                View full quiz assessment →
                              </Link>
                            </div>
                          ) : (
                            (() => {
                              const fields = RMO_FIELDS.filter((f) => f.s === current)
                              const answered = fields.filter(
                                (f) => (form[f.n] ?? "").trim() !== "",
                              ).length
                              // Group fields by their sub-section, preserving
                              // registry order; fields without a `sub` fall into
                              // a single leading unlabelled group.
                              const groups: { sub: string; items: typeof fields }[] = []
                              for (const f of fields) {
                                const key = f.sub ?? ""
                                let g = groups.find((x) => x.sub === key)
                                if (!g) {
                                  g = { sub: key, items: [] }
                                  groups.push(g)
                                }
                                g.items.push(f)
                              }
                              const complete = answered === fields.length && fields.length > 0
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
                                      {answered} / {fields.length} answered
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-6">
                                    {groups.map((g) => (
                                      <div key={g.sub || "_default"}>
                                        {g.sub ? (
                                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6B2B26] dark:text-[#A5B4FC] mb-1.5">
                                            {g.sub}
                                          </h4>
                                        ) : null}
                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                                          {g.items.map((f) => {
                                            const val = (form[f.n] ?? "").trim()
                                            return (
                                              <div
                                                key={f.n}
                                                className="flex flex-col gap-0.5 py-2.5 border-b border-[#EAECF0] dark:border-[#374151]"
                                              >
                                                <dt className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">
                                                  {f.l}
                                                </dt>
                                                <dd className="text-sm whitespace-pre-wrap break-words">
                                                  {val ? (
                                                    <span className="text-[#101828] dark:text-[#F9FAFB]">
                                                      {val}
                                                    </span>
                                                  ) : (
                                                    <span className="italic text-[#98A2B3] dark:text-[#64748B]">
                                                      Not provided
                                                    </span>
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
                            })()
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={bookRmoFollowUp}
                      className="flex items-center gap-3 rounded-xl border border-[#EAECF0] dark:border-[#374151] p-5 text-left hover:border-[#6B2B26] hover:bg-[#F9ECEB] transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-[#F9ECEB] dark:bg-[#312E81] flex items-center justify-center">
                        <CalendarPlus className="h-5 w-5 text-[#6B2B26] dark:text-[#A5B4FC]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Book RMO follow-up</p>
                        <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Schedule another RMO visit</p>
                      </div>
                    </button>

                    <button
                      onClick={bookDoctorAppointment}
                      className="flex items-center gap-3 rounded-xl border border-[#EAECF0] dark:border-[#374151] p-5 text-left hover:border-[#6B2B26] hover:bg-[#F9ECEB] transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-[#FDF2E9] flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-[#B93815]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Book with Dr. Yuvraaj Singh</p>
                        <p className="text-xs text-[#667085] dark:text-[#94A3B8]">Refer for main consultation</p>
                      </div>
                    </button>
                  </div>
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
        <Button
          variant="outline"
          onClick={bookRmoFollowUp}
          className="flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" /> Book RMO follow-up
        </Button>
        <Button
          onClick={bookDoctorAppointment}
          className="bg-[#6B2B26] hover:bg-[#54201D] text-white flex items-center gap-2"
        >
          <Stethoscope className="h-4 w-4" /> Book with Dr. Yuvraaj Singh
        </Button>
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

function VitalInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] transition-all"
      />
    </label>
  )
}
