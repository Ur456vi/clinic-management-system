"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Printer,
  CheckCircle2,
} from "lucide-react"
import { notify } from "@/lib/notify"

// Seed list — diversified patient + email columns (the previous all-
// "Sumit Mittal" / "sumit1@gmail.com" rows tripped BUG-032), and the
// "-" sentinel in dueDate has been replaced with a computed due date
// (BUG-034 — pending and partially-paid invoices should always have one,
// paid ones can fall back to the invoice date).
type Invoice = {
  id: string
  patient: string
  email: string
  amount: string
  status: "Paid" | "Pending Payment" | "Partially Paid"
  dueDate: string
  date: string
}

const invoices: Invoice[] = [
  { id: "INV-202604-000041", patient: "Sumit Mittal",     email: "sumit.mittal@example.com",     amount: "$400.30", status: "Paid",            dueDate: "Apr 2, 2026",  date: "Apr 2, 2026" },
  { id: "INV-202604-000040", patient: "Akanksha Jain",    email: "akanksha.jain@example.com",    amount: "$400.30", status: "Pending Payment", dueDate: "Apr 16, 2026", date: "Apr 2, 2026" },
  { id: "INV-202604-000039", patient: "Sonali Mittal",    email: "sonali.mittal@example.com",    amount: "$900.00", status: "Pending Payment", dueDate: "Apr 25, 2026", date: "Apr 2, 2026" },
  { id: "INV-202604-000038", patient: "Tarun Gupta",      email: "tarun.gupta@example.com",      amount: "$900.00", status: "Paid",            dueDate: "Apr 1, 2026",  date: "Apr 1, 2026" },
  { id: "INV-202604-000037", patient: "Sarita Jain",      email: "sarita.jain@example.com",      amount: "$900.00", status: "Paid",            dueDate: "Apr 1, 2026",  date: "Apr 1, 2026" },
  { id: "INV-202603-000036", patient: "Nilesh Arora",     email: "nilesh.arora@example.com",     amount: "$400.30", status: "Pending Payment", dueDate: "Apr 14, 2026", date: "Mar 31, 2026" },
  { id: "INV-202603-000035", patient: "Rakshita Gupta",   email: "rakshita.gupta@example.com",   amount: "$400.30", status: "Partially Paid", dueDate: "Apr 14, 2026", date: "Mar 31, 2026" },
  { id: "INV-202603-000034", patient: "Amit Singh",       email: "amit.singh@example.com",       amount: "$500.00", status: "Pending Payment", dueDate: "Apr 13, 2026", date: "Mar 30, 2026" },
  { id: "INV-202603-000033", patient: "Neha Sharma",      email: "neha.sharma@example.com",      amount: "$0.30",   status: "Paid",            dueDate: "Mar 29, 2026", date: "Mar 29, 2026" },
  { id: "INV-202603-000032", patient: "Priya Singh",      email: "priya.singh@example.com",      amount: "$400.00", status: "Paid",            dueDate: "Mar 26, 2026", date: "Mar 26, 2026" },
  { id: "INV-202603-000031", patient: "Rajesh Verma",     email: "rajesh.verma@example.com",     amount: "$500.00", status: "Partially Paid", dueDate: "Apr 9, 2026",  date: "Mar 26, 2026" },
  { id: "INV-202603-000030", patient: "Anita Kapoor",     email: "anita.kapoor@example.com",     amount: "$418.30", status: "Paid",            dueDate: "Mar 24, 2026", date: "Mar 24, 2026" },
  { id: "INV-202603-000029", patient: "Vikram Mehta",     email: "vikram.mehta@example.com",     amount: "$900.00", status: "Partially Paid", dueDate: "Mar 19, 2026", date: "Mar 19, 2026" },
]

export default function InvoicesPage() {
  const router = useRouter()
  const [showFilter, setShowFilter] = useState(false)
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [query, setQuery] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === "All Status" || inv.status === statusFilter
      const matchQuery =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.patient.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q)
      return matchStatus && matchQuery
    })
  }, [query, statusFilter])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]"
      case "Pending Payment":
        return "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]"
      case "Partially Paid":
        return "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const handleView = (id: string) => router.push(`/admin/invoices/${id}`)
  const handlePrint = (id: string) => {
    setOpenMenu(null)
    notify.info("Opening print preview", { description: id })
    // Defer to the browser print dialog. The actual invoice template
    // lives on the detail route — open that first, then print.
    router.push(`/admin/invoices/${id}?print=1`)
  }
  const handleMarkPaid = (id: string) => {
    setOpenMenu(null)
    notify.success("Invoice marked paid", { description: id })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Invoices</h1>
        <p className="text-sm text-[#667085] mt-1">Manage invoices and payments</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#667085]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by invoice number, patient name..."
            className="block w-full pl-11 pr-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm font-semibold text-[#344054] hover:bg-gray-50 transition-all shadow-sm min-w-[140px] justify-between"
          >
            <span>{statusFilter}</span>
            <Filter className="h-4 w-4 text-[#667085]" />
          </button>

          {showFilter && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EAECF0] rounded-xl shadow-lg z-50 py-1">
              {["All Status", "Pending Payment", "Partially Paid", "Paid"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status)
                    setShowFilter(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#667085]">
                    No invoices match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#101828]">
                      <Link href={`/admin/invoices/${invoice.id}`} className="hover:text-[#2E37A4] transition-colors">
                        {invoice.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#101828]">{invoice.patient}</span>
                        <span className="text-xs text-[#667085]">{invoice.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#101828]">
                      {invoice.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(invoice.status)}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></div>
                        {invoice.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      {invoice.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right relative">
                      <button
                        aria-label="More actions"
                        aria-haspopup="menu"
                        aria-expanded={openMenu === invoice.id}
                        onClick={() =>
                          setOpenMenu((cur) => (cur === invoice.id ? null : invoice.id))
                        }
                        className="text-[#98A2B3] hover:text-[#667085] transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {openMenu === invoice.id ? (
                        <div
                          role="menu"
                          className="absolute right-6 top-12 z-30 w-44 bg-white border border-[#EAECF0] rounded-lg shadow-lg py-1 text-left"
                        >
                          <button
                            role="menuitem"
                            onClick={() => {
                              setOpenMenu(null)
                              handleView(invoice.id)
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                          >
                            <Eye className="h-4 w-4" /> View invoice
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => handlePrint(invoice.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                          >
                            <Printer className="h-4 w-4" /> Print
                          </button>
                          {invoice.status !== "Paid" ? (
                            <button
                              role="menuitem"
                              onClick={() => handleMarkPaid(invoice.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#027A48] hover:bg-[#ECFDF3]"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Mark as paid
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
