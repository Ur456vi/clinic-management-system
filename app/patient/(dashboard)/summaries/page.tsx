"use client";

/**
 * Patient Clinical Summaries.
 *
 * Read-only view of the per-visit summary documents the doctor / RMO uploaded
 * for this patient (GET /api/patient/me/clinical-summaries). Each summary is a
 * dated entry holding one or more files; the patient can expand an entry to
 * view / download its files via short-lived presigned URLs. Patients cannot
 * add, edit, or delete here — that's an admin-side action.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  FileText,
  ExternalLink,
  ChevronDown,
  Calendar,
  ClipboardList,
} from "lucide-react";

type Summary = {
  id: string;
  title: string;
  summaryDate: string;
  notes: string | null;
  fileCount: number;
  createdAt: string;
};

type SummaryFile = {
  id: string;
  filename: string | null;
  attachmentMime: string | null;
  sizeBytes: number | null;
  uploadedAt: string;
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function PatientSummariesPage() {
  const [summaries, setSummaries] = useState<Summary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filesById, setFilesById] = useState<Record<string, SummaryFile[] | "loading">>({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/patient/me/clinical-summaries?limit=100", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSummaries(Array.isArray(json?.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summaries");
      setSummaries([]);
    }
  }, []);

  const loadFiles = useCallback(
    async (summaryId: string) => {
      setFilesById((prev) => ({ ...prev, [summaryId]: "loading" }));
      try {
        const res = await fetch(`/api/patient/me/clinical-summaries/${summaryId}/files`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setFilesById((prev) => ({
          ...prev,
          [summaryId]: Array.isArray(json?.data?.files) ? json.data.files : [],
        }));
      } catch {
        setFilesById((prev) => ({ ...prev, [summaryId]: [] }));
        setError("Couldn't load the files for that summary.");
      }
    },
    [],
  );

  const toggle = useCallback(
    (s: Summary) => {
      const next = openId === s.id ? null : s.id;
      setOpenId(next);
      if (next && filesById[s.id] === undefined && s.fileCount > 0) {
        void loadFiles(s.id);
      }
    },
    [openId, filesById, loadFiles],
  );

  const viewFile = useCallback(async (summaryId: string, fileId: string) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/patient/me/clinical-summaries/${summaryId}/files/${fileId}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const url = json?.data?.downloadUrl;
      if (!url) throw new Error();
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Couldn't open the file.");
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (summaries === null) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin mr-2 text-[#2E37A4]" />
        Loading summaries…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Clinical Summaries</h1>
        <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
          Visit summaries your doctor has shared with you. Tap a summary to view its documents.
        </p>
      </div>

      {error ? (
        <p className="text-sm font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
          {error}
        </p>
      ) : null}

      {summaries.length === 0 ? (
        <div className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] shadow-sm flex flex-col items-center justify-center py-14 text-center">
          <ClipboardList className="h-8 w-8 mb-2 text-[#C9BFA6]" />
          <p className="text-sm text-[#6B7B73] dark:text-[#94A3B8]">No clinical summaries shared yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {summaries.map((s) => {
            const isOpen = openId === s.id;
            const files = filesById[s.id];
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#1F2937] rounded-2xl border border-[#EAECF0] dark:border-[#374151] shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors"
                >
                  <span className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F1EEFB" }}>
                    <FileText className="h-4 w-4" style={{ color: "#6A4FB0" }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] truncate">{s.title}</p>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8] inline-flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3 w-3" /> {fmtDate(s.summaryDate)}
                      <span className="text-[#C9BFA6]">•</span>
                      {s.fileCount} file{s.fileCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#98A2B3] flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen ? (
                  <div className="border-t border-[#EAECF0] dark:border-[#374151] px-4 py-3 flex flex-col gap-2">
                    {s.notes ? (
                      <p className="text-xs text-[#475467] dark:text-[#CBD5E1] whitespace-pre-wrap">{s.notes}</p>
                    ) : null}

                    {files === "loading" ? (
                      <div className="flex items-center py-3 text-sm text-[#667085] dark:text-[#94A3B8]">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading files…
                      </div>
                    ) : !files || files.length === 0 ? (
                      <p className="text-sm text-[#98A2B3] py-2">No documents on this summary.</p>
                    ) : (
                      files.map((f, i) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 rounded-xl border border-[#EAECF0] dark:border-[#374151] px-3 py-2.5"
                        >
                          <FileText className="h-5 w-5 text-[#6A4FB0] flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">
                              {f.filename || `Document ${files.length - i}`}
                            </p>
                            <p className="text-xs text-[#98A2B3]">
                              {fmtDate(f.uploadedAt)}
                              {fmtSize(f.sizeBytes) ? ` · ${fmtSize(f.sizeBytes)}` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void viewFile(s.id, f.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                            style={{ color: "#6A4FB0" }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View
                          </button>
                        </div>
                      ))
                    )}
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
