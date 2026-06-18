"use client"

/**
 * Lab report upload modal — opened from the three-dots action on a row in
 * the patient's Labs & Diagnostics tab.
 *
 * Flow (reuses the BE-19/BE-20 presigned-upload plumbing):
 *   1. POST /api/files/upload-url        → presigned PUT URL + object key
 *   2. PUT  <presigned url>              → bytes go straight to object storage
 *   3. PUT  /api/lab-results/:id/attachment → links the key to the row and
 *                                          stamps reportedAt server-side, so
 *                                          the row flips from "Active" to
 *                                          "Completed" and becomes visible in
 *                                          the patient portal in one call
 *                                          (also what lets RECEPTION upload).
 */

import { useCallback, useState } from "react"
import { Loader2, UploadCloud, X, FileText, ExternalLink } from "lucide-react"

import { notify } from "@/lib/notify"

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches the storage service cap.

export default function LabReportUploadModal({
  labResultId,
  labName,
  hasReport,
  onClose,
  onUploaded,
}: {
  labResultId: string
  labName: string
  hasReport: boolean
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [viewing, setViewing] = useState(false)

  const viewReport = useCallback(async () => {
    if (viewing) return
    setViewing(true)
    try {
      const res = await fetch(`/api/lab-results/${labResultId}/attachment`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      const url = json?.data?.downloadUrl ?? json?.data?.url
      if (!url) throw new Error()
      window.open(url, "_blank", "noopener")
    } catch {
      notify.error("Couldn't open the report")
    } finally {
      setViewing(false)
    }
  }, [labResultId, viewing])

  const upload = useCallback(async () => {
    if (!file || busy) return
    if (file.type !== "application/pdf") {
      notify.error("Please choose a PDF file")
      return
    }
    if (file.size > MAX_BYTES) {
      notify.error("File too large (max 25 MB)")
      return
    }
    setBusy(true)
    try {
      // 1. Ask for a presigned upload URL.
      const urlRes = await fetch("/api/files/upload-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: "phi",
          contentType: "application/pdf",
          contentLength: file.size,
          suggestedFilename: file.name,
        }),
      })
      const urlJson = await urlRes.json().catch(() => null)
      if (!urlRes.ok) {
        throw new Error(urlJson?.error?.message ?? "Couldn't start the upload")
      }
      const { url, key, requiredHeaders } = urlJson.data as {
        url: string
        key: string
        requiredHeaders?: Record<string, string>
      }

      // 2. Upload the bytes straight to storage. The browser sets
      //    Content-Length itself; we only echo the pinned content-type.
      const put = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": requiredHeaders?.["content-type"] ?? "application/pdf",
        },
        body: file,
      })
      if (!put.ok) throw new Error("Upload to storage failed")

      // 3. Link the uploaded object to the lab result. The server stamps
      //    reportedAt on first attach, flipping the row to "Completed".
      const attach = await fetch(`/api/lab-results/${labResultId}/attachment`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          contentType: "application/pdf",
          sizeBytes: file.size,
        }),
      })
      if (!attach.ok) {
        const j = await attach.json().catch(() => null)
        throw new Error(j?.error?.message ?? "Couldn't link the report")
      }

      notify.success("Report uploaded")
      onUploaded()
      onClose()
    } catch (err) {
      notify.error("Upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setBusy(false)
    }
  }, [file, busy, labResultId, onUploaded, onClose])

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
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5 truncate">
              {labName}
            </p>
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
            {viewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            View current report
          </button>
        ) : null}

        <label
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 px-4 cursor-pointer text-center"
          style={{ borderColor: "#D9D2C2" }}
        >
          <UploadCloud className="h-7 w-7 text-[#98A2B3]" />
          {file ? (
            <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> {file.name}
            </span>
          ) : (
            <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
              Click to choose a PDF (max 25 MB)
            </span>
          )}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

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
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            {hasReport ? "Replace" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}
