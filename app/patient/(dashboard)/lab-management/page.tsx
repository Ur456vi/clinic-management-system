"use client";
import { useState, useMemo, useCallback } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Status = "completed" | "pending" | "inprogress" | "cancelled";
type Priority = "urgent" | "routine" | "stat";

interface TestOrder {
  id: string;
  name: string;
  email: string;
  type: string;
  status: Status;
  priority: Priority;
  date: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const INITIAL_ORDERS: TestOrder[] = [
  { id: "LAB-001", name: "Ahmed Singh", email: "ahmed@example.com", type: "Complete Blood Count", status: "completed", priority: "routine", date: "Apr 21, 2026" },
  { id: "LAB-002", name: "Van Ablo", email: "van@example.com", type: "Lipid Panel", status: "pending", priority: "urgent", date: "May 10, 2026" },
  { id: "LAB-003", name: "Zainab Sher", email: "zainab@example.com", type: "Thyroid Function", status: "inprogress", priority: "stat", date: "May 12, 2026" },
];

const PER_PAGE = 10;

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function LaboratoryManagementPage() {
  const [orders] = useState<TestOrder[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter(r => {
      if (q && !r.name.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) && !r.type.toLowerCase().includes(q)) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (priorityFilter && r.priority !== priorityFilter) return false;
      return true;
    });
  }, [orders, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.status === "completed").length,
    pending: orders.filter(o => o.status === "pending").length,
    urgent: orders.filter(o => o.priority === "urgent").length,
  }), [orders]);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#141414]">Laboratory Management</h1>
          <p className="text-sm font-bold text-[#667085] mt-0.5">Manage lab tests, results, and reports</p>
        </div>
        <button className="bg-[#2E37A4] hover:bg-[#1e2570] text-white border-none rounded-lg px-5 py-2.5 text-sm font-bold cursor-pointer transition-colors shadow-sm">
          + New Test Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tests", value: stats.total, color: "#2E37A4", bg: "#EEF0FB" },
          { label: "Completed", value: stats.completed, color: "#10B981", bg: "#D1FAE5" },
          { label: "Pending", value: stats.pending, color: "#F59E0B", bg: "#FEF3C7" },
          { label: "Urgent", value: stats.urgent, color: "#EF4444", bg: "#FEE2E2" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-[#EAECF0] shadow-sm flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">{s.label}</span>
            <span className="text-3xl font-bold text-[#141414]">{s.value}</span>
            <div className="w-fit px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ color: s.color, backgroundColor: s.bg }}>Active</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#F2F4F7] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 h-10 border border-[#D0D0D0] rounded-lg px-3 bg-[#F9FAFB] min-w-[280px] focus-within:border-[#2E37A4] transition-colors">
            <input 
              type="text" 
              placeholder="Search by test no, patient..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="border-none outline-none text-sm text-[#141414] bg-transparent w-full" 
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "")} className="h-10 border border-[#D0D0D0] rounded-lg px-3 bg-white text-sm font-bold text-[#141414] outline-none cursor-pointer">
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as Priority | "")} className="h-10 border border-[#D0D0D0] rounded-lg px-3 bg-white text-sm font-bold text-[#141414] outline-none cursor-pointer">
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
              <option value="stat">STAT</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {["Test No.", "Patient", "Test Type", "Status", "Priority", "Ordered Date"].map((h) => (
                  <th key={h} className="p-4 text-left text-[#667085] font-bold text-xs uppercase tracking-wider border-b border-[#F2F4F7]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-[#2E37A4]">{row.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#EEF0FB] flex items-center justify-center text-xs font-bold text-[#2E37A4]">
                        {getInitials(row.name)}
                      </div>
                      <div>
                        <p className="m-0 font-bold text-[#141414]">{row.name}</p>
                        <p className="m-0 text-xs text-[#667085] font-medium">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-[#141414]">{row.type}</td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                      row.status === "completed" ? "bg-[#D1FAE5] text-[#065F46]" :
                      row.status === "pending" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#DBEAFE] text-[#1E40AF]"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      row.priority === "urgent" ? "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]" :
                      row.priority === "stat" ? "bg-[#EDE9FE] text-[#5B21B6] border-[#C4B5FD]" : "bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]"
                    }`}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="p-4 text-[#667085] font-medium">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="mt-auto py-6 text-center border-t border-[#EAECF0]">
        <p className="m-0 text-xs text-[#6C7688] font-bold">Copyright © 2026 - Vyara.</p>
      </footer>
    </div>
  );
}