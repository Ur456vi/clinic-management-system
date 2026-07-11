"use client"

/**
 * Infusion session editor — opened from the patient's "Infusion" tab.
 *
 * One component, two modes:
 *   - CREATE (no `infusion` prop): collect name + date + start/end + eventful +
 *     note, then POST /api/infusions.
 *   - EDIT (`infusion` prop set): pre-fill the form, then PATCH /api/infusions/:id.
 *
 * Start/end times are free-text clock labels (e.g. "12:00 Pm") stored verbatim,
 * matching the form design.
 */

import { useCallback, useRef, useState } from "react"
import { ExternalLink, FileText, Loader2, Trash2, UploadCloud, X } from "lucide-react"

import { notify } from "@/lib/notify"

export type InfusionEditable = {
  id: string
  name: string
  date: string
  startTime: string | null
  endTime: string | null
  eventful: boolean
  note: string | null
  summaryKey?: string | null
  summaryMime?: string | null
  summaryFilename?: string | null
  summarySizeBytes?: number | null
}

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB — matches the storage cap.

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

const ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** Resolve an upload content-type, falling back to the extension when the
 *  browser doesn't report a usable MIME (common for Office files). */
function resolveContentType(file: File): string | null {
  const allowed = new Set(Object.values(EXT_TO_MIME))
  if (allowed.has(file.type)) return file.type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  return EXT_TO_MIME[ext] ?? null
}

function fmtSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return ""
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** presign → PUT to S3. Returns the stored object key + resolved MIME. */
async function uploadToStorage(file: File): Promise<{ key: string; contentType: string }> {
  const contentType = resolveContentType(file)
  if (!contentType) throw new Error("Unsupported file type (PDF, DOCX, image, or Excel)")
  if (file.size > MAX_BYTES) throw new Error("File is larger than 25 MB")

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

  return { key, contentType }
}

/** Open the stored summary file via a short-lived presigned GET URL. */
async function viewStoredFile(key: string, filename: string | null | undefined): Promise<void> {
  const qs = new URLSearchParams({ key })
  if (filename) qs.set("filename", filename)
  const res = await fetch(`/api/files/download-url?${qs.toString()}`, { credentials: "include" })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.data?.url) {
    notify.error("Couldn't open the file")
    return
  }
  window.open(json.data.url as string, "_blank", "noopener")
}

