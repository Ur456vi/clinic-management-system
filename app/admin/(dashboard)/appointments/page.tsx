"use client"

import Link from "next/link"
import React from "react"
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronDown,
  Clock,
  MapPin,
  User,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"

const appointments = [
  {
    id: "1",
    patient: {
      name: "Sumit Mittal",
      id: "697e1d14a4fbee4839aa03ba",
      doctor: "Mr Docto1 Steve"
    },
    dateTime: {
      date: "7/4/2026",
      time: "21:02"
    },
    type: "consultation",
    status: "scheduled",
    location: ""
  },
  {
    id: "2",
    patient: {
      name: "Sumit Mittal",
      id: "69c7e8a3f20c4423298c03f1",
      doctor: "Doctor"
    },
    dateTime: {
      date: "4/4/2026",
      time: "02:20"
    },
    type: "surgery",
    status: "confirmed",
    location: "california"
  },
  {
    id: "3",
    patient: {
      name: "Sumit Mittal",
      id: "69c7e8af20c4423298c03fb",
      doctor: "Federico Birri"
    },
    dateTime: {
      date: "31/3/2026",
      time: "16:52"
    },
    type: "consultation",
    status: "scheduled",
    location: ""
  },
  {
    id: "4",
    patient: {
      name: "Sumit Mittal",
      id: "69c904a56e5394670dd64fa7",
      doctor: "Federico Birri"
    },
    dateTime: {
      date: "31/3/2026",
      time: "14:20"
    },
    type: "follow-up",
    status: "scheduled",
    location: "https://maps.app.goo.gl/CT8ay2ohxS3GEwi8A"
  },
  {
    id: "5",
    patient: {
      name: "Sumit Mittal",
      id: "N/A",
      doctor: "test"
    },
    dateTime: {
      date: "22/3/2026",
      time: "08:28"
    },
    type: "consultation",
    status: "completed",
    location: ""
  },
  {
    id: "6",
    patient: {
      name: "Sumit Mittal",
      id: "697e1d14a4fbee4839aa03ba",
      doctor: "Doctor"
    },
    dateTime: {
      date: "20/3/2026",
      time: "17:28"
    },
    type: "consultation",
    status: "scheduled",
    location: ""
  },
  {
    id: "7",
    patient: {
      name: "Sumit Mittal",
      id: "N/A",
      doctor: "Doctor"
    },
    dateTime: {
      date: "19/3/2026",
      time: "19:00"
    },
    type: "consultation",
    status: "confirmed",
    location: ""
  },
  {
    id: "8",
    patient: {
      name: "Sumit Mittal",
      id: "699c3b15d7ce44239a96cf68",
      doctor: "test"
    },
    dateTime: {
      date: "18/3/2026",
      time: "15:58"
    },
    type: "emergency",
    status: "confirmed",
    location: "test"
  },
  {
    id: "9",
    patient: {
      name: "Sumit Mittal",
      id: "697e1d14a4fbee4839aa03ba",
      doctor: "Doctor"
    },
    dateTime: {
      date: "18/3/2026",
      time: "20:01"
    },
    type: "consultation",
    status: "scheduled",
    location: ""
  },
  {
    id: "10",
    patient: {
      name: "Sumit Mittal",
      id: "697e1d14a4fbee4839aa03ba",
      doctor: "test"
    },
    dateTime: {
      date: "17/3/2026",
      time: "16:15"
    },
    type: "checkup",
    status: "confirmed",
    location: ""
  }
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
      return "bg-[#F2F4F7] text-[#344054]"
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

export default function AppointmentsPage() {
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
              placeholder="Search appointments by patient or doctor..."
              className="block w-full pl-11 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <select className="appearance-none pl-3 pr-10 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm font-medium text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer">
                <option>All Status</option>
                <option>Scheduled</option>
                <option>Confirmed</option>
                <option>Completed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
            </div>

            <div className="relative">
              <select className="appearance-none pl-3 pr-10 py-2.5 border border-[#D0D5DD] rounded-lg bg-white text-sm font-medium text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/10 focus:border-[#2E37A4] transition-all cursor-pointer">
                <option>All Dates</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085] pointer-events-none" />
            </div>
          </div>

          <span className="text-sm text-[#667085]">35 appointments</span>
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
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Appointments.Status</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-medium text-[#667085] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#F2F4FF] flex items-center justify-center border border-[#E0E2FF] flex-shrink-0">
                        <User className="h-5 w-5 text-[#2E37A4]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[#101828] truncate">{apt.patient.name}</span>
                        <span className="text-xs text-[#667085] truncate">ID: {apt.patient.id}</span>
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
                          className="text-xs text-[#2E37A4] hover:underline truncate max-w-[150px]"
                        >
                          {apt.location}
                        </a>
                      ) : (
                        <span className="text-xs truncate max-w-[150px]">{apt.location || "-"}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b] transition-colors">
                      View
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
