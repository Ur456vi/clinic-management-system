"use client"

/**
 * Department detail / edit page — wired to /api/departments/[id].
 *
 *   View mode — GET, render details + pricing + staff count.
 *   Edit mode — (?edit=1) name, slug, description, pricing, active toggle;
 *               PATCH on save.
 *   Deactivate (soft-delete) / Reactivate via DELETE / PATCH isActive.
 */

import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  Pencil,
  Save,
  Users,
  Power,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { PricingEditor } from "../add/page"

interface Department {
  id: string
  name: string
  slug: string
  description: string | null
  defaultPricing: Record<string, number> | null
  isActive: boolean
  staffCount: number
  createdAt: string
  updatedAt: string
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const id = params?.id ?? ""
  const editing = search?.get("edit") === "1"

  const [dept, setDept] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({ name: "", slug: "", description: "", isActive: true })
  const [prices, setPrices] = useState<{ code: string; rupees: string }[]>([])

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/departments/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error(res.status === 404 ? "Department not found" : `HTTP ${res.status}`)
      const json = await res.json()
      const d = (json?.data ?? json) as Department
      setDept(d)
      setForm({ name: d.name, slug: d.slug, description: d.description ?? "", isActive: d.isActive })
      setPrices(
        Object.entries(d.defaultPricing ?? {}).map(([code, paise]) => ({
          code,
          rupees: String((paise as number) / 100),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load department")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dept || saving) return
    setSaving(true)
    setFieldErrors({})
    try {
      const defaultPricing: Record<string, number> = {}
      for (const row of prices) {
        const code = row.code.trim()
        const rupees = Number(row.rupees)
        if (code && Number.isFinite(rupees) && rupees >= 0) defaultPricing[code] = Math.round(rupees * 100)
      }
      const body = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        description: form.description.trim() ? form.description.trim() : null,
        isActive: form.isActive,
        defaultPricing: Object.keys(defaultPricing).length ? defaultPricing : null,
      }
      const res = await fetch(`/api/departments/${id}`, {
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
      notify.success("Department updated")
      router.push(`/admin/departments/${id}`)
      void load()
    } catch (err) {
      notify.error("Couldn't update department", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const setActive = async (active: boolean) => {
    if (!dept) return
    if (!active && !window.confirm(`Deactivate "${dept.name}"? It will be hidden from active lists.`)) return
    setBusy(true)
    try {
      const res = active
        ? await fetch(`/api/departments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ isActive: true }),
          })
        : await fetch(`/api/departments/${id}`, { method: "DELETE", credentials: "include" })
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`)
      notify.success(active ? "Department reactivated" : "Department deactivated")
      void load()
    } catch (err) {
      notify.error("Action failed", { description: err instanceof Error ? err.message : "Unknown error" })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading department…</p>
      </div>
    )
  }

  if (error || !dept) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-7 w-7 text-[#D92D20]" />
        <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">Couldn&apos;t load department</p>
        <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{error}</p>
        <Link href="/admin/departments">
          <Button variant="outline">Back to Departments</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[840px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/departments"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50"
            aria-label="Back to departments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">
              {editing ? "Edit department" : dept.name}
            </h1>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-0.5 flex items-center gap-2">
              <span className="font-mono">{dept.slug}</span>
              <StatusPill active={dept.isActive} />
            </p>
          </div>
        </div>

        {!editing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void setActive(!dept.isActive)}
              disabled={busy}
              className={`inline-flex items-center gap-2 ${dept.isActive ? "text-[#B42318] border-[#FECDCA] hover:bg-[#FEF3F2]" : "text-[#027A48] border-[#ABEFC6] hover:bg-[#ECFDF3]"}`}
            >
              <Power className="h-4 w-4" /> {dept.isActive ? "Deactivate" : "Reactivate"}
            </Button>
            <Link href={`/admin/departments/${id}?edit=1`}>
              <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
                <Pencil className="h-4 w-4" /> <span>Edit</span>
              </Button>
            </Link>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form className="flex flex-col gap-8" onSubmit={save}>
          <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Name" required error={fieldErrors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Slug" required hint="lowercase, hyphens" error={fieldErrors.slug}>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className={`${inputCls} font-mono`}
                />
              </Field>
            </div>
            <Field label="Description" error={fieldErrors.description}>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className={`${inputCls} h-auto py-2.5 resize-y`}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-[#344054] dark:text-[#CBD5E1]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-[#D0D5DD] dark:border-[#374151] text-[#2E37A4] dark:text-[#A5B4FC]"
              />
              Active
            </label>
          </div>

          <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6">
            <PricingEditor prices={prices} setPrices={setPrices} />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </Button>
            <Link href={`/admin/departments/${id}`} className="text-sm font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#101828]">
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-5">Overview</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-sm">
              <DetailItem icon={<Building2 className="h-4 w-4" />} label="Name" value={dept.name} />
              <DetailItem icon={<Users className="h-4 w-4" />} label="Staff" value={String(dept.staffCount)} />
              <DetailItem
                icon={<Calendar className="h-4 w-4" />}
                label="Created"
                value={new Date(dept.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <DetailItem icon={<Power className="h-4 w-4" />} label="Status" value={dept.isActive ? "Active" : "Inactive"} />
            </dl>
            <div className="mt-5 pt-5 border-t border-[#EAECF0] dark:border-[#374151]">
              <p className="text-xs uppercase tracking-wide text-[#667085] dark:text-[#94A3B8] mb-1">Description</p>
              <p className="text-sm text-[#344054] dark:text-[#CBD5E1]">{dept.description ?? "No description provided."}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#101828] dark:text-[#F9FAFB] mb-4">Default pricing</h2>
            {dept.defaultPricing && Object.keys(dept.defaultPricing).length ? (
              <dl className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                {Object.entries(dept.defaultPricing).map(([code, paise]) => (
                  <div key={code} className="flex items-center justify-between py-2.5">
                    <dt className="text-sm text-[#344054] dark:text-[#CBD5E1] font-mono">{code}</dt>
                    <dd className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                      ₹{((paise as number) / 100).toLocaleString("en-IN")}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">No pricing configured.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls =
  "w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={active ? { background: "#ECFDF3", color: "#027A48" } : { background: "#FEF3F2", color: "#B42318" }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#667085] dark:text-[#94A3B8] mt-0.5">{icon}</span>
      <div>
        <dt className="text-xs uppercase tracking-wide text-[#667085] dark:text-[#94A3B8]">{label}</dt>
        <dd className="text-[#101828] dark:text-[#F9FAFB] font-medium">{value}</dd>
      </div>
    </div>
  )
}

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