function toDateInputValue(iso: string | null): string {
  if (!iso) {
    const d = new Date()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${dd}`
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

const fieldCls =
  "h-11 px-3 rounded-xl border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm text-[#101828] dark:text-[#F9FAFB] outline-none focus:border-[#1F3D33]"

export default function InfusionModal({
  patientId,
  infusion,
  onClose,
  onChanged,
}: {
  patientId: string
  /** When set, opens in EDIT mode for an existing infusion. */
  infusion?: InfusionEditable | null
  onClose: () => void
  onChanged: () => void
}) {
  const isEdit = !!infusion

  const [name, setName] = useState(infusion?.name ?? "")
  const [date, setDate] = useState(toDateInputValue(infusion?.date ?? null))
  const [startTime, setStartTime] = useState(infusion?.startTime ?? "")
  const [endTime, setEndTime] = useState(infusion?.endTime ?? "")
  const [eventful, setEventful] = useState(infusion?.eventful ?? false)
  const [note, setNote] = useState(infusion?.note ?? "")
  const [saving, setSaving] = useState(false)

  // Summary file: the existing one (edit mode), a newly picked replacement, and
  // a "remove" flag. A newly picked file wins; otherwise `removeExisting` clears.
  const existingKey = infusion?.summaryKey ?? null
  const [existingFilename] = useState(infusion?.summaryFilename ?? null)
  const [existingSize] = useState(infusion?.summarySizeBytes ?? null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [removeExisting, setRemoveExisting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPickFile = useCallback((f: File | null) => {
    if (!f) return
    if (!resolveContentType(f)) {
      notify.error("Unsupported file type", { description: "PDF, DOCX, image, or Excel only." })
      return
    }
    if (f.size > MAX_BYTES) {
      notify.error("File too large", { description: "Max 25 MB." })
      return
    }
    setPickedFile(f)
    setRemoveExisting(false)
  }, [])

  const save = useCallback(async () => {
    if (saving) return
    if (!name.trim()) {
      notify.error("Add an infusion name")
      return
    }
    if (!date) {
      notify.error("Pick a date")
      return
    }
    setSaving(true)
    try {
      // Resolve the summary-file fields to send. A new pick uploads first;
      // "remove" clears; otherwise leave the existing file untouched.
      let summaryPatch:
        | {
            summaryKey: string | null
            summaryMime: string | null
            summaryFilename: string | null
            summarySizeBytes: number | null
          }
        | null = null
      if (pickedFile) {
        const uploaded = await uploadToStorage(pickedFile)
        summaryPatch = {
          summaryKey: uploaded.key,
          summaryMime: uploaded.contentType,
          summaryFilename: pickedFile.name,
          summarySizeBytes: pickedFile.size,
        }
      } else if (removeExisting && existingKey) {
        summaryPatch = { summaryKey: null, summaryMime: null, summaryFilename: null, summarySizeBytes: null }
      }

      const payload = {
        name: name.trim(),
        date: new Date(`${date}T00:00:00`).toISOString(),
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
        eventful,
        note: note.trim() || null,
        ...(summaryPatch ?? {}),
      }
      const res = await fetch(
        isEdit ? `/api/infusions/${infusion!.id}` : "/api/infusions",
        {
          method: isEdit ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? payload : { patientId, ...payload }),
        },
      )
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't save the infusion")
      notify.success(isEdit ? "Infusion updated" : "Infusion added")
      onChanged()
      onClose()
    } catch (err) {
      notify.error("Couldn't save", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }, [saving, name, date, startTime, endTime, eventful, note, pickedFile, removeExisting, existingKey, isEdit, infusion, patientId, onChanged, onClose])

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
          <h3 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">Infusion</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#98A2B3] hover:bg-gray-100 dark:hover:bg-[#111827]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Infusion Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Myers' Cocktail"
            className={fieldCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldCls}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Start Time</span>
            <input
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="12:00 Pm"
              className={`${fieldCls} text-center`}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">End Time</span>
            <input
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="01:00 Pm"
              className={`${fieldCls} text-center`}
            />
          </label>
        </div>

        <div className="flex items-center gap-8">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={eventful}
              onChange={() => setEventful(true)}
              className="h-4 w-4 accent-[#1F3D33]"
            />
            <span className="text-[#101828] dark:text-[#F9FAFB]">Eventful</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!eventful}
              onChange={() => setEventful(false)}
              className="h-4 w-4 accent-[#1F3D33]"
            />
            <span className="text-[#101828] dark:text-[#F9FAFB]">Uneventful</span>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">Note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Note:"
            className="px-3 py-2 rounded-xl border border-[#E7DFCD] bg-white dark:bg-[#111827] dark:border-[#374151] text-sm text-[#101828] dark:text-[#F9FAFB] outline-none focus:border-[#1F3D33] resize-none"
          />
        </label>

        {/* Summary file (optional) */}
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-[#344054] dark:text-[#CBD5E1] font-medium text-xs">
            Infusion Summary <span className="text-[#98A2B3] font-normal">(optional)</span>
          </span>

          {pickedFile ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#E7DFCD] dark:border-[#374151] px-3 py-2.5">
              <FileText className="h-5 w-5 text-[#1F3D33] dark:text-[#A5B4FC] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">{pickedFile.name}</p>
                <p className="text-xs text-[#98A2B3]">{fmtSize(pickedFile.size)} · ready to upload</p>
              </div>
              <button
                type="button"
                onClick={() => setPickedFile(null)}
                aria-label="Remove selected file"
                className="p-1 rounded-md text-[#B42318] hover:bg-[#FEF3F2] flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : existingKey && !removeExisting ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#E7DFCD] dark:border-[#374151] px-3 py-2.5">
              <FileText className="h-5 w-5 text-[#1F3D33] dark:text-[#A5B4FC] flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] truncate">
                  {existingFilename || "Summary file"}
                </p>
                {fmtSize(existingSize) ? <p className="text-xs text-[#98A2B3]">{fmtSize(existingSize)}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => void viewStoredFile(existingKey, existingFilename)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3D33] dark:text-[#A5B4FC] hover:underline flex-shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-[#475467] dark:text-[#CBD5E1] hover:underline flex-shrink-0"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setRemoveExisting(true)}
                aria-label="Remove summary file"
                className="p-1 rounded-md text-[#B42318] hover:bg-[#FEF3F2] flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-[#E7DFCD] dark:border-[#374151] rounded-xl py-5 px-4 text-center hover:border-[#1F3D33] transition-colors"
            >
              <UploadCloud className="h-6 w-6 text-[#98A2B3]" />
              <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
                Click to upload a summary file
              </span>
              {removeExisting ? (
                <span className="text-[11px] text-[#B42318]">Existing file will be removed on save</span>
              ) : null}
            </button>
          )}

          <span className="text-[10px] text-[#98A2B3]">PDF, DOCX, image, or Excel · max 25 MB</span>

          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files?.[0] ?? null)
              e.target.value = ""
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-[#475467] dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-60"
            style={{ background: "#1F3D33" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save changes" : "Save infusion"}
          </button>
        </div>
      </div>
    </div>
  )
}
