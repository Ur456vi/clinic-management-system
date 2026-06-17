"use client";

/**
 * Patient lab-report modal — opened from the Lab Management page.
 *
 * The patient uploads the PDF they got from the diagnostic centre. Upload is
 * a single multipart POST to `/api/patient/me/lab-results/:id/report` (the
 * server validates ownership + PDF + size, stores it, and marks the order
 * completed). "View current report" mints a presigned download via GET on
 * the same route.
 */

import { useCallback, useState } from "react";
import { Loader2, UploadCloud, X, FileText, ExternalLink } from "lucide-react";

const MAX_BYTES = 25 * 1024 * 1024;

export default function LabReportModal({
  labResultId,
  testName,
  hasReport,
  onClose,
  onUploaded,
}: {
  labResultId: string;
  testName: string;
  hasReport: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewReport = useCallback(async () => {
    if (viewing) return;
    setViewing(true);
    setError(null);
    try {
      const res = await fetch(`/api/patient/me/lab-results/${labResultId}/report`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const url = json?.data?.downloadUrl;
      if (!url) throw new Error();
      window.open(url, "_blank", "noopener");
    } catch {
      setError("Couldn't open the report.");
    } finally {
      setViewing(false);
    }
  }, [labResultId, viewing]);

  const upload = useCallback(async () => {
    if (!file || busy) return;
    if (file.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large (max 25 MB).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/patient/me/lab-results/${labResultId}/report`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "Upload failed");
      }
      onUploaded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [file, busy, labResultId, onUploaded, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16,24,40,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">
              {hasReport ? "Replace report" : "Upload report"}
            </h3>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5 truncate">{testName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#98A2B3] hover:bg-gray-100 dark:hover:bg-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {hasReport ? (
          <button
            type="button"
            onClick={() => void viewReport()}
            disabled={viewing}
            className="self-start inline-flex items-center gap-2 text-sm font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline disabled:opacity-50"
          >
            {viewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            View current report
          </button>
        ) : null}

        <label
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 px-4 cursor-pointer text-center"
          style={{ borderColor: "#D0D5DD" }}
        >
          <UploadCloud className="h-7 w-7 text-[#98A2B3]" />
          {file ? (
            <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> {file.name}
            </span>
          ) : (
            <span className="text-sm text-[#667085] dark:text-[#94A3B8]">Click to choose a PDF (max 25 MB)</span>
          )}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        {error ? (
          <p className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-[#667085] dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void upload()}
            disabled={!file || busy}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-50"
            style={{ background: "#2E37A4" }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {hasReport ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
