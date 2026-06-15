"use client"

/**
 * Admin per-patient refill manager.
 *
 * Renders inside the patient-detail "Program & Refills" tab. Pulls the
 * patient's real refill requests (`/api/refills?patientId=…`) and their
 * SIGNED prescribed items (`/api/treatment-plans?patientId=…`) so staff can:
 *   - raise a request on the patient's behalf (pick a prescribed item or
 *     type a free-text name), and
 *   - drive the lifecycle: PENDING → APPROVED → FULFILLED / DECLINED.
 *
 * Self-contained: it owns its own fetch + optimistic state so the (large)
 * patient page only needs to drop in `<RefillManager patientId={id} />`.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Check, X, RefreshCw } from "lucide-react"

const GREEN = "#1F3D33"

type Status = "PENDING" | "APPROVED" | "FULFILLED" | "DECLINED"

type RefillRow = {
  id: string
  itemName: string
  dose: string | null
  frequency: string | null
  note: string | null
  status: Status
  createdAt: string
  approvedAt: string | null
  fulfilledAt: string | null
  declinedAt: string | null
  decisionNote: string | null
  requestedBy: { role: string; staff: { fullName: string } | null } | null
  decidedBy: { staff: { fullName: string } | null } | null
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
  PENDING: { bg: "#FDEFE4", fg: "#C2691E", label: "Pending" },
  APPROVED: { bg: "#E5EEF9", fg: "#2E5AAC", label: "Approved" },
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

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status]
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  )
}

export default function RefillManager({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<RefillRow[]>([])
  const [items, setItems] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create form
  const [selectedItemId, setSelectedItemId] = useState("")
  const [freeText, setFreeText] = useState("")
  const [note, setNote] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rRes, pRes] = await Promise.all([
        fetch(`/api/refills?patientId=${patientId}&limit=100`, { credentials: "include" }),
        fetch(`/api/treatment-plans?patientId=${patientId}&limit=50`, { credentials: "include" }),
      ])
      const rJson = rRes.ok ? await rRes.json() : { data: [] }
      const pJson = pRes.ok ? await pRes.json() : { data: [] }
      setRows((rJson.data ?? []) as RefillRow[])
      const plans = (pJson.data ?? []) as Plan[]
      const flat = plans
        .filter((p) => p.status === "SIGNED")
        .flatMap((p) => p.items ?? [])
      setItems(flat)
    } catch {
      setError("Couldn't load refills.")
    } finally {
      setLoading(false)
    }
  }, [patientId])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load()
  }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  )

  const canCreate = (selectedItem !== null || freeText.trim().length > 0) && !creating

  const create = useCallback(async () => {
    if (!canCreate) return
    setCreating(true)
    setError(null)
    try {
      const body = selectedItem
        ? { patientId, planItemId: selectedItem.id, itemName: selectedItem.name, note: note.trim() || undefined }
        : { patientId, itemName: freeText.trim(), note: note.trim() || undefined }
      const res = await fetch("/api/refills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRows((prev) => [json.data as RefillRow, ...prev])
      setSelectedItemId("")
      setFreeText("")
      setNote("")
    } catch {
      setError("Couldn't create the request.")
    } finally {
      setCreating(false)
    }
  }, [canCreate, selectedItem, patientId, freeText, note])

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
      setRows((prev) => prev.map((r) => (r.id === id ? (json.data as RefillRow) : r)))
    } catch {
      setError("Couldn't update the request.")
    } finally {
      setBusyId(null)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7B73" }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading refills…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: "#FDECEC", color: "#B4322B" }}>
          {error}
        </div>
      ) : null}

      {/* Create on behalf */}
      <div className="rounded-xl p-3 flex flex-col gap-2.5" style={{ background: "#F4F7F5", border: "1px solid #E7DFCD" }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: GREEN }}>
          Raise a refill request
        </span>
        <div className="flex flex-col sm:flex-row gap-2">
          {items.length > 0 ? (
            <select
              value={selectedItemId}
              onChange={(e) => { setSelectedItemId(e.target.value); if (e.target.value) setFreeText("") }}
              className="flex-1 h-9 px-2.5 rounded-lg text-sm bg-white"
              style={{ border: "1px solid #D9D2C2", color: "#16302A" }}
            >
              <option value="">Prescribed item…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}{it.dose ? ` — ${it.dose}` : ""}{it.frequency ? ` · ${it.frequency}` : ""}
                </option>
              ))}
            </select>
          ) : null}
          <input
            value={freeText}
            onChange={(e) => { setFreeText(e.target.value); if (e.target.value) setSelectedItemId("") }}
            placeholder={items.length > 0 ? "or type an item…" : "Item name…"}
            className="flex-1 h-9 px-2.5 rounded-lg text-sm bg-white"
            style={{ border: "1px solid #D9D2C2", color: "#16302A" }}
          />
        </div>
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 h-9 px-2.5 rounded-lg text-sm bg-white"
            style={{ border: "1px solid #D9D2C2", color: "#16302A" }}
          />
          <button
            type="button"
            onClick={() => void create()}
            disabled={!canCreate}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: GREEN }}
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Request
          </button>
        </div>
      </div>

      {/* Requests list */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <RefreshCw className="h-7 w-7 mb-2" style={{ color: "#C9BFA6" }} />
          <p className="text-sm" style={{ color: "#6B7B73" }}>No refill requests yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {rows.map((r, i) => {
            const requester = r.requestedBy?.role === "PATIENT"
              ? "Patient"
              : r.requestedBy?.staff?.fullName ?? "Staff"
            return (
              <li key={r.id} className="flex items-start gap-3 py-3" style={i > 0 ? { borderTop: "1px solid #EFE8D8" } : undefined}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "#16302A" }}>{r.itemName}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7B73" }}>
                    {[r.dose, r.frequency].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#8A9A92" }}>
                    Requested {fmtDate(r.createdAt)} by {requester}
                    {r.status === "FULFILLED" && r.fulfilledAt ? ` · fulfilled ${fmtDate(r.fulfilledAt)}` : ""}
                    {r.status === "DECLINED" && r.declinedAt ? ` · declined ${fmtDate(r.declinedAt)}` : ""}
                  </p>
                  {r.note ? <p className="text-[11px] mt-1 italic" style={{ color: "#6B7B73" }}>“{r.note}”</p> : null}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {busyId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: GREEN }} />
                  ) : r.status === "PENDING" ? (
                    <>
                      <button type="button" onClick={() => void transition(r.id, "APPROVED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1" style={{ background: GREEN }}>
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button type="button" onClick={() => void transition(r.id, "DECLINED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1" style={{ background: "#FDECEC", color: "#B4322B" }}>
                        <X className="h-3.5 w-3.5" /> Decline
                      </button>
                    </>
                  ) : r.status === "APPROVED" ? (
                    <>
                      <button type="button" onClick={() => void transition(r.id, "FULFILLED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1" style={{ background: "#0E8C6A" }}>
                        <Check className="h-3.5 w-3.5" /> Fulfil
                      </button>
                      <button type="button" onClick={() => void transition(r.id, "DECLINED")} className="h-8 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1" style={{ background: "#FDECEC", color: "#B4322B" }}>
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
  )
}
