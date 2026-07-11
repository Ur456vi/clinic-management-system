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
import { use, useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Activity,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
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
  // Print scaling: the printable region is pinned to A4 width so it fills the
  // page; if the sheet is taller than one A4 page we shrink it just enough to
  // fit (never clip). Recomputed on every print via the `beforeprint` event so
  // it works for the Print button AND the browser's own Ctrl/Cmd+P.
  const printRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  // On-screen responsiveness: the sheet is authored at a fixed 1000px design
  // width, so on phones/tablets we scale it down to fit the viewport (the
  // installment/payment cards below stay full-width). Print path is untouched.
  const shellRef = useRef<HTMLDivElement>(null)
  const [screenScale, setScreenScale] = useState(1)
  const [sheetH, setSheetH] = useState<number | null>(null)

  function numberToWordsINR(num: number): string {
  if (num === 0) return "Zero"
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ]
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const format2 = (n: number) => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : ""))
  let words = ""
  if (num >= 10000000) { words += format2(Math.floor(num / 10000000)) + " Crore "; num %= 10000000 }
  if (num >= 100000) { words += format2(Math.floor(num / 100000)) + " Lakh "; num %= 100000 }
  if (num >= 1000) { words += format2(Math.floor(num / 1000)) + " Thousand "; num %= 1000 }
  if (num >= 100) { words += format2(Math.floor(num / 100)) + " Hundred "; num %= 100 }
  if (num > 0) { words += format2(num) }
  return words.trim()
}

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

  // A4 portrait at 96dpi. @page margin is 0, so the full sheet is usable.
  // The sheet is DESIGNED at 1000px wide (narrower cramps the header and clips
  // the "INVOICE" title), so we render it at 1000px and scale it down to fill
  // the A4 width — dropping to a smaller scale only if height would overflow.
  const A4_W = 794
  const A4_H = 1123
  const SHEET_W = 1000
  useEffect(() => {
    const fit = () => {
      const sheet = sheetRef.current
      const container = printRef.current
      if (!sheet || !container) return
      // Measure at the native design width so height reflects the real layout.
      const prevWidth = sheet.style.width
      sheet.style.width = `${SHEET_W}px`
      const height = sheet.scrollHeight
      sheet.style.width = prevWidth
      // Fill the page width; shrink further only if the sheet is too tall.
      const scale = Math.min(A4_W / SHEET_W, A4_H / height)
      container.style.setProperty("--print-scale", String(scale))
    }
    window.addEventListener("beforeprint", fit)
    // Safari has no beforeprint — fall back to the print media-query.
    const mql = window.matchMedia("print")
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) fit()
    }
    mql.addEventListener?.("change", onChange)
    return () => {
      window.removeEventListener("beforeprint", fit)
      mql.removeEventListener?.("change", onChange)
    }
  }, [])

  // On-screen: scale the 1000px invoice sheet down to the available width.
  useEffect(() => {
    const shell = shellRef.current
    const sheet = sheetRef.current
    if (!shell || !sheet) return
    const fit = () => {
      const avail = shell.clientWidth
      setScreenScale(Math.min(1, avail / SHEET_W))
      setSheetH(sheet.scrollHeight)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [invoice, SHEET_W])

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
      <div ref={printRef} className="inv-print flex flex-col gap-6">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {/* Main invoice card — measured for print scaling; scaled to fit on screen */}
      <div
        ref={shellRef}
        className="inv-shell w-full"
        style={{ overflow: "hidden", height: sheetH != null ? sheetH * screenScale : undefined }}
      >
      <div
        ref={sheetRef}
        className="inv-sheet"
        style={{ width: 1000, transform: `scale(${screenScale})`, transformOrigin: "top left" }}
      >
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
      </div>
      </div>

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
                  {/* <th className="px-6 py-3 font-semibold">Method</th> */}
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
                    {/* <td className="px-6 py-3 text-sm text-[#101828] dark:text-[#F9FAFB]">{p.method}</td> */}
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
        /* Force branded fills to print in every browser, even with the
           "Background graphics" option off. */
        .inv-print, .inv-print * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @media print {
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          /* Show only the invoice; hide app chrome and the screen-only cards. */
          body * { visibility: hidden; }
          .inv-print, .inv-print * { visibility: visible; }
          .no-print, .no-print * { display: none !important; }
          .inv-print {
            position: fixed !important;
            top: 0;
            left: 0;
            /* Native sheet width; JS scales it (~0.79) to fill the A4 page
               width, shrinking further only if a long invoice would overflow
               the page height. Anchored top-left so the scaled box spans the
               page exactly from x=0 (a >page-width box can't be centred via
               margin:auto — that shifts it right and clips the edge). */
            width: 1000px !important;
            gap: 0 !important;
            transform: scale(var(--print-scale, 0.794));
            transform-origin: top left;
            page-break-inside: avoid;
          }
          /* The sheet itself carries the border on screen; edge-to-edge in print. */
          .inv-sheet > div { border: 0 !important; }
          /* Undo the on-screen fit-scaling so print uses its own A4 scaling. */
          .inv-shell { overflow: visible !important; height: auto !important; }
          .inv-sheet { transform: none !important; width: 1000px !important; }
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
