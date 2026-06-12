"use client"

/**
 * Shared admin appointments table.
 *
 * Extracted from the Appointments page so it can be reused by any view that
 * needs the same live list + status/search filters + row actions. Pass an
 * optional `staffId` to scope the list to a single clinician (e.g. the
 * "Dr Yuvraaj Appointment" view); omit it to show every booking.
 */

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  User,
  Loader2,
  AlertCircle,
  Calendar,
  Eye,
  CheckCircle2,
  PlayCircle,
  ClipboardList,
  FileText,
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

export interface AppointmentsListProps {
  /** Page heading. */
  title: string
  /** Sub-heading under the title. */
  subtitle: string
  /** When set, only this staff member's appointments are listed. */
  staffId?: string
  /** Show the "Add Appointment" CTA (default true). */
  showAdd?: boolean
  /**
   * Show the "RMO Summary" row action (default false). Enabled on the
   * Dr Yuvraaj view so the doctor can review the RMO intake before starting.
   */
  showRmoSummary?: boolean
  /** Empty-state copy override. */
  emptyHint?: string
}

export default function AppointmentsList({
  title,
  subtitle,
  staffId,
  showAdd = true,
  showRmoSummary = false,
  emptyHint,
}: AppointmentsListProps) {
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
      if (staffId) url.searchParams.set("staffId", staffId)
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
  }, [statusFilter, staffId])

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
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">{title}</h1>
          <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">{subtitle}</p>
        </div>
        {showAdd ? (
          <Link href="/admin/appointments/add">
            <Button className="bg-[#2E37A4] hover:bg-[#1d246b] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 h-auto text-sm font-semibold">
              <Plus className="h-4 w-4" />
              <span>Add Appointment</span>
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Filter row */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] dark:text-[#94A3B8] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient, doctor, department, or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] placeholder-[#98A2B3] dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
          className="px-3 py-2.5 border border-[#D0D5DD] dark:border-[#374151] rounded-lg text-sm bg-white dark:bg-[#1F2937] text-[#101828] dark:text-[#F9FAFB] font-medium focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
        >
          {STATUS_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!loading && !error ? (
          <span className="text-sm text-[#667085] dark:text-[#94A3B8]">
            {filtered.length} appointment{filtered.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151] text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Patient</th>
                <th className="px-6 py-3 font-semibold">Doctor</th>
                <th className="px-6 py-3 font-semibold">Date / Time</th>
                <th className="px-6 py-3 font-semibold">Reason</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#667085] dark:text-[#94A3B8]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#2E37A4] dark:text-[#A5B4FC] mb-3" />
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
                      <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{error}</p>
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
                    <div className="flex flex-col items-center text-[#667085] dark:text-[#94A3B8] gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-[#2E37A4] dark:text-[#A5B4FC]" />
                      </div>
                      <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                        No appointments found
                      </p>
                      <p className="text-xs max-w-sm">
                        {emptyHint ??
                          "New bookings created in the portal will appear here. Adjust the status filter above to widen your search."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <AppointmentRow
                    key={row.id}
                    row={row}
                    showRmoSummary={showRmoSummary}
                    onChanged={() => void fetchAppointments()}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Row + pills ─────────────────────────────────────────────────── */

function AppointmentRow({
  row,
  showRmoSummary,
  onChanged,
}: {
  row: AppointmentApi
  showRmoSummary: boolean
  onChanged: () => void
}) {
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
            <div className="h-10 w-10 rounded-full bg-[#F4F5FF] dark:bg-[#312E81] flex items-center justify-center text-xs font-bold text-[#2E37A4] dark:text-[#A5B4FC]">
              {initials(row.patient.fullName)}
            </div>
            <div>
              <Link
                href={`/admin/patients/${row.patient.id}`}
                className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] hover:text-[#2E37A4]"
              >
                {row.patient.fullName}
              </Link>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">#{row.patient.patientNumber}</p>
            </div>
          </div>
        ) : (
          <span className="text-sm text-[#98A2B3] dark:text-[#94A3B8] inline-flex items-center gap-2">
            <User className="h-4 w-4" /> Unknown patient
          </span>
        )}
      </td>

      {/* Doctor */}
      <td className="px-6 py-4">
        {row.staff ? (
          <div>
            <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">{row.staff.fullName}</p>
            {row.staff.specialization ? (
              <p className="text-xs text-[#2E37A4] dark:text-[#A5B4FC]">{row.staff.specialization}</p>
            ) : row.department ? (
              <p className="text-xs text-[#667085] dark:text-[#94A3B8]">{row.department.name}</p>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">—</span>
        )}
      </td>

      {/* Date / Time */}
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB]">{dateLabel}</p>
        <p className="text-xs text-[#667085] dark:text-[#94A3B8] inline-flex items-center gap-1 mt-0.5">
          <Clock className="h-3 w-3" /> {timeLabel}
        </p>
      </td>

      {/* Reason */}
      <td className="px-6 py-4 text-sm text-[#344054] dark:text-[#CBD5E1] max-w-[280px] truncate">
        {row.reason ?? <span className="text-[#98A2B3] dark:text-[#94A3B8]">—</span>}
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusPill status={row.status} />
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <AppointmentActionMenu row={row} showRmoSummary={showRmoSummary} onChanged={onChanged} />
      </td>
    </tr>
  )
}

/* ── Actions kebab menu ──────────────────────────────────────────── */

function AppointmentActionMenu({
  row,
  showRmoSummary,
  onChanged,
}: {
  row: AppointmentApi
  showRmoSummary: boolean
  onChanged: () => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const MENU_W = 224 // w-56

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
      return
    }
    const r = btnRef.current?.getBoundingClientRect()
    if (r) {
      // Anchor below the button, right-aligned, in viewport (fixed) coords so
      // the menu escapes the table's overflow-hidden / overflow-x-auto clip.
      setCoords({ top: r.bottom + 4, left: r.right - MENU_W })
    }
    setOpen(true)
  }

  // Close on any outside click, scroll, or resize.
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener("click", close)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("click", close)
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  const accept = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/appointments/${row.id}/transition`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "CONFIRMED" }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      notify.success("Appointment accepted")
      onChanged()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't accept appointment"
      notify.error("Accept failed", { description: message })
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const viewQuiz = () => {
    setOpen(false)
    router.push(`/admin/appointments/${row.id}/quiz`)
  }

  const item =
    "w-full text-left px-4 py-2 text-sm font-medium text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 hover:text-[#101828] transition-colors flex items-center gap-2 disabled:opacity-50"

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={busy}
        className="p-1.5 text-[#667085] dark:text-[#94A3B8] hover:text-[#101828] rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
        aria-label="Appointment actions"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MoreHorizontal className="h-5 w-5" />
        )}
      </button>

      {open && coords && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: coords.top, left: coords.left }}
          className="w-56 rounded-md shadow-lg bg-white dark:bg-[#1F2937] ring-1 ring-[#EAECF0] dark:ring-[#374151] z-50"
        >
          <div className="py-1">
            <button
              className={item}
              onClick={() => {
                setOpen(false)
                router.push(`/admin/appointments/${row.id}`)
              }}
            >
              <Eye className="h-4 w-4 text-[#667085] dark:text-[#94A3B8]" /> View
            </button>

            {row.status === "REQUESTED" ? (
              <button className={item} onClick={() => void accept()}>
                <CheckCircle2 className="h-4 w-4 text-[#027A48]" /> Accept
              </button>
            ) : null}

            {showRmoSummary ? (
              <button
                className={item}
                onClick={() => {
                  setOpen(false)
                  router.push(`/admin/appointments/${row.id}/rmo-summary`)
                }}
              >
                <FileText className="h-4 w-4 text-[#667085] dark:text-[#94A3B8]" /> RMO Summary
              </button>
            ) : null}

            <button
              className={item}
              onClick={() => {
                setOpen(false)
                router.push(`/admin/appointments/${row.id}/consultation`)
              }}
            >
              <PlayCircle className="h-4 w-4 text-[#2E37A4] dark:text-[#A5B4FC]" /> Start appointment
            </button>

            <button className={item} onClick={() => void viewQuiz()}>
              <ClipboardList className="h-4 w-4 text-[#667085] dark:text-[#94A3B8]" /> View quiz Assessment
            </button>
          </div>
        </div>
      )}
    </div>
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
