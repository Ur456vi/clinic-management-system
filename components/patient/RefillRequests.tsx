"use client"

/**
 * Patient-portal refill requests.
 *
 * Self-contained card for the prescriptions page. Fetches the patient's own
 * SIGNED prescribed items (`/api/patient/me/treatment-plans`) and their
 * refill requests (`/api/patient/me/refills`), lets them request a refill
 * per item, and shows the status of each request the clinic is working.
 *
 * Owns its own data so the (large) prescriptions page only drops in
 * `<RefillRequests />`.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, RefreshCw, Check } from "lucide-react"

type Status = "PENDING" | "APPROVED" | "FULFILLED" | "DECLINED"

type RefillRow = {
  id: string
  itemName: string
  dose: string | null
  frequency: string | null
  status: Status
  createdAt: string
  fulfilledAt: string | null
  declinedAt: string | null
  decisionNote: string | null
  planItemId: string | null
}

type PlanItem = {
  id: string
  name: string
  dose: string | null
  frequency: string | null
  kind: string
}

type Plan = { status: string; items: PlanItem[] }

const STATUS_STYLE: Record<Status, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "#FEF3E2", fg: "#B7791F", label: "Pending review" },
  APPROVED: { bg: "#E8EEFB", fg: "#6B2B26", label: "Approved" },
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

export default function RefillRequests() {
  const [rows, setRows] = useState<RefillRow[]>([])
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rRes, pRes] = await Promise.all([
        fetch("/api/patient/me/refills?limit=100", { credentials: "include" }),
        fetch("/api/patient/me/treatment-plans?limit=100", { credentials: "include" }),
      ])
      const rJson = rRes.ok ? await rRes.json() : { data: [] }
      const pJson = pRes.ok ? await pRes.json() : { data: [] }
      setRows((rJson.data ?? []) as RefillRow[])
      const plans = (pJson.data ?? []) as Plan[]
      setItems(plans.filter((p) => p.status === "SIGNED").flatMap((p) => p.items ?? []))
    } catch {
      setError("Couldn't load your refills.")
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Items with an in-flight (PENDING/APPROVED) request can't be re-requested. */
  const openByItemId = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (r.planItemId && (r.status === "PENDING" || r.status === "APPROVED")) {
        set.add(r.planItemId)
      }
    }
    return set
  }, [rows])

  const request = useCallback(async (item: PlanItem) => {
    setBusyItemId(item.id)
    setError(null)
    try {
      const res = await fetch("/api/patient/me/refills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planItemId: item.id, itemName: item.name }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRows((prev) => [json.data as RefillRow, ...prev])
    } catch {
      setError("Couldn't send your request. Please try again.")
    } finally {
      setBusyItemId(null)
    }
  }, [])

  return (
    <div className="bg-white border border-[#EAECF0] rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <span className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "#E8EEFB" }}>
          <RefreshCw className="h-4.5 w-4.5" style={{ color: "#6B2B26" }} />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#101828]">Refill Requests</h2>
          <p className="text-xs text-[#667085]">Request a refill on your prescribed items — the clinic will review and fulfil.</p>
        </div>
      </div>

      {error ? (
        <div className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>{error}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#667085]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Prescribed items → request */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Your prescribed items</span>
            {items.length === 0 ? (
              <p className="text-sm text-[#98A2B3] py-2">No prescribed items yet.</p>
            ) : (
              <ul className="flex flex-col rounded-xl border border-[#EAECF0] overflow-hidden">
                {items.map((it, i) => {
                  const open = openByItemId.has(it.id)
                  return (
                    <li key={it.id} className="flex items-center gap-3 px-3.5 py-2.5" style={i > 0 ? { borderTop: "1px solid #F2F4F7" } : undefined}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#101828] truncate">{it.name}</p>
                        <p className="text-xs text-[#667085]">{[it.dose, it.frequency].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void request(it)}
                        disabled={open || busyItemId === it.id}
                        className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 flex-shrink-0 text-white disabled:opacity-50"
                        style={{ background: open ? "#98A2B3" : "#6B2B26" }}
                      >
                        {busyItemId === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {open ? "Requested" : "Request refill"}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* My requests → status */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#667085]">Your requests</span>
            {rows.length === 0 ? (
              <p className="text-sm text-[#98A2B3] py-2">No requests yet.</p>
            ) : (
              <ul className="flex flex-col rounded-xl border border-[#EAECF0] overflow-hidden">
                {rows.map((r, i) => {
                  const s = STATUS_STYLE[r.status]
                  return (
                    <li key={r.id} className="flex items-start gap-3 px-3.5 py-2.5" style={i > 0 ? { borderTop: "1px solid #F2F4F7" } : undefined}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#101828] truncate">{r.itemName}</p>
                        <p className="text-[11px] text-[#98A2B3]">
                          Requested {fmtDate(r.createdAt)}
                          {r.status === "FULFILLED" && r.fulfilledAt ? ` · fulfilled ${fmtDate(r.fulfilledAt)}` : ""}
                          {r.status === "DECLINED" && r.declinedAt ? ` · declined ${fmtDate(r.declinedAt)}` : ""}
                        </p>
                        {r.decisionNote ? <p className="text-[11px] mt-0.5 italic text-[#667085]">“{r.decisionNote}”</p> : null}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1" style={{ background: s.bg, color: s.fg }}>
                        {r.status === "FULFILLED" ? <Check className="h-3 w-3" /> : null}
                        {s.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
