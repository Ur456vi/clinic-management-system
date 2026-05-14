"use client"

import React from "react"
import { 
  Users, 
  UserCheck, 
  Stethoscope, 
  Droplet, 
  Activity, 
  Sparkles,
  ChevronRight,
  Clock
} from "lucide-react"

const departments = [
  {
    id: 'admin',
    name: 'Admin',
    staffCount: 8,
    themeColor: 'bg-[#475467]',
    lightThemeColor: 'bg-[#475467]/10',
    icon: Users,
    metrics: [
      { label: 'Active Staff', value: '8' },
      { label: 'Tasks', value: '24' },
      { label: 'Approvals', value: '12' },
    ],
    type: 'activity',
    items: [
      { text: 'Staff attendance updated', time: '09:15 AM' },
      { text: 'Monthly report generated', time: '10:30 AM' },
      { text: 'Budget approval pending', time: '11:45 AM' },
    ],
  },
  {
    id: 'reception',
    name: 'Reception',
    staffCount: 5,
    themeColor: 'bg-[#2E90FA]',
    lightThemeColor: 'bg-[#2E90FA]/10',
    icon: UserCheck,
    metrics: [
      { label: 'Check-ins', value: '42' },
      { label: 'Appointments', value: '65' },
      { label: 'Walk-ins', value: '12' },
    ],
    type: 'activity',
    items: [
      { text: 'Sarah Johnson checked in', time: '08:30 AM' },
      { text: 'New appointment scheduled', time: '09:00 AM' },
      { text: 'Insurance verified', time: '09:45 AM' },
    ],
  },
  {
    id: 'rmo',
    name: 'RMO',
    staffCount: 3,
    themeColor: 'bg-[#F04438]',
    lightThemeColor: 'bg-[#F04438]/10',
    icon: Stethoscope,
    metrics: [
      { label: 'On-Call', value: '2' },
      { label: 'Consultations', value: '18' },
      { label: 'Emergency', value: '3' },
    ],
    type: 'activity',
    items: [
      { text: 'Emergency consultation completed', time: '08:15 AM' },
      { text: 'Patient vitals reviewed', time: '09:30 AM' },
      { text: 'Prescription issued', time: '10:15 AM' },
    ],
  },
  {
    id: 'infusion',
    name: 'Infusion',
    staffCount: 6,
    themeColor: 'bg-[#00A3FF]',
    lightThemeColor: 'bg-[#00A3FF]/10',
    icon: Droplet,
    metrics: [
      { label: 'Active', value: '18' },
      { label: 'Completed', value: '12' },
      { label: 'Scheduled', value: '8' },
    ],
    type: 'patient',
    items: [
      { name: 'Sarah Johnson', treatment: 'IV Vitamin Therapy', time: '09:30 AM', id: 'B-12', status: 'In Progress' },
      { name: 'Michael Chen', treatment: 'Chemotherapy', time: '10:15 AM', id: 'B-08', status: 'Scheduled' },
      { name: 'Emma Davis', treatment: 'Hydration Therapy', time: '11:00 AM', id: 'B-15', status: 'Completed' },
    ],
  },
  {
    id: 'rehabilitation',
    name: 'Rehabilitation',
    staffCount: 9,
    themeColor: 'bg-[#12B76A]',
    lightThemeColor: 'bg-[#12B76A]/10',
    icon: Activity,
    metrics: [
      { label: 'Active', value: '32' },
      { label: 'Sessions', value: '45' },
      { label: 'Pending', value: '15' },
    ],
    type: 'patient',
    items: [
      { name: 'David Martinez', treatment: 'Physical Therapy', time: '08:00 AM', id: 'R-101', status: 'In Progress' },
      { name: 'Lisa Anderson', treatment: 'Occupational Therapy', time: '08:45 AM', id: 'R-203', status: 'Completed' },
    ],
  },
  {
    id: 'aesthetics',
    name: 'Aesthetics',
    staffCount: 4,
    themeColor: 'bg-[#F63D68]',
    lightThemeColor: 'bg-[#F63D68]/10',
    icon: Sparkles,
    metrics: [
      { label: 'Active', value: '15' },
      { label: 'Procedures', value: '22' },
      { label: 'Consultations', value: '8' },
    ],
    type: 'patient',
    items: [
      { name: 'Sophia Brown', treatment: 'Botox Treatment', time: '10:00 AM', id: 'A-302', status: 'Completed' },
      { name: 'Olivia Garcia', treatment: 'Dermal Fillers', time: '11:30 AM', id: 'A-305', status: 'In Progress' },
    ],
  },
]

const StatusBadge = ({ status }: { status: string }) => {
  const getStyles = () => {
    switch (status) {
      case 'In Progress':
        return 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]'
      case 'Completed':
        return 'bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]'
      case 'Scheduled':
        return 'bg-[#F2F4F7] text-[#344054] border-[#D0D5DD]'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStyles()}`}>
      {status}
    </span>
  )
}

export default function DepartmentsPage() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      <h1 className="text-2xl font-bold text-[#101828]">Departments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-[24px] border border-[#EAECF0] overflow-hidden flex flex-col shadow-sm">
            {/* Header Section */}
            <div className={`p-6 ${dept.themeColor} text-white`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <dept.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{dept.name}</h2>
                  <p className="text-sm opacity-80">{dept.staffCount} Staff</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                {dept.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-wider opacity-80 font-medium mb-1">{metric.label}</p>
                    <p className="text-xl font-bold">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* List Section */}
            <div className="flex-1 p-6 space-y-3">
              {dept.type === 'activity' ? (
                dept.items.map((item: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] hover:bg-[#F2F4F7] transition-colors cursor-pointer group">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-[#101828] group-hover:text-[#2E37A4] transition-colors">{item.text}</span>
                      <span className="text-[11px] text-[#667085]">{item.time}</span>
                    </div>
                    <div className="w-2 h-2 bg-[#EAECF0] rounded-full group-hover:bg-[#2E37A4]/20 transition-colors" />
                  </div>
                ))
              ) : (
                dept.items.map((item: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0] hover:bg-[#F2F4F7] transition-colors cursor-pointer group">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-[#101828] group-hover:text-[#2E37A4] transition-colors">{item.name}</span>
                      <span className="text-xs text-[#667085]">{item.treatment}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[11px] text-[#667085]">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                        <span className="text-[11px] text-[#98A2B3]">|</span>
                        <span className="text-[11px] text-[#667085]">{item.id}</span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EAECF0] flex items-center justify-center">
              <button className="text-sm font-semibold text-[#667085] hover:text-[#2E37A4] transition-colors flex items-center gap-2 group">
                View Details
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
