"use client";

/**
 * Patient Lab Management.
 *
 * Reports reach a patient by two independent routes, and this page shows both
 * as one list because the distinction is ours, not theirs:
 *
 *   - staff-uploaded PDFs on `lab_results`, fetched as a short-lived presigned
 *     link from our own storage, and
 *   - reports the partner lab sends us for a `lab_order`, which arrive as a
 *     link on the partner's host.
 *
 * READ-ONLY either way: patients view reports, never upload or remove them.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  FlaskConical,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";

import { PatientLabBooking } from "@/components/patient/PatientLabBooking";

/** One of the patient's partner-lab orders, reported or still in progress. */
type PartnerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  reportStatus: string | null;
  labNumber: string | null;
  updatedAt: string;
  createdAt: string;
  hasReport: boolean;
  testNames: string[];
};

/** Plain-English status for a partner order that has no report yet. */
function pendingLabel(status: string): string {
  if (status === "PENDING_SCHEDULE") return "Awaiting booking";
  if (status === "SCHEDULED") return "Scheduled";
  if (status === "IN_PROGRESS") return "Sample collected";
  if (status === "CANNOT_COMPLETE") return "Could not complete";
  if (status === "CANCELLED") return "Cancelled";
  return "Active";
}

/** One row of the merged list, whichever route the report arrived by. */
type Row = {
  id: string;
  title: string;
  subtitle: string | null;
  meta: string | null;
  date: string;
  done: boolean;
  /** Partial results are real but not final — the row must not read as done. */
  partial: boolean;
  open: (() => void) | null;
};

type Lab = {
  id: string;
  panelName: string;
  summary: string | null;
  collectedAt: string;
  reportedAt: string | null;
  labName: string | null;
  attachmentKey: string | null;
  attachmentUploadedAt: string | null;
  orderingDoctor: { id: string; fullName: string } | null;
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function hasReport(l: Lab): boolean {
  return !!l.attachmentKey || !!l.reportedAt;
}

export default function PatientLabManagementPage() {
  const [labs, setLabs] = useState<Lab[] | null>(null);
  const [partner, setPartner] = useState<PartnerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/patient/me/lab-results?pending=1&limit=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setLabs(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lab orders");
      setLabs([]);
    }
  }, []);

  /**
   * Partner-lab orders, pending ones included — a test the partner fulfils has
   * no other record until its report lands, so omitting pending orders would
   * hide it from the patient for the entire time it is being done.
   *
   * A failure here must not empty the page: the staff-uploaded list is the
   * older, established route and should still render on its own.
   */
  const loadPartner = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/me/lab-orders/summary", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setPartner(Array.isArray(json?.data?.orders) ? json.data.orders : []);
    } catch {
      setPartner([]);
    }
  }, []);

  const viewReport = useCallback(async (labId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/patient/me/lab-results/${labId}/report`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const url = json?.data?.downloadUrl;
      if (!url) throw new Error();
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Couldn't open the report.");
    }
  }, []);

  const viewPartnerReport = useCallback(async (orderId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/patient/me/lab-orders/${orderId}/report`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const url = json?.data?.reportUrl;
      if (!url) throw new Error();
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Couldn't open the report.");
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
    void loadPartner();
  }, [load, loadPartner]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rows = useMemo((): Row[] => {
    const fromLabs: Row[] = (labs ?? []).map((l) => ({
      id: `lab-${l.id}`,
      title: l.panelName,
      subtitle: l.summary && l.summary !== l.panelName ? l.summary : null,
      meta: l.labName,
      date: l.collectedAt,
      done: hasReport(l),
      partial: false,
      open: hasReport(l) ? () => void viewReport(l.id) : null,
    }));

    const fromPartner: Row[] = partner.map((o) => {
      const partial = !!o.reportStatus && /partial/i.test(o.reportStatus);
      return {
        id: `order-${o.id}`,
        title: o.testNames.join(", ") || o.orderNumber,
        subtitle: o.hasReport ? null : pendingLabel(o.status),
        meta: o.labNumber ? `Lab no. ${o.labNumber}` : null,
        // Sort a pending order by when it was ordered, a finished one by when
        // the report landed — each is the date the patient cares about.
        date: o.hasReport ? o.updatedAt : o.createdAt,
        done: o.hasReport,
        partial: partial && o.hasReport,
        open: o.hasReport ? () => void viewPartnerReport(o.id) : null,
      };
    });

    return [...fromPartner, ...fromLabs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [labs, partner, viewReport, viewPartnerReport]);

  const counts = useMemo(() => {
    const done = rows.filter((r) => r.done).length;
    return { total: rows.length, done, active: rows.length - done };
  }, [rows]);

  if (labs === null) {
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
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Lab Management</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Tests ordered by your doctor. View your report once it has been uploaded by the clinic.
        </p>
      </div>

      {/* Self-booking of prescribed tests still needing a slot (option 2) */}
      <PatientLabBooking
        onChange={() => {
          void load();
          void loadPartner();
        }}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi icon={FlaskConical} label="Total tests" value={counts.total} fg="#6A4FB0" bg="#F1EEFB" />
        <Kpi icon={Clock} label="Awaiting report" value={counts.active} fg="#2E5AAC" bg="#E5EEF9" />
        <Kpi icon={CheckCircle2} label="Completed" value={counts.done} fg="#0E8C6A" bg="#E4F3EC" />
      </div>

      {error ? (
        <p className="text-sm font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
          {error}
        </p>
      ) : null}

      <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <FlaskConical className="h-8 w-8 mb-2 text-[#C9BFA6]" />
            <p className="text-sm text-[#6B7B73] dark:text-[#94A3B8]">No lab tests ordered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-[#F9FAFB] dark:bg-[#111827] text-xs text-[#667085] dark:text-[#94A3B8]">
                  <th className="text-left font-semibold px-4 py-3">Test</th>
                  <th className="text-left font-semibold px-4 py-3">Ordered On</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-right font-semibold px-4 py-3">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#101828] dark:text-[#F9FAFB]">{r.title}</div>
                      {r.subtitle ? (
                        <div className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5 whitespace-normal">{r.subtitle}</div>
                      ) : null}
                      {r.meta ? <div className="text-xs text-[#98A2B3]">{r.meta}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-[#6B7B73] dark:text-[#94A3B8] whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={
                          r.partial
                            ? { background: "#FEF0E6", color: "#B4651B" }
                            : r.done
                              ? { background: "#E4F3EC", color: "#0E8C6A" }
                              : { background: "#E5EEF9", color: "#2E5AAC" }
                        }
                      >
                        {r.partial ? "Partial" : r.done ? "Completed" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        {r.open ? (
                          <button
                            type="button"
                            onClick={r.open}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                            style={{ color: r.partial ? "#B4651B" : "#0E8C6A" }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {r.partial ? "View partial" : "View"}
                          </button>
                        ) : (
                          <span className="text-xs text-[#98A2B3]">Awaiting report</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  fg,
  bg,
}: {
  icon: typeof FlaskConical;
  label: string;
  value: number;
  fg: string;
  bg: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] p-4 flex items-center gap-3">
      <span className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon className="h-4 w-4" style={{ color: fg }} />
      </span>
      <div>
        <div className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">{value}</div>
        <div className="text-xs text-[#667085] dark:text-[#94A3B8]">{label}</div>
      </div>
    </div>
  );
}
