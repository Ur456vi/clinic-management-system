"use client"

/**
 * Quiz Assessment viewer — reached from the Appointments list kebab
 * ("View quiz Assessment"). Resolves the appointment's patient and renders
 * their most recent Health Assessment submission: the scored report (band,
 * per-category subtotals, top risks, suggested focus) plus the full set of
 * per-question answers.
 *
 * This is a fresh, read-only, appointment-scoped screen. The standalone
 * submission browser lives at /admin/assessments/[id]; this view is the
 * quick "what did this patient answer for this booking?" surface.
 */

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ClipboardList,
  User,
  CalendarClock,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
import { QUESTIONS } from "@/components/public/assessment/questions"
import { CATEGORIES, type CategoryKey } from "@/components/public/assessment/types"

type Band = "OPTIMAL" | "MILD" | "MODERATE" | "SIGNIFICANT"

interface Quiz {
  id: string
  bookingRef: string
  patient: { id: string; patientNumber: string; fullName: string } | null
  contactSex: string | null
  preferredAt: string
  preferredTime: string
  notes: string | null
  totalScore: number
  scoreOutOf: number
  band: Band
  byCategory: Record<string, number>
  topRisks: { key: CategoryKey; label: string; severity: "High" | "Moderate" | "Low" }[]
  suggestedFocus: { key: CategoryKey; label: string }[]
  answers: Record<string, unknown>
  status: string
  createdAt: string
}

