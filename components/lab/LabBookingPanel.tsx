"use client";

/**
 * Shared lab-order booking panel — used by BOTH entry points:
 *   - Option 1: reception, from /admin/lab-scheduling
 *   - Option 2: the patient, from /patient/lab-management
 *
 * The only difference between the two is the URLs passed in (`availabilityUrl`,
 * `bookUrl`) and whether a centre list is provided. The panel:
 *   1. Fetches slots from the partner's existing getAvailableSlots (pincode +
 *      preferred date/time).
 *   2. Lets the user pick a returned slot — or enter one manually, since the
 *      exact getAvailableSlots response shape is still being confirmed with the
 *      partner (open item), so we never hard-depend on it.
 *   3. Books via the partner's existing bookFullAppointment / EnquiryCenterAppointment.
 */

import { useCallback, useMemo, useState } from "react";
import { Loader2, CalendarClock, Home, Building2 } from "lucide-react";

export type BookableOrder = {
  id: string;
  orderNumber: string;
  collectionMode: "HOME" | "CENTER";
  centerCode: string | null;
  items: { testName: string }[];
};

type Center = { centerCode: string; name: string };

type Slot = {
  startTime: string;
  endTime: string;
  serviceTerritoryId?: string;
  serviceMemberId?: string;
  label: string;
};

type Props = {
  order: BookableOrder;
  availabilityUrl: string;
  bookUrl: string;
  centers?: Center[];
  defaultPincode?: string;
  onBooked: () => void;
  onCancel: () => void;
};

const input =
  "w-full rounded-lg border border-[#D0D5DD] dark:border-[#3A4658] bg-white dark:bg-[#111827] px-3 py-2 text-sm text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/40";
const label = "text-xs font-semibold text-[#475467] dark:text-[#94A3B8] mb-1 block";

