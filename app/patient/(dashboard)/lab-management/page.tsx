"use client";

/**
 * Patient-side lab management page.
 *
 * Was previously unrenderable — the JSX was littered with closing-tag
 * typos (`</div>div>`, `</button>button>` etc.) which kept the page from
 * compiling at all (BUG-015: "Lab Management sidebar link broken"). This
 * is a clean rewrite that keeps the original behaviour: fetch the
 * patient's own lab results from `/api/patient/me/lab-results`, render
 * a filterable / paginated table, and gracefully handle loading and
 * error states.
 */

import { useEffect, useMemo, useState } from "react";

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
        setLoading(true);
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
            status: (String(item.status ?? "pending").toLowerCase() as Status),
            priority: (String(item.priority ?? "routine").toLowerCase() as Priority),
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

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">Loading lab results…</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Error: {error}</p>
        <button
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Laboratory Management
          </h1>
          <p className="text-sm text-gray-500">
            View your lab tests, results, and reports
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TOTAL TESTS", value: total, badge: "ACTIVE" },
          { label: "COMPLETED", value: completedCount, badge: "ACTIVE" },
          { label: "PENDING", value: pendingCount, badge: "ACTIVE" },
          { label: "URGENT", value: urgentCount, badge: "ACTIVE" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {card.value}
            </p>
            <span className="text-xs text-green-600 font-medium">
              {card.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by test no, patient..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[220px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option>All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
          <option value="stat">Stat</option>
        </select>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No lab results found.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Test No.</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Test Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Ordered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginated.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <td className="px-4 py-3 font-medium text-indigo-600">
                    {order.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {getInitials(order.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.name}
                        </p>
                        <p className="text-xs text-gray-500">{order.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {order.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : order.status === "inprogress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        order.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : order.priority === "stat"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
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
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400">
        Copyright © 2026 - Vyara.
      </div>
    </div>
  );
}
