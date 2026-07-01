"use client"

/**
 * Clinical summary manager — opened from the patient's "Summaries" tab.
 *
 * Two modes, one component:
 *   - CREATE (no `summary` prop): collect a title + date + optional notes and
 *     a set of files, then POST the summary and upload+attach each file.
 *   - MANAGE (`summary` prop set): list the existing files, add more, view, or
 *     delete individual files.
 *
 * Files (PDF / image / Word doc, 25 MB each) go straight to the private `phi`
 * S3 bucket via the presigned-PUT flow, then are linked to the summary:
 *   - presign  POST   /api/files/upload-url
 *   - upload   PUT    <s3 presigned url>
 *   - link     POST   /api/clinical-summaries/:id/files
 *   - list     GET    /api/clinical-summaries/:id/files
 *   - view     GET    /api/clinical-summaries/:id/files/:fileId
 *   - delete   DELETE /api/clinical-summaries/:id/files/:fileId
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
import FilePreviewModal from "@/components/shared/FilePreviewModal"

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches the storage service cap.

/** MIME types the storage allow-list accepts for a summary document. */
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])
const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/** Resolve an upload content-type, falling back to the extension when the
 *  browser doesn't report a usable MIME (common for .doc/.docx). */
function resolveContentType(file: File): string | null {
  if (ALLOWED_MIME.has(file.type)) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return EXT_TO_MIME[ext] ?? null
}

type SummaryFile = {
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
function todayInputValue(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** presign → PUT → link. Throws on any step so the caller can count failures. */
async function uploadAndAttach(summaryId: string, file: File): Promise<void> {
  const contentType = resolveContentType(file)
  if (!contentType) throw new Error("Unsupported file type")

  const urlRes = await fetch("/api/files/upload-url", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket: "phi",
      contentType,
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

  const put = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": requiredHeaders?.["content-type"] ?? contentType },
    body: file,
  })
  if (!put.ok) throw new Error("Upload to storage failed")

  const attach = await fetch(`/api/clinical-summaries/${summaryId}/files`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key,
      contentType,
      sizeBytes: file.size,
      filename: file.name,
    }),
  })
  if (!attach.ok) {
    const j = await attach.json().catch(() => null)
    throw new Error(j?.error?.message ?? "Couldn't link the file")
  }
}

/** Upload a batch, surfacing aggregate success/failure toasts. */
async function uploadBatch(summaryId: string, list: File[]): Promise<number> {
  let ok = 0
  let failures = 0
  for (const f of list) {
    if (!resolveContentType(f) || f.size > MAX_BYTES) {
      failures++
      continue
    }
    try {
      await uploadAndAttach(summaryId, f)
      ok++
    } catch {
      failures++
    }
  }
  if (ok > 0) notify.success(`${ok} file${ok === 1 ? "" : "s"} uploaded`)
  if (failures > 0) {
    notify.error(`${failures} file${failures === 1 ? "" : "s"} failed`, {
      description: "PDF, image or Word doc · max 25 MB each.",
    })
  }
  return ok
}