/** "YYYY-MM-DDTHH:mm" (datetime-local) → "YYYY-MM-DD HH:mm:00" (partner format). */
function toPartnerTime(local: string): string {
  if (!local) return "";
  const [d, t] = local.split("T");
  return `${d} ${(t ?? "00:00").slice(0, 5)}:00`;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function slotLabel(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${startIso} — ${endIso}`;
  const opts: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" };
  const day = s.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" });
  return `${day} · ${s.toLocaleTimeString("en-GB", opts)}–${e.toLocaleTimeString("en-GB", opts)} IST`;
}

function makeSlot(o: Record<string, unknown>, territoryId?: string, memberId?: string): Slot | null {
  const start = str(o.startTime) ?? str(o.StartTime) ?? str(o.start) ?? str(o.from);
  const end = str(o.endTime) ?? str(o.EndTime) ?? str(o.end) ?? str(o.to);
  if (!start || !end) return null;
  return {
    startTime: start,
    endTime: end,
    serviceTerritoryId: territoryId ?? str(o.serviceTerritoryId) ?? str(o.ServiceTerritoryId),
    serviceMemberId: memberId ?? str(o.serviceMemberId) ?? str(o.serviceMenberId) ?? str(o.ServiceMemberId),
    label: slotLabel(start, end),
  };
}

/**
 * Pull a slot list out of the partner's response. Mahajan returns:
 *   { serviceTerritory:{id}, members:[{serviceMemberId, availableSlots:[{startTime,endTime}]}] }
 * with each member carrying its own slots. We also keep a flat-array fallback.
 */
function parseSlots(raw: unknown): Slot[] {
  const out: Slot[] = [];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    const territory = r.serviceTerritory as Record<string, unknown> | undefined;
    const territoryId = territory ? str(territory.id) ?? str(territory.serviceTerritoryId) : undefined;
    const members = r.members;
    if (Array.isArray(members)) {
      for (const m of members) {
        if (!m || typeof m !== "object") continue;
        const mo = m as Record<string, unknown>;
        const memberId = str(mo.serviceMemberId) ?? str(mo.serviceMenberId);
        const slots = mo.availableSlots;
        if (Array.isArray(slots)) {
          for (const s of slots) {
            if (s && typeof s === "object") {
              const slot = makeSlot(s as Record<string, unknown>, territoryId, memberId);
              if (slot) out.push(slot);
            }
          }
        }
      }
      if (out.length) return out;
    }
  }
  // Fallback: a flat array under a common key.
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (raw && typeof raw === "object") {
    for (const k of ["slots", "availableSlots", "data", "result", "records"]) {
      const v = (raw as Record<string, unknown>)[k];
      if (Array.isArray(v)) {
        arr = v;
        break;
      }
    }
  }
  for (const s of arr) {
    if (s && typeof s === "object") {
      const slot = makeSlot(s as Record<string, unknown>);
      if (slot) out.push(slot);
    }
  }
  return out;
}

export function LabBookingPanel({
  order,
  availabilityUrl,
  bookUrl,
  centers,
  defaultPincode,
  onBooked,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<"HOME" | "CENTER">(order.collectionMode);
  const [centerCode, setCenterCode] = useState<string>(order.centerCode ?? "");
  const [pincode, setPincode] = useState<string>(defaultPincode ?? "");
  const [preferred, setPreferred] = useState<string>("");

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [manualStart, setManualStart] = useState<string>("");
  const [manualEnd, setManualEnd] = useState<string>("");

  const [finding, setFinding] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findSlots = useCallback(async () => {
    setError(null);
    setSlots(null);
    setChosen(null);
    if (!pincode || !preferred) {
      setError("Enter a pincode and a preferred date/time first.");
      return;
    }
    setFinding(true);
    try {
      const res = await fetch(availabilityUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode, preferredDateTime: toPartnerTime(preferred) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      setSlots(parseSlots(json?.data?.slots));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't fetch slots.");
    } finally {
      setFinding(false);
    }
  }, [availabilityUrl, pincode, preferred]);

  const effectiveSlot: Slot | null = useMemo(() => {
    if (chosen) return chosen;
    if (manualStart && manualEnd) {
      const s = toPartnerTime(manualStart);
      const e = toPartnerTime(manualEnd);
      return { startTime: s, endTime: e, label: `${s} — ${e}` };
    }
    return null;
  }, [chosen, manualStart, manualEnd]);

  const book = useCallback(async () => {
    setError(null);
    if (mode === "CENTER" && !centerCode) {
      setError("Select a centre for centre collection.");
      return;
    }
    if (!effectiveSlot) {
      setError("Pick a slot, or enter a start and end time.");
      return;
    }
    setBooking(true);
    try {
      const res = await fetch(bookUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionMode: mode,
          centerCode: mode === "CENTER" ? centerCode : null,
          slot: {
            startTime: effectiveSlot.startTime,
            endTime: effectiveSlot.endTime,
            serviceTerritoryId: effectiveSlot.serviceTerritoryId,
            serviceMemberId: effectiveSlot.serviceMemberId,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      onBooked();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setBooking(false);
    }
  }, [bookUrl, mode, centerCode, effectiveSlot, onBooked]);

  return (
    <div className="rounded-xl border border-[#EAECF0] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#111827] p-4 flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("HOME")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
            mode === "HOME"
              ? "border-[#2E37A4] bg-[#2E37A4]/5 text-[#2E37A4] dark:text-[#A5B4FC]"
              : "border-[#D0D5DD] dark:border-[#3A4658] text-[#475467] dark:text-[#94A3B8]"
          }`}
        >
          <Home className="h-4 w-4" /> Home collection
        </button>
        <button
          type="button"
          onClick={() => setMode("CENTER")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
            mode === "CENTER"
              ? "border-[#2E37A4] bg-[#2E37A4]/5 text-[#2E37A4] dark:text-[#A5B4FC]"
              : "border-[#D0D5DD] dark:border-[#3A4658] text-[#475467] dark:text-[#94A3B8]"
          }`}
        >
          <Building2 className="h-4 w-4" /> At a centre
        </button>
      </div>

      {mode === "CENTER" ? (
        <div>
          <label className={label}>Centre</label>
          {centers && centers.length > 0 ? (
            <select className={input} value={centerCode} onChange={(e) => setCenterCode(e.target.value)}>
              <option value="">Select a centre…</option>
              {centers.map((c) => (
                <option key={c.centerCode} value={c.centerCode}>
                  {c.name} ({c.centerCode})
                </option>
              ))}
            </select>
          ) : (
            <input
              className={input}
              value={centerCode}
              onChange={(e) => setCenterCode(e.target.value)}
              placeholder="Centre ID"
            />
          )}
        </div>
      ) : null}

      {/* Slot search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label}>Pincode</label>
          <input className={input} value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 110030" inputMode="numeric" />
        </div>
        <div>
          <label className={label}>Preferred date &amp; time</label>
          <input className={input} type="datetime-local" value={preferred} onChange={(e) => setPreferred(e.target.value)} />
        </div>
      </div>

      <button
        type="button"
        onClick={findSlots}
        disabled={finding}
        className="self-start inline-flex items-center gap-2 rounded-lg bg-[#2E37A4] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {finding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
        Find slots
      </button>

      {/* Slots */}
      {slots !== null ? (
        slots.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className={label}>Available slots</span>
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
              {slots.map((s, i) => (
                <label
                  key={i}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                    chosen === s ? "border-[#2E37A4] bg-[#2E37A4]/5" : "border-[#EAECF0] dark:border-[#374151]"
                  }`}
                >
                  <input type="radio" name="slot" checked={chosen === s} onChange={() => setChosen(s)} />
                  <span className="text-[#101828] dark:text-[#F9FAFB] font-mono text-xs">{s.label}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#B4791E]">
            No slots returned for that pincode/time. Enter a time manually below, or try another time.
          </p>
        )
      ) : null}

      {/* Manual fallback */}
      <details className="text-sm">
        <summary className="cursor-pointer text-[#475467] dark:text-[#94A3B8]">Enter a time manually</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div>
            <label className={label}>Start</label>
            <input className={input} type="datetime-local" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
          </div>
          <div>
            <label className={label}>End</label>
            <input className={input} type="datetime-local" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
          </div>
        </div>
      </details>

      {error ? (
        <p className="text-sm font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm text-[#475467] dark:text-[#94A3B8]">
          Cancel
        </button>
        <button
          type="button"
          onClick={book}
          disabled={booking}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0E8C6A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Confirm booking
        </button>
      </div>
    </div>
  );
}

export default LabBookingPanel;
