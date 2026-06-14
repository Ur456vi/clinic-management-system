"use client"

/**
 * Create invoice — reception check-in flow.
 *
 * Reached from the appointment kebab ("Create invoice", `?appointmentId=`)
 * when a patient arrives for their RMO / Dr. Yuvraaj visit, or from the
 * Invoices list "New Invoice" button (bare — pick a patient).
 *
 * Prefills one editable "Consultation — <clinician>" line at a default
 * amount the receptionist can adjust (GST 18%), allows extra lines, then
 * POSTs to /api/invoices and immediately issues it (DRAFT → ISSUED) so the
 * patient can be handed a printed copy from the invoice detail page. After
 * save it redirects there, where reception clicks Print.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"

import { notify } from "@/lib/notify"

type LineItem = { description: string; quantity: string; unitPriceRupees: string; taxPct: string }
type PatientLite = { id: string; fullName: string; patientNumber: string }

// Doctor consultation is a core healthcare service → GST-exempt (0%) in
// India. Manually-added lines (supplements, products, aesthetic procedures)
// can be taxable, so they default to the standard 18% — reception adjusts.
const CONSULT_TAX_PCT = "0"
const DEFAULT_TAX_PCT = "18"
const DEFAULT_CONSULT_RUPEES = "1000.00"

const inputCls =
  "h-10 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4]"

function rupeesToCents(r: string): number {
  const n = Number.parseFloat(r)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
function fmt(cents: number): string {
  return `₹${(cents / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CreateInvoicePage() {
  // useSearchParams must sit under a Suspense boundary so the route doesn't
  // bail out of prerendering at build time.
  return (
    <Suspense fallback={null}>
      <CreateInvoiceForm />
    </Suspense>
  )
}

function CreateInvoiceForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const appointmentId = sp.get("appointmentId") ?? undefined
  const patientIdParam = sp.get("patientId") ?? undefined

  const [patient, setPatient] = useState<PatientLite | null>(null)
  const [patientLocked, setPatientLocked] = useState(false)
  const [patientOptions, setPatientOptions] = useState<PatientLite[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [departmentId, setDepartmentId] = useState("")
  const [items, setItems] = useState<LineItem[]>([
    { description: "Consultation", quantity: "1", unitPriceRupees: DEFAULT_CONSULT_RUPEES, taxPct: CONSULT_TAX_PCT },
  ])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Prefill from the appointment (patient + clinician), else from patientId,
  // else load a patient list for the picker.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (appointmentId) {
          const res = await fetch(`/api/appointments/${appointmentId}`, { credentials: "include" })
          if (res.ok) {
            const { data } = await res.json()
            if (!cancelled && data?.patient) {
              setPatient({
                id: data.patient.id,
                fullName: data.patient.fullName,
                patientNumber: data.patient.patientNumber,
              })
              setPatientLocked(true)
              if (data.department?.id) setDepartmentId(data.department.id)
              const clinician = data.staff?.fullName ? ` — ${data.staff.fullName}` : ""
              setItems([
                {
                  description: `Consultation${clinician}`,
                  quantity: "1",
                  unitPriceRupees: DEFAULT_CONSULT_RUPEES,
                  taxPct: CONSULT_TAX_PCT,
                },
              ])
            }
          }
        } else {
          const res = await fetch("/api/patients?limit=100", { credentials: "include" })
          if (res.ok) {
            const json = await res.json()
            const rows: PatientLite[] = (json?.data ?? []).map((p: PatientLite) => ({
              id: p.id,
              fullName: p.fullName,
              patientNumber: p.patientNumber,
            }))
            if (!cancelled) {
              setPatientOptions(rows)
              const pre = patientIdParam ? rows.find((r) => r.id === patientIdParam) : undefined
              if (pre) {
                setPatient(pre)
                setPatientLocked(true)
              }
            }
          }
        }
      } catch {
        /* ignore — surfaced on submit if patient missing */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointmentId, patientIdParam])

  // Department options for the selector (reception picks the billed service area).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/departments?limit=100", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        const rows = (json?.data ?? []).map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))
        if (!cancelled) setDepartments(rows)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const setItem = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const addItem = () =>
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPriceRupees: "0.00", taxPct: DEFAULT_TAX_PCT }])
  const removeItem = (i: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))

  const totals = useMemo(() => {
    let subtotal = 0
    let tax = 0
    for (const it of items) {
      const qty = Number.parseFloat(it.quantity) || 0
      const lineSub = Math.round(rupeesToCents(it.unitPriceRupees) * qty)
      const bps = Math.round((Number.parseFloat(it.taxPct) || 0) * 100)
      subtotal += lineSub
      tax += Math.round((lineSub * bps) / 10_000)
    }
    return { subtotal, tax, total: subtotal + tax }
  }, [items])

  const canSubmit =
    !!patient &&
    !!departmentId &&
    items.length > 0 &&
    items.every((it) => it.description.trim() && rupeesToCents(it.unitPriceRupees) >= 0 && (Number.parseFloat(it.quantity) || 0) > 0)

  const save = useCallback(async () => {
    if (!patient || !canSubmit || submitting) return
    setSubmitting(true)
    try {
      const body = {
        patientId: patient.id,
        appointmentId,
        departmentId: departmentId || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: it.quantity.trim() || "1",
          unitPriceCents: rupeesToCents(it.unitPriceRupees),
          taxRateBps: Math.round((Number.parseFloat(it.taxPct) || 0) * 100),
        })),
      }
      const res = await fetch("/api/invoices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`)
      const id = json?.data?.id as string | undefined
      if (!id) throw new Error("Invoice created but no id returned")

      // Issue immediately so reception can hand over a printed copy.
      await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ISSUED" }),
      })
      notify.success("Invoice created")
      router.push(`/admin/invoices/${id}`)
    } catch (err) {
      notify.error("Couldn't create invoice", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
      setSubmitting(false)
    }
  }, [patient, canSubmit, submitting, appointmentId, departmentId, notes, items, router])

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#EAECF0] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#111827]"
          aria-label="Back to invoices"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Create invoice</h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            {appointmentId ? "Check-in billing — issued and ready to print." : "New billing record."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          {/* Patient */}
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Patient</span>
            {patientLocked && patient ? (
              <div className="h-11 px-3 flex items-center rounded-lg border border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB]">
                {patient.fullName} <span className="ml-2 text-[#98A2B3]">#{patient.patientNumber}</span>
              </div>
            ) : (
              <select
                value={patient?.id ?? ""}
                onChange={(e) => setPatient(patientOptions.find((p) => p.id === e.target.value) ?? null)}
                className={inputCls + " h-11"}
              >
                <option value="">Select a patient…</option>
                {patientOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} — #{p.patientNumber}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">
              Department <span className="text-[#B42318]">*</span>
            </span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={inputCls + " h-11"}
            >
              <option value="">Select a department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Line items */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Line items</span>
            <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-[#111827] text-xs text-[#667085] dark:text-[#94A3B8]">
                    <th className="text-left px-3 py-2 font-semibold">Description</th>
                    <th className="text-left px-2 py-2 font-semibold w-16">Qty</th>
                    <th className="text-left px-2 py-2 font-semibold w-28">Unit (₹)</th>
                    <th className="text-left px-2 py-2 font-semibold w-20">GST %</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input className={inputCls + " w-full"} value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="e.g., Consultation" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={inputCls + " w-full"} value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} inputMode="decimal" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={inputCls + " w-full"} value={it.unitPriceRupees} onChange={(e) => setItem(i, { unitPriceRupees: e.target.value })} inputMode="decimal" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className={inputCls + " w-full"} value={it.taxPct} onChange={(e) => setItem(i, { taxPct: e.target.value })} inputMode="decimal" />
                      </td>
                      <td className="px-1.5 py-1.5 align-middle">
                        <button type="button" onClick={() => removeItem(i)} aria-label="Remove line" className="p-2 text-[#98A2B3] hover:text-[#B42318] rounded-md hover:bg-[#FEF3F2]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] px-3 py-2">
                <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add line
                </button>
              </div>
            </div>
            <p className="text-xs text-[#6C7688] dark:text-[#94A3B8]">
              Doctor consultation is GST-exempt (0%). Apply GST only to taxable items such as supplements or products.
            </p>
          </div>

          {/* Totals */}
          <div className="self-end w-full sm:w-64 text-sm">
            <div className="flex justify-between py-1 text-[#475467] dark:text-[#CBD5E1]"><span>Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
            <div className="flex justify-between py-1 text-[#475467] dark:text-[#CBD5E1]"><span>GST</span><span>{fmt(totals.tax)}</span></div>
            <div className="flex justify-between py-1.5 mt-1 border-t border-[#EAECF0] dark:border-[#374151] font-bold text-[#101828] dark:text-[#F9FAFB]"><span>Total</span><span>{fmt(totals.total)}</span></div>
          </div>

          {/* Notes */}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything to print on the invoice" className="px-3 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] resize-none" />
          </label>

          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSubmit || submitting}
            className="h-11 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create &amp; issue invoice
          </button>
        </div>
      )}
    </div>
  )
}
