"use client"

/**
 * Admin refill queue.
 *
 * Cross-patient worklist of refill requests. Defaults to the open queue
 * (PENDING + APPROVED) so staff can work it top-to-bottom; a filter switches
 * to fulfilled / declined / all. Each row drives the same lifecycle as the
 * per-patient manager: PENDING → APPROVED → FULFILLED / DECLINED.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Check, X, RefreshCw } from "lucide-react"

type Status = "PENDING" | "APPROVED" | "FULFILLED" | "DECLINED"

type RefillRow = {
  id: string
  itemName: string
  dose: string | null
  frequency: string | null
  note: string | null
  status: Status
  createdAt: string
  fulfilledAt: string | null
  declinedAt: string | null
  patient: { id: string; patientNumber: string; fullName: string }
  requestedBy: { role: string; staff: { fullName: string } | null } | null
}

const FILTERS: { key: string; label: string; status: string }[] = [
  { key: "open", label: "Open", status: "PENDING,APPROVED" },
  { key: "pending", label: "Pending", status: "PENDING" },
  { key: "approved", label: "Approved", status: "APPROVED" },
  { key: "fulfilled", label: "Fulfilled", status: "FULFILLED" },
  { key: "declined", label: "Declined", status: "DECLINED" },
  { key: "all", label: "All", status: "" },
]

const STATUS_STYLE: Record<Status, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "#FEF3E2", fg: "#B7791F", label: "Pending" },
  APPROVED: { bg: "#E8EEFB", fg: "#2E37A4", label: "Approved" },
  FULFILLED: { bg: "#E4F3EC", fg: "#0E8C6A", label: "Fulfilled" },
  DECLINED: { bg: "#FDECEC", fg: "#B4322B", label: "Declined" },
}

function fmtDate(v: string | null): string {
  if (!v) return ""
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export default function AdminRefillsPage() {
  const [filter, setFilter] = useState("open")
  const [rows, setRows] = useState<RefillRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (key: string) => {
    setLoading(true)
    setError(null)
    const f = FILTERS.find((x) => x.key === key) ?? FILTERS[0]
    try {
      const qs = new URLSearchParams({ limit: "100" })
      if (f.status) qs.set("status", f.status)
      const res = await fetch(`/api/refills?${qs.toString()}`, { credentials: "include" })
      const json = res.ok ? await res.json() : { data: [] }
      setRows((json.data ?? []) as RefillRow[])
    } catch {
      setError("Couldn't load the refill queue.")
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load(filter)
  }, [filter, load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const transition = useCallback(async (id: string, to: Status) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`/api/refills/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      const updated = json.data as RefillRow
      setRows((prev) => {
        // Drop rows that no longer match the active filter.
        const f = FILTERS.find((x) => x.key === filter)
        const stillMatches = !f?.status || f.status.split(",").includes(updated.status)
        return stillMatches
          ? prev.map((r) => (r.id === id ? updated : r))
          : prev.filter((r) => r.id !== id)
      })
    } catch {
      setError("Couldn't update the request.")
    } finally {
      setBusyId(null)
    }
  }, [filter])

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "#E8EEFB" }}>
          <RefreshCw className="h-5 w-5" style={{ color: "#2E37A4" }} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Refill Queue</h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-0.5">Review, approve, and fulfil patient refill requests.</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              filter === f.key
                ? "bg-[#2E37A4] text-white"
                : "bg-white dark:bg-[#1F2937] text-[#475467] dark:text-[#CBD5E1] border border-[#EAECF0] dark:border-[#374151] hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>{error}</div>
      ) : null}

      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8] p-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <RefreshCw className="h-8 w-8 mb-2 text-[#D0D5DD]" />
            <p className="text-sm text-[#667085] dark:text-[#94A3B8]">Nothing in this view.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
            {rows.map((r) => {
              const s = STATUS_STYLE[r.status]
              const requester = r.requestedBy?.role === "PATIENT" ? "Patient" : r.requestedBy?.staff?.fullName ?? "Staff"
              return (
                <li key={r.id} className="flex items-start gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{r.itemName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                    </div>
                    <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-0.5">
                      {[r.dose, r.frequency].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="text-[11px] text-[#98A2B3] mt-0.5">
                      <Link href={`/admin/patients/${r.patient.id}`} className="font-semibold hover:underline" style={{ color: "#2E37A4" }}>
                        {r.patient.fullName}
                      </Link>
                      {" "}#{r.patient.patientNumber} · requested {fmtDate(r.createdAt)} by {requester}
                    </p>
                    {r.note ? <p className="text-[11px] mt-1 italic text-[#667085]">“{r.note}”</p> : null}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {busyId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#2E37A4]" />
                    ) : r.status === "PENDING" ? (
                      <>
                        <button onClick={() => void transition(r.id, "APPROVED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1 bg-[#2E37A4] hover:bg-[#252c83]">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => void transition(r.id, "DECLINED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1" style={{ background: "#FDECEC", color: "#B4322B" }}>
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </>
                    ) : r.status === "APPROVED" ? (
                      <>
                        <button onClick={() => void transition(r.id, "FULFILLED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1" style={{ background: "#0E8C6A" }}>
                          <Check className="h-3.5 w-3.5" /> Fulfil
                        </button>
                        <button onClick={() => void transition(r.id, "DECLINED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1" style={{ background: "#FDECEC", color: "#B4322B" }}>
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
