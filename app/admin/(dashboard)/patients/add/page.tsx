"use client"

/**
 * Add Patient — focused demographics form that POSTs /api/patients.
 *
 * Replaces a 3,000-line consultation wizard that mixed patient creation
 * with the RMO/main consultation flow and never actually saved anything.
 * The Patient row only needs the fields in `createPatientSchema`
 * (fullName + a handful of optional demographics). Clinical visits live
 * under separate routes: book the appointment in /admin/appointments/add
 * and capture the consultation against that appointment.
 */

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Save,
  Stethoscope,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Sex = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"

type FormState = {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  sex: "" | Sex
  occupation: string
  placeOfResidence: string
  address: string
  referralSource: string
  primaryDoctorId: string
}

const empty: FormState = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  sex: "",
  occupation: "",
  placeOfResidence: "",
  address: "",
  referralSource: "",
  primaryDoctorId: "",
}

interface Doctor {
  id: string
  fullName: string
  specialization: string | null
  role: string
}

export default function AddPatientPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(empty)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const fetchDoctors = useCallback(async () => {
    try {
      const url = new URL("/api/staff", window.location.origin)
      url.searchParams.set("limit", "100")
      const res = await fetch(url.toString(), { credentials: "include" })
      if (!res.ok) throw new Error()
      const json = await res.json()
      const items: Doctor[] = json?.data ?? json?.items ?? []
      setDoctors(items.filter((d) => d.role === "DOCTOR"))
    } catch {
      setDoctors([])
    } finally {
      setLoadingDoctors(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchDoctors()
  }, [fetchDoctors])
  /* eslint-enable react-hooks/set-state-in-effect */

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const canSubmit = form.fullName.trim().length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setFieldErrors({})
    try {
      const optional = (v: string) => (v.trim() === "" ? undefined : v.trim())
      const body = {
        fullName: form.fullName.trim(),
        email: optional(form.email),
        phone: optional(form.phone),
        dateOfBirth: optional(form.dateOfBirth),
        sex: form.sex === "" ? undefined : form.sex,
        occupation: optional(form.occupation),
        placeOfResidence: optional(form.placeOfResidence),
        address: optional(form.address),
        referralSource: optional(form.referralSource),
        ...(form.primaryDoctorId
          ? { primaryDoctorId: form.primaryDoctorId }
          : {}),
      }
      const res = await fetch("/api/patients", {
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
        throw new Error(json?.error?.message ?? "Save failed")
      }
      notify.success("Patient created", {
        description: `Patient #${json?.data?.patientNumber ?? "—"}`,
      })
      const patientId = json?.data?.id
      router.push(patientId ? `/admin/patients/${patientId}` : "/admin/patients")
    } catch (err) {
      notify.error("Couldn't create patient", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-8 pb-12" onSubmit={submit}>
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Add New Patient</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            Only full name is required. Other demographics can be filled in
            now or later from the patient&apos;s profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/patients">
            <Button
              type="button"
              variant="outline"
              className="px-6 h-11 border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] font-semibold rounded-lg"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-6 h-11 bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white font-semibold rounded-lg shadow-sm inline-flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create Patient
          </Button>
        </div>
      </div>

      <div>
        <Link
          href="/admin/patients"
          className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patients
        </Link>
      </div>

      {/* Banner */}
      <div className="bg-[#6B2B26] rounded-xl p-6 text-white flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-lg bg-white dark:bg-[#1F2937]/20 flex items-center justify-center">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">New Patient Record</h2>
          <p className="text-white/85 text-sm">
            Auto-generates a PAT-XXXXXX number on save. Consultations are
            captured separately during the patient&apos;s first appointment.
          </p>
        </div>
      </div>

      {/* Identity */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Full Name" required error={fieldErrors.fullName}>
            <input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="As it should appear on records"
              className={inputCls}
            />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="patient@example.com"
                className={`${inputCls} pl-10`}
              />
            </div>
          </Field>
          <Field label="Phone Number" error={fieldErrors.phone}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                className={`${inputCls} pl-10`}
              />
            </div>
          </Field>
          <Field label="Date of Birth" error={fieldErrors.dateOfBirth}>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Sex" error={fieldErrors.sex}>
            <select
              value={form.sex}
              onChange={(e) => set("sex", e.target.value as FormState["sex"])}
              className={`${inputCls} bg-white dark:bg-[#1F2937]`}
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="UNDISCLOSED">Undisclosed</option>
            </select>
          </Field>
          <Field label="Occupation" error={fieldErrors.occupation}>
            <input
              value={form.occupation}
              onChange={(e) => set("occupation", e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="Place of Residence"
            error={fieldErrors.placeOfResidence}
          >
            <input
              value={form.placeOfResidence}
              onChange={(e) => set("placeOfResidence", e.target.value)}
              placeholder="City / region"
              className={inputCls}
            />
          </Field>
          <Field label="Full Address" error={fieldErrors.address}>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, locality, postal code"
              className="w-full rounded-lg border border-[#D0D5DD] dark:border-[#374151] p-3 text-sm bg-white dark:bg-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"
            />
          </Field>
        </div>
      </section>

      {/* Clinic context */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Clinic context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="Referral source"
            hint="How did they find us? (Word of mouth, web search, referral, …)"
            error={fieldErrors.referralSource}
          >
            <input
              value={form.referralSource}
              onChange={(e) => set("referralSource", e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </Field>
          <Field
            label="Primary Doctor"
            hint={
              loadingDoctors
                ? "Loading doctors…"
                : doctors.length === 0
                  ? "No doctors configured yet"
                  : "Optional — defaults to none"
            }
            error={fieldErrors.primaryDoctorId}
          >
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
              <select
                value={form.primaryDoctorId}
                onChange={(e) => set("primaryDoctorId", e.target.value)}
                disabled={loadingDoctors || doctors.length === 0}
                className={`${inputCls} pl-10 bg-white dark:bg-[#1F2937] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed`}
              >
                <option value="">No primary doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}
                    {d.specialization ? ` · ${d.specialization}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>
      </section>
    </form>
  )
}

/* ── atoms ─────────────────────────────────────────────────────── */

const inputCls =
  "w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] shadow-sm"

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
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
      {hint ? <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{hint}</p> : null}
      {error ? <p className="text-xs text-[#B42318]">{error}</p> : null}
    </label>
  )
}
