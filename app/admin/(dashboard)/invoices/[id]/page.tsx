"use client"

/**
 * Invoice detail page — real fetch from /api/invoices/[id].
 *
 * Replaces the previous stub which rendered the hardcoded "Moustapha
 * NDAO" patient and fake line items. The page now loads the live
 * invoice with patient + items + payments and surfaces a "Mark Paid"
 * action that PATCHes invoice status when status is OPEN /
 * PARTIALLY_PAID. Print uses the browser's window.print().
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { computeInstallments } from "@/lib/invoice-installments"
import InvoiceSheet from "@/components/invoice/InvoiceSheet"

type Status = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID"

interface InvoiceApi {
  id: string
  invoiceNumber: string
  status: Status
  notes: string | null
  subtotalCents: number
  totalCents: number
  paidCents: number
  installmentCount: number
  installmentPlan: number[] | null
  currency: string
  issuedAt: string
  dueAt: string | null
  patient: {
    id: string
    patientNumber: string
    fullName: string
    status: string
  } | null
  appointment: { id: string; startsAt: string } | null
  department: { id: string; name: string } | null
  items: {
    id: string
    description: string
    quantity: number
    unitPriceCents: number
    lineTotalCents: number
  }[]
  payments: {
    id: string
    amountCents: number
    method: string
    status?: string
    receivedAt: string
    note: string | null
  }[]
  createdAt: string
  updatedAt: string
}

export default function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<InvoiceApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchOne = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/invoices/${id}`, { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data: InvoiceApi = json?.data ?? json
      setInvoice(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchOne()
  }, [fetchOne])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Payment is collected at the desk via UPI QR; reception confirms it here.
  // We RECORD a real CAPTURED payment for the outstanding balance (method
  // UPI) rather than just flipping status — the service recomputes the
  // invoice status from captured payments, so revenue/Balance Due stay
  // consistent everywhere they're derived.
  const markPaid = async () => {
    if (!invoice || updating) return
    const balanceCents = Math.max(0, invoice.totalCents - paidCents)
    if (balanceCents <= 0) return
    // On an installment plan, collect the NEXT installment's outstanding amount;
    // otherwise collect the full balance.
    const plan = computeInstallments(invoice.totalCents, invoice.installmentCount, paidCents, invoice.installmentPlan)
    const amountCents =
      invoice.installmentCount > 1 && plan.nextDue ? plan.nextDue.remainingCents : balanceCents
    if (amountCents <= 0) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountCents, method: "UPI" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't record payment")
      notify.success("Payment recorded")
      await fetchOne()
    } catch (err) {
      notify.error("Couldn't record payment", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setUpdating(false)
    }
  }

  const deleteInvoice = async () => {
    if (!invoice || deleting) return
    if (
      !window.confirm(
        `Permanently delete invoice ${invoice.invoiceNumber}?\n\nIts line items and any recorded payments are deleted too — if it was paid, that amount is removed from revenue. This cannot be undone.`,
      )
    )
      return
    setDeleting(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok && res.status !== 204) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`)
      }
      notify.success("Invoice deleted")
      router.push("/admin/invoices")
    } catch (err) {
      notify.error("Couldn't delete invoice", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" />
        Loading invoice…
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <p className="text-sm font-semibold text-[#B42318]">
            {error ?? "Invoice not found"}
          </p>
          <Link
            href="/admin/invoices"
            className="text-sm text-[#6B2B26] dark:text-[#A5B4FC] hover:underline font-semibold"
          >
            ← Back to all invoices
          </Link>
        </div>
      </div>
    )
  }

  // `paidCents` isn't a column on Invoice — derive it from CAPTURED payments
  // so "Paid"/"Balance Due" don't render ₹NaN on an unpaid invoice.
  const paidCents = invoice.payments
    .filter((p) => !p.status || p.status === "CAPTURED")
    .reduce((acc, p) => acc + (Number(p.amountCents) || 0), 0)

  // Derived installment plan (equal split). nextDue drives the "record next
  // installment" button; the schedule card lists each part's paid/due status.
  const installmentPlan = computeInstallments(
    invoice.totalCents,
    invoice.installmentCount,
    paidCents,
    invoice.installmentPlan,
  )

  const issuedLabel = invoice.issuedAt
    ? new Date(invoice.issuedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—"

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header actions */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Invoice Details</h1>
          <p className="text-xs text-[#98A2B3] dark:text-[#94A3B8] mt-1 font-mono">{invoice.id}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="px-4 h-10 border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] font-semibold rounded-lg flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          {invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID" ? (
            <Button
              className="bg-[#12B76A] hover:bg-[#0E9A57] text-white px-4 h-10 rounded-lg flex items-center gap-2"
              disabled={updating}
              onClick={() => void markPaid()}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {invoice.installmentCount > 1 && installmentPlan.nextDue
                ? `Record installment ${installmentPlan.nextDue.seq}/${invoice.installmentCount} · ${formatMoney(installmentPlan.nextDue.remainingCents, invoice.currency)}`
                : "Mark UPI payment received"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="px-4 h-10 border-[#FDA29B] text-[#B42318] hover:bg-[#FEF3F2] font-semibold rounded-lg flex items-center gap-2"
            disabled={deleting}
            onClick={() => void deleteInvoice()}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="no-print">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
      </div>

      {/* Printable region — only this prints (invoice + payment history) */}
      <div className="inv-print flex flex-col gap-6">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* Main invoice card */}
      <InvoiceSheet
        invoiceNumber={invoice.invoiceNumber}
        issuedLabel={issuedLabel}
        patientNumber={invoice.patient?.patientNumber ?? null}
        patientFullName={invoice.patient?.fullName ?? null}
        items={invoice.items}
        subtotalCents={invoice.subtotalCents}
        totalCents={invoice.totalCents}
        paidCents={paidCents}
        currency={invoice.currency}
      />

      {/* Installment plan — screen only, excluded from print */}
      {invoice.installmentCount > 1 ? (
        <div className="no-print bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#EAECF0] dark:border-[#374151] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">Installment plan</h3>
            <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
              {installmentPlan.installments.filter((x) => x.status === "PAID").length} of {invoice.installmentCount} paid · balance {formatMoney(installmentPlan.balanceCents, invoice.currency)}
            </span>
          </div>
          <ul className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {installmentPlan.installments.map((inst) => {
              const st =
                inst.status === "PAID"
                  ? { bg: "#ECFDF3", fg: "#027A48", label: "Paid" }
                  : inst.status === "PARTIAL"
                    ? { bg: "#FFF1D6", fg: "#B5642A", label: `Partial · ${formatMoney(inst.remainingCents, invoice.currency)} left` }
                    : { bg: "#EFF8FF", fg: "#175CD3", label: "Due" }
              return (
                <li key={inst.seq} className="px-6 py-3.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#101828] dark:text-[#F9FAFB]">
                    Installment {inst.seq} of {invoice.installmentCount}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                      {formatMoney(inst.amountCents, invoice.currency)}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: st.bg, color: st.fg }}>
                      {st.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {/* Payment history — screen only, excluded from print */}
      <div className="no-print bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#EAECF0] dark:border-[#374151]">
          <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">Payment History</h3>
        </div>
        {invoice.payments.length === 0 ? (
          <p className="px-6 py-6 text-sm text-[#98A2B3] dark:text-[#94A3B8]">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Method</th>
                  <th className="px-6 py-3 font-semibold">Note</th>
                  <th className="px-6 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-3 text-sm text-[#101828] dark:text-[#F9FAFB]">
                      {new Date(p.receivedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3 text-sm text-[#101828] dark:text-[#F9FAFB]">{p.method}</td>
                    <td className="px-6 py-3 text-sm text-[#667085] dark:text-[#94A3B8]">
                      {p.note ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-[#101828] dark:text-[#F9FAFB] text-right">
                      {formatMoney(p.amountCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Print rules: only the invoice region prints; hide app chrome + toolbar */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap');
        .inv-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100vh !important;
            overflow: hidden !important;
          }
          body * { visibility: hidden; }
          .inv-print, .inv-print * { visibility: visible; }
          .inv-print { 
            position: fixed !important; 
            left: 0; 
            top: 0; 
            width: 1000px !important; 
            height: 1400px !important;
            transform: scale(0.68); 
            transform-origin: top left; 
            overflow: hidden;
            page-break-after: avoid;
            page-break-inside: avoid;
            page-break-before: avoid;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function formatMoney(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(cents / 100)
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`
  }
}
