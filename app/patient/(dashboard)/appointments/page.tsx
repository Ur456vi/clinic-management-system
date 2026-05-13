"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const allAppointments = [
  { date: "30 Apr 2025", time: "09:30 AM", doctor: "Dr. Sumit Mittal", spec: "Cardiologist", mode: "In-person", status: "Checked Out" },
  { date: "15 Apr 2025", time: "11:20 AM", doctor: "Dr. Akangsha Jain", spec: "Orthopedic Surgeon", mode: "Online", status: "Checked In" },
  { date: "02 Apr 2025", time: "08:15 AM", doctor: "Dr. Sonal Mittal", spec: "Pediatrician", mode: "In-Person", status: "Cancelled" },
  { date: "27 Mar 2025", time: "02:00 PM", doctor: "Dr. Tarun Gupta", spec: "Gynecologist", mode: "Online", status: "Schedule", scheduleDate: "30 Apr 2025" },
  { date: "12 Mar 2025", time: "05:40 PM", doctor: "Dr. Raika Jain", spec: "Psychiatrist", mode: "Online", status: "Confirmed" },
  { date: "24 Feb 2025", time: "09:20 AM", doctor: "Dr. Nilesh Arora", spec: "Neurosurgeon", mode: "In-Person", status: "Cancelled" },
  { date: "18 Feb 2025", time: "11:40 AM", doctor: "Dr. Kaushik Gupta", spec: "Oncologist", mode: "Online", status: "Confirmed" },
  { date: "01 Feb 2025", time: "04:00 PM", doctor: "Dr. Anki Singh", spec: "Pulmonologist", mode: "Online", status: "Checked Out" },
  { date: "25 Jan 2025", time: "03:10 PM", doctor: "Dr. Ganesh Gupta", spec: "Urologist", mode: "Online", status: "Schedule", scheduleDate: "28 Jan 2025" },
  { date: "12 Jan 2025", time: "02:10 PM", doctor: "Dr. Saurabh Jain", spec: "Cardiologist", mode: "In-Person", status: "Cancelled" },
  { date: "05 Jan 2025", time: "10:00 AM", doctor: "Dr. Priya Sharma", spec: "Dermatologist", mode: "Online", status: "Confirmed" },
  { date: "28 Dec 2024", time: "03:30 PM", doctor: "Dr. Rahul Verma", spec: "Orthopedic", mode: "In-Person", status: "Checked Out" },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  "Checked Out": { color: "#2E37A4", bg: "#EEF0FF" },
  "Checked In":  { color: "#12B76A", bg: "#ECFDF3" },
  "Cancelled":   { color: "#F04438", bg: "#FEF3F2" },
  "Schedule":    { color: "#EB9200", bg: "#FFF4B7" },
  "Confirmed":   { color: "#0BA5EC", bg: "#E0F2FE" },
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

