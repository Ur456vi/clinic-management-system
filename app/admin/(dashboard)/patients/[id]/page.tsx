"use client"

/**
 * Patient detail / edit page — real fetch + PATCH against /api/patients/[id].
 *
 * Replaces the previous stub which rendered "—" everywhere and called
 * notify.success() without actually saving. The page now:
 *   - GETs the patient on mount
 *   - Renders read-only details by default
 *   - Switches to an in-place edit form when ?edit=1 is in the URL
 *   - PATCHes the diff on submit and surfaces zod field errors inline
 */

import Link from "next/link"
import { useCallback, useEffect, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Pencil,
  Loader2,
  AlertCircle,
  Save,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

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

type ApptStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

interface ActivityAppt {
  id: string
  startsAt: string
  status: ApptStatus
  reason: string | null
  staff: { id: string; fullName: string; specialization: string | null } | null
  department: { id: string; name: string } | null
}

const APPT_STATUS_STYLE: Record<ApptStatus, { label: string; cls: string }> = {
  REQUESTED: { label: "Requested", cls: "bg-[#FFFAEB] text-[#B54708]" },
  CONFIRMED: { label: "Confirmed", cls: "bg-[#EFF8FF] dark:bg-[#1E3A5F] text-[#175CD3]" },
  COMPLETED: { label: "Completed", cls: "bg-[#ECFDF3] text-[#027A48]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#FEF3F2] text-[#B42318]" },
  NO_SHOW: { label: "No show", cls: "bg-[#F2F4F7] dark:bg-[#111827] text-[#475467] dark:text-[#CBD5E1]" },
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

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
      const res = await fetch(
        `/api/appointments?patientId=${id}&limit=50`,
        { credentials: "include" },
      )
      if (!res.ok) {
        setActivity([])
        return
      }
      const json = await res.json()
      const rows: ActivityAppt[] = Array.isArray(json?.data) ? json.data : []
      rows.sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      )
      setActivity(rows.slice(0, 8))
    } catch {
      setActivity([])
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchOne()
    void fetchActivity()
  }, [fetchOne, fetchActivity])
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
      notify.error("Couldn't save patient", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" /> Loading patient…
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <p className="text-sm font-semibold text-[#B42318]">
            {error ?? "Patient not found"}
          </p>
          <Link
            href="/admin/patients"
            className="text-sm text-[#2E37A4] dark:text-[#A5B4FC] hover:underline font-semibold"
          >
            ← Back to all patients
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/patients"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50"
            aria-label="Back to patients"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">
              {editing ? "Edit patient" : patient.fullName}
            </h1>
            <p className="text-xs text-[#98A2B3] dark:text-[#94A3B8] mt-1">
              Patient #{patient.patientNumber} · <span className="font-mono">{patient.id}</span>
            </p>
          </div>
        </div>

        {!editing ? (
          <Link href={`/admin/patients/${id}?edit=1`}>
            <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">
            Contact information
          </h2>
          {editing && form ? (
            <form
              onSubmit={handleSave}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Field label="Full name" required error={fieldErrors.fullName}>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Patient name"
                  className={inputCls}
                />
              </Field>
              <Field label="Email" error={fieldErrors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone" error={fieldErrors.phone}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 …"
                  className={inputCls}
                />
              </Field>
              <Field label="Date of birth" error={fieldErrors.dateOfBirth}>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Sex" error={fieldErrors.sex}>
                <select
                  value={form.sex}
                  onChange={(e) =>
                    setForm({ ...form, sex: e.target.value as FormState["sex"] })
                  }
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNDISCLOSED">Undisclosed</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Status })
                  }
                  className={inputCls}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>
              <Field label="Occupation" error={fieldErrors.occupation}>
                <input
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                  placeholder="Occupation"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Place of residence"
                error={fieldErrors.placeOfResidence}
              >
                <input
                  value={form.placeOfResidence}
                  onChange={(e) =>
                    setForm({ ...form, placeOfResidence: e.target.value })
                  }
                  placeholder="City / region"
                  className={inputCls}
                />
              </Field>
              <Field label="Address" wide error={fieldErrors.address}>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, locality, city, postal code"
                  className="rounded-lg border border-[#D0D5DD] dark:border-[#374151] p-3 text-sm w-full bg-white dark:bg-[#1F2937]"
                />
              </Field>

              <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save changes
                </Button>
                <Link
                  href={`/admin/patients/${id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#101828]"
                >
                  <X className="h-4 w-4" /> Cancel
                </Link>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <DetailRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={patient.email ?? "—"}
              />
              <DetailRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={patient.phone ?? "—"}
              />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Date of birth"
                value={
                  patient.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
              />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Registered"
                value={new Date(patient.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <DetailRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Status"
                value={patient.status}
              />
              <DetailRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Sex"
                value={patient.sex ?? "—"}
              />
              {patient.occupation ? (
                <DetailRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Occupation"
                  value={patient.occupation}
                />
              ) : null}
              {patient.placeOfResidence ? (
                <DetailRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Place of residence"
                  value={patient.placeOfResidence}
                />
              ) : null}
              {patient.address ? (
                <div className="md:col-span-2 border-t border-[#F2F4F7] dark:border-[#374151] pt-4">
                  <dt className="text-xs uppercase text-[#667085] dark:text-[#94A3B8] font-semibold tracking-wider mb-1">
                    Address
                  </dt>
                  <dd className="text-sm text-[#344054] dark:text-[#CBD5E1] whitespace-pre-wrap">
                    {patient.address}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}
        </div>

        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">
            Recent activity
          </h2>
          {activity === null ? (
            <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" />
              Loading activity…
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
              No appointments recorded for this patient yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {activity.map((a) => {
                const style =
                  APPT_STATUS_STYLE[a.status] ?? APPT_STATUS_STYLE.REQUESTED
                return (
                  <li
                    key={a.id}
                    className="flex flex-col gap-1 border-l-2 border-[#EAECF0] dark:border-[#374151] pl-3 py-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">
                        {new Date(a.startsAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="text-[#98A2B3] dark:text-[#94A3B8] font-normal">
                          {" · "}
                          {new Date(a.startsAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.cls}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <span className="text-xs text-[#475467] dark:text-[#CBD5E1]">
                      {a.staff?.fullName ?? "Unassigned"}
                      {a.staff?.specialization
                        ? ` · ${a.staff.specialization}`
                        : a.department?.name
                          ? ` · ${a.department.name}`
                          : ""}
                    </span>
                    {a.reason ? (
                      <span className="text-xs text-[#667085] dark:text-[#94A3B8] truncate">
                        {a.reason}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── atoms ────────────────────────────────────────────────────────── */

const inputCls =
  "h-10 rounded-lg border border-[#D0D5DD] dark:border-[#374151] px-3 text-sm w-full bg-white dark:bg-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"

function Field({
  label,
  required,
  wide,
  error,
  children,
}: {
  label: string
  required?: boolean
  wide?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-[#344054] dark:text-[#CBD5E1] font-medium">
        {label}
        {required ? <span className="text-[#B42318]"> *</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-[#B42318]">{error}</span> : null}
    </label>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#667085] dark:text-[#94A3B8] mt-0.5">{icon}</div>
      <div>
        <dt className="text-xs uppercase text-[#667085] dark:text-[#94A3B8]">{label}</dt>
        <dd className="text-[#101828] dark:text-[#F9FAFB] font-medium">{value}</dd>
      </div>
    </div>
  )
}
