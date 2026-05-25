"use client"

/**
 * Admin Appointments list — fully wired to /api/appointments.
 *
 * The previous version shipped a hard-coded array of fake bookings; this
 * rewrite fetches the live list from the BE-27 endpoint and keeps the
 * existing visual language (status pills, search + filter row,
 * "Add Appointment" CTA). Status pills map cleanly off the
 * AppointmentStatus enum returned by the API; the legacy "type" column is
 * repurposed to show the assigned doctor's specialization (the closest
 * analogue we have on the real model).
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Search,
  Plus,
  ChevronDown,
  Clock,
  User,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"

/* ── API response shape (mirrors APPOINTMENT_INCLUDE in
 *    lib/services/appointment.ts) ─────────────────────────────────── */

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
}

const STATUS_FILTERS: { label: string; value: Status | "ALL" }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "No-show", value: "NO_SHOW" },
]

export default function AppointmentsPage() {
  const [rows, setRows] = useState<AppointmentApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL")

  const fetchAppointments = useCallback(async () => {
    setError(null)
    try {
      const url = new URL("/api/appointments", window.location.origin)
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)
      url.searchParams.set("limit", "50")
      const res = await fetch(url.toString(), { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      // The BE-27 endpoint returns `{ items, nextCursor }`. Other API
      // helpers wrap in the standard `{ data: {...} }` envelope — accept
      // both shapes so the page is robust to either.
      const items: AppointmentApi[] =
        json?.items ?? json?.data?.items ?? json?.data ?? []
      setRows(items)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load appointments"
      setError(message)
      notify.error("Couldn't load appointments", { description: message })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchAppointments()
  }, [fetchAppointments])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const fields = [
        r.patient?.fullName,
        r.patient?.patientNumber,
        r.staff?.fullName,
        r.staff?.specialization,
        r.department?.name,
        r.reason,
      ]
        .filter(Boolean)
        .map((s) => (s as string).toLowerCase())
      return fields.some((f) => f.includes(q))
    })
  }, [rows, search])

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Appointments</h1>
          <p className="text-sm text-[#667085] mt-1">
            Live booking list — slots created by reception, the patient portal,
            and the public-site assessment flow all show up here.
          </p>
        </div>
        <Link href="/admin/appointments/add">
          <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
            <Plus className="h-4 w-4" />
            <span>Add Appointment</span>
          </Button>
        </Link>
      </div>

      {/* Filter row */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient, doctor, department, or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
          className="px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white text-[#101828] font-medium focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
        >
          {STATUS_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!loading && !error ? (
          <span className="text-sm text-[#667085]">
            {filtered.length} appointment{filtered.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#EAECF0] text-xs text-[#667085] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Doctor</th>
                <th className="px-6 py-3 font-semibold">Date / Time</th>
                <th className="px-6 py-3 font-semibold">Reason</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#667085]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] mb-3" />
                      <p className="text-sm font-medium">Loading appointments…</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-7 w-7 text-[#D92D20]" />
                      <p className="text-sm font-semibold text-[#B42318]">
                        Couldn&apos;t load appointments
                      </p>
                      <p className="text-xs text-[#667085] max-w-md">{error}</p>
                      <Button
                        variant="outline"
                        onClick={() => void fetchAppointments()}
                      >
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center text-[#667085] gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F4F5FF] flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-[#2E37A4]" />
                      </div>
                      <p className="text-sm font-semibold text-[#101828]">
                        No appointments found
                      </p>
                      <p className="text-xs max-w-sm">
                        New bookings created in the portal will appear here. Adjust the
                        status filter above to widen your search.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => <AppointmentRow key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Row + pills ─────────────────────────────────────────────────── */

function AppointmentRow({ row }: { row: AppointmentApi }) {
  const starts = new Date(row.startsAt)
  const dateLabel = starts.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const timeLabel = starts.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <tr className="hover:bg-[#F9FAFB] transition-colors">
      {/* Patient */}
      <td className="px-6 py-4">
        {row.patient ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#F4F5FF] flex items-center justify-center text-xs font-bold text-[#2E37A4]">
              {initials(row.patient.fullName)}
            </div>
            <div>
              <Link
                href={`/admin/patients/${row.patient.id}`}
                className="text-sm font-semibold text-[#101828] hover:text-[#2E37A4]"
              >
                {row.patient.fullName}
              </Link>
              <p className="text-xs text-[#667085]">#{row.patient.patientNumber}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-[#98A2B3] inline-flex items-center gap-2">
            <User className="h-4 w-4" /> Unknown patient
          </span>
        )}
      </td>

      {/* Doctor */}
      <td className="px-6 py-4">
        {row.staff ? (
          <div>
            <p className="text-sm font-medium text-[#101828]">{row.staff.fullName}</p>
            {row.staff.specialization ? (
              <p className="text-xs text-[#2E37A4]">{row.staff.specialization}</p>
            ) : row.department ? (
              <p className="text-xs text-[#667085]">{row.department.name}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-[#98A2B3]">—</span>
        )}
      </td>

      {/* Date / Time */}
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-[#101828]">{dateLabel}</p>
        <p className="text-xs text-[#667085] inline-flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" /> {timeLabel}
        </p>
      </td>

      {/* Reason */}
      <td className="px-6 py-4 text-sm text-[#344054] max-w-[280px] truncate">
        {row.reason ?? <span className="text-[#98A2B3]">—</span>}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusPill status={row.status} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <Link
          href={`/admin/appointments/${row.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E37A4] hover:underline"
        >
          View <ChevronDown className="h-3 w-3 -rotate-90" />
        </Link>
      </td>
    </tr>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string; label: string }> = {
    REQUESTED: { bg: "#EFF8FF", fg: "#175CD3", label: "Requested" },
    CONFIRMED: { bg: "#ECFDF3", fg: "#027A48", label: "Confirmed" },
    COMPLETED: { bg: "#F4F5FF", fg: "#3538CD", label: "Completed" },
    CANCELLED: { bg: "#FEF3F2", fg: "#B42318", label: "Cancelled" },
    NO_SHOW: { bg: "#FFF4ED", fg: "#B93815", label: "No-show" },
  }
  const c = map[status] ?? map.REQUESTED
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{ background: c.fg }}
      />
      {c.label}
    </span>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
