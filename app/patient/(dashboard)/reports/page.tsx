"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  TrendingUp,
  Loader2,
  ChevronDown,
  Activity
} from "lucide-react";

type Appt = { id: string; status: string; startsAt: string; staff: { fullName: string } | null };
type Plan = { id: string; status: string; title: string; createdAt: string };
type Lab = { id: string };

type TimelineData = {
  month: string;
  diabetes: number;
  labTests: number;
  respiratory: number;
};

// 6 Months Timeline Data matching Figma
const TIMELINE_MOCKS: Record<string, TimelineData[]> = {
  "6months": [
    { month: "Oct '25", diabetes: 3.9, labTests: 3.2, respiratory: 4.7 },
    { month: "Nov '25", diabetes: 3.0, labTests: 4.8, respiratory: 5.1 },
    { month: "Dec '25", diabetes: 4.5, labTests: 4.7, respiratory: 3.0 },
    { month: "Jan '26", diabetes: 5.6, labTests: 5.9, respiratory: 4.1 },
    { month: "Feb '26", diabetes: 4.0, labTests: 4.8, respiratory: 6.0 },
    { month: "Mar '26", diabetes: 2.6, labTests: 5.5, respiratory: 5.8 },
  ],
  "3months": [
    { month: "Jan '26", diabetes: 5.6, labTests: 5.9, respiratory: 4.1 },
    { month: "Feb '26", diabetes: 4.0, labTests: 4.8, respiratory: 6.0 },
    { month: "Mar '26", diabetes: 2.6, labTests: 5.5, respiratory: 5.8 },
  ]
};

