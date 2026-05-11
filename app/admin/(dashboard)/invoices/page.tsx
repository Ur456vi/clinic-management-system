"use client"

import React, { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  ChevronDown,
  Filter,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"

const invoices = [
  { id: "INV-202604-000041", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$400.30", status: "Paid", dueDate: "-", date: "Apr 2, 2026" },
  { id: "INV-202604-000040", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$400.30", status: "Pending Payment", dueDate: "-", date: "Apr 2, 2026" },
  { id: "INV-202604-000039", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$900.00", status: "Pending Payment", dueDate: "Apr 25, 2026", date: "Apr 2, 2026" },
  { id: "INV-202604-000038", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$900.00", status: "Paid", dueDate: "Apr 1, 2026", date: "Apr 1, 2026" },
  { id: "INV-202604-000037", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$900.00", status: "Paid", dueDate: "Apr 1, 2026", date: "Apr 1, 2026" },
  { id: "INV-202603-000036", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$400.30", status: "Pending Payment", dueDate: "-", date: "Mar 31, 2026" },
  { id: "INV-202603-000035", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$400.30", status: "Partially Paid", dueDate: "Mar 31, 2026", date: "Mar 31, 2026" },
  { id: "INV-202603-000034", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$500.00", status: "Pending Payment", dueDate: "-", date: "Mar 30, 2026" },
  { id: "INV-202603-000033", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$0.30", status: "Paid", dueDate: "-", date: "Mar 29, 2026" },
  { id: "INV-202603-000032", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$400.00", status: "Paid", dueDate: "-", date: "Mar 26, 2026" },
  { id: "INV-202603-000031", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$500.00", status: "Partially Paid", dueDate: "-", date: "Mar 26, 2026" },
  { id: "INV-202603-000030", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$418.30", status: "Paid", dueDate: "Mar 24, 2026", date: "Mar 24, 2026" },
  { id: "INV-202603-000029", patient: "Sumit Mittal", email: "sumit1@gmail.com", amount: "$900.00", status: "Partially Paid", dueDate: "Mar 19, 2026", date: "Mar 19, 2026" },
]

export default function InvoicesPage() {
  const [showFilter, setShowFilter] = useState(false)

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
            placeholder="Search by invoice number, patient name..."
            className="block w-full pl-11 pr-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all shadow-sm"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm font-semibold text-[#344054] hover:bg-gray-50 transition-all shadow-sm min-w-[140px] justify-between"
          >
            <span>All Status</span>
            <Filter className="h-4 w-4 text-[#667085]" />
          </button>
          
          {showFilter && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EAECF0] rounded-xl shadow-lg z-50 py-1">
              {["All Status", "Draft", "Pending", "Partially Paid", "Paid", "Cancelled"].map((status) => (
                <button
                  key={status}
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
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {invoices.map((invoice) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-[#98A2B3] hover:text-[#667085] transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
