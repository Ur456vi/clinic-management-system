"use client";

/**
 * Patient self-booking of prescribed lab tests — option 2.
 *
 * Shows the patient's lab orders that still need a slot (PENDING_SCHEDULE) and
 * lets them book a home visit or centre slot themselves, against the partner's
 * existing endpoints. Rendered at the top of the Lab Management page; renders
 * nothing when there is nothing to book.
 */

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, FlaskConical } from "lucide-react";

import { LabBookingPanel, type BookableOrder } from "@/components/lab/LabBookingPanel";

type Order = BookableOrder & { status: string };

// Patient self-booking (option 2) is behind a setting. Off = reception books
// every order (option 1) and this section stays hidden.
//
// The gate is NOT read here. It lives in admin settings, and the three
// /api/patient/me/lab-orders routes already answer 403 when it is off, so we
// hide on that instead. A client-side `process.env.NEXT_PUBLIC_*` check would
// be inlined at build time and could never reflect a setting change, and it
// would duplicate an authority the server already holds.

export function PatientLabBooking({ onChange }: { onChange?: () => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/patient/me/lab-orders", { credentials: "include" });
      // Self-booking switched off — hide the section rather than showing an
      // error the patient can do nothing about.
      if (res.status === 403) {
        setEnabled(false);
        setOrders([]);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      setOrders(Array.isArray(json?.data?.orders) ? json.data.orders : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your lab orders");
      setOrders([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const onBooked = useCallback(() => {
    setExpanded(null);
    void load();
    onChange?.();
  }, [load, onChange]);

  if (!enabled) return null;
  if (orders === null) return null;
  const pending = orders.filter((o) => o.status === "PENDING_SCHEDULE" || o.status === "FAILED");
  if (pending.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EAECF0] dark:border-[#374151] flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-[#2E37A4]" />
        <h2 className="font-semibold text-[#101828] dark:text-[#F9FAFB]">Book your sample collection</h2>
      </div>

      {error ? (
        <p className="text-sm font-medium mx-5 mt-4 rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
          {error}
        </p>
      ) : null}

      <div className="p-5 flex flex-col gap-3">
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8]">
          Your doctor prescribed these tests. Choose a home visit or a centre and pick a time that suits you.
        </p>
        {pending.map((o) => (
          <div key={o.id} className="rounded-xl border border-[#EAECF0] dark:border-[#374151]">
            <div className="flex items-center gap-3 p-4">
              <FlaskConical className="h-5 w-5 text-[#6A4FB0] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">
                  {o.items.map((it) => it.testName).join(", ") || "Lab tests"}
                </p>
                <p className="text-[11px] text-[#98A2B3] font-mono mt-0.5">{o.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-[#2E37A4] px-3 py-2 text-sm font-medium text-white"
              >
                {expanded === o.id ? "Close" : "Book"}
              </button>
            </div>
            {expanded === o.id ? (
              <div className="border-t border-[#EAECF0] dark:border-[#374151] p-4">
                <LabBookingPanel
                  order={o}
                  availabilityUrl="/api/patient/me/lab-orders/availability"
                  bookUrl={`/api/patient/me/lab-orders/${o.id}/book`}
                  onBooked={onBooked}
                  onCancel={() => setExpanded(null)}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientLabBooking;
