"use client"

/**
 * Patient invoice detail — renders the SAME branded IPHMH invoice sheet the
 * admin sees (shared <InvoiceSheet/>), plus the installment plan + payment
 * history. View-only: payments are collected at the clinic.
 */

import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"
import { ArrowLeft, Printer, Loader2, AlertCircle } from "lucide-react"

import InvoiceSheet, { formatMoney } from "@/components/invoice/InvoiceSheet"
import { computeInstallments } from "@/lib/invoice-installments"

type Status = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID"

type SelfInvoice = {
  id: string
  invoiceNumber: string
  status: Status
  subtotalCents: number
  totalCents: number
  installmentCount: number
  installmentPlan: number[] | null
  issuedAt: string | null
  department: { id: string; name: string } | null
  patient: { id: string; patientNumber: string; fullName: string } | null
  items: { id: string; description: string; lineTotalCents: number }[]
  payments: { id: string; amountCents: number; method: string; status?: string; receivedAt: string }[]
}

const CURRENCY = "INR"

export default function PatientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<SelfInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/patient/me/invoices/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error(res.status === 404 ? "Invoice not found" : `HTTP ${res.status}`)
      const json = await res.json()
      setInvoice((json?.data ?? json) as SelfInvoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B2B26]" /> Loading invoice…
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <p className="text-sm font-semibold text-[#B42318]">{error ?? "Invoice not found"}</p>
          <Link href="/patient/invoices" className="text-sm text-[#6B2B26] hover:underline font-semibold">
            ← Back to billing
          </Link>
        </div>
      </div>
    )
  }

  const paidCents = invoice.payments
    .filter((p) => !p.status || p.status === "CAPTURED")
    .reduce((acc, p) => acc + (Number(p.amountCents) || 0), 0)
  const issuedLabel = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—"
  const plan = computeInstallments(invoice.totalCents, invoice.installmentCount, paidCents, invoice.installmentPlan)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 pb-12 max-w-[1000px]">
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <Link href="/patient/invoices" className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to billing
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-[#6B2B26] hover:bg-[#54201D] text-white text-sm font-semibold"
        >
          <Printer className="h-4 w-4" /> Print invoice
        </button>
      </div>

      {/* Branded sheet (prints) */}
      <div className="inv-print">
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <InvoiceSheet
          invoiceNumber={invoice.invoiceNumber}
          issuedLabel={issuedLabel}
          patientNumber={invoice.patient?.patientNumber ?? null}
          patientFullName={invoice.patient?.fullName ?? null}
          items={invoice.items}
          subtotalCents={invoice.subtotalCents}
          totalCents={invoice.totalCents}
          paidCents={paidCents}
          currency={CURRENCY}
        />
      </div>

      {/* Installment plan (view-only) */}
      {invoice.installmentCount > 1 ? (
        <div className="no-print bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#EAECF0] dark:border-[#374151] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">Installment plan</h3>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
              {plan.installments.filter((x) => x.status === "PAID").length} of {invoice.installmentCount} paid · balance {formatMoney(plan.balanceCents, CURRENCY)}
            </span>
          </div>
          <ul className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {plan.installments.map((inst) => {
              const st =
                inst.status === "PAID"
                  ? { bg: "#ECFDF3", fg: "#027A48", label: "Paid" }
                  : inst.status === "PARTIAL"
                    ? { bg: "#FFF1D6", fg: "#B5642A", label: `Partial · ${formatMoney(inst.remainingCents, CURRENCY)} left` }
                    : { bg: "#EFF8FF", fg: "#175CD3", label: "Due" }
              return (
                <li key={inst.seq} className="px-5 py-3.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#101828] dark:text-[#F9FAFB]">Installment {inst.seq} of {invoice.installmentCount}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">{formatMoney(inst.amountCents, CURRENCY)}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="px-5 py-3 text-xs text-[#98A2B3] border-t border-[#EAECF0] dark:border-[#374151]">
            Pay each part at the clinic on your next visit — the front desk records it here.
          </p>
        </div>
      ) : null}

      {/* Payment history */}
      <div className="no-print bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#EAECF0] dark:border-[#374151]">
          <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">Payment history</h3>
        </div>
        {invoice.payments.length === 0 ? (
          <p className="px-5 py-5 text-sm text-[#98A2B3]">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {invoice.payments.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <span className="text-[#667085] dark:text-[#94A3B8]">
                  {new Date(p.receivedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · {p.method}
                </span>
                <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">{formatMoney(p.amountCents, CURRENCY)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .inv-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { size: A4; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: 100vh !important; overflow: hidden !important; }
          body * { visibility: hidden; }
          .inv-print, .inv-print * { visibility: visible; }
          .inv-print { position: fixed !important; left: 0; top: 0; width: 1000px !important; height: 1400px !important; transform: scale(0.68); transform-origin: top left; overflow: hidden; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}
