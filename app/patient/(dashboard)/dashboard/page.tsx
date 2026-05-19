"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { 
  Eye, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Info, 
  ChevronRight,
  ArrowUpRight,
  Calendar,
  Activity,
  Heart,
  Thermometer,
  User,
  Plus,
  Weight as WeightIcon,
  Ruler,
  Zap,
  Droplets,
  Clock
} from "lucide-react";

const statsCards = [
  { 
    label: "Total Appointments", 
    value: "24", 
    sub: "In Last 7 Days", 
    bg: "#2E37A4",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.7)",
    icon: <Calendar className="w-6 h-6 text-white opacity-80" />
  },
  { 
    label: "Risk Score", 
    value: "Moderate", 
    sub: "Index: 7 days", 
    bg: "#FDB022",
    textColor: "#141414",
    subColor: "rgba(20, 20, 20, 0.6)",
    icon: <Activity className="w-6 h-6 text-[#141414] opacity-80" />
  },
  { 
    label: "Blood Pressure", 
    value: "120/80", 
    unit: "mmHg",
    sub: "Normal", 
    bg: "#12B76A",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.7)",
    icon: <Heart className="w-6 h-6 text-white opacity-80" />
  },
  { 
    label: "Heart Rate", 
    value: "82", 
    unit: "bpm", 
    sub: "Normal", 
    bg: "#0BA5EC",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.7)",
    icon: <Zap className="w-6 h-6 text-white opacity-80" />
  },
  { 
    label: "Weight", 
    value: "87", 
    unit: "kg", 
    sub: "Normal", 
    bg: "#004EEB",
    textColor: "#FFFFFF",
    subColor: "rgba(255, 255, 255, 0.7)",
    icon: <WeightIcon className="w-6 h-6 text-white opacity-80" />
  },
];

