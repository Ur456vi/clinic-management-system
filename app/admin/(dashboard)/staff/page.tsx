"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  Eye,
  Pencil,
  MoreVertical,
  User,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

// Seed list — replaced the 6 identical "Sumit Mittal" rows with a
// realistic mixed roster so QA can actually tell rows apart.
type StaffMember = { id: string; name: string; email: string; role: string; created: string }

const staffMembers: StaffMember[] = [
  { id: "STF-1006", name: "Sumit Mittal",     email: "sumit.mittal@vyara.health",     role: "Reception",          created: "26/2/2026" },
  { id: "STF-1005", name: "Akanksha Jain",    email: "akanksha.jain@vyara.health",    role: "Doctor",             created: "17/2/2026" },
  { id: "STF-1004", name: "Federico Birri",   email: "federico.birri@vyara.health",   role: "Doctor",             created: "14/2/2026" },
  { id: "STF-1003", name: "Sonali Mittal",    email: "sonali.mittal@vyara.health",    role: "RMO",                created: "30/1/2026" },
  { id: "STF-1002", name: "Simran Goel",      email: "simran.goel@vyara.health",      role: "Infusion specialist", created: "29/1/2026" },
  { id: "STF-1001", name: "Yuvraj Singh",     email: "yuvraj.singh@vyara.health",     role: "Doctor",             created: "22/1/2026" },
]

export default function StaffPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staffMembers
    return staffMembers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q),
    )
  }, [query])

  const handleDetails = (id: string) => router.push(`/admin/staff/${id}`)
  const handleEdit = (id: string) => router.push(`/admin/staff/${id}?edit=1`)
  const handleDeactivate = (id: string) => {
    setOpenMenu(null)
    notify.success("Staff deactivated", { description: `Deactivated ${id}` })
  }

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff members by name or email..."
              className="block w-full pl-11 pr-4 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>
          <div className="bg-[#F2F4F7] text-[#344054] text-xs font-medium px-3 py-1.5 rounded-full">
            {filtered.length} staff members
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
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#667085]">
                    No staff members match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center border border-[#ABEFC6]">
                          <User className="h-5 w-5 text-[#027A48]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#101828]">{staff.name}</span>
                          <span className="text-xs text-[#667085]">ID: {staff.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      {staff.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#344054]">
                      {staff.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      {staff.created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative flex items-center gap-4">
                        <button
                          onClick={() => handleDetails(staff.id)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#667085] hover:text-[#101828] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => handleEdit(staff.id)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b] transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          aria-label="More actions"
                          aria-haspopup="menu"
                          aria-expanded={openMenu === staff.id}
                          onClick={() =>
                            setOpenMenu((cur) => (cur === staff.id ? null : staff.id))
                          }
                          className="text-[#98A2B3] hover:text-[#667085] transition-colors"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openMenu === staff.id ? (
                          <div
                            role="menu"
                            className="absolute right-0 top-8 z-30 w-44 bg-white border border-[#EAECF0] rounded-lg shadow-lg py-1"
                          >
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenu(null)
                                handleDetails(staff.id)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                            >
                              <Eye className="h-4 w-4" /> View details
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenu(null)
                                handleEdit(staff.id)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => handleDeactivate(staff.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#B42318] hover:bg-[#FEF3F2]"
                            >
                              <Trash2 className="h-4 w-4" /> Deactivate
                            </button>
                          </div>
                        ) : null}
                      </div>
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
