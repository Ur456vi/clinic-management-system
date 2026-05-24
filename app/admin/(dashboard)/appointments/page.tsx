"use client"

import Link from "next/link"
import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  ChevronDown,
  Clock,
  MapPin,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Realistic-looking seed data. Patient & doctor names are de-duplicated
// to avoid the "every row is Sumit Mittal" smell that the bug report
// flagged. Opaque internal IDs are hidden from the list view in favour
// of clinic-friendly short codes; the long Mongo id is still tooltipped
// in title= for support spelunking.
type Appointment = {
  id: string
  shortCode: string
  patient: { name: string; id: string; doctor: string }
  dateTime: { date: string; time: string }
  type: "consultation" | "surgery" | "follow-up" | "emergency" | "checkup"
  status: "scheduled" | "confirmed" | "completed"
  location: string
}

const appointments: Appointment[] = [
  { id: "1",  shortCode: "APT-1041", patient: { name: "Sumit Mittal",    id: "697e1d14a4fbee4839aa03ba", doctor: "Dr. Yuvraj Singh" },   dateTime: { date: "7/4/2026",  time: "21:02" }, type: "consultation", status: "scheduled", location: "" },
  { id: "2",  shortCode: "APT-1040", patient: { name: "Akanksha Jain",   id: "69c7e8a3f20c4423298c03f1", doctor: "Dr. Rajesh Jain" },    dateTime: { date: "4/4/2026",  time: "02:20" }, type: "surgery",      status: "confirmed", location: "California Clinic, Room 204" },
  { id: "3",  shortCode: "APT-1039", patient: { name: "Sonali Mittal",   id: "69c7e8af20c4423298c03fb", doctor: "Dr. Federico Birri" }, dateTime: { date: "31/3/2026", time: "16:52" }, type: "consultation", status: "scheduled", location: "" },
  { id: "4",  shortCode: "APT-1038", patient: { name: "Tarun Gupta",     id: "69c904a56e5394670dd64fa7", doctor: "Dr. Federico Birri" }, dateTime: { date: "31/3/2026", time: "14:20" }, type: "follow-up",    status: "scheduled", location: "https://maps.app.goo.gl/CT8ay2ohxS3GEwi8A" },
  { id: "5",  shortCode: "APT-1037", patient: { name: "Sarita Jain",     id: "—",                        doctor: "Dr. Simran Goel" },    dateTime: { date: "22/3/2026", time: "08:28" }, type: "consultation", status: "completed", location: "Vyara Main Clinic" },
  { id: "6",  shortCode: "APT-1036", patient: { name: "Nilesh Arora",    id: "697e1d14a4fbee4839aa03bb", doctor: "Dr. Yuvraj Singh" },   dateTime: { date: "20/3/2026", time: "17:28" }, type: "consultation", status: "scheduled", location: "Vyara Main Clinic" },
  { id: "7",  shortCode: "APT-1035", patient: { name: "Rakshita Gupta",  id: "—",                        doctor: "Dr. Yuvraj Singh" },   dateTime: { date: "19/3/2026", time: "19:00" }, type: "consultation", status: "confirmed", location: "Vyara Main Clinic" },
  { id: "8",  shortCode: "APT-1034", patient: { name: "Amit Singh",      id: "699c3b15d7ce44239a96cf68", doctor: "Dr. Simran Goel" },    dateTime: { date: "18/3/2026", time: "15:58" }, type: "emergency",    status: "confirmed", location: "Vyara ER" },
  { id: "9",  shortCode: "APT-1033", patient: { name: "Neha Sharma",     id: "697e1d14a4fbee4839aa03bc", doctor: "Dr. Yuvraj Singh" },   dateTime: { date: "18/3/2026", time: "20:01" }, type: "consultation", status: "scheduled", location: "Vyara Main Clinic" },
  { id: "10", shortCode: "APT-1032", patient: { name: "Priya Singh",     id: "697e1d14a4fbee4839aa03bd", doctor: "Dr. Simran Goel" },    dateTime: { date: "17/3/2026", time: "16:15" }, type: "checkup",      status: "confirmed", location: "Vyara Main Clinic" },
]

const getTypeStyles = (type: string) => {
  switch (type.toLowerCase()) {
    case "consultation":
      return "bg-[#EBF5FF] text-[#175CD3]"
    case "surgery":
      return "bg-[#F2F4F7] text-[#344054]"
    case "follow-up":
      return "bg-[#F9F5FF] text-[#6941C6]"
    case "emergency":
      return "bg-[#FEF3F2] text-[#B42318]"
    case "checkup":
      return "bg-[#ECFDF3] text-[#027A48]"
    default:
      return "bg-[#F2F4F7] text-[#344054]"
  }
}

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "bg-[#F2F4F7] text-[#344054]"
    case "confirmed":
      return "bg-[#ECFDF3] text-[#027A48]"
    case "completed":
      return "bg-[#EBF5FF] text-[#175CD3]"
    default:
      return "bg-[#F2F4F7] text-[#344054]"
  }
}

// Trim a long URL to the host, so the Location column shows a friendly
// label instead of the raw URL.
function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>("All")
  const [dateFilter, setDateFilter] = useState<string>("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return appointments.filter((a) => {
      const matchQuery =
        !q ||
        a.patient.name.toLowerCase().includes(q) ||
        a.patient.doctor.toLowerCase().includes(q) ||
        a.shortCode.toLowerCase().includes(q)
      const matchStatus = status === "All" || a.status === status.toLowerCase()
      // Date filter is a placeholder for the static dataset — the real
      // dataset will flow in via BE-08 and use the same control.
      const matchDate = dateFilter === "All" || true
      return matchQuery && matchStatus && matchDate
    })
  }, [query, status, dateFilter])

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Appointments</h1>
        <p className="text-sm text-[#667085] mt-1">Manage and schedule patient appointments</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-[400px]">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-5 w-5 text-[#667085] my-auto ml-1" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search appointments by patient or doctor..."
              className="block w-full pl-11 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="appearance-none pl-3 pr-10 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm font-medium text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none pl-3 pr-10 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm font-medium text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Week">This Week</option>
                <option value="Month">This Month</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
            </div>
          </div>

          <span className="text-sm text-[#667085]">{filtered.length} appointments</span>
        </div>

        <Link href="/admin/appointments/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold shadow-sm">
            <Plus className="h-5 w-5" />
            <span>Add New Appointment</span>
          </Button>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Patient & Doctor</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-[#667085]">
                    No appointments match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF] flex-shrink-0">
                          <User className="h-5 w-5 text-[#2E37A4]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-[#101828] truncate">{apt.patient.name}</span>
                          <span className="text-xs text-[#667085] truncate" title={apt.patient.id}>
                            {apt.shortCode}
                          </span>
                          <span className="text-xs font-medium text-[#101828] truncate">{apt.patient.doctor}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        <span className="font-medium text-[#101828]">{apt.dateTime.date}</span>
                        <div className="flex items-center gap-1.5 text-[#667085]">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">{apt.dateTime.time}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getTypeStyles(apt.type)}`}>
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${getStatusStyles(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[#667085]">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        {apt.location.startsWith("http") ? (
                          <a
                            href={apt.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={apt.location}
                            className="text-xs text-[#2E37A4] hover:underline truncate max-w-[180px]"
                          >
                            {shortenUrl(apt.location)}
                          </a>
                        ) : (
                          <span className="text-xs truncate max-w-[180px]">{apt.location || "—"}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/admin/appointments/${apt.id}`)}
                        className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b] transition-colors"
                      >
                        View
                      </button>
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
