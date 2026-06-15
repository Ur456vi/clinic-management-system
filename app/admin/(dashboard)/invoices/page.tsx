"use client"

/**
 * Invoices list — real fetch from /api/invoices.
 *
 * Drops the previous hardcoded array of mock "Sumit Mittal" /
 * "Akanksha Jain" invoices. Status filter maps to the InvoiceStatus
 * enum; amounts use Intl.NumberFormat for proper currency rendering.
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  Printer,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type Status = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID"

interface InvoiceRow {
  id: string
  invoiceNumber: string
  status: Status
  totalCents: number
  paidCents: number
  currency: string
  issuedAt: string
  dueAt: string | null
  patient: {
    id: string
    patientNumber: string
    fullName: string
    email: string | null
  } | null
  createdAt: string
}

const STATUS_FILTERS: { label: string; value: Status | "ALL" }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Partially paid", value: "PARTIALLY_PAID" },
  { label: "Paid", value: "PAID" },
  { label: "Void", value: "VOID" },
]

export default function InvoicesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    setError(null)
    try {
      const url = new URL("/api/invoices", window.location.origin)
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)
      url.searchParams.set("limit", "100")
      const res = await fetch(url.toString(), { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const items: InvoiceRow[] =
        json?.items ?? json?.data?.items ?? json?.data ?? []
      setRows(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchInvoices()
  }, [fetchInvoices])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!openMenu) return
    const close = () => setOpenMenu(null)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [openMenu])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.patient?.fullName.toLowerCase().includes(q) ||
        r.patient?.email?.toLowerCase().includes(q) ||
        r.patient?.patientNumber.toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Invoices</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            Billing records — issued, paid, partially paid and outstanding.
          </p>
        </div>
        <Link href="/admin/invoices/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg h-auto text-sm font-semibold inline-flex items-center gap-2">
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by invoice #, patient name, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
            className="pl-9 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] font-medium focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          >
            {STATUS_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {!loading && !error ? (
          <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
            {filtered.length} invoice{filtered.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm">
        <div className="">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Invoice</th>
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Issued</th>
                <th className="px-6 py-3 font-semibold">Due</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#667085] dark:text-[#94A3B8]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-3" />
                      <p className="text-sm font-medium">Loading invoices…</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-7 w-7 text-[#D92D20]" />
                      <p className="text-sm font-semibold text-[#B42318]">
                        Couldn&apos;t load invoices
                      </p>
                      <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{error}</p>
                      <Button variant="outline" onClick={() => void fetchInvoices()}>
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center text-[#667085] dark:text-[#94A3B8] gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
                      </div>
                      <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">No invoices yet</p>
                      <p className="text-xs max-w-sm">
                        New billing records will appear here. Adjust the status filter to widen your search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <InvoiceRowItem
                    key={row.id}
                    row={row}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onView={(id) => router.push(`/admin/invoices/${id}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function InvoiceRowItem({
  row,
  openMenu,
  setOpenMenu,
  onView,
}: {
  row: InvoiceRow
  openMenu: string | null
  setOpenMenu: (v: string | null) => void
  onView: (id: string) => void
}) {
  const isMenuOpen = openMenu === row.id
  return (
    <tr className="hover:bg-[#F9FAFB] transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/admin/invoices/${row.id}`}
          className="text-sm font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
        >
          {row.invoiceNumber}
        </Link>
        <p className="text-[10px] text-[#98A2B3] dark:text-[#94A3B8] font-mono mt-0.5">{row.id}</p>
      </td>
      <td className="px-6 py-4">
        {row.patient ? (
          <div>
            <Link
              href={`/admin/patients/${row.patient.id}`}
              className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] hover:text-[#2E37A4]"
            >
              {row.patient.fullName}
            </Link>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
              #{row.patient.patientNumber}
              {row.patient.email ? ` · ${row.patient.email}` : ""}
            </p>
          </div>
        ) : (
          <span className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB]">
          {formatMoney(row.totalCents, row.currency)}
        </p>
        {row.paidCents > 0 && row.paidCents < row.totalCents ? (
          <p className="text-xs text-[#027A48]">
            Paid {formatMoney(row.paidCents, row.currency)}
          </p>
        ) : null}
      </td>
      <td className="px-6 py-4">
        <StatusPill status={row.status} />
      </td>
      <td className="px-6 py-4 text-sm text-[#667085] dark:text-[#94A3B8]">
        {new Date(row.issuedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 text-sm text-[#667085] dark:text-[#94A3B8]">
        {row.dueAt
          ? new Date(row.dueAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-6 py-4 text-right relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenu(isMenuOpen ? null : row.id)
          }}
          className="p-1.5 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Open actions menu"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
        {isMenuOpen ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white dark:bg-[#1F2937] ring-1 ring-[#EAECF0] dark:ring-[#374151] z-10"
          >
            <div className="py-1">
              <button
                type="button"
                onClick={() => onView(row.id)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB]"
              >
                <Eye className="h-4 w-4" /> View
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB]"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        ) : null}
      </td>
    </tr>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string; label: string; Icon?: typeof CheckCircle2 }> = {
    DRAFT: { bg: "#F2F4F7", fg: "#344054", label: "Draft" },
    ISSUED: { bg: "#EFF8FF", fg: "#175CD3", label: "Issued" },
    PARTIALLY_PAID: { bg: "#FFF1D6", fg: "#B5642A", label: "Partially Paid" },
    PAID: { bg: "#ECFDF3", fg: "#027A48", label: "Paid", Icon: CheckCircle2 },
    VOID: { bg: "#FEF3F2", fg: "#B42318", label: "Void" },
  }
  const c = map[status] ?? map.ISSUED
  const Icon = c.Icon
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
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
