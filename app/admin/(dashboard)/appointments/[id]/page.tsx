"use client"

/**
 * Appointment detail page — real fetch from /api/appointments/[id].
 *
 * The previous version rendered "—" for every field because the data
 * wasn't wired up. This rewrite calls the BE-27 GET endpoint, renders
 * the patient + staff + slot, and supports:
 *   - Reschedule (date/time form → PATCH /api/appointments/[id])
 *   - Status transitions (confirm / complete / cancel) via the
 *     /transition endpoint, which handles audit-trail writes
 */

import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Stethoscope,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

type Status = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

interface AppointmentApi {
  id: string
  startsAt: string
  endsAt: string
  status: Status
  reason: string | null
  notes: string | null
  patient: {
    id: string
    patientNumber: string
    fullName: string
  } | null
  staff: {
    id: string
    fullName: string
    specialization: string | null
  } | null
  department: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [appt, setAppt] = useState<AppointmentApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTime, setEditingTime] = useState(false)
  const [draft, setDraft] = useState({ date: "", time: "", duration: "30" })
  const [saving, setSaving] = useState(false)

  const fetchOne = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data: AppointmentApi = json?.data ?? json
      setAppt(data)
      const starts = new Date(data.startsAt)
      setDraft({
        date: starts.toISOString().slice(0, 10),
        time: starts.toTimeString().slice(0, 5),
        duration: String(
          Math.max(
            5,
            Math.round((new Date(data.endsAt).getTime() - starts.getTime()) / 60000),
          ),
        ),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointment")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchOne()
  }, [fetchOne])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleReschedule = async () => {
    if (!appt || saving) return
    setSaving(true)
    try {
      const startsAt = new Date(`${draft.date}T${draft.time}:00`)
      if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid date/time")
      const endsAt = new Date(
        startsAt.getTime() + Number.parseInt(draft.duration, 10) * 60_000,
      )
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? "Reschedule failed")
      notify.success("Appointment rescheduled")
      setEditingTime(false)
      await fetchOne()
    } catch (err) {
      notify.error("Couldn't reschedule", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (status: Status) => {
    if (!appt) return
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${id}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      notify.success(`Marked ${status.toLowerCase()}`)
      await fetchOne()
    } catch (err) {
      notify.error("Couldn't update status", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085]">
        <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4]" />
        Loading appointment…
      </div>
    )
  }

  if (error || !appt) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-white border border-[#FECDCA] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <p className="text-sm font-semibold text-[#B42318]">
            {error ?? "Appointment not found"}
          </p>
          <Link
            href="/admin/appointments"
            className="text-sm text-[#2E37A4] hover:underline font-semibold"
          >
            ← Back to all appointments
          </Link>
        </div>
      </div>
    )
  }

  const starts = new Date(appt.startsAt)
  const ends = new Date(appt.endsAt)
  const dateLabel = starts.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const timeLabel = `${starts.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${ends.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/appointments"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#D0D5DD] text-[#344054] hover:bg-gray-50"
            aria-label="Back to appointments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">Appointment</h1>
            <p className="text-xs text-[#98A2B3] mt-0.5 font-mono">{appt.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={appt.status} />
          {appt.status === "REQUESTED" ? (
            <Button
              className="bg-[#12B76A] hover:bg-[#0E9A57] text-white h-9 px-3 text-xs"
              disabled={saving}
              onClick={() => void handleStatus("CONFIRMED")}
            >
              Confirm
            </Button>
          ) : null}
          {appt.status === "CONFIRMED" ? (
            <Button
              className="bg-[#2E37A4] hover:bg-[#1d246b] text-white h-9 px-3 text-xs"
              disabled={saving}
              onClick={() => void handleStatus("COMPLETED")}
            >
              Mark completed
            </Button>
          ) : null}
          {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" ? (
            <>
              <Button
                variant="outline"
                className="h-9 px-3 text-xs"
                onClick={() => setEditingTime((v) => !v)}
              >
                {editingTime ? "Close" : "Reschedule"}
              </Button>
              <Button
                variant="outline"
                className="h-9 px-3 text-xs text-[#B42318] border-[#FECDCA] hover:bg-[#FEF3F2]"
                disabled={saving}
                onClick={() => void handleStatus("CANCELLED")}
              >
                Cancel
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {editingTime ? (
        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-5">
          <p className="text-sm font-semibold text-[#101828] mb-3">Reschedule</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              className="h-10 px-3 border border-[#D0D5DD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
            />
            <input
              type="time"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              className="h-10 px-3 border border-[#D0D5DD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
            />
            <select
              value={draft.duration}
              onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
              className="h-10 px-3 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingTime(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleReschedule()}
              disabled={saving || !draft.date || !draft.time}
              className="bg-[#2E37A4] hover:bg-[#1d246b] text-white inline-flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save new time
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-[#101828] mb-4">Overview</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <Item icon={<User className="h-4 w-4" />} label="Patient">
              {appt.patient ? (
                <Link
                  href={`/admin/patients/${appt.patient.id}`}
                  className="text-[#2E37A4] font-semibold hover:underline"
                >
                  {appt.patient.fullName}
                </Link>
              ) : (
                "—"
              )}
              {appt.patient ? (
                <p className="text-xs text-[#98A2B3] mt-0.5">
                  #{appt.patient.patientNumber}
                </p>
              ) : null}
            </Item>
            <Item icon={<Stethoscope className="h-4 w-4" />} label="Doctor">
              {appt.staff?.fullName ?? "—"}
              {appt.staff?.specialization ? (
                <p className="text-xs text-[#2E37A4] mt-0.5">
                  {appt.staff.specialization}
                </p>
              ) : null}
            </Item>
            <Item icon={<Calendar className="h-4 w-4" />} label="Date">
              {dateLabel}
            </Item>
            <Item icon={<Clock className="h-4 w-4" />} label="Time">
              {timeLabel}
            </Item>
            <Item icon={<MapPin className="h-4 w-4" />} label="Department">
              {appt.department?.name ?? "—"}
            </Item>
            <Item icon={<User className="h-4 w-4" />} label="Reason">
              {appt.reason ?? "—"}
            </Item>
            {appt.notes ? (
              <div className="md:col-span-2 border-t border-[#F2F4F7] pt-4">
                <dt className="text-xs uppercase text-[#667085] font-semibold tracking-wider mb-1">
                  Notes
                </dt>
                <dd className="text-sm text-[#344054] whitespace-pre-wrap">
                  {appt.notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm p-6 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-[#101828] mb-1">Status</h2>
          <StatusPill status={appt.status} />
          <div className="text-xs text-[#667085] mt-2 space-y-1">
            <p>
              Created{" "}
              {new Date(appt.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              Last updated{" "}
              {new Date(appt.updatedAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Item({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#667085] mt-0.5">{icon}</div>
      <div className="min-w-0">
        <dt className="text-xs uppercase text-[#667085] font-semibold tracking-wider">
          {label}
        </dt>
        <dd className="text-[#101828] font-medium mt-0.5">{children}</dd>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string; Icon: typeof CheckCircle2; label: string }> = {
    REQUESTED: { bg: "#EFF8FF", fg: "#175CD3", Icon: Clock, label: "Requested" },
    CONFIRMED: { bg: "#ECFDF3", fg: "#027A48", Icon: CheckCircle2, label: "Confirmed" },
    COMPLETED: { bg: "#F4F5FF", fg: "#3538CD", Icon: CheckCircle2, label: "Completed" },
    CANCELLED: { bg: "#FEF3F2", fg: "#B42318", Icon: XCircle, label: "Cancelled" },
    NO_SHOW: { bg: "#FFF4ED", fg: "#B93815", Icon: XCircle, label: "No-show" },
  }
  const { bg, fg, Icon, label } = map[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit"
      style={{ background: bg, color: fg }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