const myDoctors = [
  { name: "Dr. Rajesh Jain", spec: "Cardiologist", status: "Available", statusColor: "#12B76A", statusBg: "#ECFDF3", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" },
  { name: "Dr. Simran Goel", spec: "Dermatologist", status: "Busy", statusColor: "#FDB022", statusBg: "#FFF4B7", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Simran" },
  { name: "Dr. Sonali Saini", spec: "Orthopedic", status: "Available", statusColor: "#12B76A", statusBg: "#ECFDF3", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sonali" },
  { name: "Dr. Rakshit Gupta", spec: "Neurologist", status: "Busy", statusColor: "#FDB022", statusBg: "#FFF4B7", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakshit" },
  { name: "Dr. Rakhi Gupta", spec: "Psychiatrist", status: "Available", statusColor: "#12B76A", statusBg: "#ECFDF3", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakhi" },
  { name: "Dr. Amit Verma", spec: "General Surgeon", status: "Available", statusColor: "#12B76A", statusBg: "#ECFDF3", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=AmitV" },
  { name: "Dr. Neha Sharma", spec: "Pediatrician", status: "Available", statusColor: "#12B76A", statusBg: "#ECFDF3", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neha" },
];

const prescriptions = [
  { name: "Cardiology Prescription", date: "22 Mar 2026", doctor: "Dr. Rajesh Jain", file: "PDF" },
  { name: "Dental Prescription", date: "19 Mar 2026", doctor: "Dr. Simran Goel", file: "PDF" },
  { name: "Orthopedic Prescription", date: "15 Mar 2026", doctor: "Dr. Sonali Saini", file: "PDF" },
  { name: "Neurology Prescription", date: "10 Mar 2026", doctor: "Dr. Rakshit Gupta", file: "PDF" },
  { name: "Psychiatry Prescription", date: "05 Mar 2026", doctor: "Dr. Rakhi Gupta", file: "PDF" },
  { name: "General Checkup", date: "01 Mar 2026", doctor: "Dr. Amit Verma", file: "PDF" },
  { name: "Pediatric Care", date: "25 Feb 2026", doctor: "Dr. Neha Sharma", file: "PDF" },
];

const recentActivity = [
  { text: "Appointment with Primary Care", date: "24 Mar 2026, 10:00 AM", dotColor: "#2E37A4" },
  { text: "Blood Pressure Check", date: "24 Mar 2026, 11:00 AM", dotColor: "#12B76A" },
  { text: "Physical Therapy Session", date: "24 Mar 2026, 01:00 PM", dotColor: "#FDB022" },
  { text: "Glucose Dietary Changes", date: "24 Mar 2026, 11:00 AM", dotColor: "#6941C6" },
  { text: "Lab Test Results Received", date: "23 Mar 2026, 09:00 AM", dotColor: "#2E37A4" },
];

const vitalsList = [
  { label: "Weight", value: "100", unit: "Kg", color: "#2E37A4", icon: <WeightIcon size={20} /> },
  { label: "Height", value: "154", unit: "cm", color: "#2E37A4", icon: <Ruler size={20} /> },
  { label: "BMI", value: "19.2", unit: "", color: "#2E37A4", icon: <Activity size={20} /> },
  { label: "Pulse", value: "97", unit: "bpm", color: "#2E37A4", icon: <Activity size={20} /> },
  { label: "SPO2", value: "98", unit: "%", color: "#2E37A4", icon: <Droplets size={20} /> },
  { label: "Temperature", value: "101", unit: "C", color: "#2E37A4", icon: <Thermometer size={20} /> },
];

const consultationByDept = [
  { dept: "Cardiology", value: 85, color: "#2E37A4" },
  { dept: "Urology", value: 75, color: "#12B76A" },
  { dept: "Pediatrics", value: 90, color: "#2E37A4" },
  { dept: "Gynecology", value: 65, color: "#12B76A" },
  { dept: "Psychiatrist", value: 80, color: "#2E37A4" },
  { dept: "General", value: 45, color: "#12B76A" },
];

const recentTransactions = [
  { name: "Dr. Rajesh Jain", spec: "Neurosurgeon", label: "Consultation Fees", amount: "$450", status: "Success", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" },
  { name: "Dr. Simran Goel", spec: "Oncologist", label: "Consultation Fees", amount: "$350", status: "Success", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Simran" },
  { name: "Dr. Sonali Saini", spec: "Pulmonologist", label: "Consultation Fees", amount: "$400", status: "Failed", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sonali" },
  { name: "Dr. Sonali Saini", spec: "Urologist", label: "Consultation Fees", amount: "$550", status: "Success", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sonali2" },
  { name: "Dr. Rajesh Jain", spec: "Cardiologist", label: "Consultation Fees", amount: "$600", status: "Success", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh2" },
];

const recentAppointments = [
  { name: "Dr. Rajesh Jain", spec: "Cardiologist", date: "27 May 2026 - 09:30 AM", fee: "$436", mode: "Online", status: "Upcoming", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh" },
  { name: "Dr. Simran Goel", spec: "Orthopedic Surgeon", date: "26 May 2026 - 10:15 AM", fee: "$150", mode: "Online", status: "Completed", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Simran" },
  { name: "Dr. Sonali Saini", spec: "Pediatrician", date: "25 May 2026 - 12:40 PM", fee: "$200", mode: "In Clinic", status: "Cancelled", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sonali" },
  { name: "Dr. Rakshit Gupta", spec: "Neurologist", date: "24 May 2026 - 11:30 AM", fee: "$300", mode: "In Clinic", status: "Completed", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakshit" },
  { name: "Dr. Rakhi Gupta", spec: "Psychiatrist", date: "23 May 2026 - 04:20 PM", fee: "$180", mode: "Online", status: "Upcoming", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rakhi" },
];

const statusColorMap: Record<string, string> = {
  Upcoming: "#2E37A4",
  Completed: "#12B76A",
  Cancelled: "#F04438",
  Success: "#12B76A",
  Failed: "#F04438",
};

const statusBgMap: Record<string, string> = {
  Upcoming: "#EEF0FF",
  Completed: "#ECFDF3",
  Cancelled: "#FEF3F2",
  Success: "#ECFDF3",
  Failed: "#FEF3F2",
};

export default function DashboardPage() {
  const router = useRouter();

  const handleNewAppointment = () => {
    router.push("/patient/appointments");
  };

  return (
    <div className="p-8 flex flex-col gap-8 bg-[#F9FAFB] min-h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#141414]">Patient Dashboard</h1>
        </div>
        <button 
          onClick={handleNewAppointment}
          className="bg-[#2E37A4] hover:bg-[#1e2570] text-white border-none rounded-lg px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((card, idx) => (
          <div 
            key={idx} 
            className="rounded-2xl p-5 shadow-sm flex flex-col justify-between h-36 transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: card.bg }}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold opacity-90" style={{ color: card.textColor }}>{card.label}</span>
              {card.icon}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: card.textColor }}>{card.value}</span>
                {card.unit && <span className="text-sm font-medium opacity-80" style={{ color: card.textColor }}>{card.unit}</span>}
              </div>
              <span className="text-[11px] font-medium" style={{ color: card.subColor }}>
                {card.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Doctors Column */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAECF0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#141414]">My Doctors</h3>
            <ChevronRight className="w-5 h-5 text-[#6C7688] cursor-pointer" />
          </div>
          <div className="flex flex-col gap-5">
            {myDoctors.map((doc, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F2F4F7] overflow-hidden relative">
                    <Image src={doc.image} alt={doc.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#141414] leading-tight">{doc.name}</p>
                    <p className="text-xs text-[#6C7688] font-medium">{doc.spec}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span 
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ color: doc.statusColor, backgroundColor: doc.statusBg }}
                   >
                    {doc.status}
                  </span>
                  <button className="text-[10px] font-bold text-[#2E37A4] bg-[#EEF0FF] px-3 py-1 rounded-full border-none cursor-pointer hover:bg-[#DEDFFF] transition-colors">
                    Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prescriptions Column */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAECF0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#141414]">Prescriptions</h3>
            <ChevronRight className="w-5 h-5 text-[#6C7688] cursor-pointer" />
          </div>
          <div className="flex flex-col">
            {prescriptions.map((rx, i) => (
              <div key={i} className="flex justify-between items-center py-3.5 border-b border-[#F2F4F7] last:border-0 group hover:bg-[#F9FAFB] px-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F9FAFB] flex items-center justify-center group-hover:bg-white transition-colors">
                    <Calendar size={16} className="text-[#2E37A4]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#141414] leading-tight">{rx.name}</p>
                    <p className="text-[11px] text-[#6C7688] font-medium mt-0.5">{rx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#6C7688]">{rx.file}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F9FAFB] cursor-pointer hover:bg-gray-200 transition-colors">
                    <Info className="w-4 h-4 text-[#6C7688]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Column */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAECF0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#141414]">Recent Activity</h3>
            <ChevronRight className="w-5 h-5 text-[#6C7688] cursor-pointer" />
          </div>
          <div className="relative pl-6 flex flex-col gap-6">
            <div className="absolute left-1.5 top-1 bottom-1 w-0.5 bg-[#F2F4F7]" />
            {recentActivity.map((act, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[23.5px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: act.dotColor }} />
                <p className="text-sm font-bold text-[#141414] leading-snug">{act.text}</p>
                <p className="text-[11px] text-[#6C7688] font-medium mt-1 flex items-center gap-1">
                  <Clock size={10} />
                  {act.date}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vitals Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAECF0] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-bold text-[#141414]">Vitals</h3>
          <div className="flex items-center gap-1 text-sm font-bold text-[#2E37A4] cursor-pointer">
            Monthly ▾
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {vitalsList.map((vital, i) => (
            <div key={i} className="flex flex-col items-center">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-md transition-transform hover:scale-110 cursor-pointer"
                style={{ backgroundColor: vital.color }}
              >
                <div className="text-white">
                  {vital.icon}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-2xl font-bold text-[#141414]">{vital.value}</span>
                  <span className="text-xs font-bold text-[#6C7688]">{vital.unit}</span>
                </div>
                <p className="text-xs text-[#6C7688] font-bold mt-1 uppercase tracking-wider">{vital.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts & Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultation By Department */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAECF0] shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-bold text-[#141414]">Consultation By Department</h3>
            <div className="text-sm font-bold text-[#2E37A4] cursor-pointer">Monthly ▾</div>
          </div>
          <div className="space-y-6 relative pb-2">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-50">
              {[0, 20, 40, 60, 80, 100].map((val) => (
                <div key={val} className="w-full border-t border-[#F2F4F7]" />
              ))}
            </div>
            {/* Scale numbers */}
            <div className="absolute -top-6 left-[104px] right-0 flex justify-between px-1 pointer-events-none">
              {[0, 20, 40, 60, 80, 100].map((val) => (
                <span key={val} className="text-[10px] font-bold text-[#98A2B3]">{val}</span>
              ))}
            </div>

            {consultationByDept.map((item, i) => (
              <div key={i} className="flex items-center gap-4 relative z-10">
                <span className="w-24 text-xs font-bold text-[#6C7688] truncate">{item.dept}</span>
                <div className="flex-1 h-5 bg-[#F9FAFB] rounded-sm overflow-hidden">
                  <div 
                    className="h-full rounded-sm transition-all duration-1000 shadow-sm" 
                    style={{ width: `${item.value}%`, backgroundColor: item.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAECF0] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#141414]">Recent Transactions</h3>
            <div className="text-sm font-bold text-[#2E37A4] cursor-pointer">Weekly ▾</div>
          </div>
          <div className="flex flex-col gap-4">
            {recentTransactions.map((txn, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 rounded-xl hover:bg-[#F9FAFB] transition-colors border border-transparent hover:border-[#F2F4F7] group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden relative bg-[#F2F4F7] border-2 border-white shadow-sm">
                    <Image src={txn.image} alt={txn.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#141414] leading-tight">{txn.name}</p>
                    <p className="text-[11px] text-[#6C7688] font-medium mt-0.5">{txn.spec}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#141414]">{txn.label}</p>
                    <p className="text-sm font-bold text-[#141414]">{txn.amount}</p>
                  </div>
                  <span 
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full w-20 text-center shadow-sm" 
                    style={{ color: statusColorMap[txn.status], backgroundColor: statusBgMap[txn.status] }}
                  >
                    {txn.status}
                  </span>
                  <div className="bg-[#2E37A4] w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1e2570] transition-all transform group-hover:scale-110">
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm overflow-hidden mb-8">
        <div className="p-6 flex justify-between items-center border-b border-[#F2F4F7]">
          <h3 className="text-lg font-bold text-[#141414]">Recent Appointments</h3>
          <div className="text-sm font-bold text-[#2E37A4] cursor-pointer">Weekly ▾</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB]">
                <th className="px-6 py-5 text-left text-xs font-bold text-[#6C7688] uppercase tracking-widest">Name & Designation</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-[#6C7688] uppercase tracking-widest">Date & Time</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-[#6C7688] uppercase tracking-widest">Consultation Fees</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-[#6C7688] uppercase tracking-widest">Mode</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-[#6C7688] uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-[#6C7688] uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {recentAppointments.map((apt, i) => (
                <tr key={i} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative bg-[#F2F4F7] border border-[#EAECF0]">
                        <Image src={apt.image} alt={apt.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#141414]">{apt.name}</p>
                        <p className="text-xs text-[#6C7688] font-medium">{apt.spec}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-[#141414]">
                    {apt.date}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-[#141414]">
                    {apt.fee}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-[#141414]">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${apt.mode === "Online" ? "bg-blue-500" : "bg-orange-500"}`} />
                      {apt.mode}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span 
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm" 
                      style={{ color: statusColorMap[apt.status], backgroundColor: statusBgMap[apt.status] }}
                    >
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all">
                        <Eye className="w-4 h-4 text-[#6C7688] cursor-pointer hover:text-[#2E37A4]" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all">
                        <Edit3 className="w-4 h-4 text-[#6C7688] cursor-pointer hover:text-[#2E37A4]" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all">
                        <Trash2 className="w-4 h-4 text-[#F04438] cursor-pointer hover:text-red-700" />
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
  );
}