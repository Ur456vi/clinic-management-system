"use client";

/**
 * Patient Lab Management.
 *
 * Lists the patient's own lab orders (GET /api/patient/me/lab-results with
 * ?pending=1 so still-active orders show, not just finalized ones). The
 * patient gets each test done at a diagnostic centre, then uploads the PDF
 * report here — an "Active" order flips to "Completed" once a report lands.
 * Staff (reception) can also upload on the patient's behalf from the admin
 * patient chart.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  FlaskConical,
  UploadCloud,
  CheckCircle2,
  Clock,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

import LabReportModal from "@/components/patient/LabReportModal";

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
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Lab | null>(null);

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const counts = useMemo(() => {
    const list = labs ?? [];
    const done = list.filter(hasReport).length;
    return { total: list.length, done, active: list.length - done };
  }, [labs]);

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
          Tests ordered by your doctor. Upload the report PDF after you get a test done.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
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
        {labs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <FlaskConical className="h-8 w-8 mb-2 text-[#C9BFA6]" />
            <p className="text-sm text-[#6B7B73] dark:text-[#94A3B8]">No lab tests ordered yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#111827] text-xs text-[#667085] dark:text-[#94A3B8]">
                <th className="text-left font-semibold px-4 py-3">Test</th>
                <th className="text-left font-semibold px-4 py-3">Ordered On</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {labs.map((l) => {
                const done = hasReport(l);
                return (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#101828] dark:text-[#F9FAFB]">{l.panelName}</div>
                      {l.summary && l.summary !== l.panelName ? (
                        <div className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5">{l.summary}</div>
                      ) : null}
                      {l.labName ? <div className="text-xs text-[#98A2B3]">{l.labName}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-[#6B7B73] dark:text-[#94A3B8]">{fmtDate(l.collectedAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={done ? { background: "#E4F3EC", color: "#0E8C6A" } : { background: "#E5EEF9", color: "#2E5AAC" }}
                      >
                        {done ? "Completed" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {done ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void viewReport(l.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                              style={{ color: "#0E8C6A" }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => setActive(l)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:underline"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Replace
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActive(l)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                          >
                            <UploadCloud className="h-3.5 w-3.5" /> Upload report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {active ? (
        <LabReportModal
          labResultId={active.id}
          testName={active.panelName}
          hasReport={hasReport(active)}
          onClose={() => setActive(null)}
          onUploaded={() => {
            void load();
          }}
        />
      ) : null}
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
