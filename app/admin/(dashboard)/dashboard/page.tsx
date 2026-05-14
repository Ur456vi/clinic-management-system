"use client"

import React from "react"
import { 
  Users, 
  Calendar, 
  UserSquare2, 
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

const stats = [
  { name: "Total Patients", value: "1,248", icon: Users, color: "text-[#2E37A4]", bg: "bg-[#F4F5FF]" },
  { name: "Total Appointments", value: "852", icon: Calendar, color: "text-[#12B76A]", bg: "bg-[#ECFDF3]" },
  { name: "Total Staff", value: "24", icon: UserSquare2, color: "text-[#F79009]", bg: "bg-[#FFFAEB]" },
  { name: "Total Revenue", value: "$42,500", icon: FileText, color: "text-[#175CD3]", bg: "bg-[#EFF8FF]" },
]

const recentAppointments = [
  { id: 1, patient: "Sumit Mittal", doctor: "Dr. Yuvraj Singh", time: "10:30 AM", status: "Confirmed" },
  { id: 2, patient: "Anita Sharma", doctor: "Dr. Yuvraj Singh", time: "11:15 AM", status: "Pending" },
  { id: 3, patient: "Rajesh Kumar", doctor: "Dr. Yuvraj Singh", time: "12:00 PM", status: "Confirmed" },
  { id: 4, patient: "Priya Singh", doctor: "Dr. Yuvraj Singh", time: "02:30 PM", status: "In Progress" },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Dashboard</h1>
        <p className="text-sm text-[#667085] mt-1">Overview of clinic performance and activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#667085]">{stat.name}</p>
              <p className="text-2xl font-bold text-[#101828]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-[#EAECF0] flex items-center justify-between">
            <h3 className="text-base font-bold text-[#101828]">Upcoming Appointments</h3>
            <button className="text-sm font-semibold text-[#2E37A4] hover:text-[#1d246b]">View All</button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#EAECF0]">
                  <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase">Patient</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0]">
                {recentAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#101828]">{apt.patient}</span>
                        <span className="text-xs text-[#667085]">{apt.doctor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#667085]">
                      {apt.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        apt.status === "Confirmed" ? "bg-[#ECFDF3] text-[#027A48]" :
                        apt.status === "Pending" ? "bg-[#FFFAEB] text-[#B54708]" :
                        "bg-[#EFF8FF] text-[#175CD3]"
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-6">
          <h3 className="text-base font-bold text-[#101828] mb-6">Clinic Performance</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#ECFDF3] flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#12B76A]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#101828]">Patient Growth</p>
                  <p className="text-xs text-[#667085]">+12% from last month</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[#12B76A]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#F4F5FF] flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#2E37A4]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#101828]">Avg. Wait Time</p>
                  <p className="text-xs text-[#667085]">15 mins - Within target</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[#12B76A]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FEF3F2] rounded-xl border border-[#FEE4E2]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#FEE4E2] flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-[#D92D20]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#B42318]">Pending Invoices</p>
                  <p className="text-xs text-[#F04438]">5 invoices over 30 days</p>
                </div>
              </div>
              <button className="text-xs font-bold text-[#B42318] hover:underline">Take Action</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
