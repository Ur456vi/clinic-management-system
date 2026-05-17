"use client"

import React from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"

const patients = [
  {
    name: "Dr. Sumit Mittal",
    id: "PAT-263040",
    email: "ndao.m@outlook.com",
    phone: "772478743",
    status: "Active",
    registrationDate: "29/3/2026",
    assignedDoctor: "No"
  },
  {
    name: "Dr. Akanksha Jain",
    id: "PAT-263039",
    email: "patient@aidoc.com",
    phone: "01536166567",
    status: "Active",
    registrationDate: "28/3/2026",
    assignedDoctor: "No"
  },
  {
    name: "Dr. Sonali Mittal",
    id: "PAT-263038",
    email: "admin@pharmacy.com",
    phone: "01536166567",
    status: "Active",
    registrationDate: "28/3/2026",
    assignedDoctor: "No"
  },
  {
    name: "Dr. Tarun Gupta",
    id: "PAT-263037",
    email: "uo@oiu.gt",
    phone: "056677888",
    status: "Active",
    registrationDate: "19/3/2026",
    assignedDoctor: "No"
  },
  {
    name: "Dr. Sarita Jain",
    id: "PAT-263036",
    email: "vakilbetter6762@gmail.com",
    phone: "07738285764",
    status: "Active",
    registrationDate: "15/3/2026",
    assignedDoctor: "aaaa"
  },
  {
    name: "Dr. Nilesh Arora",
    id: "PAT-263035",
    email: "pat@yopmail.com",
    phone: "9090909090",
    status: "Active",
    registrationDate: "15/3/2026",
    assignedDoctor: "No"
  },
  {
    name: "Dr. Rakshita Gupta",
    id: "PAT-263034",
    email: "testp@yopmail.com",
    phone: "00000000",
    status: "Active",
    registrationDate: "3/3/2026",
    assignedDoctor: "No"
  },
  {
    name: "Dr. Amit Singh",
    id: "PAT-263033",
    email: "pushkarmali9137@gmail.com",
    phone: "165 5 5646565",
    status: "Active",
    registrationDate: "1/3/2026",
    assignedDoctor: "No"
  }
]

export default function PatientsPage() {
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
              placeholder="Search patients by name or email..."
              className="block w-full pl-11 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>All patients</span>
          </button>
          <span className="text-sm text-[#667085]">29 patients</span>
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
              {patients.map((patient, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                    <div className="flex items-center gap-3">
                      <button className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]">View</button>
                      <button className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]">Edit</button>
                      <button className="text-[#667085] hover:text-[#101828]">
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