export default function AppointmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("Recent");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("01/10/2026");
  const [dateTo, setDateTo] = useState("01/22/2026");

  // Filter & search
  const filtered = allAppointments.filter((apt) => {
    const matchSearch =
      apt.doctor.toLowerCase().includes(search.toLowerCase()) ||
      apt.spec.toLowerCase().includes(search.toLowerCase()) ||
      apt.status.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || apt.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleNewAppointment = () => {
    // Logic for new appointment
    console.log("Opening new appointment modal/form");
  };

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#141414]">Appointments</h1>
        <div className="flex gap-2.5 items-center">
          {/* Export */}
          <button className="flex items-center gap-1.5 border border-[#D0D0D0] rounded-lg px-4 py-2.5 bg-white text-sm text-[#141414] font-semibold cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export ▾
          </button>
          {/* Share */}
          <button className="flex items-center justify-center w-10 h-10 border border-[#D0D0D0] rounded-lg bg-white text-[#141414] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {/* Print */}
          <button className="flex items-center justify-center w-10 h-10 border border-[#D0D0D0] rounded-lg bg-white text-[#141414] cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* New Appointment */}
          <button 
            onClick={handleNewAppointment}
            className="bg-[#2E37A4] hover:bg-[#1e2570] text-white border-none rounded-lg px-5 py-2.5 text-sm font-bold cursor-pointer transition-colors shadow-sm ml-1"
          >
            + New Appointment
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 lg:px-5 flex items-center justify-between border-b border-[#F2F4F7] flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 h-10 border border-[#D0D0D0] rounded-lg px-3 bg-[#F9FAFB] min-w-[240px] focus-within:border-[#2E37A4] transition-colors">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="#A1A1A1" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="#A1A1A1" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input 
                type="text" 
                placeholder="Search appointments..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} 
                className="border-none outline-none text-sm text-[#141414] bg-transparent w-full" 
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 h-10 border border-[#D0D0D0] rounded-lg px-3 bg-[#F9FAFB]">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="#6C7688" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="#6C7688" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input type="text" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-none outline-none text-sm text-[#141414] bg-transparent w-20" />
              <span className="text-[#6C7688] font-bold">-</span>
              <input type="text" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-none outline-none text-sm text-[#141414] bg-transparent w-20" />
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            {/* Filter by Status */}
            <div className="flex items-center gap-2 h-10 border border-[#D0D0D0] rounded-lg px-3 bg-[#F9FAFB] cursor-pointer hover:border-[#2E37A4] transition-colors">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="#6C7688" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <select 
                value={filterStatus} 
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} 
                className="border-none outline-none text-sm font-semibold text-[#141414] bg-transparent cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Checked In">Checked In</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Schedule">Schedule</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2 h-10 border border-[#D0D0D0] rounded-lg px-3 bg-[#F9FAFB] cursor-pointer hover:border-[#2E37A4] transition-colors">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M3 6h18M6 12h12M9 18h6" stroke="#6C7688" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="border-none outline-none text-sm font-semibold text-[#141414] bg-transparent cursor-pointer"
              >
                <option value="Recent">Sort By: Recent</option>
                <option value="Oldest">Sort By: Oldest</option>
                <option value="Name">Sort By: Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {["Date & Time", "Doctor Name", "Mode", "Status"].map((h) => (
                  <th key={h} className="p-4 text-left text-[#6C7688] font-bold text-xs uppercase tracking-wider border-b border-[#F2F4F7]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-[#6C7688] font-medium italic">No appointments found matching your criteria.</td>
                </tr>
              ) : (
                paginated.map((apt, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {/* Date & Time */}
                    <td className="p-4 text-[#141414]">
                      <span className="font-bold">{apt.date}</span>
                      <span className="text-[#6C7688] font-medium ml-2">{apt.time}</span>
                    </td>

                    {/* Doctor */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#EEF0FF] flex items-center justify-center text-sm font-bold text-[#2E37A4] flex-shrink-0">
                          {apt.doctor.charAt(4)}
                        </div>
                        <div>
                          <p className="m-0 text-sm font-bold text-[#141414]">{apt.doctor}</p>
                          <p className="m-0 text-xs text-[#6C7688] font-medium">{apt.spec}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mode */}
                    <td className="p-4 text-[#141414] font-medium">{apt.mode}</td>

                    {/* Status */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap" 
                          style={{ color: statusConfig[apt.status]?.color ?? "#141414", backgroundColor: statusConfig[apt.status]?.bg ?? "#F2F4F7" }}
                        >
                          {apt.status}
                        </span>
                        {apt.status === "Schedule" && apt.scheduleDate && (
                          <span className="text-xs text-[#6C7688] font-semibold">{apt.scheduleDate}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 flex items-center justify-between border-t border-[#F2F4F7] flex-wrap gap-4">
          {/* Rows per page */}
          <div className="flex items-center gap-2 text-sm text-[#6C7688] font-medium">
            <span>Rows per page:</span>
            <select 
              value={rowsPerPage} 
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
              className="border border-[#D0D0D0] rounded px-1.5 py-0.5 text-sm text-[#141414] bg-white cursor-pointer"
            >
              {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="ml-1">Entries</span>
          </div>

          {/* Pages */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`w-9 h-9 border border-[#D0D0D0] rounded-lg bg-white flex items-center justify-center transition-opacity ${currentPage === 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 border rounded-lg text-sm font-bold cursor-pointer transition-colors ${
                  currentPage === page ? "border-[#2E37A4] bg-[#2E37A4] text-white" : "border-[#D0D0D0] bg-white text-[#141414] hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`w-9 h-9 border border-[#D0D0D0] rounded-lg bg-white flex items-center justify-center transition-opacity ${currentPage === totalPages ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center border-t border-[#EAECF0]">
        <p className="m-0 text-xs text-[#6C7688] font-medium">Copyright © 2026 - Vyara.</p>
      </footer>
    </div>
  );
}