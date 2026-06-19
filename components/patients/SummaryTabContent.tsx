"use client"

import React from "react"
import { Search, Filter, Plus, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react"

const StatsCard = ({ title, value, trend, trendValue }: { title: string; value: string; trend?: "up" | "down"; trendValue?: string }) => (
  <div className="bg-white border border-[#EAECF0] rounded-2xl p-6 flex-1 shadow-sm">
    <p className="text-sm font-medium text-[#667085] mb-2">{title}</p>
    <div className="flex items-end gap-2">
      <h3 className={`text-3xl font-bold ${title === "High Risk" ? "text-[#D92D20]" : "text-[#101828]"}`}>{value}</h3>
      {trend && (
        <div className={`flex items-center gap-1 mb-1 ${trend === "up" ? "text-[#12B76A]" : "text-[#D92D20]"}`}>
          {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-xs font-semibold">{trendValue}</span>
        </div>
      )}
    </div>
  </div>
)

const FilterDropdown = ({ label }: { label: string }) => (
  <div className="relative">
    <select className="appearance-none h-10 pl-4 pr-10 border border-[#D0D5DD] rounded-lg bg-white text-sm text-[#344054] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] min-w-[120px]">
      <option>{label}</option>
    </select>
    <ChevronLeft className="absolute right-3 top-3 w-4 h-4 text-[#667085] -rotate-90" />
  </div>
)

const RiskBadge = ({ risk }: { risk: "High" | "Moderate" | "Low" }) => {
  const colors = {
    High: "bg-[#FEE4E2] text-[#B42318] dot-[#B42318]",
    Moderate: "bg-[#FFFAEB] text-[#B54708] dot-[#B54708]",
    Low: "bg-[#ECFDF3] text-[#027A48] dot-[#027A48]",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[risk]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${risk === "High" ? "bg-[#B42318]" : risk === "Moderate" ? "bg-[#B54708]" : "bg-[#027A48]"}`} />
      {risk}
    </span>
  )
}

const patients = [
  { name: "Marcelo Dias", id: "P012", risk: "High", diagnosis: "Type 2 Diabetes", comorbidities: "Hypertension", lastVisit: "15 Mar 2024", nextVisit: "17 May 2024", hba1c: "9.2%", trend: "up", bmi: "34.1" },
  { name: "Priya Gupta", id: "P012", risk: "Moderate", diagnosis: "Hypothyroidism", comorbidities: "PCOS", lastVisit: "27 Mar 2024", nextVisit: "15 Jul 2024", hba1c: "6.8%", trend: "down", bmi: "27.8" },
  { name: "Amit Sharma", id: "P012", risk: "High", diagnosis: "Type 2 Diabetes", comorbidities: "Type 2 Diabetes", lastVisit: "19 Mar 2024", nextVisit: "19 Apr 2024", hba1c: "8.4%", trend: "up", bmi: "30.5" },
  { name: "Sarah Johnson", id: "P012", risk: "Low", diagnosis: "Obesity", comorbidities: "Obesity", lastVisit: "16 Mar 2024", nextVisit: "28 Jun 2024", hba1c: "5.9%", trend: "down", bmi: "31.2" },
  { name: "Michael Chen", id: "P012", risk: "Moderate", diagnosis: "Type 2 Diabetes", comorbidities: "Dyslipidemia", lastVisit: "12 Mar 2024", nextVisit: "11 Jun 2024", hba1c: "7.1%", trend: "down", bmi: "28.5" },
  { name: "Rohit Verma", id: "P012", risk: "High", diagnosis: "Type 2 Diabetes", comorbidities: "-", lastVisit: "10 Mar 2024", nextVisit: "25 May 2024", hba1c: "9.1%", trend: "up", bmi: "33.5" },
  { name: "Anjali Mehta", id: "P012", risk: "Low", diagnosis: "Hypothyroidism", comorbidities: "Hypertension", lastVisit: "08 Mar 2024", nextVisit: "20 Apr 2024", hba1c: "5.1%", trend: "down", bmi: "23.1" },
]

export default function SummaryTabContent() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="flex gap-4">
        <StatsCard title="High Risk" value="120" trend="up" trendValue="+5%" />
        <StatsCard title="Avg HbA1c" value="7.6%" />
        <StatsCard title="High Risk %" value="14.1%" />
        <StatsCard title="Dropout Rate" value="8.2%" />
        <StatsCard title="Recovery Rate" value="68%" trend="up" trendValue="+12%" />
        <StatsCard title="Avg Improvement" value="32%" />
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#EAECF0] rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-6 space-y-4">
          <div className="relative max-w-[720px]">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#667085]" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full h-10 pl-10 pr-4 border border-[#D0D5DD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#344054]">Filter by:</span>
              <FilterDropdown label="Risk" />
              <FilterDropdown label="Gender" />
              <FilterDropdown label="Age Group" />
              <FilterDropdown label="Outcome" />
              <button className="p-2 border border-[#D0D5DD] rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 text-[#344054]" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#6B2B26] text-white rounded-lg text-sm font-semibold hover:bg-[#54201D] transition-all">
              <Plus className="w-4 h-4" />
              Add New Patient
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-y border-[#EAECF0]">
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Primary Diagnosis</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Comorbidities</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Last Visit</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">Next Visit</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">HbA1c</th>
                <th className="px-6 py-3 text-xs font-semibold text-[#667085] uppercase tracking-wider">BMI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {patients.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        i % 3 === 0 ? "bg-[#444CE7]" : i % 3 === 1 ? "bg-[#7A5AF8]" : "bg-[#6B2B26]"
                      }`}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#101828]">{p.name}</span>
                        <span className="text-xs text-[#667085]">{p.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{p.id}</td>
                  <td className="px-6 py-4">
                    <RiskBadge risk={p.risk as any} />
                  </td>
                  <td className="px-6 py-4 text-sm text-[#101828] font-medium">{p.diagnosis}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{p.comorbidities}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{p.lastVisit}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{p.nextVisit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#101828]">{p.hba1c}</span>
                      {p.trend === "up" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-[#D92D20]" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-[#12B76A]" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#667085]">{p.bmi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#EAECF0]">
          <span className="text-sm text-[#667085]">Showing 1-10 of 850</span>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] hover:bg-gray-50 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button className="w-10 h-10 bg-[#F9ECEB] text-[#6B2B26] rounded-lg text-sm font-bold border border-[#6B2B26]/10">1</button>
            <button className="w-10 h-10 text-[#667085] rounded-lg text-sm font-medium hover:bg-gray-50">2</button>
            <button className="w-10 h-10 text-[#667085] rounded-lg text-sm font-medium hover:bg-gray-50">3</button>
            <button className="px-4 py-2 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] hover:bg-gray-50 flex items-center gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
