"use client"

/**
 * Create invoice — reception check-in flow.
 *
 * Reached from the appointment kebab ("Create invoice", `?appointmentId=`)
 * when a patient arrives for their RMO / Dr. Yuvraaj visit, or from the
 * Invoices list "New Invoice" button (bare — pick a patient).
 *
 * Prefills one editable "Consultation — <clinician>" line at a default
 * amount the receptionist can adjust, allows extra lines, then
 * POSTs to /api/invoices and immediately issues it (DRAFT → ISSUED) so the
 * patient can be handed a printed copy from the invoice detail page. After
 * save it redirects there, where reception clicks Print.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"

import { notify } from "@/lib/notify"
import { splitInstallments } from "@/lib/invoice-installments"

type LineItem = { description: string; quantity: string; unitPriceRupees: string }
type PatientLite = { id: string; fullName: string; patientNumber: string }

const DEFAULT_CONSULT_RUPEES = "1000.00"

const inputCls =
  "h-10 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26]"

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
    { description: "Consultation", quantity: "1", unitPriceRupees: DEFAULT_CONSULT_RUPEES },
  ])
  const [notes, setNotes] = useState("")
  // "1" = pay in full; "2"/"3"/"4" = equal split; "custom" = per-row amounts.
  const [installmentChoice, setInstallmentChoice] = useState("1")
  const [customAmounts, setCustomAmounts] = useState<string[]>(["", ""])
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
              // Dynamic description derived from the appointment context
              // (clinician + visit date) rather than a static "Consultation".
              const clinician = data.staff?.fullName ? ` — ${data.staff.fullName}` : ""
              const when = data.startsAt
                ? ` · ${new Date(data.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                : ""
              setItems([
                {
                  description: `Consultation${clinician}${when}`,
                  quantity: "1",
                  unitPriceRupees: DEFAULT_CONSULT_RUPEES,
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
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPriceRupees: "0.00" }])
  const removeItem = (i: number) => setItems((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))

  const totals = useMemo(() => {
    let subtotal = 0
    for (const it of items) {
      const qty = Number.parseFloat(it.quantity) || 0
      subtotal += Math.round(rupeesToCents(it.unitPriceRupees) * qty)
    }
    return { total: subtotal }
  }, [items])

  // Custom installment plan (cents) + validity (must be 2+ parts that sum to total).
  const customCents = customAmounts.map((a) => rupeesToCents(a))
  const customSum = customCents.reduce((a, c) => a + c, 0)
  const customValid =
    installmentChoice !== "custom" ||
    (customCents.length >= 2 && customCents.every((c) => c > 0) && customSum === totals.total && totals.total > 0)

  const canSubmit =
    !!patient &&
    !!departmentId &&
    items.length > 0 &&
    customValid &&
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
        installmentCount:
          installmentChoice !== "custom" && Number(installmentChoice) > 1
            ? Number(installmentChoice)
            : undefined,
        installments:
          installmentChoice === "custom" ? customAmounts.map((a) => rupeesToCents(a)) : undefined,
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: it.quantity.trim() || "1",
          unitPriceCents: rupeesToCents(it.unitPriceRupees),
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
  }, [patient, canSubmit, submitting, appointmentId, departmentId, notes, installmentChoice, customAmounts, items, router])

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-6xl">
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
        <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: form ── */}
        <div className="flex-1 min-w-0 w-full bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add line
                </button>
              </div>
            </div>
          </div>

          {/* Payment plan (installments / EMI) */}
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Payment plan</span>
            <select
              value={installmentChoice}
              onChange={(e) => setInstallmentChoice(e.target.value)}
              className={inputCls + " h-11 sm:max-w-xs"}
            >
              <option value="1">Pay in full</option>
              <option value="2">2 equal installments</option>
              <option value="3">3 equal installments</option>
              <option value="4">4 equal installments</option>
              <option value="custom">Custom installments…</option>
            </select>

            {installmentChoice === "custom" ? (
              <div className="flex flex-col gap-2 rounded-xl border border-[#EAECF0] dark:border-[#374151] p-3 sm:max-w-md">
                {customAmounts.map((amt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[#667085] dark:text-[#94A3B8] w-24 flex-shrink-0">Installment {i + 1}</span>
                    <input
                      className={inputCls + " h-9 flex-1"}
                      value={amt}
                      onChange={(e) => setCustomAmounts((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                      placeholder="₹ amount"
                      inputMode="decimal"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomAmounts((prev) => (prev.length > 2 ? prev.filter((_, j) => j !== i) : prev))}
                      aria-label="Remove installment"
                      disabled={customAmounts.length <= 2}
                      className="p-2 text-[#98A2B3] hover:text-[#B42318] rounded-md hover:bg-[#FEF3F2] disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCustomAmounts((prev) => (prev.length < 12 ? [...prev, ""] : prev))}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add installment
                  </button>
                  <span className={`text-xs font-semibold ${customSum === totals.total && totals.total > 0 ? "text-[#0E8C6A]" : "text-[#B54708]"}`}>
                    {fmt(customSum)} / {fmt(totals.total)}
                  </span>
                </div>
                {customSum !== totals.total ? (
                  <p className="text-[11px] text-[#B54708]">Installments must add up to the invoice total.</p>
                ) : null}
              </div>
            ) : null}

            <span className="text-xs text-[#98A2B3]">
              Split a large bill so the patient can pay each part at a later visit — staff records each payment.
            </span>
          </div>

          {/* Notes */}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything to print on the invoice" className="px-3 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] resize-none" />
          </label>
        </div>

        {/* ── Right: summary (sticky) ── */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-6 bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">Summary</h3>
          {patient ? (
            <div className="text-xs text-[#667085] dark:text-[#94A3B8] flex flex-col gap-1 pb-3 border-b border-[#EAECF0] dark:border-[#374151]">
              <span><span className="text-[#98A2B3]">Patient:</span> {patient.fullName}</span>
              {departmentId ? <span><span className="text-[#98A2B3]">Department:</span> {departments.find((d) => d.id === departmentId)?.name ?? "—"}</span> : null}
              <span><span className="text-[#98A2B3]">Lines:</span> {items.length}</span>
            </div>
          ) : null}
          <div className="text-sm">
            <div className="flex justify-between py-1.5 font-bold text-base text-[#101828] dark:text-[#F9FAFB]"><span>Total</span><span>{fmt(totals.total)}</span></div>
          </div>
          {installmentChoice !== "1" ? (
            <div className="text-xs text-[#667085] dark:text-[#94A3B8] flex flex-col gap-0.5 pt-1 border-t border-[#EAECF0] dark:border-[#374151]">
              <span className="font-semibold text-[#344054] dark:text-[#CBD5E1] pt-2">
                {installmentChoice === "custom" ? `${customAmounts.length} custom installments` : `${installmentChoice} installments`}
              </span>
              {(installmentChoice === "custom" ? customCents : splitInstallments(totals.total, Number(installmentChoice))).map((c, i) => (
                <span key={i} className="flex justify-between">
                  <span>Installment {i + 1}</span>
                  <span>{fmt(c)}</span>
                </span>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void save()}
            disabled={!canSubmit || submitting}
            className="h-11 w-full rounded-lg bg-[#6B2B26] hover:bg-[#54201D] disabled:bg-[#D5ABAB] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create &amp; issue invoice
          </button>
        </div>
        </div>
      )}
    </div>
  )
}
