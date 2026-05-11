"use client"

import React from "react"
import Link from "next/link"
import { 
  Search, 
  Plus, 
  Eye, 
  Pencil, 
  MoreVertical,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"

const staffMembers = [
  { id: 1, name: "Sumit Mittal", email: "sumit1@gmail.com", created: "26/2/2026" },
  { id: 2, name: "Sumit Mittal", email: "sumit1@gmail.com", created: "17/2/2026" },
  { id: 3, name: "Sumit Mittal", email: "sumit1@gmail.com", created: "14/2/2026" },
  { id: 4, name: "Sumit Mittal", email: "sumit1@gmail.com", created: "30/1/2026" },
  { id: 5, name: "Sumit Mittal", email: "sumit1@gmail.com", created: "29/1/2026" },
  { id: 6, name: "Sumit Mittal", email: "sumit1@gmail.com", created: "22/1/2026" },
]

export default function StaffPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Staff Members</h1>
        <p className="text-sm text-[#667085] mt-1">Manage staff member accounts</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#667085]" />
            </div>
            <input
              type="text"
              placeholder="Search staff members by name or email..."
              className="block w-full pl-11 pr-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>
          <div className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-3 py-1.5 rounded-full">
            6 staff members
          </div>
        </div>
        
        <Link href="/admin/staff/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold shadow-sm">
            <Plus className="h-5 w-5" />
            <span>Add Staff Member</span>
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {staffMembers.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center border border-[#ABEFC6]">
                        <User className="h-5 w-5 text-[#027A48]" />
                      </div>
                      <span className="text-sm font-semibold text-[#101828]">{staff.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                    {staff.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                    {staff.created}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1.5 text-sm font-semibold text-[#667085] hover:text-[#101828] transition-colors">
                        <Eye className="h-4 w-4" />
                        <span>Details</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b] transition-colors">
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button className="text-[#98A2B3] hover:text-[#667085] transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
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
