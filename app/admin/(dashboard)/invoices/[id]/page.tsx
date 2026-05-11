"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Printer, 
  Pencil, 
  User,
  MoreVertical,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function InvoiceDetailsPage() {
  const params = useParams()
  const invoiceId = params?.id as string

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Invoice Details</h1>
          <p className="text-sm text-[#667085] mt-1">{invoiceId}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="px-4 h-11 border-[#D0D5DD] text-[#344054] font-semibold hover:bg-gray-50 rounded-lg flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </Button>
          <Button variant="outline" className="px-4 h-11 border-[#D0D5DD] text-[#344054] font-semibold hover:bg-gray-50 rounded-lg flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            <span>Edit Invoice</span>
          </Button>
        </div>
      </div>

      {/* Back Link */}
      <div>
        <Link 
          href="/admin/invoices"
          className="inline-flex items-center gap-2 text-[#667085] hover:text-[#101828] text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
      </div>

      {/* Main Invoice Card */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
        {/* Invoice Header */}
        <div className="p-8 border-b border-[#EAECF0]">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#101828] tracking-tight">INVOICE</h2>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-[#667085]">Invoice #</p>
                <p className="text-lg font-bold text-[#101828]">{invoiceId}</p>
              </div>
              <div className="pt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                  Paid
                </span>
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-xs font-medium text-[#667085]">Date</p>
              <p className="text-lg font-bold text-[#101828]">Apr 2, 2026</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="p-8 border-b border-[#EAECF0] bg-[#F9FAFB]/50">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-[#667085]" />
            <h3 className="text-base font-bold text-[#101828]">Patient Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#667085]">Patient</p>
              <p className="text-sm font-bold text-[#101828]">Moustapha NDAO</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#667085]">Email</p>
              <p className="text-sm font-bold text-[#101828]">ndao.m@outlook.com</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#667085]">Phone</p>
              <p className="text-sm font-bold text-[#101828]">772478743</p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="p-8">
          <h3 className="text-base font-bold text-[#101828] mb-6">Invoice Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border border-[#EAECF0]">
                  <th className="px-4 py-3 text-xs font-bold text-[#667085] uppercase">Description</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#667085] uppercase text-right">Quantity</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#667085] uppercase text-right">Unit Price</th>
                  <th className="px-4 py-3 text-xs font-bold text-[#667085] uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                <tr>
                  <td className="px-4 py-4 text-sm text-[#101828]">tyyu</td>
                  <td className="px-4 py-4 text-sm text-[#101828] text-right">1</td>
                  <td className="px-4 py-4 text-sm text-[#101828] text-right">$0.30</td>
                  <td className="px-4 py-4 text-sm font-bold text-[#101828] text-right">$0.30</td>
                </tr>
                <tr>
                  <td className="px-4 py-4 text-sm text-[#101828]">X -Ray</td>
                  <td className="px-4 py-4 text-sm text-[#101828] text-right">1</td>
                  <td className="px-4 py-4 text-sm text-[#101828] text-right">$400.00</td>
                  <td className="px-4 py-4 text-sm font-bold text-[#101828] text-right">$400.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-[280px] space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#667085]">Subtotal:</span>
                <span className="font-bold text-[#101828]">$400.30</span>
              </div>
              <div className="h-[1px] bg-[#EAECF0] w-full"></div>
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-[#101828]">Grand Total:</span>
                <span className="text-base font-black text-[#2E37A4]">$400.30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#667085]">Paid Amount:</span>
                <span className="text-sm font-bold text-[#12B76A]">$400.30</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#EAECF0]">
          <h3 className="text-base font-bold text-[#101828]">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <th className="px-8 py-3 text-xs font-bold text-[#667085] uppercase">Payment Date</th>
                <th className="px-8 py-3 text-xs font-bold text-[#667085] uppercase">Payment Method</th>
                <th className="px-8 py-3 text-xs font-bold text-[#667085] uppercase text-right">Payment Amount</th>
                <th className="px-8 py-3 text-xs font-bold text-[#667085] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#EAECF0] last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-8 py-4 text-sm text-[#101828]">Apr 2, 2026</td>
                <td className="px-8 py-4 text-sm text-[#101828]">Card</td>
                <td className="px-8 py-4 text-sm font-bold text-[#101828] text-right">$400.30</td>
                <td className="px-8 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF3] text-[#027A48]">
                    Completed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
