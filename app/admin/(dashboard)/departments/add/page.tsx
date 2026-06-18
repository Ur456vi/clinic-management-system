"use client"

/**
 * Add Department — real POST to /api/departments.
 *
 * Collects the fields `createDepartmentSchema` accepts: name (required),
 * slug (auto-derived from name, editable), description, and an optional
 * default-pricing table (service code -> price). Prices are entered in
 * rupees and converted to integer paise for the API. ADMIN-only by contract.
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Building2, Loader2, Plus, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

interface PriceRow {
  code: string
  rupees: string
}

export default function AddDepartmentPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const effectiveSlug = slugTouched ? slug : slugify(name)
  const canSubmit = name.trim().length > 0 && effectiveSlug.length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setFieldErrors({})
    try {
      const defaultPricing: Record<string, number> = {}
      for (const row of prices) {
        const code = row.code.trim()
        const rupees = Number(row.rupees)
        if (code && Number.isFinite(rupees) && rupees >= 0) {
          defaultPricing[code] = Math.round(rupees * 100)
        }
      }
      const body = {
        name: name.trim(),
        slug: effectiveSlug,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(Object.keys(defaultPricing).length ? { defaultPricing } : {}),
      }
      const res = await fetch("/api/departments", {
        method: "POST",
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
      notify.success("Department created")
      router.push("/admin/departments")
    } catch (err) {
      notify.error("Couldn't create department", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="flex flex-col gap-8 pb-12 max-w-[840px]" onSubmit={submit}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Add Department</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            A care lane used to route staff and slot appointments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/departments">
            <Button type="button" variant="outline" className="px-6 h-11 border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] font-semibold rounded-lg">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            className="px-6 h-11 bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white font-semibold rounded-lg inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Department
          </Button>
        </div>
      </div>

      <Link href="/admin/departments" className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Departments
      </Link>

      <div className="bg-[#6B2B26] rounded-xl p-6 text-white flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-lg bg-white dark:bg-[#1F2937]/20 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">New care lane</h2>
          <p className="text-white/80 text-sm">Name &amp; slug required. Pricing is optional and editable later.</p>
        </div>
      </div>

      <section className="space-y-5">
        <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Name" required error={fieldErrors.name}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aesthetics"
              className={inputCls}
            />
          </Field>
          <Field label="Slug" required hint="URL-safe id (lowercase, hyphens)" error={fieldErrors.slug}>
            <input
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
              placeholder="aesthetics"
              className={`${inputCls} font-mono`}
            />
          </Field>
        </div>
        <Field label="Description" error={fieldErrors.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What this department covers"
            className={`${inputCls} h-auto py-2.5 resize-y`}
          />
        </Field>
      </section>

      <PricingEditor prices={prices} setPrices={setPrices} />
    </form>
  )
}

/* ── shared pricing editor (used by add + edit) ───────────────────── */

export function PricingEditor({
  prices,
  setPrices,
}: {
  prices: { code: string; rupees: string }[]
  setPrices: React.Dispatch<React.SetStateAction<{ code: string; rupees: string }[]>>
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">Default pricing</h3>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8]">
            Service code → price (₹). Seeds appointment / invoice line items.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPrices((p) => [...p, { code: "", rupees: "" }])}
          className="inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add row
        </Button>
      </div>
      {prices.length === 0 ? (
        <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">No pricing configured.</p>
      ) : (
        <div className="space-y-3">
          {prices.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                value={row.code}
                onChange={(e) =>
                  setPrices((p) => p.map((r, j) => (j === i ? { ...r, code: e.target.value } : r)))
                }
                placeholder="service code (e.g. consultation)"
                className={`${inputCls} flex-1`}
              />
              <div className="relative w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] dark:text-[#94A3B8] text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={row.rupees}
                  onChange={(e) =>
                    setPrices((p) => p.map((r, j) => (j === i ? { ...r, rupees: e.target.value } : r)))
                  }
                  placeholder="0"
                  className={`${inputCls} pl-7`}
                />
              </div>
              <button
                type="button"
                onClick={() => setPrices((p) => p.filter((_, j) => j !== i))}
                className="p-2 text-[#B42318] hover:bg-[#FEF3F2] rounded-lg"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const inputCls =
  "w-full h-11 px-4 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15 focus:border-[#6B2B26]"

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
