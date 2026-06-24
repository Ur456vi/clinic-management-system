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
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Activity,
  Search,
  Target,
  Heart,
  Plus,
  Check
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { computeInstallments } from "@/lib/invoice-installments"

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
    const plan = computeInstallments(invoice.totalCents, invoice.installmentCount, paidCents)
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
      <div className="text-[#384a3c] bg-[#fdfcf7] border border-[#EAECF0] shadow-sm overflow-hidden dark:text-[#101828]">
        {/* Header Section */}
        <div className="p-12 flex items-stretch justify-between relative border-b border-[#a98b63]/30 bg-[#fbfaf6]">
          {/* Left Logo */}
          <div className="flex flex-col items-center justify-center pr-10 border-r border-[#a98b63]/50 w-[30%] text-center">
            <div className="mb-4 relative">
              <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* The Arc */}
                <path d="M 12 85 A 48 48 0 1 1 88 85" stroke="url(#goldGradient)" strokeWidth="1.5" strokeLinecap="round" />
                
                {/* The Caduceus */}
                <g fill="url(#goldGradient)">
                  {/* Staff */}
                  <rect x="48.5" y="16" width="3" height="66" rx="1.5" />
                  <circle cx="50" cy="12" r="4.5" />
                  
                  {/* Wings (Left) - 3 distinct upward sweeping feathers */}
                  <path d="M 48 22 C 30 18 15 22 10 28 C 22 30 35 26 48 25 Z" />
                  <path d="M 48 24 C 28 22 18 28 12 34 C 25 36 38 32 48 27 Z" />
                  <path d="M 48 26 C 25 28 22 36 18 42 C 30 42 40 36 48 29 Z" />
                  
                  {/* Wings (Right) - 3 distinct upward sweeping feathers */}
                  <path d="M 52 22 C 70 18 85 22 90 28 C 78 30 65 26 52 25 Z" />
                  <path d="M 52 24 C 72 22 82 28 88 34 C 75 36 62 32 52 27 Z" />
                  <path d="M 52 26 C 75 28 78 36 82 42 C 70 42 60 36 52 29 Z" />
                </g>
                
                <g stroke="url(#goldGradient)" strokeWidth="3" strokeLinecap="round" fill="none">
                  {/* Snake 1 (Left starting) - 3 intertwining loops */}
                  <path d="M 40 82 C 15 72 20 62 50 55 C 80 48 75 38 50 35 C 25 32 30 22 46 18" />
                  {/* Fake background cutout for depth */}
                  <path d="M 40 82 C 15 72 20 62 50 55 C 80 48 75 38 50 35 C 25 32 30 22 46 18" stroke="#fbfaf6" strokeWidth="6" opacity="0.1" />
                  {/* Snake 2 (Right starting) - 3 intertwining loops */}
                  <path d="M 60 82 C 85 72 80 62 50 55 C 20 48 25 38 50 35 C 75 32 70 22 54 18" />
                </g>

                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d4c19f" />
                    <stop offset="40%" stopColor="#a98b63" />
                    <stop offset="100%" stopColor="#7a5c37" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="text-[52px] tracking-widest leading-none mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, background: 'linear-gradient(to bottom, #d4c19f, #8b6e4b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IPHMH</h2>
            <div className="flex items-center w-full justify-center gap-2 mb-1.5 opacity-80">
              <div className="h-[0.5px] bg-[#384a3c] w-6"></div>
              <span className="text-[7px] uppercase tracking-[0.2em] text-[#384a3c]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>Institute Of</span>
              <div className="h-[0.5px] bg-[#384a3c] w-6"></div>
            </div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#384a3c] leading-[1.6]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
              Precision Hormonal
            </p>
            <div className="flex items-center w-full justify-center gap-2 my-1 opacity-80">
              <div className="h-[0.5px] bg-[#384a3c] w-4"></div>
              <span className="text-[6.5px] uppercase tracking-[0.3em] text-[#384a3c]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>And</span>
              <div className="h-[0.5px] bg-[#384a3c] w-4"></div>
            </div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-[#384a3c] leading-[1.6]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>
              Metabolic Health
            </p>
          </div>

          {/* Middle Doctor Details */}
          <div className="pl-10 pr-10 border-r border-[#a98b63]/50 flex flex-col justify-center w-[40%]">
            <div className="flex items-baseline gap-2 mb-1.5">
              <h2 className="text-[22px] text-[#384a3c]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, letterSpacing: "0.02em" }}>DR. YUVRAAJ SINGH</h2>
              <span className="text-[9px] text-[#a98b63]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.08em" }}>MD | F.A.A.R.M</span>
            </div>
            {/* <p className="text-[10px] text-[#384a3c] mb-6 uppercase" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.15em" }}>INTERNAL MEDICINE PHYSICIAN</p> */}
            
            <div className="space-y-4 text-[9px] uppercase text-[#384a3c] mb-8" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.05em", lineHeight: "1.5" }}>
              <div className="flex items-start gap-3">
                <div className="text-[#a98b63] shrink-0 mt-[2px]"><Activity className="w-3.5 h-3.5" strokeWidth={1.5} /></div>
                <p>MD – INTERNAL MEDICINE</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-[#a98b63] shrink-0 mt-[2px]"><ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} /></div>
                <p>FELLOWSHIP IN ANTI-AGING &<br/>REGENERATIVE MEDICINE – A4M</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-[#a98b63] shrink-0 mt-[2px]"><Plus className="w-3.5 h-3.5" strokeWidth={1.5} /></div>
                <p>ADVANCED EDUCATION IN<br/>STEM CELL & GENOMICS<br/>(IN PROGRESS)</p>
              </div>
            </div>
            <p className="text-[9px] text-[#a98b63]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: "0.2em" }}>RESTORE &bull; OPTIMIZE &bull; TRANSFORM</p>
          </div>

          {/* Right Invoice Data */}
          <div className="pl-10 flex flex-col justify-start w-[30%] pt-2">
            <h1 className="text-[44px] text-[#384a3c] mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: "0.15em" }}>INVOICE</h1>
            <table className="w-full text-[10px] text-[#384a3c]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.02em" }}>
              <tbody>
                <tr>
                  <td className="py-1 w-24 align-top">INVOICE NO.</td>
                  <td className="py-1 w-4 align-top text-center">:</td>
                  <td className="py-1 align-top">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="py-1 w-24 align-top">DATE</td>
                  <td className="py-1 w-4 align-top text-center">:</td>
                  <td className="py-1 align-top">{issuedLabel}</td>
                </tr>
                <tr>
                  <td className="py-1 w-24 align-top">PATIENT ID</td>
                  <td className="py-1 w-4 align-top text-center">:</td>
                  <td className="py-1 align-top">{invoice.patient?.patientNumber || "—"}</td>
                </tr>
                <tr>
                  <td className="py-1 w-24 align-top">CONSULTANT</td>
                  <td className="py-1 w-4 align-top text-center">:</td>
                  <td className="py-1 align-top uppercase">DR. YUVRAAJ SINGH, MD | F.A.A.R.M</td>
                </tr>
                <tr>
                  <td className="py-1 w-24 align-top">LOCATION</td>
                  <td className="py-1 w-4 align-top text-center">:</td>
                  <td className="py-1 align-top uppercase">811, Harnoor House, 1st Floor, Sector-42, Gurugram</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Billed To & Quote Section */}
        <div className="px-10 pt-8 pb-12 flex relative border-b border-[#EAECF0]/50 bg-[#fbfaf6]">
          {/* Left Column: Billed To */}
          <div className="w-[280px] pr-6 border-r-[1.5px]" style={{ borderColor: "#E5DFD0" }}>
            <p className="font-semibold tracking-[0.12em] text-[12px] mb-4 uppercase" style={{ color: "#B08D44" }}>
              Billed To
            </p>
            <p className="font-bold text-[16px]" style={{ color: "#28342F" }}>
              {invoice.patient ? invoice.patient.fullName : "Ms. Neha Sharma"}
            </p>
          </div>

          {/* Right Column: Quote */}
          <div className="flex-1 pl-10 relative flex items-center min-h-[140px] overflow-hidden">
             {/* Decorative Background (Hexagons and DNA-like fading shapes) */}
             <div className="absolute inset-0 opacity-[0.12] pointer-events-none flex items-center justify-end pr-4" style={{ right: "-20px" }}>
                <svg width="300" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* DNA Strand */}
                  <g opacity="0.8">
                    <path d="M150 0 Q180 37.5 150 75 T150 150" stroke="#B08D44" strokeWidth="4" strokeLinecap="round" />
                    <path d="M180 0 Q150 37.5 180 75 T180 150" stroke="#B08D44" strokeWidth="4" strokeLinecap="round" />
                    <line x1="156" y1="20" x2="174" y2="20" stroke="#B08D44" strokeWidth="2.5" />
                    <line x1="162" y1="37.5" x2="168" y2="37.5" stroke="#B08D44" strokeWidth="2.5" />
                    <line x1="156" y1="55" x2="174" y2="55" stroke="#B08D44" strokeWidth="2.5" />
                    <line x1="150" y1="75" x2="180" y2="75" stroke="#B08D44" strokeWidth="2.5" />
                    <line x1="156" y1="95" x2="174" y2="95" stroke="#B08D44" strokeWidth="2.5" />
                    <line x1="162" y1="112.5" x2="168" y2="112.5" stroke="#B08D44" strokeWidth="2.5" />
                    <line x1="156" y1="130" x2="174" y2="130" stroke="#B08D44" strokeWidth="2.5" />
                  </g>
                  
                  {/* Hexagons */}
                  <g opacity="0.6">
                    <path d="M230 40 L245 30 L260 40 L260 60 L245 70 L230 60 Z" stroke="#B08D44" strokeWidth="1.5" />
                    <circle cx="230" cy="40" r="3" fill="#B08D44"/>
                    <circle cx="245" cy="30" r="3" fill="#B08D44"/>
                    <circle cx="260" cy="40" r="3" fill="#B08D44"/>
                    <circle cx="260" cy="60" r="3" fill="#B08D44"/>
                    <circle cx="245" cy="70" r="3" fill="#B08D44"/>
                    <circle cx="230" cy="60" r="3" fill="#B08D44"/>
                    
                    <path d="M200 60 L215 50 L230 60 L230 80 L215 90 L200 80 Z" stroke="#B08D44" strokeWidth="1.5" />
                    <circle cx="200" cy="60" r="3" fill="#B08D44"/>
                    <circle cx="215" cy="50" r="3" fill="#B08D44"/>
                    <circle cx="230" cy="80" r="3" fill="#B08D44"/>
                    <circle cx="215" cy="90" r="3" fill="#B08D44"/>
                    <circle cx="200" cy="80" r="3" fill="#B08D44"/>
                    
                    <path d="M80 60 L95 50 L110 60 L110 80 L95 90 L80 80 Z" stroke="#B08D44" strokeWidth="1.5" />
                    <circle cx="80" cy="60" r="3" fill="#B08D44"/>
                    <circle cx="95" cy="50" r="3" fill="#B08D44"/>
                    <circle cx="110" cy="60" r="3" fill="#B08D44"/>
                    <circle cx="110" cy="80" r="3" fill="#B08D44"/>
                    <circle cx="95" cy="90" r="3" fill="#B08D44"/>
                    <circle cx="80" cy="80" r="3" fill="#B08D44"/>
                  </g>
                </svg>
             </div>
             
             {/* Large Quote Mark */}
             <div className="absolute top-0 left-8 text-[60px] leading-none" style={{ color: "#D1CCBF", fontFamily: "Georgia, serif" }}>
               &ldquo;
             </div>
             
             <div className="pl-12 pt-4 relative z-10 w-full pr-12">
               <p className="text-[17px] italic mb-3" style={{ color: "#28342F", fontFamily: "Georgia, serif", lineHeight: "1.6" }}>
                 True health is not the absence<br/>
                 of disease, but the harmony of<br/>
                 biology, performance and longevity.
               </p>
               <p className="text-[14px] italic" style={{ color: "#4A5650", fontFamily: "Georgia, serif" }}>
                 &mdash; Dr. Yuvraaj Singh (MD | F.A.A.R.M)
               </p>
             </div>
          </div>
        </div>

        {/* Table / Description Section */}
        <div className="mx-10 my-8 border border-[#d4c19f]/60 rounded-md overflow-hidden bg-[#fbfaf6]">
          {/* Header */}
          <div className="flex items-center bg-[#404d3e] text-[#fdfaf6] text-[11px] tracking-[0.15em] font-semibold uppercase">
            <div className="w-[70%] py-3.5 pl-8 border-r border-[#d4c19f]/30">
              Description
            </div>
            <div className="w-[30%] py-3.5 text-center">
              Amount (₹)
            </div>
          </div>
          
          {/* Items */}
          {invoice.items.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No items</div>
          ) : invoice.items.map((it, idx) => (
            <div key={it.id} className={`flex ${idx !== invoice.items.length - 1 ? "border-b border-[#d4c19f]/40" : ""}`}>
              {/* Left */}
              <div className="w-[70%] pt-6 pb-4 px-8 border-r border-[#d4c19f]/40 flex gap-6">
                {/* Custom DNA Icon from Image */}
                <div className="shrink-0 w-[72px] h-[72px] rounded-full border-[1.5px] border-[#a98b63] flex items-center justify-center relative bg-transparent mt-1">
                   <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="23" cy="10" r="3.5" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                      <path d="M14 18 C 14 14, 32 14, 32 18" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                      <path d="M20 18 Q26 24 20 30 T20 42" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                      <path d="M26 18 Q20 24 26 30 T26 42" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                      <line x1="21.5" y1="22" x2="24.5" y2="22" stroke="#384a3c" strokeWidth="1.5" />
                      <line x1="21.5" y1="26" x2="24.5" y2="26" stroke="#384a3c" strokeWidth="1.5" />
                      <line x1="21.5" y1="30" x2="24.5" y2="30" stroke="#384a3c" strokeWidth="1.5" />
                      <line x1="21.5" y1="34" x2="24.5" y2="34" stroke="#384a3c" strokeWidth="1.5" />
                      <line x1="21.5" y1="38" x2="24.5" y2="38" stroke="#384a3c" strokeWidth="1.5" />
                      <path d="M12 24 C 8 24, 6 20, 6 20 C 6 20, 10 18, 12 24 Z" fill="#384a3c" />
                      <path d="M14 26 C 10 28, 8 32, 8 32 C 8 32, 12 34, 14 26 Z" fill="#384a3c" />
                      <path d="M34 24 C 38 24, 40 20, 40 20 C 40 20, 36 18, 34 24 Z" fill="#384a3c" />
                      <path d="M32 26 C 36 28, 38 32, 38 32 C 38 32, 34 34, 32 26 Z" fill="#384a3c" />
                   </svg>
                </div>
                <div className="pt-1">
                   <h4 className="text-[15px] font-semibold text-[#28342F] tracking-[0.03em] mb-2 uppercase">
                     {it.description === "Consultation" || invoice.items.length === 1 ? "COMPREHENSIVE PRECISION HEALTH PROGRAM" : it.description}
                   </h4>
                   <p className="text-[13px] text-[#4A5650] font-medium leading-[1.7] mb-3 pr-4">
                     A complete physician-led, evidence-based program encompassing advanced diagnostics, personalized protocols, metabolic optimization, hormonal balance, regenerative strategies, longevity planning, and continuous clinical monitoring.
                   </p>
                   <p className="text-[14.5px] text-[#384a3c] italic font-serif opacity-90 tracking-wide">
                     Designed Around You. Backed by Science. Focused on Results.
                   </p>
                </div>
              </div>
              {/* Right */}
              <div className="w-[30%] flex flex-col justify-center items-center pt-6 pb-4 px-4">
                 <p className="text-[26px] font-medium text-[#28342F] tracking-wide">
                   {formatMoney(it.lineTotalCents, invoice.currency).replace("INR", "₹").replace(".00", "")}
                 </p>
                 <p className="text-[10.5px] text-[#4A5650] font-medium text-center mt-3 leading-relaxed px-6">
                   (Rupees {numberToWordsINR(Math.floor(it.lineTotalCents / 100))} Only)
                 </p>
              </div>
            </div>
          ))}

          {/* Totals Section */}
          <div>
            {/* Subtotals Area (Transparent bg) */}
            <div className="flex text-[#28342F] border-b border-[#d4c19f]/40">
              <div className="w-[70%] border-r border-[#d4c19f]/40"></div>
              <div className="w-[30%] pt-2 pb-5 px-10 flex flex-col gap-3 text-[13px] font-medium text-[#28342F]">
                 <div className="flex justify-between w-full items-center">
                    <span className="text-[#4A5650] text-[11px] uppercase tracking-wider font-bold">Subtotal</span>
                    <span>{formatMoney(invoice.subtotalCents, invoice.currency)}</span>
                 </div>
                 <div className="flex justify-between w-full items-center">
                    <span className="text-[#384a3c] text-[11px] uppercase tracking-wider font-bold">Grand Total</span>
                    <span className="font-bold">{formatMoney(invoice.totalCents, invoice.currency)}</span>
                 </div>
                 <div className="flex justify-between w-full items-center">
                    <span className="text-[#a1824a] text-[11px] uppercase tracking-wider font-bold">Paid</span>
                    <span className="text-[#a1824a] font-bold">{formatMoney(paidCents, invoice.currency)}</span>
                 </div>
              </div>
            </div>

            {/* Bottom Total Row (Pinkish Beige) */}
            <div className="flex text-[#28342F]">
              {/* Left */}
              <div className="w-[70%] py-5 pr-8 border-r border-[#d4c19f]/40 flex items-center justify-end bg-[#e8decd]/80">
                 <span className="text-[11px] font-bold tracking-[0.1em] text-[#384a3c] uppercase">
                   TOTAL (ALL INCLUSIVE)
                 </span>
              </div>
              {/* Right */}
              <div className="w-[30%] py-5 px-10 flex justify-between items-center text-[13px] font-medium text-[#28342F] bg-[#e1d3bc]/80">
                 <span className="text-[#28342F] text-[11px] uppercase tracking-wider font-black">Balance Due</span>
                 <span className="font-bold text-[18px]">{formatMoney(Math.max(0, invoice.totalCents - paidCents), invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Note */}
        <div className="pt-2 pb-2 text-center font-serif italic text-[#384a3c] bg-[#fdfdfb] border-b border-[#EAECF0]/50">
          <p>Thank you for placing your trust in us.</p>
          <p>You are not just a patient. You are a partner in your journey to optimal health and longevity.</p>
        </div>

        {/* Footer Sign & Philosophy */}
        <div className="px-10 flex gap-12 py-12 bg-[#fdfaf6] items-start">
          <div className="w-[40%] pt-2">
            <div className="text-[36px] mb-4 text-[#28342F] leading-none font-medium ml-2" style={{ fontFamily: "'Meddon', 'La Belle Aurore', 'Style Script', cursive", transform: "rotate(-3deg)" }}>
              <br />
            </div>
            <div className="w-[230px] border-b-[1.5px] border-[#c3ab7b] mb-4"></div>
            <h4 className="text-[16px] font-semibold text-[#28342F] mb-1 tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Dr. Yuvraaj Singh, MD, FAARM
            </h4>
            <p className="text-[11px] font-semibold text-[#4A5650] tracking-[0.12em] mb-4 uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Internal Medicine / Critical Care / Advanced training in Hormonal and Metabolic Medicine (USA)
            </p>
            <div className="text-[12px] text-[#4A5650] space-y-1.5 italic leading-[1.6]">
              <p>Fellow, American Academy of Anti-Aging Medicine (A4M)</p>
              <p>Advanced Training in Functional, Regenerative<br/>and Longevity Medicine</p>
              <p>Advanced Education in Stem Cell & Genomics (In Progress)</p>
            </div>
          </div>

          <div className="flex-1 bg-[#fdfaf6] border-[1.5px] border-[#e8decd] rounded-xl p-8 shadow-sm">
            <h4 className="text-[12px] font-bold text-[#384a3c] tracking-[0.15em] mb-2 uppercase">OUR PHILOSOPHY</h4>
            <div className="w-8 border-b-[2.5px] border-[#c3ab7b] mb-5"></div>
            <p className="text-[11.5px] text-[#4A5650] mb-8 leading-[1.8] font-medium">
              We go beyond symptom management to uncover the root causes of imbalance. Our precision approach integrates clinical expertise, cutting-edge diagnostics, and personalized protocols to restore physiology, enhance performance, and extend healthspan.
            </p>
            <div className="flex justify-between items-start text-center px-2">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 mb-3 flex items-center justify-center text-[#384a3c]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m8 22 8-8"/><path d="m8 2 8 8"/><path d="M8 10a5 5 0 0 0 8-4"/><path d="M8 14a5 5 0 0 1 8 4"/><path d="m15 15-3-3"/><path d="m15 9-3 3"/></svg>
                </div>
                <p className="text-[8px] font-bold text-[#384a3c] tracking-[0.12em] uppercase">PHYSICIAN LED</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 mb-3 flex items-center justify-center text-[#384a3c]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>
                </div>
                <p className="text-[8px] font-bold text-[#384a3c] tracking-[0.12em] uppercase">EVIDENCE BASED</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 mb-3 flex items-center justify-center text-[#384a3c]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="m22 2-6 6"/></svg>
                </div>
                <p className="text-[8px] font-bold text-[#384a3c] tracking-[0.12em] uppercase">PRECISION FOCUSED</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 mb-3 flex items-center justify-center text-[#384a3c]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>
                </div>
                <p className="text-[8px] font-bold text-[#384a3c] tracking-[0.12em] uppercase">LONG TERM OUTCOMES</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Contact Strip */}
        <div className="bg-[#414d3e] text-[#d4c19f] px-12 py-10 flex items-center justify-between relative overflow-hidden">
          {/* DNA Overlay */}
          <div className="absolute right-[-40px] top-[-20px] bottom-0 w-[400px] opacity-30 pointer-events-none flex items-center justify-end">
             <svg width="400" height="200" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-15deg)' }}>
                <path d="M 50 100 Q 150 0, 250 100 T 450 100" stroke="#d4c19f" strokeWidth="2" fill="none"/>
                <path d="M 50 100 Q 150 200, 250 100 T 450 100" stroke="#d4c19f" strokeWidth="2" fill="none"/>
                <line x1="80" y1="75" x2="80" y2="125" stroke="#d4c19f" strokeWidth="1" />
                <line x1="110" y1="50" x2="110" y2="150" stroke="#d4c19f" strokeWidth="1" />
                <line x1="140" y1="35" x2="140" y2="165" stroke="#d4c19f" strokeWidth="1" />
                <line x1="170" y1="40" x2="170" y2="160" stroke="#d4c19f" strokeWidth="1" />
                <line x1="200" y1="60" x2="200" y2="140" stroke="#d4c19f" strokeWidth="1" />
                <line x1="230" y1="85" x2="230" y2="115" stroke="#d4c19f" strokeWidth="1" />
                <line x1="270" y1="85" x2="270" y2="115" stroke="#d4c19f" strokeWidth="1" />
                <line x1="300" y1="60" x2="300" y2="140" stroke="#d4c19f" strokeWidth="1" />
                <line x1="330" y1="40" x2="330" y2="160" stroke="#d4c19f" strokeWidth="1" />
                <line x1="360" y1="35" x2="360" y2="165" stroke="#d4c19f" strokeWidth="1" />
                <line x1="390" y1="50" x2="390" y2="150" stroke="#d4c19f" strokeWidth="1" />
             </svg>
          </div>

          <div className="flex items-center gap-8 w-1/2 relative z-10 border-r border-[#d4c19f]/30 pr-10">
            <div className="text-[#d4c19f] shrink-0 border-[1.5px] border-[#d4c19f] rounded-t-sm rounded-b-xl p-3 w-[60px] h-[64px] flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <p className="text-[11px] font-medium tracking-[0.05em] uppercase leading-[1.8] text-[#fdfaf6]">
              <span className="text-[#d4c19f]">ALL PROGRAMS ARE</span><br/>
              PHYSICIAN-LED, EVIDENCE-BASED<br/>
              & PERSONALLY SUPERVISED.
            </p>
          </div>
          <div className="flex flex-col gap-3.5 text-[12.5px] tracking-wide w-1/2 pl-12 relative z-10 text-[#fdfaf6]">
            <div className="flex items-center gap-5"><Phone className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> +91 9266843439</div>
            <div className="flex items-center gap-5"><Mail className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> dryuvraaj@iphmh.com</div>
            <div className="flex items-center gap-5"><Globe className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> www.dryuvraajsingh.com</div>
            <div className="flex items-center gap-5"><MapPin className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> 811, Harnoor House, 1st Floor, Sector-42, Gurugram</div>
          </div>
        </div>

        {/* Bottom Gold Strip */}
        <div className="bg-[#ebd9bd] text-[#384a3c] text-center py-6">
          <div className="text-[12px] font-medium tracking-[0.25em] uppercase mb-2">
            INSTITUTE OF PRECISION HORMONAL & METABOLIC HEALTH
          </div>
          <div className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#384a3c]/90">
            PRECISION. PERSONALIZATION. RESULTS.
          </div>
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

function numberToWordsINR(num: number): string {
  if (num === 0) return "Zero";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const format2 = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
  };
  
  let words = "";
  if (num >= 10000000) {
    words += format2(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    words += format2(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    words += format2(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num >= 100) {
    words += format2(Math.floor(num / 100)) + " Hundred ";
    num %= 100;
  }
  if (num > 0) {
    words += format2(num);
  }
  return words.trim();
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
