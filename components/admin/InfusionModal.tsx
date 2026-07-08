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

import { useCallback, useState } from "react"
import { Loader2, X } from "lucide-react"

import { notify } from "@/lib/notify"

export type InfusionEditable = {
  id: string
  name: string
  date: string
  startTime: string | null
  endTime: string | null
  eventful: boolean
  note: string | null
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
      const payload = {
        name: name.trim(),
        date: new Date(`${date}T00:00:00`).toISOString(),
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
        eventful,
        note: note.trim() || null,
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
  }, [saving, name, date, startTime, endTime, eventful, note, isEdit, infusion, patientId, onChanged, onClose])

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
