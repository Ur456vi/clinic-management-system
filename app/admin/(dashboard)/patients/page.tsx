"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  User,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

// NOTE: patient list uses real names (no honorific). Source data should
// not prefix patients with "Dr." — that bug lived in the seed list and
// was corrected here.
const seedPatients = [
  { name: "Sumit Mittal",   id: "PAT-263040", email: "sumit.mittal@example.com",  phone: "+91 77247 87430",  status: "Active", registrationDate: "29/3/2026", assignedDoctor: "Unassigned" },
  { name: "Akanksha Jain",  id: "PAT-263039", email: "akanksha.jain@example.com", phone: "+91 95361 66567",  status: "Active", registrationDate: "28/3/2026", assignedDoctor: "Dr. Yuvraj Singh" },
  { name: "Sonali Mittal",  id: "PAT-263038", email: "sonali.mittal@example.com", phone: "+91 95361 66567",  status: "Active", registrationDate: "28/3/2026", assignedDoctor: "Dr. Yuvraj Singh" },
  { name: "Tarun Gupta",    id: "PAT-263037", email: "tarun.gupta@example.com",   phone: "+91 90566 77888",  status: "Active", registrationDate: "19/3/2026", assignedDoctor: "Unassigned" },
  { name: "Sarita Jain",    id: "PAT-263036", email: "sarita.jain@example.com",   phone: "+91 77382 85764",  status: "Active", registrationDate: "15/3/2026", assignedDoctor: "Dr. Rajesh Jain" },
  { name: "Nilesh Arora",   id: "PAT-263035", email: "nilesh.arora@example.com",  phone: "+91 90909 09090",  status: "Active", registrationDate: "15/3/2026", assignedDoctor: "Unassigned" },
  { name: "Rakshita Gupta", id: "PAT-263034", email: "rakshita.gupta@example.com", phone: "+91 98980 00012", status: "Active", registrationDate: "3/3/2026",  assignedDoctor: "Unassigned" },
  { name: "Amit Singh",     id: "PAT-263033", email: "amit.singh@example.com",    phone: "+91 16555 46565",  status: "Active", registrationDate: "1/3/2026",  assignedDoctor: "Unassigned" },
]

export default function PatientsPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return seedPatients
    return seedPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q),
    )
  }, [query])

  const handleView = (id: string) => router.push(`/admin/patients/${id}`)
  const handleEdit = (id: string) => router.push(`/admin/patients/${id}?edit=1`)
  const handleArchive = (id: string) => {
    setOpenMenu(null)
    notify.success("Patient archived", { description: `Archived patient ${id}` })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Patients</h1>
        <p className="text-sm text-[#667085] mt-1">Manage your patient records and information</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-[320px]">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-5 w-5 text-[#667085] my-auto ml-1" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name or email..."
              className="block w-full pl-11 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>All patients</span>
          </button>
          <span className="text-sm text-[#667085]">{filtered.length} patients</span>
        </div>

        <Link href="/admin/patients/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
            <Plus className="h-5 w-5" />
            <span>Add New Patient</span>
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <th className="px-6 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Registration Date</th>
                <th className="px-6 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Assigned Doctor</th>
                <th className="px-6 py-3 text-xs font-medium text-[#667085] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#667085]">
                    No patients match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF]">
                          <User className="h-5 w-5 text-[#2E37A4]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#101828]">{patient.name}</span>
                          <span className="text-xs text-[#667085]">ID: {patient.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#101828]">{patient.email}</span>
                        <span className="text-xs text-[#667085]">{patient.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#667085]">
                      {patient.registrationDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#667085]">
                      {patient.assignedDoctor}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative flex items-center gap-3">
                        <button
                          onClick={() => handleView(patient.id)}
                          className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(patient.id)}
                          className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]"
                        >
                          Edit
                        </button>
                        <button
                          aria-label="More actions"
                          aria-haspopup="menu"
                          aria-expanded={openMenu === patient.id}
                          onClick={() =>
                            setOpenMenu((cur) => (cur === patient.id ? null : patient.id))
                          }
                          className="text-[#667085] hover:text-[#101828]"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openMenu === patient.id ? (
                          <div
                            role="menu"
                            className="absolute right-0 top-8 z-30 w-44 bg-white border border-[#EAECF0] rounded-lg shadow-lg py-1"
                          >
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenu(null)
                                handleView(patient.id)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                            >
                              <Eye className="h-4 w-4" /> View details
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => {
                                setOpenMenu(null)
                                handleEdit(patient.id)
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#344054] hover:bg-[#F9FAFB]"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => handleArchive(patient.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#B42318] hover:bg-[#FEF3F2]"
                            >
                              <Trash2 className="h-4 w-4" /> Archive
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
