"use client";

/**
 * Lab Scheduling (reception) — option 1.
 *
 * Lists lab orders that need a collection slot (PENDING_SCHEDULE) and lets
 * reception book each one against the partner's existing endpoints, using a
 * slot from getAvailableSlots. Already-scheduled orders are shown for context.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, FlaskConical, CalendarClock, FileText } from "lucide-react";

import { LabBookingPanel, type BookableOrder } from "@/components/lab/LabBookingPanel";

type Order = BookableOrder & {
  status: string;
  appointmentStart: string | null;
  reason: string | null;
  reportUrl: string | null;
  reportStatus: string | null;
  labNumber: string | null;
  patient: { id: string; fullName: string; patientNumber: string };
};

type Center = { centerCode: string; name: string };

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING_SCHEDULE: { bg: "#FEF0E6", fg: "#B4651B", label: "Needs slot" },
  SCHEDULED: { bg: "#E5EEF9", fg: "#2E5AAC", label: "Scheduled" },
  IN_PROGRESS: { bg: "#EDE9FE", fg: "#6A4FB0", label: "In progress" },
  COMPLETED: { bg: "#E4F3EC", fg: "#0E8C6A", label: "Completed" },
  CANNOT_COMPLETE: { bg: "#FDECEC", fg: "#B4322B", label: "Cannot complete" },
  CANCELLED: { bg: "#F2F4F7", fg: "#667085", label: "Cancelled" },
  FAILED: { bg: "#FDECEC", fg: "#B4322B", label: "Booking failed" },
};

function fmt(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export default function LabSchedulingPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [oRes, cRes] = await Promise.all([
        fetch("/api/admin/lab/orders", { credentials: "include" }),
        fetch("/api/admin/lab/centers", { credentials: "include" }),
      ]);
      const oJson = await oRes.json();
      if (!oRes.ok) throw new Error(oJson?.error?.message ?? `HTTP ${oRes.status}`);
      setOrders(Array.isArray(oJson?.data?.orders) ? oJson.data.orders : []);
      if (cRes.ok) {
        const cJson = await cRes.json();
        setCenters(Array.isArray(cJson?.data?.centers) ? cJson.data.centers : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load lab orders");
      setOrders([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pendingCount = useMemo(
    () => (orders ?? []).filter((o) => o.status === "PENDING_SCHEDULE" || o.status === "FAILED").length,
    [orders],
  );

  const onBooked = useCallback(() => {
    setExpanded(null);
    void load();
  }, [load]);

  if (orders === null) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#2E37A4]" />
        Loading lab orders…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Lab Scheduling</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Book a home visit or centre slot for prescribed lab tests. {pendingCount} awaiting a slot.
        </p>
      </div>

      {error ? (
        <p className="text-sm font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
          {error}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151]">
          <FlaskConical className="h-8 w-8 mb-2 text-[#C9BFA6]" />
          <p className="text-sm text-[#6B7B73] dark:text-[#94A3B8]">No lab orders yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const s = STATUS_STYLES[o.status] ?? { bg: "#F2F4F7", fg: "#667085", label: o.status };
            const bookable = o.status === "PENDING_SCHEDULE" || o.status === "FAILED";
            return (
              <div key={o.id} className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">{o.patient.fullName}</span>
                      <span className="text-xs text-[#667085] dark:text-[#94A3B8] font-mono">{o.patient.patientNumber}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1 truncate">
                      {o.items.map((it) => it.testName).join(", ") || "—"}
                    </p>
                    <p className="text-[11px] text-[#98A2B3] mt-0.5 font-mono">
                      {o.orderNumber}
                      {o.status === "SCHEDULED" ? ` · ${fmt(o.appointmentStart)}` : ""}
                      {o.labNumber ? ` · Lab no. ${o.labNumber}` : ""}
                      {o.reason ? ` · ${o.reason}` : ""}
                    </p>
                  </div>
                  {o.reportUrl ? (
                    <a
                      href={o.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[#D0D5DD] dark:border-[#374151] px-3 py-2 text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] dark:hover:bg-[#374151]/50"
                    >
                      <FileText className="h-4 w-4" />
                      {/* Partial reports are not the final result — say so rather
                          than letting a half-finished panel read as complete. */}
                      {o.reportStatus && /partial/i.test(o.reportStatus)
                        ? "View partial report"
                        : "View report"}
                    </a>
                  ) : null}
                  {bookable ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                      className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[#2E37A4] px-3 py-2 text-sm font-medium text-white"
                    >
                      <CalendarClock className="h-4 w-4" />
                      {expanded === o.id ? "Close" : o.status === "FAILED" ? "Retry booking" : "Book slot"}
                    </button>
                  ) : null}
                </div>
                {expanded === o.id ? (
                  <div className="border-t border-[#EAECF0] dark:border-[#374151] p-4">
                    <LabBookingPanel
                      order={o}
                      centers={centers}
                      availabilityUrl="/api/admin/lab/availability"
                      bookUrl={`/api/admin/lab/orders/${o.id}/book`}
                      onBooked={onBooked}
                      onCancel={() => setExpanded(null)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
