"use client"

/**
 * Admin Assessment detail page.
 *
 * Fetches a single AssessmentSubmission plus the patient's prior
 * submissions so the doctor can see:
 *   - Patient identity + booking slot
 *   - Score, band, per-category subtotals, top risks, suggested focus
 *   - The patient's per-question answers with the chosen option
 *     surfaced (so the doctor can spot drivers of the score)
 *   - A timeline of this patient's previous attempts with score deltas
 *
 * Status updates (Confirm / Complete / Cancel) PATCH back to the API.
 */

import Link from "next/link"
import { use, useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

import { notify } from "@/lib/notify"
import { QUESTIONS } from "@/components/public/assessment/questions"
import { CATEGORIES, type CategoryKey } from "@/components/public/assessment/types"

type Band = "OPTIMAL" | "MILD" | "MODERATE" | "SIGNIFICANT"
type Status = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

interface Submission {
  id: string
  bookingRef: string
  patient: {
    id: string
    patientNumber: string
    fullName: string
    email: string | null
    phone: string | null
    sex: string | null
    dateOfBirth: string | null
  } | null
  contactName: string
  contactEmail: string
  contactPhone: string
  contactSex: string | null
  preferredAt: string
  preferredTime: string
  notes: string | null
  totalScore: number
  scoreOutOf: number
  band: Band
  byCategory: Record<string, number>
  topRisks: { key: string; label: string; severity: string }[]
  suggestedFocus: { key: string; label: string }[]
  answers: Record<string, unknown>
  status: Status
  createdAt: string
}

interface HistoryItem {
  id: string
  bookingRef: string
  totalScore: number
  scoreOutOf: number
  band: Band
  status: Status
  createdAt: string
}

const BAND_LABELS: Record<Band, string> = {
  OPTIMAL: "Optimal Zone",
  MILD: "Mild Imbalance",
  MODERATE: "Moderate Dysfunction",
  SIGNIFICANT: "Significant Imbalance",
}

export default function AdminAssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchOne = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/assessment-submissions/${id}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { data } = (await res.json()) as {
        data: { submission: Submission; history: HistoryItem[] }
      }
      setSubmission(data.submission)
      setHistory(data.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submission")
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void fetchOne()
  }, [fetchOne])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setStatus = async (status: Status) => {
    if (!submission || updatingStatus) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/assessment-submissions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Update failed")
      setSubmission((s) => (s ? { ...s, status } : s))
      notify.success(`Marked as ${status.toLowerCase()}`)
    } catch (err) {
      notify.error("Couldn't update status", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-sm text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B2B26] dark:text-[#A5B4FC]" />
        Loading submission…
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-white dark:bg-[#1F2937] border border-[#FECDCA] rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-5 w-5 text-[#F04438]" />
          <p className="text-sm font-semibold text-[#B42318]">
            {error ?? "Submission not found"}
          </p>
          <Link
            href="/admin/assessments"
            className="text-sm text-[#6B2B26] dark:text-[#A5B4FC] hover:underline font-semibold"
          >
            ← Back to all submissions
          </Link>
        </div>
      </div>
    )
  }

  const slotDate = new Date(submission.preferredAt)
  const previousIndex = history.findIndex((h) => h.id === submission.id) + 1
  const previous = history[previousIndex] // null if this is the first attempt
  const delta = previous ? submission.totalScore - previous.totalScore : null

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/admin/assessments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> All submissions
        </Link>
        <span className="text-xs text-[#98A2B3] dark:text-[#94A3B8] font-mono">{submission.bookingRef}</span>
      </div>

      {/* Header — patient + status */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6 md:p-7 flex flex-col md:flex-row md:items-start md:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC] flex items-center justify-center font-bold">
            {initials(submission.contactName)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">{submission.contactName}</h1>
            <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-0.5">
              {submission.contactEmail} · {submission.contactPhone}
            </p>
            {submission.patient ? (
              <p className="text-xs text-[#98A2B3] dark:text-[#94A3B8] mt-1">
                Patient #{submission.patient.patientNumber}
                {" · "}
                <Link
                  href={`/admin/patients/${submission.patient.id}`}
                  className="text-[#6B2B26] dark:text-[#A5B4FC] font-semibold hover:underline"
                >
                  Open chart →
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={submission.status} />
          {submission.status === "REQUESTED" ? (
            <button
              type="button"
              onClick={() => void setStatus("CONFIRMED")}
              disabled={updatingStatus}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#12B76A] hover:bg-[#0E9A57] disabled:opacity-50"
            >
              Confirm slot
            </button>
          ) : null}
          {submission.status === "CONFIRMED" ? (
            <button
              type="button"
              onClick={() => void setStatus("COMPLETED")}
              disabled={updatingStatus}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-[#6B2B26] hover:bg-[#54201D] disabled:opacity-50"
            >
              Mark completed
            </button>
          ) : null}
          {submission.status !== "CANCELLED" && submission.status !== "COMPLETED" ? (
            <button
              type="button"
              onClick={() => void setStatus("CANCELLED")}
              disabled={updatingStatus}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#B42318] hover:bg-[#FEF3F2] disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {/* Slot + score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DetailCard title="Preferred Slot">
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Date"
            value={slotDate.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label="Time"
            value={submission.preferredTime}
          />
          {submission.notes ? (
            <DetailRow
              icon={<User className="h-4 w-4" />}
              label="Notes"
              value={submission.notes}
            />
          ) : null}
        </DetailCard>

        <DetailCard title="Contact">
          <DetailRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={submission.contactEmail}
          />
          <DetailRow
            icon={<Phone className="h-4 w-4" />}
            label="Phone"
            value={submission.contactPhone}
          />
          <DetailRow
            icon={<User className="h-4 w-4" />}
            label="Sex"
            value={submission.contactSex ?? "—"}
          />
        </DetailCard>

        <DetailCard title="Score">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#101828] dark:text-[#F9FAFB]">
                {submission.totalScore}
              </span>
              <span className="text-sm text-[#667085] dark:text-[#94A3B8]">/ {submission.scoreOutOf}</span>
              {delta !== null ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold ml-auto px-2 py-0.5 rounded-full"
                  style={{
                    background: delta < 0 ? "#ECFDF3" : delta > 0 ? "#FEF3F2" : "#F2F4F7",
                    color: delta < 0 ? "#027A48" : delta > 0 ? "#B42318" : "#344054",
                  }}
                  title="Change since last attempt"
                >
                  {delta < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : delta > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              ) : null}
            </div>
            <BandPill band={submission.band} />
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-3">
              Submitted{" "}
              {new Date(submission.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </DetailCard>
      </div>

      {/* Top risks + suggested focus + category subtotals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-3">
            Top 3 Risk Areas
          </p>
          <div className="space-y-3">
            {submission.topRisks.map((r) => (
              <RiskBar
                key={r.key}
                label={r.label}
                severity={r.severity}
                value={submission.byCategory[r.key] ?? 0}
              />
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mt-6 mb-3">
            Suggested Focus
          </p>
          <div className="flex flex-wrap gap-2">
            {submission.suggestedFocus.map((f) => (
              <span
                key={f.key}
                className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#F9ECEB] dark:bg-[#312E81] text-[#3538CD]"
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-3">
            Per-category subtotals
          </p>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-sm">
                <span className="text-[#344054] dark:text-[#CBD5E1]">{c.label}</span>
                <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {submission.byCategory[c.key as CategoryKey] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient's individual answers */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-4">
          Patient&apos;s answers
        </p>
        <ol className="space-y-4">
          {/* Only the questions this respondent was actually asked — men skip
              the female-only question, so numbering follows their quiz. */}
          {QUESTIONS.filter(
            (q) => !(q.kind === "femaleOnly" && submission.contactSex === "male"),
          ).map((q, i) => (
            <li
              key={q.id}
              className="border-l-2 pl-4"
              style={{ borderColor: "#EAECF0" }}
            >
              <p className="text-xs uppercase tracking-wider text-[#98A2B3] dark:text-[#94A3B8] font-semibold">
                Q{i + 1} · {labelFor(q.category as CategoryKey)}
              </p>
              <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] mt-0.5">
                {promptFor(q, submission.contactSex)}
              </p>
              <p className="text-sm text-[#6B2B26] dark:text-[#A5B4FC] font-semibold mt-1">
                {renderAnswer(q, submission.answers[q.id])}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Score history */}
      {history.length > 1 ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-3">
            Score history ({history.length} attempts)
          </p>
          <table className="w-full text-sm">
            <thead className="text-xs text-[#667085] dark:text-[#94A3B8] uppercase tracking-wider">
              <tr>
                <th className="text-left py-2 font-semibold">When</th>
                <th className="text-left py-2 font-semibold">Score</th>
                <th className="text-left py-2 font-semibold">Band</th>
                <th className="text-left py-2 font-semibold">Status</th>
                <th className="text-left py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {history.map((h) => (
                <tr key={h.id} className={h.id === submission.id ? "bg-[#F9FAFB] dark:bg-[#111827]" : ""}>
                  <td className="py-2.5 text-[#344054] dark:text-[#CBD5E1]">
                    {new Date(h.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2.5 font-semibold text-[#101828] dark:text-[#F9FAFB]">
                    {h.totalScore} <span className="text-[#667085] dark:text-[#94A3B8] font-normal">/ {h.scoreOutOf}</span>
                  </td>
                  <td className="py-2.5">
                    <BandPill band={h.band} />
                  </td>
                  <td className="py-2.5">
                    <StatusPill status={h.status} />
                  </td>
                  <td className="py-2.5 text-right">
                    {h.id !== submission.id ? (
                      <Link
                        href={`/admin/assessments/${h.id}`}
                        className="text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline"
                      >
                        Open
                      </Link>
                    ) : (
                      <span className="text-xs text-[#98A2B3] dark:text-[#94A3B8]">Current</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

/* ── helpers ──────────────────────────────────────────────────────── */

function labelFor(key: CategoryKey): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key
}

function promptFor(q: (typeof QUESTIONS)[number], sex: string | null): string {
  if (q.kind === "splitGender") {
    const variant =
      sex === "male" ? q.male : sex === "female" ? q.female : q[q.defaultVariant]
    return variant.prompt
  }
  return q.prompt
}

/** Render the patient's selected answer for any of the four question kinds. */
function renderAnswer(
  q: (typeof QUESTIONS)[number],
  raw: unknown,
): string {
  if (!raw || typeof raw !== "object") return "— not answered —"
  const a = raw as { kind?: string }

  if (a.kind === "single" && (q.kind === "single" || q.kind === "femaleOnly")) {
    const choice = (a as { choice: number }).choice
    const opt = q.options[choice]
    return opt ? `${opt.label} (${opt.score})` : "—"
  }
  if (a.kind === "splitGender" && q.kind === "splitGender") {
    const { variant, choice } = a as {
      variant: "male" | "female"
      choice: number
    }
    const opts = q[variant].options
    const opt = opts[choice]
    return opt
      ? `[${variant}] ${opt.label} (${opt.score})`
      : "—"
  }
  if (a.kind === "multiToggle" && q.kind === "multiToggle") {
    const yes = (a as { yes: boolean[] }).yes
    return q.options
      .map((o, i) => `${o.label}: ${yes[i] ? "Yes" : "No"}`)
      .join(" · ")
  }
  if (a.kind === "comorbidities" && q.kind === "comorbidities") {
    const sel = (a as { selected: number[] }).selected
    if (sel.length === 0) return "None reported"
    return sel.map((i) => q.options[i]).filter(Boolean).join(", ")
  }
  return "—"
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/* ── tiny presentation atoms ──────────────────────────────────────── */

function DetailCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329]">{title}</p>
      {children}
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[#F9ECEB] dark:bg-[#312E81] text-[#6B2B26] dark:text-[#A5B4FC] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] dark:text-[#94A3B8]">
          {label}
        </p>
        <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] break-words">{value}</p>
      </div>
    </div>
  )
}

function BandPill({ band }: { band: Band }) {
  const map: Record<Band, { bg: string; fg: string }> = {
    OPTIMAL: { bg: "#E4EBD6", fg: "#4E7A3F" },
    MILD: { bg: "#FFF1D6", fg: "#B5642A" },
    MODERATE: { bg: "#FBE2D0", fg: "#B5602A" },
    SIGNIFICANT: { bg: "#F4D3D3", fg: "#7A2329" },
  }
  const c = map[band]
  return (
    <span
      className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.fg }}
    >
      {BAND_LABELS[band]}
    </span>
  )
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; fg: string; Icon: typeof Clock; label: string }> = {
    REQUESTED: { bg: "#EFF8FF", fg: "#175CD3", Icon: Clock, label: "Requested" },
    CONFIRMED: { bg: "#ECFDF3", fg: "#027A48", Icon: CheckCircle2, label: "Confirmed" },
    COMPLETED: { bg: "#F9ECEB", fg: "#3538CD", Icon: CheckCircle2, label: "Completed" },
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

function RiskBar({
  label,
  severity,
  value,
}: {
  label: string
  severity: string
  value: number
}) {
  const sevColor =
    severity === "High" ? "#7A2329" : severity === "Moderate" ? "#B5642A" : "#4E7A3F"
  const max = 12
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#344054] dark:text-[#CBD5E1]">{label}</span>
        <span className="font-semibold" style={{ color: sevColor }}>
          {severity}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-[#F2F4F7] dark:bg-[#111827]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: sevColor }}
        />
      </div>
    </div>
  )
}
