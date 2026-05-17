"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  User,
  Loader2,
  AlertCircle,
  RefreshCcw,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  patientNumber: string
  fullName: string
  email: string | null
  phone: string | null
  status: string
  createdAt: string
  primaryDoctorId: string | null
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchPatients = useCallback(async (cursor?: string) => {
    if (cursor) {
      setIsFetchingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      const url = new URL("/api/patients", window.location.origin)
      url.searchParams.set("take", "20")
      if (cursor) {
        url.searchParams.set("cursor", cursor)
      }
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error("Failed to fetch patients")
      }
      
      const json = await response.json()
      
      if (cursor) {
        setPatients(prev => [...prev, ...(json.data || [])])
      } else {
        setPatients(json.data || [])
      }
      
      setNextCursor(json.nextCursor || json.pagination?.next || null)
      setTotalCount(json.pagination?.total ?? json.data?.length ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load patients")
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB") // DD/MM/YYYY
  }

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const handleLoadMore = () => {
    if (nextCursor && !isFetchingMore) {
      fetchPatients(nextCursor)
    }
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
              placeholder="Search patients by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span>All patients</span>
          </button>
          {!isLoading && !error && (
            <span className="text-sm text-[#667085]">{totalCount} patients</span>
          )}
        </div>
        
        <Link href="/admin/patients/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
            <Plus className="h-5 w-5" />
            <span>Add New Patient</span>
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-sm min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-[#667085]">
            <Loader2 className="h-8 w-8 animate-spin text-[#2E37A4] mb-4" />
            <p className="text-sm font-medium">Loading patients...</p>
          </div>
        ) : error && patients.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#101828] mb-2">Couldn't load patients</h3>
            <p className="text-sm text-[#667085] mb-6 max-w-xs">{error}</p>
            <Button 
              onClick={() => fetchPatients()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-[#667085]" />
            </div>
            <h3 className="text-lg font-semibold text-[#101828] mb-2">No patients yet</h3>
            <p className="text-sm text-[#667085] mb-6">Add the first one to start managing records.</p>
            <Link href="/admin/patients/add">
              <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white">
                Add Patient
              </Button>
            </Link>
          </div>
        ) : (
          <>
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
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF]">
                            <User className="h-5 w-5 text-[#2E37A4]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-[#101828]">{patient.fullName}</span>
                            <span className="text-xs text-[#667085]">ID: {patient.patientNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-[#101828]">{patient.email || "No email"}</span>
                          <span className="text-xs text-[#667085]">{patient.phone || "No phone"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          patient.status === "ACTIVE" 
                            ? "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                        )}>
                          {formatStatus(patient.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#667085]">
                        {formatDate(patient.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#667085]">
                        {patient.primaryDoctorId ? "Assigned" : "No"}
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

            {/* Pagination Controls */}
            {nextCursor && (
              <div className="p-4 border-t border-[#EAECF0] flex justify-center bg-[#F9FAFB]">
                <Button
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-[#344054] border-[#D0D5DD] font-medium py-2 px-4 h-auto flex items-center gap-2 shadow-sm"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span>Load more</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
