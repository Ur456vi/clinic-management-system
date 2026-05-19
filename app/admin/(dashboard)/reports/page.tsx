import React from "react"
import { BarChart3, TrendingUp, Users, Calendar, Activity } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Reports & Analytics</h1>
        <p className="text-sm text-[#667085] mt-1">Overview of clinic performance, patient demographics, and financials.</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-[#F4F5FF] border border-[#E0E2FF] rounded-xl p-8 text-center flex flex-col items-center justify-center h-[350px]">
        <div className="h-16 w-16 bg-[#E0E2FF] text-[#2E37A4] rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-[#101828] mb-2">Reports Module Coming Soon</h2>
        <p className="text-[#667085] max-w-md mx-auto">
          We are currently building a comprehensive analytics dashboard. Soon you will be able to visualize patient trends, clinic revenue, and clinical outcomes here.
        </p>
      </div>

      {/* Placeholder Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 pointer-events-none">
        <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#667085]">Total Patients</h3>
            <Users className="h-5 w-5 text-[#667085]" />
          </div>
          <div className="text-2xl font-bold text-[#101828]">---</div>
          <p className="text-sm text-[#027A48] mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> <span>+12% from last month</span>
          </p>
        </div>

        <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#667085]">Appointments</h3>
            <Calendar className="h-5 w-5 text-[#667085]" />
          </div>
          <div className="text-2xl font-bold text-[#101828]">---</div>
          <p className="text-sm text-[#027A48] mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> <span>+5% from last month</span>
          </p>
        </div>

        <div className="bg-white border border-[#EAECF0] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#667085]">Clinical Activities</h3>
            <Activity className="h-5 w-5 text-[#667085]" />
          </div>
          <div className="text-2xl font-bold text-[#101828]">---</div>
          <p className="text-sm text-[#667085] mt-2">Data syncing in progress...</p>
        </div>
      </div>
    </div>
  )
}
