"use client"

/**
 * Add Appointment — 4-step wizard wired to real APIs.
 *
 *   Step 0 — Patient: search /api/patients and pick the existing row
 *   Step 1 — Doctor + slot: pick a staff member (/api/staff filtered to
 *            DOCTOR + RMO), pick date / time / duration
 *   Step 2 — Reason + notes free text
 *   Step 3 — Review and submit (POST /api/appointments)
 *
 * The previous version of this page had a hardcoded doctor list and
 * disconnected inputs, and the "Next" button never submitted anything.
 * This rewrite uses real fetches for the patient & doctor pickers and
 * POSTs the createAppointmentSchema shape on the final step.
 */

import Link from "next/link"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Save,
  Search,
  Stethoscope,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

/** Clinic working hours (local, 24h "HH:MM"). The availability service has
 *  no per-staff schedule yet, so the booking UI bounds slot generation to
 *  this window. Clinic operates 10:00 AM – 6:00 PM (incl. Dr. Yuvraaj).
 *  Make this configurable per department/staff in a later pass. */
const CLINIC_OPEN = "10:00"
const CLINIC_CLOSE = "18:00"

const STEPS = [
  { id: "patient", name: "Patient", Icon: User },
  { id: "slot", name: "Doctor & Slot", Icon: Calendar },
  { id: "details", name: "Details", Icon: FileText },
  { id: "review", name: "Review", Icon: CheckCircle },
] as const

type Patient = {
  id: string
  patientNumber: string
  fullName: string
  email: string | null
  phone: string | null
}

type Doctor = {
  id: string
  fullName: string
  specialization: string | null
  role: string
}

type FormState = {
  patient: Patient | null
  doctor: Doctor | null
  date: string
  time: string
  durationMin: number
  reason: string
  notes: string
}

const empty: FormState = {
  patient: null,
  doctor: null,
  date: "",
  time: "",
  durationMin: 30,
  reason: "",
  notes: "",
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={null}>
      <NewAppointmentPageInner />
    </Suspense>
  )
}

function NewAppointmentPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(empty)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Prefill hints from the RMO consultation hand-off
  // (?patientId=…&doctor=Yuvraaj or ?role=RMO).
  const prefillPatientId = searchParams.get("patientId")
  const prefillDoctorName = searchParams.get("doctor")
  const prefillRole = searchParams.get("role")

  // Preselect the patient when arriving with ?patientId.
  useEffect(() => {
    if (!prefillPatientId) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/patients/${prefillPatientId}`, {
          credentials: "include",
        })
        if (!res.ok) return
        const json = await res.json()
        const p = json?.data ?? json
        if (cancelled || !p?.id) return
        setForm((f) => ({
          ...f,
          patient: {
            id: p.id,
            patientNumber: p.patientNumber ?? "",
            fullName: p.fullName ?? "",
            email: p.email ?? null,
            phone: p.phone ?? null,
          },
        }))
        setStep((s) => (s === 0 ? 1 : s))
      } catch {
        /* ignore — user can still pick manually */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [prefillPatientId])

  // Preselect the date (+ reason) when arriving from a "Book follow-up"
  // hand-off so the slot picker opens pre-dated instead of blank.
  const prefillDate = searchParams.get("date")
  const prefillReason = searchParams.get("reason")
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!prefillDate && !prefillReason) return
    setForm((f) => ({
      ...f,
      ...(prefillDate ? { date: prefillDate } : {}),
      ...(prefillReason && !f.reason ? { reason: prefillReason } : {}),
    }))
  }, [prefillDate, prefillReason])
  /* eslint-enable react-hooks/set-state-in-effect */

  const canAdvance = useMemo(() => {
    if (step === 0) return form.patient !== null
    if (step === 1)
      return Boolean(form.doctor && form.date && form.time && form.durationMin > 0)
    return true
  }, [step, form])

  const next = () => {
    if (!canAdvance) return
    if (step < STEPS.length - 1) setStep(step + 1)
  }
  const prev = () => step > 0 && setStep(step - 1)

  const submit = async () => {
    if (submitting) return
    if (!form.patient || !form.doctor || !form.date || !form.time) return
    setSubmitting(true)
    setFieldErrors({})
    try {
      const startsAt = new Date(`${form.date}T${form.time}:00`)
      if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid date/time")
      const endsAt = new Date(startsAt.getTime() + form.durationMin * 60_000)
      const body = {
        patientId: form.patient.id,
        staffId: form.doctor.id,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        ...(form.reason.trim() ? { reason: form.reason.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      }
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
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
        throw new Error(json?.error?.message ?? "Booking failed")
      }
      // The patient + doctor confirmation emails are sent when the
      // appointment is ACCEPTED (REQUESTED → CONFIRMED), not at booking time.
      notify.success("Appointment booked", {
        description: "A confirmation email is sent once the appointment is accepted.",
      })
      router.push("/admin/appointments")
    } catch (err) {
      notify.error("Couldn't create appointment", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">New Appointment</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            Pick an existing patient, doctor, and slot.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/appointments">
            <Button
              variant="outline"
              className="px-6 h-11 border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] font-semibold rounded-lg"
            >
              Cancel
            </Button>
          </Link>
          {step > 0 ? (
            <Button
              variant="outline"
              className="px-6 h-11 border-[#6B2B26] text-[#6B2B26] dark:text-[#A5B4FC] font-semibold hover:bg-[#F9ECEB] rounded-lg"
              onClick={prev}
            >
              Previous
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button
              className="px-6 h-11 bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white font-semibold rounded-lg"
              disabled={!canAdvance}
              onClick={next}
            >
              Next
            </Button>
          ) : (
            <Button
              className="px-6 h-11 bg-[#12B76A] hover:bg-[#0E9A57] disabled:bg-[#D5ABAB] text-white font-semibold rounded-lg inline-flex items-center gap-2"
              disabled={submitting || !canAdvance}
              onClick={() => void submit()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Book Appointment
            </Button>
          )}
        </div>
      </div>

      <div>
        <Link
          href="/admin/appointments"
          className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to appointments
        </Link>
      </div>

      {/* Stepper */}
      <div className="border-b border-[#EAECF0] dark:border-[#374151]">
        <div className="flex gap-8 overflow-x-auto pb-px">
          {STEPS.map((s, i) => {
            const isActive = step === i
            const Icon = s.Icon
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 pb-4 px-1 relative transition-all whitespace-nowrap ${
                  isActive
                    ? "text-[#6B2B26] dark:text-[#A5B4FC]"
                    : "text-[#667085] dark:text-[#94A3B8] hover:text-[#101828]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                  {s.name}
                </span>
                {isActive ? (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B2B26] rounded-full" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* Step body */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 max-w-[1000px]">
          {step === 0 ? (
            <PatientPicker
              selected={form.patient}
              onSelect={(p) => setForm({ ...form, patient: p })}
            />
          ) : null}
          {step === 1 ? (
            <SlotPicker
              form={form}
              setForm={setForm}
              fieldErrors={fieldErrors}
              preselectDoctorName={prefillDoctorName}
              preselectRole={prefillRole}
            />
          ) : null}
          {step === 2 ? <DetailsStep form={form} setForm={setForm} /> : null}
          {step === 3 ? <ReviewStep form={form} /> : null}
        </div>
      </div>
    </div>
  )
}

/* ── Step 0: patient picker ────────────────────────────────────── */

function PatientPicker({
  selected,
  onSelect,
}: {
  selected: Patient | null
  onSelect: (p: Patient) => void
}) {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced search. The setLoading/setItems calls inside are the
  // *purpose* of the effect (mirror remote search results into React
  // state); React 18's set-state-in-effect rule doesn't model that
  // pattern, so we silence it here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const url = new URL("/api/patients", window.location.origin)
        if (query.trim()) url.searchParams.set("q", query.trim())
        url.searchParams.set("limit", "10")
        const res = await fetch(url.toString(), { credentials: "include" })
        if (!res.ok) throw new Error()
        const json = await res.json()
        if (!cancelled) setItems(json?.data ?? [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF]">
          <User className="h-5 w-5 text-[#6B2B26] dark:text-[#A5B4FC]" />
        </div>
        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Select Patient</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or patient #…"
          className="w-full pl-10 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"
        />
      </div>

      <div className="border border-[#EAECF0] dark:border-[#374151] rounded-lg divide-y divide-[#EAECF0] dark:divide-[#374151] max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-[#667085] dark:text-[#94A3B8] flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
            No patients matched.{" "}
            <Link href="/admin/patients/add" className="text-[#6B2B26] dark:text-[#A5B4FC] font-semibold hover:underline">
              Add a new patient
            </Link>
            .
          </div>
        ) : (
          items.map((p) => {
            const isSel = selected?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p)}
                className={`w-full text-left px-4 py-3 hover:bg-[#F9FAFB] transition-colors ${
                  isSel ? "bg-[#F9ECEB] dark:bg-[#312E81]" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{p.fullName}</p>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                      #{p.patientNumber} · {p.email ?? "no email"} ·{" "}
                      {p.phone ?? "no phone"}
                    </p>
                  </div>
                  {isSel ? (
                    <CheckCircle className="h-5 w-5 text-[#12B76A]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] -rotate-90" />
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

/* ── Step 1: doctor + slot ─────────────────────────────────────── */

function SlotPicker({
  form,
  setForm,
  fieldErrors,
  preselectDoctorName,
  preselectRole,
}: {
  form: FormState
  setForm: (f: FormState) => void
  fieldErrors: Record<string, string>
  preselectDoctorName?: string | null
  preselectRole?: string | null
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  // Open slots for the selected doctor + date + duration.
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const fetchDoctors = useCallback(async () => {
    try {
      const url = new URL("/api/staff", window.location.origin)
      url.searchParams.set("limit", "100")
      const res = await fetch(url.toString(), { credentials: "include" })
      const json = await res.json()
      const items = (json?.data ?? json?.items ?? []) as Doctor[]
      const filtered = items.filter((d) => d.role === "DOCTOR" || d.role === "RMO")
      setDoctors(filtered)
      // Preselect the hand-off target doctor if the page was opened with a hint.
      if (!form.doctor && (preselectDoctorName || preselectRole)) {
        const match =
          (preselectDoctorName &&
            filtered.find((d) =>
              d.fullName.toLowerCase().includes(preselectDoctorName.toLowerCase()),
            )) ||
          (preselectRole && filtered.find((d) => d.role === preselectRole)) ||
          null
        if (match) setForm({ ...form, doctor: match })
      }
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectDoctorName, preselectRole])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchDoctors()
  }, [fetchDoctors])

  // Fetch open slots whenever doctor / date / duration changes.
  const doctorId = form.doctor?.id
  const { date, durationMin } = form
  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([])
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    setSlotsError(null)
    void (async () => {
      try {
        // Clinic working hours (local) — the availability service has no
        // working-hours overlay, so we bound the request to 09:00–18:00.
        const from = new Date(`${date}T${CLINIC_OPEN}:00`)
        const to = new Date(`${date}T${CLINIC_CLOSE}:00`)
        const url = new URL("/api/appointments/availability", window.location.origin)
        url.searchParams.set("staffId", doctorId)
        url.searchParams.set("from", from.toISOString())
        url.searchParams.set("to", to.toISOString())
        url.searchParams.set("durationMins", String(durationMin))
        const res = await fetch(url.toString(), { credentials: "include" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setSlots((json?.data ?? []) as { start: string; end: string }[])
      } catch (err) {
        if (!cancelled) {
          setSlots([])
          setSlotsError(err instanceof Error ? err.message : "Couldn't load slots")
        }
      } finally {
        if (!cancelled) setSlotsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [doctorId, date, durationMin])
  /* eslint-enable react-hooks/set-state-in-effect */

  const hhmm = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center border border-[#ABEFC6]">
          <Calendar className="h-5 w-5 text-[#027A48]" />
        </div>
        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Doctor &amp; Slot</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Doctor" required error={fieldErrors.staffId}>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
            <select
              value={form.doctor?.id ?? ""}
              onChange={(e) => {
                const d = doctors.find((x) => x.id === e.target.value) ?? null
                setForm({ ...form, doctor: d, time: "" })
              }}
              disabled={loading}
              className="w-full h-11 pl-10 pr-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26] disabled:bg-[#F9FAFB]"
            >
              <option value="">
                {loading
                  ? "Loading…"
                  : doctors.length === 0
                    ? "No doctors yet"
                    : "Select a doctor"}
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                  {d.specialization ? ` · ${d.specialization}` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Duration" required>
          <select
            value={String(form.durationMin)}
            onChange={(e) =>
              setForm({ ...form, durationMin: Number.parseInt(e.target.value, 10), time: "" })
            }
            className="w-full h-11 px-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </Field>

        <Field label="Date" required error={fieldErrors.startsAt}>
          <input
            type="date"
            value={form.date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
            className="w-full h-11 px-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"
          />
        </Field>

      </div>

      {/* Available open slots (driven by /api/appointments/availability) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
          <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
            Available time slots{form.durationMin ? ` · ${form.durationMin} min` : ""}
          </span>
          {fieldErrors.endsAt ? (
            <span className="text-xs text-[#B42318]">{fieldErrors.endsAt}</span>
          ) : null}
        </div>

        {!form.doctor || !form.date ? (
          <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">
            Select a doctor and date to see {form.doctor?.fullName ?? "the doctor"}&apos;s open slots.
          </p>
        ) : slotsLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading open slots…
          </div>
        ) : slotsError ? (
          <p className="text-sm text-[#B42318]">{slotsError}</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">
            No open slots for this day — try another date or a shorter duration.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {slots.map((s) => {
              const t = hhmm(s.start)
              const selected = form.time === t
              return (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => setForm({ ...form, time: t })}
                  className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                    selected
                      ? "bg-[#6B2B26] border-[#6B2B26] text-white"
                      : "border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:border-[#6B2B26] hover:bg-[#F9ECEB]"
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Step 2: details ────────────────────────────────────────────── */

function DetailsStep({
  form,
  setForm,
}: {
  form: FormState
  setForm: (f: FormState) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#F9F5FF] flex items-center justify-center border border-[#E9D7FE]">
          <FileText className="h-5 w-5 text-[#6941C6]" />
        </div>
        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Details</h2>
      </div>

      <Field label="Reason for visit">
        <textarea
          rows={4}
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          placeholder="Chief complaint, referral context, etc."
          className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26] resize-y"
        />
      </Field>
      <Field label="Internal notes (optional)">
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Anything reception/doctor should know ahead of the visit"
          className="w-full px-4 py-3 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26] resize-y"
        />
      </Field>
    </div>
  )
}

/* ── Step 3: review ─────────────────────────────────────────────── */

function ReviewStep({ form }: { form: FormState }) {
  const dateLabel = form.date
    ? new Date(`${form.date}T${form.time || "00:00"}:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center border border-[#ABEFC6]">
          <CheckCircle className="h-5 w-5 text-[#027A48]" />
        </div>
        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Review</h2>
      </div>
      <div className="bg-[#F9FAFB] dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 text-sm">
        <ReviewBlock title="Patient">
          {form.patient ? (
            <>
              <p className="font-semibold text-[#101828] dark:text-[#F9FAFB]">{form.patient.fullName}</p>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
                #{form.patient.patientNumber}
                {form.patient.email ? ` · ${form.patient.email}` : ""}
                {form.patient.phone ? ` · ${form.patient.phone}` : ""}
              </p>
            </>
          ) : (
            <p className="text-[#98A2B3] dark:text-[#94A3B8]">Not selected</p>
          )}
        </ReviewBlock>
        <ReviewBlock title="Doctor">
          {form.doctor ? (
            <>
              <p className="font-semibold text-[#101828] dark:text-[#F9FAFB]">{form.doctor.fullName}</p>
              {form.doctor.specialization ? (
                <p className="text-xs text-[#6B2B26] dark:text-[#A5B4FC]">{form.doctor.specialization}</p>
              ) : null}
            </>
          ) : (
            <p className="text-[#98A2B3] dark:text-[#94A3B8]">Not selected</p>
          )}
        </ReviewBlock>
        <ReviewBlock title="Date">{dateLabel}</ReviewBlock>
        <ReviewBlock title="Time">
          {form.time ? `${form.time} · ${form.durationMin} min` : "—"}
        </ReviewBlock>
        {form.reason ? (
          <ReviewBlock title="Reason" wide>
            <p className="whitespace-pre-wrap">{form.reason}</p>
          </ReviewBlock>
        ) : null}
        {form.notes ? (
          <ReviewBlock title="Notes" wide>
            <p className="whitespace-pre-wrap">{form.notes}</p>
          </ReviewBlock>
        ) : null}
      </div>
    </div>
  )
}

/* ── tiny atoms ─────────────────────────────────────────────────── */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-[#344054] dark:text-[#CBD5E1] font-medium">
        {label}
        {required ? <span className="text-[#B42318]"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </label>
  )
}

function ReviewBlock({
  title,
  wide,
  children,
}: {
  title: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#94A3B8] mb-1">
        {title}
      </p>
      <div className="text-[#101828] dark:text-[#F9FAFB]">{children}</div>
    </div>
  )
}
