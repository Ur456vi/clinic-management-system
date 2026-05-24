"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

// ——— TYPES ———————————————————————————————————————————
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

// ——— HELPERS ———————————————————————————————————————————
const PER_PAGE = 10;

function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
}

function formatStatus(status: string): string {
    const map: Record<string, string> = {
          completed: "Completed",
          pending: "Pending",
          inprogress: "In Progress",
          cancelled: "Cancelled",
    };
    return map[status] ?? status;
}

// ——— PAGE COMPONENT ————————————————————————————————————
export default function LaboratoryManagementPage() {
    const [orders, setOrders] = useState<TestOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Statuses");
    const [priorityFilter, setPriorityFilter] = useState("All Priorities");
    const [page, setPage] = useState(1);

  // Fetch the logged-in patient's own lab results from the API
  useEffect(() => {
        async function fetchLabResults() {
                try {
                          setLoading(true);
                          setError(null);
                          const res = await fetch("/api/patient/me/lab-results");
                          if (!res.ok) {
                                      throw new Error(`Failed to fetch lab results: ${res.status}`);
                          }
                          const data = await res.json();
                          // Map API response to TestOrder shape
                  const mapped: TestOrder[] = (data.data ?? data ?? []).map((item: any) => ({
                              id: item.id ?? item.labResultId ?? "",
                              name: item.patient?.name ?? item.patientName ?? "",
                              email: item.patient?.email ?? item.patientEmail ?? "",
                              type: item.testType ?? item.type ?? "Unknown",
                              status: (item.status ?? "pending").toLowerCase() as Status,
                              priority: (item.priority ?? "routine").toLowerCase() as Priority,
                              date: item.orderedAt ?? item.createdAt ?? "",
                  }));
                          setOrders(mapped);
                } catch (err: any) {
                          setError(err.message ?? "Failed to load lab results.");
                } finally {
                          setLoading(false);
                }
        }
        fetchLabResults();
  }, []);

  // ——— FILTERS ————————————————————————————————————————
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

  // Stats
  const total = orders.length;
    const completedCount = orders.filter((o) => o.status === "completed").length;
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const urgentCount = orders.filter((o) => o.priority === "urgent" || o.priority === "stat").length;

  // ——— RENDER ——————————————————————————————————————————
  if (loading) {
        return (
                <div className="p-6 text-center text-gray-400">Loading lab results…</div>div>
              );
  }
  
    if (error) {
          return (
                  <div className="p-6 text-center text-red-500">
                          <p>Error: {error}</p>p>
                          <button
                                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                      onClick={() => window.location.reload()}
                                    >
                                    Retry
                          </button>button>
                  </div>div>
                );
    }
  
    return (
          <div className="p-6 space-y-6">
            {/* Header */}
                <div className="flex items-center justify-between">
                        <div>
                                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                              Laboratory Management
                                  </h1>h1>
                                  <p className="text-sm text-gray-500">Manage lab tests, results, and reports</p>p>
                        </div>div>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                  + New Test Order
                        </button>button>
                </div>div>
          
            {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  {[
            { label: "TOTAL TESTS", value: total, badge: "ACTIVE" },
            { label: "COMPLETED", value: completedCount, badge: "ACTIVE" },
            { label: "PENDING", value: pendingCount, badge: "ACTIVE" },
            { label: "URGENT", value: urgentCount, badge: "ACTIVE" },
                    ].map((card) => (
                                <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>p>
                                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>p>
                                            <span className="text-xs text-green-600 font-medium">{card.badge}</span>span>
                                </div>div>
                              ))}
                </div>div>
          
            {/* Filters */}
                <div className="flex gap-3 items-center">
                        <input
                                    type="text"
                                    placeholder="Search by test no, patient..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                        <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  >
                                  <option>All Statuses</option>option>
                                  <option>completed</option>option>
                                  <option>pending</option>option>
                                  <option>inprogress</option>option>
                                  <option>cancelled</option>option>
                        </select>select>
                        <select
                                    value={priorityFilter}
                                    onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  >
                                  <option>All Priorities</option>option>
                                  <option>urgent</option>option>
                                  <option>routine</option>option>
                                  <option>stat</option>option>
                        </select>select>
                </div>div>
          
            {/* Table */}
            {paginated.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                              No lab results found.
                    </div>div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <table className="w-full text-sm">
                                          <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 uppercase tracking-wide">
                                                        <tr>
                                                                        <th className="px-4 py-3 text-left">Test No.</th>th>
                                                                        <th className="px-4 py-3 text-left">Patient</th>th>
                                                                        <th className="px-4 py-3 text-left">Test Type</th>th>
                                                                        <th className="px-4 py-3 text-left">Status</th>th>
                                                                        <th className="px-4 py-3 text-left">Priority</th>th>
                                                                        <th className="px-4 py-3 text-left">Ordered Date</th>th>
                                                        </tr>tr>
                                          </thead>thead>
                                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {paginated.map((order) => (
                                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                                        <td className="px-4 py-3 font-medium text-indigo-600">{order.id}</td>td>
                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-2">
                                                                                                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                                                                                    {getInitials(order.name)}
                                                                                                    </div>div>
                                                                                                  <div>
                                                                                                                          <p className="font-medium text-gray-900 dark:text-white">{order.name}</p>p>
                                                                                                                          <p className="text-xs text-gray-500">{order.email}</p>p>
                                                                                                    </div>div>
                                                                            </div>div>
                                                        </td>td>
                                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.type}</td>td>
                                                        <td className="px-4 py-3">
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                              order.status === "completed" ? "bg-green-100 text-green-700" :
                                                              order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                              order.status === "inprogress" ? "bg-blue-100 text-blue-700" :
                                                              "bg-red-100 text-red-700"
                                      }`}>
                                                                              {formatStatus(order.status)}
                                                                            </span>span>
                                                        </td>td>
                                                        <td className="px-4 py-3">
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                              order.priority === "urgent" ? "bg-red-100 text-red-700" :
                                                              order.priority === "stat" ? "bg-orange-100 text-orange-700" :
                                                              "bg-gray-100 text-gray-700"
                                      }`}>
                                                                              {order.priority}
                                                                            </span>span>
                                                        </td>td>
                                                        <td className="px-4 py-3 text-gray-500">
                                                          {order.date ? new Date(order.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                        </td>td>
                                      </tr>tr>
                                    ))}
                                          </tbody>tbody>
                              </table>table>
                    </div>div>
                )}
          
            {/* Pagination */}
            {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border text-sm disabled:opacity-40">Prev</button>button>
                              <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>span>
                              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border text-sm disabled:opacity-40">Next</button>button>
                    </div>div>
                )}
          
            {/* Footer */}
                <div className="text-center text-xs text-gray-400">
                        Copyright © 2026 - Vyara.
                </div>div>
          </div>div>
        );
}</div>
