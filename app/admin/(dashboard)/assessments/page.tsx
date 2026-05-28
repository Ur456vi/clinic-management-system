"use client"

/**
 * Admin "Assessments" page — the doctor's view of every public-site
 * Health Assessment booking. Each row is one quiz attempt; the same
 * patient retaking the assessment appears multiple times (sorted most
 * recent first) so the doctor can see score improvement over time.
 */

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Search,
  Loader2,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react"

import { notify } from "@/lib/notify"

type Band = "OPTIMAL" | "MILD" | "MODERATE" | "SIGNIFICANT"
type Status = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

interface Row {
  id: string
  bookingRef: string
  patient: {
    id: string
    patientNumber: string
    fullName: string
    email: string | null
  } | null
  contactName: string
  contactEmail: string
  contactPhone: string
  preferredAt: string
  preferredTime: string
  totalScore: number
  scoreOutOf: number
  band: Band
  status: Status
  createdAt: string
}

const STATUS_OPTIONS: { label: string; value: Status | "ALL" }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Requested", value: "REQUESTED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
]

export default function AdminAssessmentsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL")
  const [search, setSearch] = useState("")

  const fetchRows = useCallback(async () => {
    setError(null)
    try {
      const url = new URL("/api/admin/assessment-submissions", window.location.origin)
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter)
      url.searchParams.set("take", "100")
      const res = await fetch(url.toString(), { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as { data: { items: Row[] } }
      setRows(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchRows()
  }, [fetchRows])
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter(
      (r) =>
        r.contactName.toLowerCase().includes(q) ||
        r.contactEmail.toLowerCase().includes(q) ||
        r.contactPhone.toLowerCase().includes(q) ||
        r.bookingRef.toLowerCase().includes(q) ||
        r.patient?.patientNumber.toLowerCase().includes(q),
    )
  }, [rows, search])

  // Quick action: mark a submission confirmed without leaving the list.
  const setStatus = async (id: string, status: Status) => {
    try {
      const res = await fetch(`/api/admin/assessment-submissions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Update failed")
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
      notify.success(`Marked as ${status.toLowerCase()}`)
    } catch (err) {
      notify.error("Couldn't update status", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Health Assessments</h1>
          <p className="text-sm text-[#667085] mt-1">
            Public-site quiz submissions. Each row is one attempt — retakes appear separately.
          </p>
        </div>
      </div>

      {/* Filter row */}
      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone, booking ref, patient #…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
          className="px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/15 focus:border-[#2E37A4]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-12 flex flex-col items-center justify-center gap-3 text-sm text-[#667085]">
          <Loader2 className="h-5 w-5 animate-spin text-[#2E37A4]" />
          Loading submissions…
        </div>
      ) : error ? (
        <div className="bg-white border border-[#FECDCA] rounded-xl shadow-sm p-10 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <div>
            <p className="text-sm font-semibold text-[#B42318]">Couldn&apos;t load submissions</p>
            <p className="text-xs text-[#667085] mt-1">{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-sm p-16 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F5FF] flex items-center justify-center">
            <FileText className="h-5 w-5 text-[#2E37A4]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#101828]">No submissions found</p>
            <p className="text-xs text-[#667085] mt-1 max-w-sm">
              Public-site assessment bookings will show up here as they come in.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EAECF0] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] text-xs text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Patient</th>
                <th className="px-4 py-3 text-left font-semibold">Score</th>
                <th className="px-4 py-3 text-left font-semibold">Band</th>
                <th className="px-4 py-3 text-left font-semibold">Preferred Slot</th>
                <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <Link
                        href={`/admin/assessments/${r.id}`}
                        className="font-semibold text-[#2E37A4] hover:underline"
                      >
                        {r.contactName}
                      </Link>
                      <span className="text-xs text-[#667085]">
                        {r.contactEmail} · {r.contactPhone}
                      </span>
                      {r.patient ? (
                        <span className="text-[10px] text-[#98A2B3] mt-0.5">
                          #{r.patient.patientNumber} · {r.bookingRef}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#98A2B3] mt-0.5">{r.bookingRef}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-base font-bold text-[#101828]">
                      {r.totalScore}
                    </span>
                    <span className="text-xs text-[#667085]"> / {r.scoreOutOf}</span>
                  </td>
                  <td className="px-4 py-4">
                    <BandPill band={r.band} />
                  </td>
                  <td className="px-4 py-4 text-[#344054]">
                    {new Date(r.preferredAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    <span className="text-[#667085]">· {r.preferredTime}</span>
                  </td>
                  <td className="px-4 py-4 text-[#667085]">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/assessments/${r.id}`}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#2E37A4] hover:bg-[#F4F5FF] transition-colors"
                      >
                        View
                      </Link>
                      {r.status === "REQUESTED" ? (
                        <button
                          type="button"
                          onClick={() => void setStatus(r.id, "CONFIRMED")}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#12B76A] hover:bg-[#0E9A57] transition-colors"
                        >
                          Confirm
                        </button>
                      ) : null}
                      {r.status !== "CANCELLED" && r.status !== "COMPLETED" ? (
                        <button
                          type="button"
                          onClick={() => void setStatus(r.id, "CANCELLED")}
                          className="px-2 py-1.5 rounded-md text-xs text-[#B42318] hover:bg-[#FEF3F2] transition-colors"
                          title="Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Pills ──────────────────────────────────────────────────────────── */

function BandPill({ band }: { band: Band }) {
  const map: Record<Band, { bg: string; fg: string; label: string }> = {
    OPTIMAL: { bg: "#E4EBD6", fg: "#4E7A3F", label: "Optimal" },
    MILD: { bg: "#FFF1D6", fg: "#B5642A", label: "Mild" },
    MODERATE: { bg: "#FBE2D0", fg: "#B5602A", label: "Moderate" },
    SIGNIFICANT: { bg: "#F4D3D3", fg: "#7A2329", label: "Significant" },
  }
  const c = map[band]
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string; Icon: typeof Clock; label: string }> = {
    REQUESTED: { bg: "#EFF8FF", fg: "#175CD3", Icon: Clock, label: "Requested" },
    CONFIRMED: { bg: "#ECFDF3", fg: "#027A48", Icon: CheckCircle2, label: "Confirmed" },
    COMPLETED: { bg: "#F4F5FF", fg: "#3538CD", Icon: CheckCircle2, label: "Completed" },
    CANCELLED: { bg: "#FEF3F2", fg: "#B42318", Icon: XCircle, label: "Cancelled" },
  }
  const { bg, fg, Icon, label } = map[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color: fg }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