export default function PatientReportsPage() {
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  
  // Dropdown states
  const [timelineRange, setTimelineRange] = useState("6months");
  const [medsYear, setMedsYear] = useState("2026");
  const [showTimelineDropdown, setShowTimelineDropdown] = useState(false);
  const [showMedsDropdown, setShowMedsDropdown] = useState(false);

  const load = useCallback(async () => {
    try {
      const resAppts = await fetch("/api/patient/me/appointments?limit=100", { credentials: "include" });
      const resPlans = await fetch("/api/patient/me/treatment-plans?limit=100", { credentials: "include" });
      const resLabs = await fetch("/api/patient/me/lab-results?limit=100", { credentials: "include" });

      if (resAppts.ok) {
        const j = await resAppts.json();
        setAppts(Array.isArray(j?.data) ? j.data : []);
      }
      if (resPlans.ok) {
        const j = await resPlans.json();
        setPlans(Array.isArray(j?.data) ? j.data : []);
      }
      if (resLabs.ok) {
        const j = await resLabs.json();
        setLabs(Array.isArray(j?.data) ? j.data : []);
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#2E37A4]" />
        Loading reports...
      </div>
    );
  }

  // Calculate dynamic stats
  const totalLabsCount = Math.max(5, labs.length);
  const totalPrescriptionsCount = Math.max(15, plans.length);

  // SVG Line Chart calculations
  const timelineData = TIMELINE_MOCKS[timelineRange] || TIMELINE_MOCKS["6months"];
  const chartHeight = 220;
  const chartWidth = 500;
  const paddingX = 48;
  const paddingY = 32;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (timelineData.length - 1)) * (chartWidth - paddingX * 2);
    // Value range 1 to 6 mapped to chartHeight
    const y = chartHeight - paddingY - ((val - 1) / 5) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const linePath = (key: keyof Omit<TimelineData, "month">) => {
    return timelineData.map((d, idx) => {
      const { x, y } = getCoordinates(idx, d[key] as number);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const areaPath = (key: keyof Omit<TimelineData, "month">) => {
    const points = timelineData.map((d, idx) => {
      const { x, y } = getCoordinates(idx, d[key] as number);
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    });
    const firstX = getCoordinates(0, 1).x;
    const lastX = getCoordinates(timelineData.length - 1, 1).x;
    const baseY = chartHeight - paddingY;
    return `${points.join(" ")} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">Patient Reports</h1>
      </div>

      {/* Stats Card Container Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-4 items-stretch w-full">
        
        {/* Card 1: Online & In-Person Appointments */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-4 flex items-center justify-between gap-4 w-full lg:w-[44%]">
          {/* Column 1: Online Appointments */}
          <div className="flex items-center justify-between w-1/2 pr-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight">Total Online Appointment</span>
              <span className="text-2xl font-black text-gray-950 dark:text-white">30%</span>
            </div>
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="9" fill="none" stroke="#F3F4F6" strokeWidth="18" className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="18" cy="18" r="9" fill="none" stroke="#22C55E" strokeWidth="18" strokeDasharray="16.96 56.55" strokeDashoffset="0" />
              </svg>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1px] h-10 bg-gray-200 dark:bg-gray-700 shrink-0" />

          {/* Column 2: In-Person Appointments */}
          <div className="flex items-center justify-between w-1/2 pl-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight">Total In-Person Appointment</span>
              <span className="text-2xl font-black text-gray-955 dark:text-white">70%</span>
            </div>
            <div className="relative h-12 w-12 shrink-0">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="9" fill="none" stroke="#F3F4F6" strokeWidth="18" className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="18" cy="18" r="9" fill="none" stroke="#2E37A4" strokeWidth="18" strokeDasharray="39.58 56.55" strokeDashoffset="0" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Lab Tests & Prescriptions */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-4 flex flex-col justify-between h-[88px] w-full lg:w-[16%]">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
            <span>Lab Tests</span>
            <span className="text-base font-black text-gray-950 dark:text-white">{String(totalLabsCount).padStart(2, "0")}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
            <span>Prescriptions</span>
            <span className="text-base font-black text-gray-950 dark:text-white">{String(totalPrescriptionsCount).padStart(2, "0")}</span>
          </div>
        </div>

        {/* Card 3: Treatment Completed */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-4 flex flex-col justify-between h-[88px] w-full lg:w-[20%]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight">Treatment Completed</span>
            <span className="text-2xl font-black text-gray-955 dark:text-white">07</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full bg-[#2E37A4] rounded-full" style={{ width: "70%" }} />
          </div>
        </div>

        {/* Card 4: Medications Prescribed */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-4 flex flex-col justify-between h-[88px] w-full lg:w-[20%]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight">Medications Prescribed</span>
            <span className="text-2xl font-black text-gray-955 dark:text-white">15</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: "75%" }} />
          </div>
        </div>

      </div>

      {/* Middle Section: Line and Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Disease Timeline Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">Disease Timeline</h2>
            
            {/* Range dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowTimelineDropdown(p => !p)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1F2937] hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                <span>{timelineRange === "6months" ? "Last 6 Months" : "Last 3 Months"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>

              {showTimelineDropdown && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1 py-1.5 text-xs">
                  <button
                    onClick={() => { setTimelineRange("6months"); setShowTimelineDropdown(false); }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-105 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer"
                  >
                    Last 6 Months
                  </button>
                  <button
                    onClick={() => { setTimelineRange("3months"); setShowTimelineDropdown(false); }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-105 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer"
                  >
                    Last 3 Months
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-hidden">
            <svg className="w-full h-auto" viewBox={`0 0 ${chartWidth} ${chartHeight}`} fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Gradients */}
              <defs>
                <linearGradient id="grad-diabetes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="grad-labtests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E37A4" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2E37A4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="grad-respiratory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Y Lines (horizontal) */}
              {[1, 2, 3, 4, 5, 6].map((val) => {
                const y = chartHeight - paddingY - ((val - 1) / 5) * (chartHeight - paddingY * 2);
                return (
                  <g key={val}>
                    <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#EAECF0" strokeWidth="0.8" className="stroke-gray-100 dark:stroke-gray-800" strokeDasharray="3 3" />
                    <text x={paddingX - 18} y={y + 3} fill="#98A2B3" className="fill-gray-400 dark:fill-gray-500 font-bold" fontSize="10">{val}</text>
                  </g>
                );
              })}

              {/* Chart Areas */}
              <path d={areaPath("diabetes")} fill="url(#grad-diabetes)" />
              <path d={areaPath("labTests")} fill="url(#grad-labtests)" />
              <path d={areaPath("respiratory")} fill="url(#grad-respiratory)" />

              {/* Chart Lines */}
              <path d={linePath("diabetes")} stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
              <path d={linePath("labTests")} stroke="#2E37A4" strokeWidth="2" strokeLinecap="round" />
              <path d={linePath("respiratory")} stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

              {/* X Axis Labels & Dots */}
              {timelineData.map((d, idx) => {
                const { x: xDiabetes, y: yDiabetes } = getCoordinates(idx, d.diabetes);
                const { x: xLab, y: yLab } = getCoordinates(idx, d.labTests);
                const { x: xResp, y: yResp } = getCoordinates(idx, d.respiratory);

                const showDots = d.month.includes("Dec") || d.month.includes("Jan");

                return (
                  <g key={idx}>
                    {/* Text Label */}
                    <text x={xDiabetes} y={chartHeight - 8} textAnchor="middle" fill="#98A2B3" className="fill-gray-400 dark:fill-gray-500 font-bold" fontSize="9.5">{d.month}</text>
                    {/* Dots */}
                    {showDots && (
                      <>
                        <circle cx={xDiabetes} cy={yDiabetes} r="3" fill="#22C55E" stroke="white" strokeWidth="1" />
                        <circle cx={xLab} cy={yLab} r="3" fill="#2E37A4" stroke="white" strokeWidth="1" />
                        <circle cx={xResp} cy={yResp} r="3" fill="#EF4444" stroke="white" strokeWidth="1" />
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legends */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-3 text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#22C55E]" />
              <span>Diabetes</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#2E37A4]" />
              <span>Lab Tests</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#EF4444]" />
              <span>Respiratory Infection</span>
            </span>
          </div>

        </div>

        {/* Medication Stats Donut Chart */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-955 dark:text-white">Medication Stats</h2>
            
            {/* Year dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMedsDropdown(p => !p)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-[#1F2937] hover:bg-gray-55 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none"
              >
                <span>{medsYear}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>

              {showMedsDropdown && (
                <div className="absolute right-0 mt-1.5 w-28 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1.5 text-xs">
                  {["2026", "2025", "2024"].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => { setMedsYear(yr); setShowMedsDropdown(false); }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-105 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer"
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SVG Donut Chart */}
          <div className="relative flex items-center justify-center py-2">
            <div className="relative h-36 w-36">
              <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F3F4F6" strokeWidth="4" className="stroke-gray-100 dark:stroke-gray-800" />
                
                {/* 1. Antibiotics: 39% (Green) */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#22C55E" strokeWidth="4" strokeDasharray="39 100" strokeDashoffset="0" />
                
                {/* 2. Thyroid: 40% (Blue) */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2E37A4" strokeWidth="4" strokeDasharray="40 100" strokeDashoffset="-39" />
                
                {/* 3. Diabetes: 21% (Yellow) */}
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#FBBF24" strokeWidth="4" strokeDasharray="21 100" strokeDashoffset="-79" />
              </svg>
              
              {/* Inner Donut segment labels */}
              <div className="absolute top-[8%] left-[45%] text-[10px] font-black text-gray-900 dark:text-gray-900 bg-white dark:bg-white px-1.5 py-0.5 rounded shadow-xs border border-gray-200 dark:border-gray-200 select-none">39%</div>
              <div className="absolute bottom-[20%] right-[10%] text-[10px] font-black text-gray-900 dark:text-gray-900 bg-white dark:bg-white px-1.5 py-0.5 rounded shadow-xs border border-gray-200 dark:border-gray-200 select-none">70%</div>
              <div className="absolute bottom-[40%] left-[8%] text-[10px] font-black text-gray-900 dark:text-gray-900 bg-white dark:bg-white px-1.5 py-0.5 rounded shadow-xs border border-gray-200 dark:border-gray-200 select-none">21%</div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs font-bold text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#22C55E]" />
              <span>Antibiotics</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#FBBF24]" />
              <span>Diabetes</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-xs bg-[#2E37A4]" />
              <span>Thyroid</span>
            </span>
          </div>

        </div>

      </div>

      {/* Bottom Row: Latest Appointments, Recent Activity, Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Latest Appointments */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#2E37A4] dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-gray-955 dark:text-white">Latest Appointments</h3>
            </div>
            <Link href="/patient/appointments" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ChevronRight className="h-4.5 w-4.5" />
            </Link>
          </div>
          
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold select-none mt-[-6px]">Your latest appointments</p>

          <div className="flex flex-col gap-3.5 pt-2">
            {/* Row 1 */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {appts.length > 0 ? (appts[0].staff?.fullName || "Doctor") : "Dr. Sumit Mittal"}
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {appts.length > 0
                  ? (appts[0].status === "ONLINE" || appts[0].status?.toLowerCase().includes("online") ? "Online" : "In Person")
                  : "In Person"}
              </span>
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {appts.length > 1 ? (appts[1].staff?.fullName || "Doctor") : "Dr. Sarita Jain"}
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {appts.length > 1
                  ? (appts[1].status === "ONLINE" || appts[1].status?.toLowerCase().includes("online") ? "Online" : "In Person")
                  : "Online"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-[#2E37A4] dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-gray-955 dark:text-white">Recent Activity</h3>
          </div>
          
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold select-none mt-[-6px]">Latest patient updates</p>

          <div className="flex flex-col gap-4 pt-1">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Prescription Downloaded</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">2 minutes ago</span>
            </div>

            <div className="flex justify-between items-start">
              <div className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Appointment Rescheduled</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">15 minutes ago</span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-[#2E37A4] dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-gray-955 dark:text-white">Performance</h3>
          </div>
          
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold select-none mt-[-6px]">Overall Performance over past a year</p>

          <div className="flex flex-col divide-y divide-gray-105 dark:divide-gray-800">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Patient Satisfaction</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">4.8 / 5.0</span>
            </div>
            
            <div className="flex justify-between items-center py-2.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Attendance Rate</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">94%</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
