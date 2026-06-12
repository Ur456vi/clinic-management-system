"use client"

/**
 * Add Staff page — real POST to /api/staff.
 *
 * The previous version shipped a static form whose Add button did nothing.
 * This rewrite collects only the fields `createStaffSchema` accepts
 * (email, firstName, lastName, role, departmentId?, phone?, password?),
 * loads the Department list from /api/departments for the dropdown, and
 * POSTs on submit with inline zod-error display. ADMIN-only by API
 * contract — non-admin staff get a 403 from the server.
 */

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  UserPlus,
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

const ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "RMO", label: "RMO" },
  { value: "RECEPTION", label: "Reception" },
  { value: "INFUSION_SPECIALIST", label: "Infusion Specialist" },
  { value: "REHAB_SPECIALIST", label: "Rehab Specialist" },
  { value: "AESTHETICS_SPECIALIST", label: "Aesthetics Specialist" },
]

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: Role | ""
  departmentId: string
  password: string
}

const empty: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "DOCTOR",
  departmentId: "",
  password: "",
}

interface Department {
  id: string
  name: string
}

export default function AddStaffPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(empty)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments?limit=100", { credentials: "include" })
      if (!res.ok) throw new Error("Departments load failed")
      const json = await res.json()
      const items: Department[] = json?.data?.items ?? json?.data ?? json?.items ?? []
      setDepartments(items)
    } catch {
      // Non-fatal — leave departments empty; the dropdown will say "no departments yet".
    } finally {
      setLoadingDepartments(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchDepartments()
  }, [fetchDepartments])
  /* eslint-enable react-hooks/set-state-in-effect */

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const canSubmit =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    /.+@.+\..+/.test(form.email) &&
    form.role !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setFieldErrors({})
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.departmentId ? { departmentId: form.departmentId } : {}),
        ...(form.password.trim().length >= 8
          ? { password: form.password }
          : {}),
      }
      const res = await fetch("/api/staff", {
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
      notify.success("Staff member added")
      router.push("/admin/staff")
    } catch (err) {
      notify.error("Couldn't add staff", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-8 pb-12" onSubmit={handleSubmit}>
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Add New Staff Member</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            Creates a User + Staff record in one transaction.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/staff">
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
            className="px-6 h-11 bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white font-semibold rounded-lg shadow-sm inline-flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Add Staff Member
          </Button>
        </div>
      </div>

      <div>
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staff
        </Link>
      </div>

      {/* Green banner */}
      <div className="bg-[#12B76A] rounded-xl p-6 text-white flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-lg bg-white dark:bg-[#1F2937]/20 flex items-center justify-center">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">New Staff Member</h2>
          <p className="text-white/80 text-sm">
            Email + role required. Other fields can be filled in later from the
            staff member&apos;s profile page.
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="First Name" required error={fieldErrors.firstName}>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="e.g. Sarita"
              className={inputCls}
            />
          </Field>

          <Field label="Last Name" required error={fieldErrors.lastName}>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="e.g. Jain"
              className={inputCls}
            />
          </Field>

          <Field
            label="Email"
            required
            hint="Used as the staff member's login"
            error={fieldErrors.email}
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="doctor@example.com"
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
        </div>
      </section>

      {/* Role + Department */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Role &amp; Department</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Role" required error={fieldErrors.role}>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value as Role)}
                className={`${inputCls} pl-10 bg-white dark:bg-[#1F2937]`}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          <Field
            label="Department"
            hint={
              loadingDepartments
                ? "Loading departments…"
                : departments.length === 0
                  ? "No departments configured yet"
                  : undefined
            }
            error={fieldErrors.departmentId}
          >
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] dark:text-[#94A3B8]" />
              <select
                value={form.departmentId}
                onChange={(e) => set("departmentId", e.target.value)}
                disabled={loadingDepartments || departments.length === 0}
                className={`${inputCls} pl-10 bg-white dark:bg-[#1F2937] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed`}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </Field>
        </div>
      </section>

      {/* Account */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Account</h3>

        <Field
          label="Initial password"
          hint="Optional — leave blank to send the staff member a password-reset email instead. Minimum 8 characters."
          error={fieldErrors.password}
        >
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Min. 8 characters"
            className={inputCls}
          />
        </Field>
      </section>
    </form>
  )
}

/* ── atoms ─────────────────────────────────────────────────────── */

const inputCls =
  "w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] shadow-sm"

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