export default function AppointmentQuizPage() {
  const params = useParams<{ id: string }>()
  const appointmentId = params.id

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setError(null)
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/quiz`, {
          credentials: "include",
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { data } = await res.json()
        if (cancelled) return
        if (!data) {
          setEmpty(true)
        } else {
          setQuiz(data as Quiz)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load quiz"
        if (!cancelled) setError(message)
        notify.error("Couldn't load quiz assessment", { description: message })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  const submittedLabel = useMemo(() => {
    if (!quiz) return ""
    return new Date(quiz.createdAt).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [quiz])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#667085] dark:text-[#94A3B8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#6B2B26] dark:text-[#A5B4FC] mb-3" />
        <p className="text-sm font-medium">Loading quiz assessment…</p>
      </div>
    )
  }

  if (error) {
    return (
      <CenteredState
        icon={<AlertCircle className="h-7 w-7 text-[#D92D20]" />}
        title="Couldn't load quiz assessment"
        body={error}
      />
    )
  }

  if (empty || !quiz) {
    return (
      <CenteredState
        icon={<ClipboardList className="h-7 w-7 text-[#6B2B26] dark:text-[#A5B4FC]" />}
        title="No quiz assessment on file"
        body="This patient hasn't completed the Health Assessment quiz yet."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1000px]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] dark:text-[#94A3B8] hover:text-[#6B2B26] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Appointments
          </Link>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Quiz Assessment</h1>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-[#667085] dark:text-[#94A3B8]">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {quiz.patient ? (
                <Link
                  href={`/admin/patients/${quiz.patient.id}`}
                  className="font-medium text-[#101828] dark:text-[#F9FAFB] hover:text-[#6B2B26]"
                >
                  {quiz.patient.fullName}
                </Link>
              ) : (
                "Unknown patient"
              )}
              {quiz.patient ? (
                <span className="text-[#98A2B3] dark:text-[#94A3B8]">#{quiz.patient.patientNumber}</span>
              ) : null}
            </span>
            <span className="text-[#98A2B3] dark:text-[#94A3B8]">·</span>
            <span className="font-mono text-xs">{quiz.bookingRef}</span>
          </div>
        </div>
        <Link
          href={`/admin/assessments/${quiz.id}`}
          className="text-xs font-semibold text-[#6B2B26] dark:text-[#A5B4FC] hover:underline mt-1"
        >
          Open full submission →
        </Link>
      </div>

      {/* Score + report */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Score */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-3">
            Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#101828] dark:text-[#F9FAFB]">{quiz.totalScore}</span>
            <span className="text-sm text-[#667085] dark:text-[#94A3B8]">/ {quiz.scoreOutOf}</span>
          </div>
          <div className="mt-2">
            <BandPill band={quiz.band} />
          </div>
          <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-3 inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" /> {submittedLabel}
          </p>
        </div>

        {/* Top risks + focus */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-3">
            Top Risk Areas
          </p>
          <div className="space-y-3">
            {quiz.topRisks.length ? (
              quiz.topRisks.map((r) => (
                <RiskBar
                  key={r.key}
                  label={r.label}
                  severity={r.severity}
                  value={quiz.byCategory[r.key] ?? 0}
                />
              ))
            ) : (
              <p className="text-sm text-[#667085] dark:text-[#94A3B8]">No elevated risk areas.</p>
            )}
          </div>
          {quiz.suggestedFocus.length ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mt-6 mb-3">
                Suggested Focus
              </p>
              <div className="flex flex-wrap gap-2">
                {quiz.suggestedFocus.map((f) => (
                  <span
                    key={f.key}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#F9ECEB] dark:bg-[#312E81] text-[#3538CD]"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Per-category subtotals */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-3">
            Per-category subtotals
          </p>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-sm">
                <span className="text-[#344054] dark:text-[#CBD5E1]">{c.label}</span>
                <span className="font-semibold text-[#101828] dark:text-[#F9FAFB]">
                  {quiz.byCategory[c.key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-4">
          Patient&apos;s answers
        </p>
        <ol className="space-y-4">
          {/* Only the questions this respondent was actually asked — men skip
              the female-only question, so numbering follows their quiz. */}
          {QUESTIONS.filter(
            (q) => !(q.kind === "femaleOnly" && quiz.contactSex === "male"),
          ).map((q, i) => (
            <li key={q.id} className="border-l-2 pl-4" style={{ borderColor: "#EAECF0" }}>
              <p className="text-xs uppercase tracking-wider text-[#98A2B3] dark:text-[#94A3B8] font-semibold">
                Q{i + 1} · {labelFor(q.category as CategoryKey)}
              </p>
              <p className="text-sm font-medium text-[#101828] dark:text-[#F9FAFB] mt-0.5">
                {promptFor(q, quiz.contactSex)}
              </p>
              <p className="text-sm text-[#6B2B26] dark:text-[#A5B4FC] font-semibold mt-1">
                {renderAnswer(q, quiz.answers[q.id])}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {quiz.notes ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A2329] mb-2">
            Patient notes
          </p>
          <p className="text-sm text-[#344054] dark:text-[#CBD5E1] whitespace-pre-wrap">{quiz.notes}</p>
        </div>
      ) : null}
    </div>
  )
}

/* ── helpers ──────────────────────────────────────────────────────── */

function CenteredState({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      {icon}
      <p className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">{title}</p>
      <p className="text-xs text-[#667085] dark:text-[#94A3B8] max-w-md">{body}</p>
      <Link href="/admin/appointments">
        <Button variant="outline">Back to appointments</Button>
      </Link>
    </div>
  )
}

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
function renderAnswer(q: (typeof QUESTIONS)[number], raw: unknown): string {
  if (!raw || typeof raw !== "object") return "— not answered —"
  const a = raw as { kind?: string }

  if (a.kind === "single" && (q.kind === "single" || q.kind === "femaleOnly")) {
    const choice = (a as { choice: number }).choice
    const opt = q.options[choice]
    return opt ? `${opt.label} (${opt.score})` : "—"
  }
  if (a.kind === "splitGender" && q.kind === "splitGender") {
    const { variant, choice } = a as { variant: "male" | "female"; choice: number }
    const opt = q[variant].options[choice]
    return opt ? `[${variant}] ${opt.label} (${opt.score})` : "—"
  }
  if (a.kind === "multiToggle" && q.kind === "multiToggle") {
    const yes = (a as { yes: boolean[] }).yes
    return q.options.map((o, i) => `${o.label}: ${yes[i] ? "Yes" : "No"}`).join(" · ")
  }
  if (a.kind === "comorbidities" && q.kind === "comorbidities") {
    const sel = (a as { selected: number[] }).selected
    if (sel.length === 0) return "None reported"
    return sel.map((i) => q.options[i]).filter(Boolean).join(", ")
  }
  return "—"
}

function BandPill({ band }: { band: Band }) {
  const map: Record<Band, { bg: string; fg: string; label: string }> = {
    OPTIMAL: { bg: "#ECFDF3", fg: "#027A48", label: "Optimal Zone" },
    MILD: { bg: "#FFFAEB", fg: "#B54708", label: "Mild Imbalance" },
    MODERATE: { bg: "#FFF4ED", fg: "#B93815", label: "Moderate Dysfunction" },
    SIGNIFICANT: { bg: "#FEF3F2", fg: "#B42318", label: "Significant Imbalance" },
  }
  const c = map[band] ?? map.MILD
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  )
}

function RiskBar({
  label,
  severity,
  value,
}: {
  label: string
  severity: "High" | "Moderate" | "Low"
  value: number
}) {
  const color =
    severity === "High" ? "#D92D20" : severity === "Moderate" ? "#F79009" : "#12B76A"
  // Category subtotals top out around 10; clamp the bar to a sane width.
  const pct = Math.min(100, Math.round((value / 10) * 100))
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[#344054] dark:text-[#CBD5E1] font-medium">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {severity} · {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F2F4F7] dark:bg-[#111827] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
