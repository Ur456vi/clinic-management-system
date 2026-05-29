"use client"

/**
 * Staff member detail / edit page — wired to /api/staff/[id].
 *
 *   View mode  — GET /api/staff/:id, render the profile.
 *   Edit mode  — (?edit=1) prefill the editable fields (name, phone, role,
 *                department; email is immutable) and PATCH on save.
 */

import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Building2,
  Pencil,
  Loader2,
  AlertCircle,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Role =
  | "ADMIN"
  | "DOCTOR"
  | "RMO"
  | "RECEPTION"
  | "INFUSION_SPECIALIST"
  | "REHAB_SPECIALIST"
  | "AESTHETICS_SPECIALIST"
  | "PATIENT"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  RMO: "RMO",
  RECEPTION: "Reception",
  INFUSION_SPECIALIST: "Infusion Specialist",
  REHAB_SPECIALIST: "Rehab Specialist",
  AESTHETICS_SPECIALIST: "Aesthetics Specialist",
  PATIENT: "Patient",
}

const ROLE_OPTIONS: Role[] = [
  "ADMIN",
  "DOCTOR",
  "RMO",
  "RECEPTION",
  "INFUSION_SPECIALIST",
  "REHAB_SPECIALIST",
  "AESTHETICS_SPECIALIST",
]

interface Staff {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: Role
  phone: string | null
  departmentId: string | null
  department: { id: string; name: string; slug: string } | null
  isActive: boolean
  createdAt: string
}

interface Department {
  id: string
  name: string
}

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const id = params?.id ?? ""
  const editing = search?.get("edit") === "1"

  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  // Edit form
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    role: "DOCTOR" as Role,
    departmentId: "",
  })
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/staff/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error(res.status === 404 ? "Staff member not found" : `HTTP ${res.status}`)
      const json = await res.json()
      const s = (json?.data ?? json) as Staff
      setStaff(s)
      setForm({
        firstName: s.firstName ?? "",
        lastName: s.lastName ?? "",
        phone: s.phone ?? "",
        role: s.role,
        departmentId: s.departmentId ?? "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff member")
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments?limit=100", { credentials: "include" })
      if (!res.ok) return
      const json = await res.json()
      setDepartments(json?.data?.items ?? json?.data ?? json?.items ?? [])
    } catch {
      /* non-fatal */
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    if (editing) void loadDepartments()
  }, [editing, loadDepartments])
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staff || saving) return
    setSaving(true)
    setFieldErrors({})
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        phone: form.phone.trim() || undefined,
        departmentId: form.departmentId ? form.departmentId : null,
      }
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        const issues = json?.error?.issues
        if (Array.isArray(issues)) {
          const map: Record<string, string> = {}
          for (const i of issues) {
            const path = Array.isArray(i.path) ? i.path.join(".") : ""
            if (path) map[path] = i.message
          }
          setFieldErrors(map)
        }
        throw new Error(json?.error?.message ?? "Save failed")
      }
      notify.success("Staff member updated")
      router.push(`/admin/staff/${id}`)
      void load()
    } catch (err) {
      notify.error("Couldn't update staff member", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] mb-3" />
        <p className="text-sm font-medium">Loading staff member…</p>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828]">Couldn&apos;t load staff member</p>
        <p className="text-xs text-[#667085] max-w-md">{error}</p>
        <Link href="/admin/staff">
          <Button variant="outline">Back to Staff</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[840px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/staff"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] text-[#344054] hover:bg-gray-50"
            aria-label="Back to staff"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">
              {editing ? "Edit staff member" : staff.fullName}
            </h1>
            <p className="text-sm text-[#667085] mt-0.5 flex items-center gap-2">
              {ROLE_LABEL[staff.role] ?? staff.role}
              <StatusPill active={staff.isActive} />
            </p>
          </div>
        </div>

        {!editing ? (
          <Link href={`/admin/staff/${id}?edit=1`}>
            <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
              <Pencil className="h-4 w-4" /> <span>Edit</span>
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#101828] mb-5">Profile</h2>

        {editing ? (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={save}>
            <FormField label="First name" required error={fieldErrors.firstName}>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className={inputCls}
              />
            </FormField>
            <FormField label="Last name" required error={fieldErrors.lastName}>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className={inputCls}
              />
            </FormField>
            <FormField label="Email" hint="Email cannot be changed here">
              <input value={staff.email} disabled className={`${inputCls} bg-[#F9FAFB] text-[#667085]`} />
            </FormField>
            <FormField label="Phone" error={fieldErrors.phone}>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className={inputCls}
              />
            </FormField>
            <FormField label="Role" required error={fieldErrors.role}>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className={`${inputCls} bg-white`}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Department" error={fieldErrors.departmentId}>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className={`${inputCls} bg-white`}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
              <Link
                href={`/admin/staff/${id}`}
                className="text-sm font-semibold text-[#667085] hover:text-[#101828]"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <DetailItem icon={<Mail className="h-4 w-4" />} label="Email" value={staff.email} />
            <DetailItem icon={<Phone className="h-4 w-4" />} label="Phone" value={staff.phone ?? "—"} />
            <DetailItem
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Role"
              value={ROLE_LABEL[staff.role] ?? staff.role}
            />
            <DetailItem
              icon={<Building2 className="h-4 w-4" />}
              label="Department"
              value={staff.department?.name ?? "—"}
            />
            <DetailItem
              icon={<Calendar className="h-4 w-4" />}
              label="Created"
              value={new Date(staff.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            <DetailItem
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Status"
              value={staff.isActive ? "Active" : "Inactive"}
            />
          </dl>
        )}
      </div>
    </div>
  )
}

/* ── atoms ─────────────────────────────────────────────────────── */

const inputCls =
  "h-10 w-full rounded-lg border border-[#D0D5DD] px-3 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={
        active
          ? { background: "#ECFDF3", color: "#027A48" }
          : { background: "#FEF3F2", color: "#B42318" }
      }
    >
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function DetailItem({
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
      <span className="text-[#667085] mt-0.5">{icon}</span>
      <div>
        <dt className="text-xs uppercase tracking-wide text-[#667085]">{label}</dt>
        <dd className="text-[#101828] font-medium">{value}</dd>
      </div>
    </div>
  )
}

function FormField({
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
      <span className="text-[#344054] font-medium">
        {label}
        {required ? <span className="text-[#B42318]"> *</span> : null}
      </span>
      {children}
      {hint ? <p className="text-xs text-[#667085]">{hint}</p> : null}
      {error ? <p className="text-xs text-[#B42318]">{error}</p> : null}
    </label>
  )
}
