"use client"

/**
 * Lab report manager — opened from the three-dots action on a row in the
 * patient's Labs & Diagnostics tab.
 *
 * A test can hold MULTIPLE report files. This modal lists every file, lets
 * staff/reception add more (multi-select, PDF, 25 MB each via the presigned
 * BE-19 flow), view any one, and delete individual files.
 *
 *   - list   GET    /api/lab-results/:id/attachments
 *   - add    POST   /api/files/upload-url → PUT <s3> → PUT /api/lab-results/:id/attachment
 *   - view   GET    /api/lab-results/:id/attachments/:fileId
 *   - delete DELETE /api/lab-results/:id/attachments/:fileId
 */

import { useCallback, useEffect, useState } from "react"
import {
  Loader2,
  UploadCloud,
  X,
  FileText,
  ExternalLink,
  Trash2,
} from "lucide-react"

import { notify } from "@/lib/notify"

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches the storage service cap.

type ReportFile = {
  id: string
  filename: string | null
  attachmentMime: string | null
  sizeBytes: number | null
  uploadedAt: string
}

function fmtDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}
function fmtSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return ""
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function LabReportUploadModal({
  labResultId,
  labName,
  onClose,
  onUploaded,
}: {
  labResultId: string
  labName: string
  /** Unused — kept for call-site compatibility. */
  hasReport?: boolean
  onClose: () => void
  onUploaded: () => void
}) {
  const [files, setFiles] = useState<ReportFile[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/lab-results/${labResultId}/attachments`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setFiles(Array.isArray(json?.data?.files) ? json.data.files : [])
    } catch {
      notify.error("Couldn't load report files")
      setFiles([])
    }
  }, [labResultId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const uploadOne = useCallback(
    async (file: File) => {
      // 1. Presigned URL.
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
      if (!urlRes.ok) throw new Error(urlJson?.error?.message ?? "Couldn't start the upload")
      const { url, key, requiredHeaders } = urlJson.data as {
        url: string
        key: string
        requiredHeaders?: Record<string, string>
      }

      // 2. Bytes straight to storage.
      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": requiredHeaders?.["content-type"] ?? "application/pdf" },
        body: file,
      })
      if (!put.ok) throw new Error("Upload to storage failed")

      // 3. Link the object to the lab result (appends a file).
      const attach = await fetch(`/api/lab-results/${labResultId}/attachment`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          contentType: "application/pdf",
          sizeBytes: file.size,
          filename: file.name,
        }),
      })
      if (!attach.ok) {
        const j = await attach.json().catch(() => null)
        throw new Error(j?.error?.message ?? "Couldn't link the report")
      }
    },
    [labResultId],
  )

  const onPick = useCallback(
    async (picked: FileList | null) => {
      const list = picked ? Array.from(picked) : []
      if (list.length === 0 || uploading) return
      setUploading(true)
      let ok = 0
      let failures = 0
      for (const f of list) {
        if (f.type !== "application/pdf" || f.size > MAX_BYTES) {
          failures++
          continue
        }
        try {
          await uploadOne(f)
          ok++
        } catch {
          failures++
        }
      }
      setUploading(false)
      if (ok > 0) notify.success(`${ok} file${ok === 1 ? "" : "s"} uploaded`)
      if (failures > 0) {
        notify.error(`${failures} file${failures === 1 ? "" : "s"} failed`, {
          description: "PDF only, max 25 MB each.",
        })
      }
      await load()
      onUploaded()
    },
    [uploading, uploadOne, load, onUploaded],
  )

  const viewFile = useCallback(
    async (fileId: string) => {
      try {
        const res = await fetch(`/api/lab-results/${labResultId}/attachments/${fileId}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error()
        const json = await res.json()
        const url = json?.data?.downloadUrl
        if (!url) throw new Error()
        window.open(url, "_blank", "noopener")
      } catch {
        notify.error("Couldn't open the file")
      }
    },
    [labResultId],
  )

  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!window.confirm("Delete this report file? This cannot be undone.")) return
      setBusyId(fileId)
      try {
        const res = await fetch(`/api/lab-results/${labResultId}/attachments/${fileId}`, {
          method: "DELETE",
          credentials: "include",
        })
        if (!res.ok && res.status !== 204) throw new Error()
        await load()
        onUploaded()
      } catch {
        notify.error("Couldn't delete the file")
      } finally {
        setBusyId(null)
      }
    },
    [labResultId, load, onUploaded],
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16,24,40,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">Reports</h3>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5 truncate">{labName}</p>
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

        <div className="flex flex-col gap-2 overflow-y-auto">
          {files === null ? (
            <div className="flex items-center justify-center py-6 text-sm text-[#667085] dark:text-[#94A3B8]">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-[#667085] dark:text-[#94A3B8] text-center py-4">
              No report files yet. Add the PDF(s) below.
            </p>
          ) : (
            files.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-[#EAECF0] dark:border-[#374151] px-3 py-2.5"
              >
                <FileText className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">
                    {f.filename || `Report ${files.length - i}`}
                  </p>
                  <p className="text-xs text-[#98A2B3]">
                    {fmtDate(f.uploadedAt)}
                    {fmtSize(f.sizeBytes) ? ` · ${fmtSize(f.sizeBytes)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void viewFile(f.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E37A4] dark:text-[#A5B4FC] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View
                </button>
                <button
                  type="button"
                  onClick={() => void deleteFile(f.id)}
                  disabled={busyId === f.id}
                  aria-label="Delete file"
                  className="p-1 rounded-md text-[#B42318] hover:bg-[#FEF3F2] disabled:opacity-50"
                >
                  {busyId === f.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        <label
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 px-4 cursor-pointer text-center"
          style={{ borderColor: "#D9D2C2" }}
        >
          {uploading ? (
            <span className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] inline-flex items-center gap-1.5">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </span>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-[#98A2B3]" />
              <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
                Click to add PDF(s) — you can select several (max 25 MB each)
              </span>
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void onPick(e.target.files)
              e.target.value = ""
            }}
          />
        </label>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#2E37A4" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
