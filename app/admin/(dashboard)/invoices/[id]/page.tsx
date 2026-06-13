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
import { use, useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Printer,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Status = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID"

interface InvoiceApi {
  id: string
  invoiceNumber: string
  status: Status
  notes: string | null
  subtotalCents: number
  totalCents: number
  paidCents: number
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
  const [invoice, setInvoice] = useState<InvoiceApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

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

  const markPaid = async () => {
    if (!invoice || updating) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "PAID" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? "Update failed")
      notify.success("Invoice marked paid")
      await fetchOne()
    } catch (err) {
      notify.error("Couldn't mark paid", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" />
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
            className="text-sm text-[#2E37A4] dark:text-[#A5B4FC] hover:underline font-semibold"
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
      <div className="flex items-center justify-between flex-wrap gap-3">
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
              Mark Paid
            </Button>
          ) : null}
        </div>
      </div>

      <div>
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
      </div>

      {/* Main invoice card */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#EAECF0] dark:border-[#374151] flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#101828] dark:text-[#F9FAFB] tracking-tight">INVOICE</h2>
            <p className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">Invoice #</p>
            <p className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">{invoice.invoiceNumber}</p>
            <div className="pt-3">
              <StatusPill status={invoice.status} />
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">Issued</p>
            <p className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">{issuedLabel}</p>
            {invoice.dueAt ? (
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1">
                Due{" "}
                {new Date(invoice.dueAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </div>
        </div>

        {/* Patient info */}
        <div className="p-8 border-b border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB]/50 dark:bg-[#111827]/50">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-5 w-5 text-[#667085] dark:text-[#94A3B8]" />
            <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB]">Patient Information</h3>
          </div>
          {invoice.patient ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KV label="Patient">
                <Link
                  href={`/admin/patients/${invoice.patient.id}`}
                  className="text-[#2E37A4] dark:text-[#A5B4FC] font-semibold hover:underline"
                >
                  {invoice.patient.fullName}
                </Link>
              </KV>
              <KV label="Patient #">{invoice.patient.patientNumber}</KV>
              <KV label="Status">{invoice.patient.status}</KV>
            </div>
          ) : (
            <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">
              Patient record is no longer linked to this invoice.
            </p>
          )}
        </div>

        {/* Items */}
        <div className="p-8">
          <h3 className="text-base font-bold text-[#101828] dark:text-[#F9FAFB] mb-5">Invoice Items</h3>
          {invoice.items.length === 0 ? (
            <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">No line items.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-y border-[#EAECF0] dark:border-[#374151] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold text-right">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                  {invoice.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-4 py-4 text-sm text-[#101828] dark:text-[#F9FAFB]">{it.description}</td>
                      <td className="px-4 py-4 text-sm text-[#101828] dark:text-[#F9FAFB] text-right">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-4 text-sm text-[#101828] dark:text-[#F9FAFB] text-right">
                        {formatMoney(it.unitPriceCents, invoice.currency)}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-[#101828] dark:text-[#F9FAFB] text-right">
                        {formatMoney(it.lineTotalCents, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-[300px] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[#667085] dark:text-[#94A3B8]">Subtotal</span>
                <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {formatMoney(invoice.subtotalCents, invoice.currency)}
                </span>
              </div>
              <div className="h-px bg-[#EAECF0]" />
              <div className="flex justify-between">
                <span className="text-base font-black text-[#101828] dark:text-[#F9FAFB]">Grand Total</span>
                <span className="text-base font-black text-[#2E37A4] dark:text-[#A5B4FC]">
                  {formatMoney(invoice.totalCents, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[#667085] dark:text-[#94A3B8]">Paid</span>
                <span className="font-semibold text-[#12B76A]">
                  {formatMoney(paidCents, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-[#667085] dark:text-[#94A3B8]">Balance Due</span>
                <span className="font-semibold text-[#B42318]">
                  {formatMoney(
                    Math.max(0, invoice.totalCents - paidCents),
                    invoice.currency,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
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
  )
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-[#667085] dark:text-[#94A3B8]">{label}</p>
      <p className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">{children}</p>
    </div>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string; label: string }> = {
    DRAFT: { bg: "#F2F4F7", fg: "#344054", label: "Draft" },
    ISSUED: { bg: "#EFF8FF", fg: "#175CD3", label: "Issued" },
    PARTIALLY_PAID: { bg: "#FFF1D6", fg: "#B5642A", label: "Partially Paid" },
    PAID: { bg: "#ECFDF3", fg: "#027A48", label: "Paid" },
    VOID: { bg: "#FEF3F2", fg: "#B42318", label: "Void" },
  }
  const c = map[status] ?? map.ISSUED
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
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
