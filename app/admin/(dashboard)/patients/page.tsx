"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"

type Patient = {
  id: string
  patientNumber: string
  fullName: string
  email?: string
  phone?: string
  status: string
  createdAt: string
  primaryDoctorId?: string
}

function PatientActionMenu({ patientId }: { patientId: string }) {
  const [isOpen, setIsOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClose = () => setIsOpen(false)

    window.addEventListener("click", handleClose)

    return () => {
      window.removeEventListener("click", handleClose)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] rounded-md hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-white dark:bg-[#1F2937] ring-1 ring-[#EAECF0] dark:ring-[#374151] z-10"
        >
          <div className="py-1">
            <Link
              href={`/admin/patients/${patientId}`}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 hover:text-[#101828] transition-colors"
            >
              View
            </Link>

            <Link
              href={`/admin/patients/${patientId}?edit=1`}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 hover:text-[#101828] transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchPatients = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/patients?take=20")

      if (!res.ok) {
        throw new Error("Failed to fetch patients")
      }

      const json = await res.json()

      setPatients(json.data || [])
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  // Format date helper
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr)

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase()

    return (
      patient.fullName.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">
          Patients
        </h1>

        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
          Manage your patient records and information
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-[320px]">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-5 w-5 text-[#667085] dark:text-[#94A3B8] my-auto ml-1" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search patients by name or email..."
              className="block w-full pl-11 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm placeholder-[#667085] dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>

          {/* Filter */}
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>All patients</span>
          </button>

          {/* Count */}
          {!isLoading && !error && (
            <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
              {filteredPatients.length} patient
              {filteredPatients.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Add Patient */}
        <Link href="/admin/patients/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
            <Plus className="h-5 w-5" />
            <span>Add New Patient</span>
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
                <th className="px-6 py-3 text-xs font-medium text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  Patient
                </th>

                <th className="px-6 py-3 text-xs font-medium text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  Contact
                </th>

                <th className="px-6 py-3 text-xs font-medium text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  Status
                </th>

                <th className="px-6 py-3 text-xs font-medium text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  Registration Date
                </th>

                <th className="px-6 py-3 text-xs font-medium text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  Assigned Doctor
                </th>

                <th className="px-6 py-3 text-xs font-medium text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {/* Loading */}
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-[#667085] dark:text-[#94A3B8]">
                      <Loader2 className="h-8 w-8 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-4" />

                      <p className="text-sm font-medium">
                        Loading patients...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Error */}
              {!isLoading && error && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-[#d92d20]">
                      <AlertCircle className="h-8 w-8 mb-4" />

                      <p className="text-sm font-medium mb-4">
                        Couldn't load patients
                      </p>

                      <Button
                        variant="outline"
                        onClick={fetchPatients}
                      >
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!isLoading &&
                !error &&
                filteredPatients.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex flex-col items-center justify-center text-[#667085] dark:text-[#94A3B8]">
                        <User className="h-8 w-8 mb-4 text-[#D0D5DD]" />

                        <p className="text-sm font-medium">
                          No patients found
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

              {/* Data */}
              {!isLoading &&
                !error &&
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Patient */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF]">
                          <User className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
                        </div>

                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                            {patient.fullName}
                          </span>

                          <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
                            ID: {patient.patientNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#101828] dark:text-[#F9FAFB]">
                          {patient.email || "—"}
                        </span>

                        <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
                          {patient.phone || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          patient.status === "ACTIVE"
                            ? "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]"
                            : patient.status === "INACTIVE"
                            ? "bg-[#F2F4F7] dark:bg-[#111827] text-[#344054] dark:text-[#CBD5E1] border-[#D0D5DD] dark:border-[#374151]"
                            : "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]"
                        }`}
                      >
                        {patient.status.charAt(0) +
                          patient.status
                            .slice(1)
                            .toLowerCase()}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-[#667085] dark:text-[#94A3B8]">
                      {formatDate(patient.createdAt)}
                    </td>

                    {/* Doctor */}
                    <td className="px-6 py-4 text-sm text-[#667085] dark:text-[#94A3B8]">
                      {patient.primaryDoctorId
                        ? "Assigned"
                        : "No"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <PatientActionMenu
                        patientId={patient.id}
                      />
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