export default function ClinicalSummaryModal({
  patientId,
  summary,
  onClose,
  onChanged,
}: {
  patientId: string
  /** When set, opens in MANAGE mode for an existing summary. */
  summary?: { id: string; title: string } | null
  onClose: () => void
  onChanged: () => void
}) {
  const isManage = !!summary

  // ── Create-mode form state ───────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(todayInputValue())
  const [notes, setNotes] = useState("")
  const [picked, setPicked] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  // ── Manage-mode state ────────────────────────────────────────────────
  const [files, setFiles] = useState<SummaryFile[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; filename: string | null; mime: string | null } | null>(null)

  const load = useCallback(async () => {
    if (!summary) return
    try {
      const res = await fetch(`/api/clinical-summaries/${summary.id}/files`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setFiles(Array.isArray(json?.data?.files) ? json.data.files : [])
    } catch {
      notify.error("Couldn't load summary files")
      setFiles([])
    }
  }, [summary])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isManage) void load()
  }, [isManage, load])
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Create: pick files (held locally until Save) ─────────────────────
  const addPicked = useCallback((list: FileList | null) => {
    const arr = list ? Array.from(list) : []
    if (arr.length === 0) return
    setPicked((prev) => [...prev, ...arr])
  }, [])

  const createSummary = useCallback(async () => {
    if (saving) return
    if (!title.trim()) {
      notify.error("Add a title for the summary")
      return
    }
    if (!date) {
      notify.error("Pick a date")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/clinical-summaries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          title: title.trim(),
          summaryDate: new Date(`${date}T00:00:00`).toISOString(),
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't create the summary")
      const summaryId = json?.data?.id as string
      if (picked.length > 0 && summaryId) {
        await uploadBatch(summaryId, picked)
      } else {
        notify.success("Summary added")
      }
      onChanged()
      onClose()
    } catch (err) {
      notify.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }, [saving, title, date, notes, picked, patientId, onChanged, onClose])

  // ── Manage: add more files to an existing summary ────────────────────
  const onAddToExisting = useCallback(
    async (list: FileList | null) => {
      if (!summary) return
      const arr = list ? Array.from(list) : []
      if (arr.length === 0 || uploading) return
      setUploading(true)
      await uploadBatch(summary.id, arr)
      setUploading(false)
      await load()
      onChanged()
    },
    [summary, uploading, load, onChanged],
  )

  const viewFile = useCallback(
    async (file: SummaryFile) => {
      if (!summary) return
      try {
        const res = await fetch(`/api/clinical-summaries/${summary.id}/files/${file.id}`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error()
        const json = await res.json()
        const url = json?.data?.downloadUrl
        if (!url) throw new Error()
        setPreview({ url, filename: file.filename, mime: file.attachmentMime })
      } catch {
        notify.error("Couldn't open the file")
      }
    },
    [summary],
  )

  const deleteFile = useCallback(
    async (fileId: string) => {
      if (!summary) return
      if (!window.confirm("Delete this file? This cannot be undone.")) return
      setBusyId(fileId)
      try {
        const res = await fetch(`/api/clinical-summaries/${summary.id}/files/${fileId}`, {
          method: "DELETE",
          credentials: "include",
        })
        if (!res.ok && res.status !== 204) throw new Error()
        await load()
        onChanged()
      } catch {
        notify.error("Couldn't delete the file")
      } finally {
        setBusyId(null)
      }
    },
    [summary, load, onChanged],
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(16,24,40,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1F2937] rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">
              {isManage ? "Summary files" : "New clinical summary"}
            </h3>
            {isManage ? (
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5 truncate">{summary?.title}</p>
            ) : null}
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

        {!isManage ? (
          // ── CREATE MODE ────────────────────────────────────────────
          <>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Follow-up visit summary"
                className="h-10 px-3 rounded-lg border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm outline-none focus:border-[#1F3D33]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm outline-none focus:border-[#1F3D33]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional context shown with the files"
                className="px-3 py-2 rounded-lg border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm outline-none focus:border-[#1F3D33] resize-none"
              />
            </label>

            {picked.length > 0 ? (
              <div className="flex flex-col gap-2">
                {picked.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 rounded-xl border border-[#EAECF0] dark:border-[#374151] px-3 py-2.5"
                  >
                    <FileText className="h-5 w-5 text-[#1F3D33] dark:text-[#A5B4FC] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">{f.name}</p>
                      <p className="text-xs text-[#98A2B3]">{fmtSize(f.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPicked((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove file"
                      className="p-1 rounded-md text-[#B42318] hover:bg-[#FEF3F2]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <label
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 px-4 cursor-pointer text-center"
              style={{ borderColor: "#D9D2C2" }}
            >
              <UploadCloud className="h-6 w-6 text-[#98A2B3]" />
              <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
                Click to add files — PDF, image or Word doc (max 25 MB each)
              </span>
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  addPicked(e.target.files)
                  e.target.value = ""
                }}
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-[#475467] dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#111827]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createSummary()}
                disabled={saving}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-60"
                style={{ background: "#1F3D33" }}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save summary
              </button>
            </div>
          </>
        ) : (
          // ── MANAGE MODE ────────────────────────────────────────────
          <>
            <div className="flex flex-col gap-2">
              {files === null ? (
                <div className="flex items-center justify-center py-6 text-sm text-[#667085] dark:text-[#94A3B8]">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
                </div>
              ) : files.length === 0 ? (
                <p className="text-sm text-[#667085] dark:text-[#94A3B8] text-center py-4">
                  No files yet. Add them below.
                </p>
              ) : (
                files.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 rounded-xl border border-[#EAECF0] dark:border-[#374151] px-3 py-2.5"
                  >
                    <FileText className="h-5 w-5 text-[#1F3D33] dark:text-[#A5B4FC] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">
                        {f.filename || `File ${files.length - i}`}
                      </p>
                      <p className="text-xs text-[#98A2B3]">
                        {fmtDate(f.uploadedAt)}
                        {fmtSize(f.sizeBytes) ? ` · ${fmtSize(f.sizeBytes)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void viewFile(f)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3D33] dark:text-[#A5B4FC] hover:underline"
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
                    Click to add files — PDF, image or Word doc (max 25 MB each)
                  </span>
                </>
              )}
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void onAddToExisting(e.target.files)
                  e.target.value = ""
                }}
              />
            </label>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-lg text-sm font-semibold text-white"
                style={{ background: "#1F3D33" }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>

      {preview ? (
        <FilePreviewModal
          url={preview.url}
          filename={preview.filename}
          mime={preview.mime}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  )
}
