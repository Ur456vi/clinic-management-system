"use client";

/**
 * Patient-side lab management page.
 *
 * Visual rewrite (2026-05) to match the dashboard's light theme — the
 * previous version used `dark:` Tailwind variants but the patient
 * dashboard layout itself has a hard-coded light background, so any time
 * the user toggled the theme switch the cards turned dark while the
 * shell stayed white. The result was an invisible heading and mismatched
 * stat cards.
 *
 * This rewrite keeps the existing behaviour — fetch the patient's own
 * lab results from `/api/patient/me/lab-results`, render a filterable
 * paginated table, gracefully handle loading + error — and aligns the
 * styling with the dashboard / appointments pages (colorful stat tiles,
 * white cards, indigo accents, lucide icons).
 */

import { useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  RotateCcw,
} from "lucide-react";

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

const PER_PAGE = 10;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_LABELS: Record<Status, string> = {
  completed: "Completed",
  pending: "Pending",
  inprogress: "In Progress",
  cancelled: "Cancelled",
};

function formatStatus(status: string): string {
  return STATUS_LABELS[status as Status] ?? status;
}

export default function LaboratoryManagementPage() {
  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    async function fetchLabResults() {
      try {
        setError(null);
        const res = await fetch("/api/patient/me/lab-results");
        if (!res.ok) {
          throw new Error(`Failed to fetch lab results (${res.status})`);
        }
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.data ?? []);
        const mapped: TestOrder[] = rows.map((item: Record<string, unknown>) => {
          const patient = (item.patient ?? {}) as Record<string, unknown>;
          return {
            id: String(item.id ?? item.labResultId ?? ""),
            name: String(patient.name ?? item.patientName ?? "—"),
            email: String(patient.email ?? item.patientEmail ?? ""),
            type: String(item.testType ?? item.type ?? "Unknown"),
            status: String(item.status ?? "pending").toLowerCase() as Status,
            priority: String(item.priority ?? "routine").toLowerCase() as Priority,
            date: String(item.orderedAt ?? item.createdAt ?? ""),
          };
        });
        if (!cancelled) setOrders(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lab results.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLabResults();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.type.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "All Statuses" ||
        o.status.toLowerCase() === statusFilter.toLowerCase();
      const matchPriority =
        priorityFilter === "All Priorities" ||
        o.priority.toLowerCase() === priorityFilter.toLowerCase();
      return matchSearch && matchStatus && matchPriority;
    });
  }, [orders, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const total = orders.length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const urgentCount = orders.filter(
    (o) => o.priority === "urgent" || o.priority === "stat",
  ).length;

  // Stat tile config — mirrors the dashboard's colorful tile pattern.
  const statCards = [
    {
      label: "TOTAL TESTS",
      value: total,
      sub: `${orders.length} ordered`,
      bg: "#2E37A4",
      icon: <FlaskConical className="w-6 h-6 text-white opacity-80" />,
    },
    {
      label: "COMPLETED",
      value: completedCount,
      sub: total ? `${Math.round((completedCount / total) * 100)}% of total` : "—",
      bg: "#12B76A",
      icon: <CheckCircle2 className="w-6 h-6 text-white opacity-80" />,
    },
    {
      label: "PENDING",
      value: pendingCount,
      sub: pendingCount ? "Awaiting results" : "All up to date",
      bg: "#FDB022",
      icon: <Clock className="w-6 h-6 text-[#141414] dark:text-[#F9FAFB] opacity-80" />,
      textColor: "#141414",
      subColor: "rgba(20, 20, 20, 0.65)",
    },
    {
      label: "URGENT",
      value: urgentCount,
      sub: urgentCount ? "Needs attention" : "No urgent items",
      bg: "#F04438",
      icon: <AlertCircle className="w-6 h-6 text-white opacity-80" />,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">
            Laboratory Management
          </h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
            View your lab tests, results, and reports.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[124px]"
            style={{
              background: card.bg,
              color: card.textColor ?? "#FFFFFF",
            }}
          >
            <div className="flex items-start justify-between">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: card.subColor ?? "rgba(255,255,255,0.85)" }}
              >
                {card.label}
              </p>
              {card.icon}
            </div>
            <div>
              <p
                className="text-3xl font-bold leading-none"
                style={{ color: card.textColor ?? "#FFFFFF" }}
              >
                {card.value}
              </p>
              <p
                className="text-xs mt-1 font-medium"
                style={{ color: card.subColor ?? "rgba(255,255,255,0.75)" }}
              >
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by test no, patient, or test type…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4] transition-all"
          >
            <option>All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="inprogress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4] transition-all"
          >
            <option>All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
            <option value="stat">Stat</option>
          </select>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
          <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4] dark:text-[#A5B4FC]" />
          Loading your lab results…
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-[#FEF3F2] flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-[#F04438]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#B42318]">Something went wrong</p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] text-white text-sm font-semibold transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-16 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">No lab results found</p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1 max-w-sm">
              When your physician orders lab work, your results will appear here. Adjust filters above if you&apos;re looking for something specific.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1F2937] rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] dark:bg-[#111827] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Test No.</th>
                <th className="px-4 py-3 text-left font-semibold">Patient</th>
                <th className="px-4 py-3 text-left font-semibold">Test Type</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Ordered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {paginated.map((order) => (
                <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-4 font-semibold text-[#2E37A4] dark:text-[#A5B4FC]">
                    {order.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center text-xs font-bold text-[#2E37A4] dark:text-[#A5B4FC] flex-shrink-0">
                        {getInitials(order.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[#101828] dark:text-[#F9FAFB] truncate">
                          {order.name}
                        </p>
                        {order.email ? (
                          <p className="text-xs text-[#667085] dark:text-[#94A3B8] truncate">
                            {order.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#344054] dark:text-[#CBD5E1]">{order.type}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-4 py-4">
                    <PriorityPill priority={order.priority} />
                  </td>
                  <td className="px-4 py-4 text-[#667085] dark:text-[#94A3B8]">
                    {order.date
                      ? new Date(order.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 ? (
        <div className="flex justify-between items-center bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm px-4 py-3">
          <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md border border-[#D0D5DD] dark:border-[#374151] text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-[#344054] dark:text-[#CBD5E1] font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-md border border-[#D0D5DD] dark:border-[#374151] text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── pills ────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string }> = {
    completed: { bg: "#ECFDF3", fg: "#027A48" },
    pending: { bg: "#FEF6E7", fg: "#B54708" },
    inprogress: { bg: "#EFF8FF", fg: "#175CD3" },
    cancelled: { bg: "#FEF3F2", fg: "#B42318" },
  };
  const colors = map[status] ?? map.pending;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: colors.bg, color: colors.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ background: colors.fg }}
      />
      {formatStatus(status)}
    </span>
  );
}

function PriorityPill({ priority }: { priority: Priority }) {
  const map: Record<Priority, { bg: string; fg: string }> = {
    urgent: { bg: "#FEF3F2", fg: "#B42318" },
    stat: { bg: "#FFF6ED", fg: "#B93815" },
    routine: { bg: "#F2F4F7", fg: "#344054" },
  };
  const colors = map[priority] ?? map.routine;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
      style={{ background: colors.bg, color: colors.fg }}
    >
      {priority}
    </span>
  );
}
