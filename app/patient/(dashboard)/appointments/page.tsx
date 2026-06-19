"use client";

/**
 * Patient appointments — real list from GET /api/patient/me/appointments.
 * Search + status filter are client-side over the fetched page.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Search } from "lucide-react";

type Appt = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  reason: string | null;
  staff: { id: string; fullName: string; specialization: string | null } | null;
  department: { id: string; name: string } | null;
};

const STATUS_STYLE: Record<string, string> = {
  REQUESTED: "bg-[#FFFAEB] text-[#B54708]",
  CONFIRMED: "bg-[#EFF8FF] text-[#175CD3]",
  COMPLETED: "bg-[#ECFDF3] text-[#027A48]",
  CANCELLED: "bg-[#FEF3F2] text-[#B42318]",
  NO_SHOW: "bg-[#F2F4F7] text-[#475467]",
};
const STATUSES = ["All", "REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Appt[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/me/appointments?limit=100", { credentials: "include" });
      if (!res.ok) {
        setRows([]);
        return;
      }
      const json = await res.json();
      const list: Appt[] = Array.isArray(json?.data) ? json.data : [];
      list.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
      setRows(list);
    } catch {
      setRows([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((a) => {
      if (status !== "All" && a.status !== status) return false;
      if (!q) return true;
      return (
        (a.staff?.fullName ?? "").toLowerCase().includes(q) ||
        (a.department?.name ?? "").toLowerCase().includes(q) ||
        (a.reason ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, status]);

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Appointments</h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">Your bookings across the clinic.</p>
        </div>
        <button
          onClick={() => router.push("/patient/appointments/new")}
          className="bg-[#6B2B26] hover:bg-[#54201D] text-white rounded-lg px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" /> New Appointment
        </button>
      </div>

      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#98A2B3]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor, department, or reason…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/15"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB]"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm overflow-hidden">
        {rows === null ? (
          <div className="p-8 flex items-center justify-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#667085] dark:text-[#94A3B8]">
            No appointments found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[#667085] dark:text-[#94A3B8] border-b border-[#EAECF0] dark:border-[#374151]">
                <th className="px-5 py-3 font-semibold">Date / Time</th>
                <th className="px-5 py-3 font-semibold">Doctor</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-4 text-[#101828] dark:text-[#F9FAFB] font-medium whitespace-nowrap">
                    {new Date(a.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    <span className="text-[#98A2B3] dark:text-[#94A3B8] font-normal">
                      {" · "}{new Date(a.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[#101828] dark:text-[#F9FAFB] font-medium">{a.staff?.fullName ?? "—"}</div>
                    {a.department ? <div className="text-xs text-[#667085] dark:text-[#94A3B8]">{a.department.name}</div> : null}
                  </td>
                  <td className="px-5 py-4 text-[#475467] dark:text-[#CBD5E1] max-w-[260px] truncate">{a.reason ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? STATUS_STYLE.REQUESTED}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
