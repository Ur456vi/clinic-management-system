"use client"

/**
 * Branded, print-ready invoice sheet (IPHMH letterhead). Shared by the admin
 * invoice detail page and the patient portal so both render the exact same
 * document. Pure presentation — the caller supplies normalized invoice data.
 */

import {
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  Activity,
  Plus,
} from "lucide-react"
import Image from "next/image"

export type InvoiceSheetItem = {
  id: string
  description: string
  lineTotalCents: number
}

export type InvoiceSheetProps = {
  invoiceNumber: string
  issuedLabel: string
  patientNumber: string | null
  patientFullName: string | null
  items: InvoiceSheetItem[]
  subtotalCents: number
  totalCents: number
  paidCents: number
  currency: string
}

export function formatMoney(cents: number, currency: string): string {
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

export default function InvoiceSheet({
  invoiceNumber,
  issuedLabel,
  patientNumber,
  patientFullName,
  items,
  subtotalCents,
  totalCents,
  paidCents,
  currency,
}: InvoiceSheetProps) {
  return (
    <div className="text-[#384a3c] bg-[#fdfcf7] border border-[#EAECF0] shadow-sm overflow-hidden dark:text-[#101828]">
      {/* Header Section */}
      <div className="p-12 flex items-stretch justify-between relative border-b border-[#a98b63]/30 bg-[#fbfaf6]">
        <div className="flex flex-col items-center justify-center pr-10 border-r border-[#a98b63]/50 w-[30%] text-center">
          <Image
                        src="/iphmh-logos.jpeg"
                        alt="IPHMH Logo"
                        width={180}
                        height={180}
                        className="object-contain"
                        priority
                      />
        </div>

        {/* <div className="pl-10 pr-10 border-r border-[#a98b63]/50 flex flex-col justify-center w-[40%]">
          <div className="flex items-baseline gap-2 mb-1.5">
            <h2 className="text-[22px] text-[#384a3c]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, letterSpacing: "0.02em" }}>DR. YUVRAAJ SINGH</h2>
            <span className="text-[9px] text-[#a98b63]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.08em" }}>MD | F.A.A.R.M</span>
          </div>
          <div className="space-y-4 text-[9px] uppercase text-[#384a3c] mb-8" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.05em", lineHeight: "1.5" }}>
            <div className="flex items-start gap-3"><div className="text-[#a98b63] shrink-0 mt-[2px]"><Activity className="w-3.5 h-3.5" strokeWidth={1.5} /></div><p>MD – INTERNAL MEDICINE</p></div>
            <div className="flex items-start gap-3"><div className="text-[#a98b63] shrink-0 mt-[2px]"><ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} /></div><p>FELLOWSHIP IN ANTI-AGING &<br />REGENERATIVE MEDICINE – A4M</p></div>
            <div className="flex items-start gap-3"><div className="text-[#a98b63] shrink-0 mt-[2px]"><Plus className="w-3.5 h-3.5" strokeWidth={1.5} /></div><p>ADVANCED EDUCATION IN<br />STEM CELL & GENOMICS<br />(IN PROGRESS)</p></div>
          </div>
          <p className="text-[9px] text-[#a98b63]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: "0.2em" }}>RESTORE &bull; OPTIMIZE &bull; TRANSFORM</p>
        </div> */}
        <div className="pl-10 pr-10 border-r border-[#a98b63]/50 flex flex-col justify-center w-[40%]">
            <div className="flex items-baseline gap-2 mb-1.5">
              <h2 className="text-[18px] text-[#384a3c]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, letterSpacing: "0.02em" }}>DR. YUVRAAJ SINGH</h2>
              <span className="text-[9px] text-[#a98b63]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.08em" }}>MD | F.A.A.R.M</span>
            </div>
            {/* <p className="text-[10px] text-[#384a3c] mb-6 uppercase" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.15em" }}>INTERNAL MEDICINE PHYSICIAN</p> */}
            
            <div className="space-y-4 text-[9px] uppercase text-[#384a3c] mb-8" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.05em", lineHeight: "1.5" }}>
              <div className="flex items-start gap-3">
                <div className="text-[#a98b63] shrink-0 mt-[2px]"><Activity className="w-3.5 h-3.5" strokeWidth={1.5} /></div>
                <p>INTERNAL MEDICINE | Critical Care</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-[#a98b63] shrink-0 mt-[2px]"><ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} /></div>
                <p>ADVANCED TRAINING IN HORMONAL,<br />METABOLIC & REGENERATIVE<br />MEDICINE, USA</p>
              </div>
              {/* <div className="flex items-start gap-3">
                <div className="text-[#a98b63] shrink-0 mt-[2px]"><Plus className="w-3.5 h-3.5" strokeWidth={1.5} /></div>
                <p>A4M, USA</p>
              </div> */}
            </div>
            <p className="text-[9px] text-[#a98b63]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: "0.2em" }}>RESTORE &bull; OPTIMIZE &bull; TRANSFORM</p>
          </div>

        <div className="pl-10 flex flex-col justify-start w-[30%] pt-2">
          <h1 className="text-[44px] text-[#384a3c] mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, letterSpacing: "0.15em" }}>INVOICE</h1>
          <table className="w-full text-[10px] text-[#384a3c]" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500, letterSpacing: "0.02em" }}>
            <tbody>
              <tr><td className="py-1 w-24 align-top">INVOICE NO.</td><td className="py-1 w-4 align-top text-center">:</td><td className="py-1 align-top">{invoiceNumber}</td></tr>
              <tr><td className="py-1 w-24 align-top">DATE</td><td className="py-1 w-4 align-top text-center">:</td><td className="py-1 align-top">{issuedLabel}</td></tr>
              <tr><td className="py-1 w-24 align-top">PATIENT ID</td><td className="py-1 w-4 align-top text-center">:</td><td className="py-1 align-top">{patientNumber || "—"}</td></tr>
              <tr><td className="py-1 w-24 align-top">CONSULTANT</td><td className="py-1 w-4 align-top text-center">:</td><td className="py-1 align-top uppercase">DR. YUVRAAJ SINGH, MD | F.A.A.R.M</td></tr>
              <tr><td className="py-1 w-24 align-top">LOCATION</td><td className="py-1 w-4 align-top text-center">:</td><td className="py-1 align-top uppercase">811, Harnoor House, 1st Floor, Sector-42, Gurugram</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Billed To */}
      <div className="px-10 pt-8 pb-12 flex relative border-b border-[#EAECF0]/50 bg-[#fbfaf6]">
        <div className="w-[280px] pr-6 border-r-[1.5px]" style={{ borderColor: "#E5DFD0" }}>
          <p className="font-semibold tracking-[0.12em] text-[12px] mb-4 uppercase" style={{ color: "#B08D44" }}>Billed To</p>
          <p className="font-bold text-[16px]" style={{ color: "#28342F" }}>{patientFullName || "—"}</p>
        </div>
        <div className="flex-1 pl-10 relative flex items-center min-h-[140px] overflow-hidden">
          <div className="absolute top-0 left-8 text-[60px] leading-none" style={{ color: "#D1CCBF", fontFamily: "Georgia, serif" }}>&ldquo;</div>
          <div className="pl-12 pt-4 relative z-10 w-full pr-12">
            <p className="text-[17px] italic mb-3" style={{ color: "#28342F", fontFamily: "Georgia, serif", lineHeight: "1.6" }}>True health is not the absence<br />of disease, but the harmony of<br />biology, performance and longevity.</p>
            <p className="text-[14px] italic" style={{ color: "#4A5650", fontFamily: "Georgia, serif" }}>&mdash; Dr. Yuvraaj Singh, MD | F.A.A.R.M</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mx-10 my-8 border border-[#d4c19f]/60 rounded-md overflow-hidden bg-[#fbfaf6]">
        <div className="flex items-center bg-[#404d3e] text-[#fdfaf6] text-[11px] tracking-[0.15em] font-semibold uppercase">
          <div className="w-[70%] py-3.5 pl-8 border-r border-[#d4c19f]/30">Description</div>
          <div className="w-[30%] py-3.5 text-center">Amount (₹)</div>
        </div>

        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No items</div>
        ) : (
          items.map((it, idx) => (
            <div key={it.id} className={`flex ${idx !== items.length - 1 ? "border-b border-[#d4c19f]/40" : ""}`}>
              <div className="w-[70%] pt-6 pb-4 px-8 border-r border-[#d4c19f]/40 flex gap-6">
                <div className="shrink-0 w-[72px] h-[72px] rounded-full border-[1.5px] border-[#a98b63] flex items-center justify-center relative bg-transparent mt-1">
                  <svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="23" cy="10" r="3.5" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                    <path d="M14 18 C 14 14, 32 14, 32 18" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                    <path d="M20 18 Q26 24 20 30 T20 42" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                    <path d="M26 18 Q20 24 26 30 T26 42" stroke="#384a3c" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
                <div className="pt-1">
                  <h4 className="text-[15px] font-semibold text-[#28342F] tracking-[0.02em] leading-snug whitespace-pre-wrap break-words">
                    {it.description}
                  </h4>
                </div>
              </div>
              <div className="w-[30%] flex flex-col justify-center items-center pt-6 pb-4 px-4">
                <p className="text-[26px] font-medium text-[#28342F] tracking-wide">
                  {formatMoney(it.lineTotalCents, currency).replace("INR", "₹").replace(".00", "")}
                </p>
                <p className="text-[10.5px] text-[#4A5650] font-medium text-center mt-3 leading-relaxed px-6">
                  (Rupees {numberToWordsINR(Math.floor(it.lineTotalCents / 100))} Only)
                </p>
              </div>
            </div>
          ))
        )}

        {/* Totals */}
        <div>
          <div className="flex text-[#28342F] border-b border-[#d4c19f]/40">
            <div className="w-[70%] border-r border-[#d4c19f]/40"></div>
            <div className="w-[30%] pt-2 pb-5 px-10 flex flex-col gap-3 text-[13px] font-medium text-[#28342F]">
              <div className="flex justify-between w-full items-center"><span className="text-[#4A5650] text-[11px] uppercase tracking-wider font-bold">Subtotal</span><span>{formatMoney(subtotalCents, currency)}</span></div>
              <div className="flex justify-between w-full items-center"><span className="text-[#384a3c] text-[11px] uppercase tracking-wider font-bold">Grand Total</span><span className="font-bold">{formatMoney(totalCents, currency)}</span></div>
              <div className="flex justify-between w-full items-center"><span className="text-[#a1824a] text-[11px] uppercase tracking-wider font-bold">Paid</span><span className="text-[#a1824a] font-bold">{formatMoney(paidCents, currency)}</span></div>
            </div>
          </div>
          <div className="flex text-[#28342F]">
            <div className="w-[70%] py-5 pr-8 border-r border-[#d4c19f]/40 flex items-center justify-end bg-[#e8decd]/80"><span className="text-[11px] font-bold tracking-[0.1em] text-[#384a3c] uppercase">TOTAL (ALL INCLUSIVE)</span></div>
            <div className="w-[30%] py-5 px-10 flex justify-between items-center text-[13px] font-medium text-[#28342F] bg-[#e1d3bc]/80"><span className="text-[#28342F] text-[11px] uppercase tracking-wider font-black">Balance Due</span><span className="font-bold text-[18px]">{formatMoney(Math.max(0, totalCents - paidCents), currency)}</span></div>
          </div>
        </div>
      </div>

      {/* Thank you */}
      <div className="pt-2 pb-2 text-center font-serif italic text-[#384a3c] bg-[#fdfdfb] border-b border-[#EAECF0]/50">
        <p>Thank you for placing your trust in us.</p>
        <p>We Are obliged to be a partner in your journey to optimal health and longevity.</p>
      </div>

      {/* Contact strip */}
      <div className="bg-[#414d3e] text-[#d4c19f] px-12 py-10 flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-8 w-1/2 relative z-10 border-r border-[#d4c19f]/30 pr-10">
          <div className="text-[#d4c19f] shrink-0 border-[1.5px] border-[#d4c19f] rounded-t-sm rounded-b-xl p-3 w-[60px] h-[64px] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
          </div>
          <p className="text-[11px] font-medium tracking-[0.05em] uppercase leading-[1.8] text-[#fdfaf6]"><span className="text-[#d4c19f]">ALL PROGRAMS ARE</span><br />PHYSICIAN-LED, EVIDENCE-BASED<br />& PERSONALLY SUPERVISED.</p>
        </div>
        <div className="flex flex-col gap-3.5 text-[12.5px] tracking-wide w-1/2 pl-12 relative z-10 text-[#fdfaf6]">
          <div className="flex items-center gap-5"><Phone className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> +91 9266843439</div>
          <div className="flex items-center gap-5"><Mail className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> dryuvraajsingh@iphmh.com</div>
          <div className="flex items-center gap-5"><Globe className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> www.dryuvraajsingh.com</div>
          <div className="flex items-center gap-5"><MapPin className="w-[18px] h-[18px] text-[#d4c19f]" strokeWidth={1.5} /> 811, Harnoor House, 1st Floor, Sector-42, Gurugram</div>
        </div>
      </div>

      {/* Gold strip */}
      <div className="bg-[#ebd9bd] text-[#384a3c] text-center py-6">
        <div className="text-[12px] font-medium tracking-[0.25em] uppercase mb-2">INSTITUTE OF PRECISION HORMONAL & METABOLIC HEALTH</div>
        <div className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#384a3c]/90">PRECISION. PERSONALIZATION. OUTCOMES.</div>
      </div>
    </div>
  )
}
