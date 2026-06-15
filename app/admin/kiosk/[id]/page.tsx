"use client"

/**
 * In-clinic tablet kiosk — Health Assessment for a walk-in patient.
 *
 * Reached from the appointment kebab ("Start tablet assessment"). The
 * device is handed to the patient, who picks their sex and answers the
 * quiz; on submit the scored result is POSTed to
 * `/api/appointments/[id]/tablet-assessment`, which records an
 * AssessmentSubmission for the appointment's patient so the RMO/Doctor see
 * it on this visit.
 *
 * Lives under `/admin/kiosk/**` (staff-auth via proxy) but OUTSIDE the
 * `(dashboard)` route group, so it renders full-screen with no admin
 * sidebar — a clean surface for a patient-held tablet. Quiz state is local
 * to this component (not the public QuizContext) so it never bleeds into
 * the public site's localStorage or another patient's session.
 */

import { useRouter } from "next/navigation"
import { use, useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import { questionsForSex } from "@/components/public/assessment/questions"
import { scoreQuiz } from "@/components/public/assessment/scoring"
import {
  QuizQuestions,
  SEX_CHOICES,
  answeredCount,
  finalizeAnswers,
  quizComplete,
} from "@/components/public/assessment/quiz-runner"
import { type AnswerValue, type Sex } from "@/components/public/assessment/types"

export default function TabletKioskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: appointmentId } = use(params)
  const router = useRouter()

  const [patientName, setPatientName] = useState<string>("")
  const [sex, setSex] = useState<Sex | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Best-effort greeting so reception can confirm the right patient holds
  // the tablet. Non-blocking — the quiz works without it.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`, { credentials: "include" })
        if (!res.ok) return
        const { data } = await res.json()
        if (!cancelled) setPatientName(data?.patient?.fullName ?? "")
      } catch {
        /* greeting is optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [appointmentId])

  const questionCount = useMemo(() => questionsForSex(sex).length, [sex])
  const allAnswered = useMemo(() => quizComplete(sex, answers), [sex, answers])
  const answered = useMemo(() => answeredCount(sex, answers), [sex, answers])

  const setAnswer = (qid: string, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }))

  const submit = async () => {
    if (!allAnswered || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const finalAnswers = finalizeAnswers(sex, answers)
      const result = scoreQuiz(finalAnswers, sex)
      const res = await fetch(`/api/appointments/${appointmentId}/tablet-assessment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalScore: result.totalScore,
          scoreOutOf: result.scoreOutOf,
          band: result.band,
          topRisks: result.topRisks,
          suggestedFocus: result.suggestedFocus,
          byCategory: result.byCategory,
          answers: finalAnswers,
          sex,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit assessment")
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Done screen ─────────────────────────────────────────────── */
  if (done) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "var(--brand-cream, #F6F1E7)" }}
      >
        <CheckCircle2 className="h-16 w-16" style={{ color: "#1E7A4F" }} />
        <h1 className="mt-6 text-3xl font-bold" style={{ color: "var(--brand-ink, #2A1A18)" }}>
          Thank you
        </h1>
        <p className="mt-3 text-lg max-w-md" style={{ color: "var(--brand-ink-soft, #5A4A48)" }}>
          Your assessment has been recorded. Please hand the tablet back to the reception desk.
        </p>
        <button
          onClick={() => router.push("/admin/appointments")}
          className="mt-10 rounded-lg px-6 py-3 text-sm font-semibold text-white"
          style={{ background: "var(--brand-burgundy, #7A2329)" }}
        >
          Reception: finish
        </button>
      </div>
    )
  }

  /* ── Intro: pick sex ─────────────────────────────────────────── */
  if (sex === null) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "var(--brand-cream, #F6F1E7)" }}
      >
        <div className="max-w-2xl w-full text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--brand-burgundy, #7A2329)" }}>
            Health Assessment
          </p>
          <h1 className="mt-3 text-4xl font-bold" style={{ color: "var(--brand-ink, #2A1A18)" }}>
            Welcome{patientName ? `, ${patientName}` : ""}
          </h1>
          <p className="mt-4 text-lg" style={{ color: "var(--brand-ink-soft, #5A4A48)" }}>
            A few quick health questions — about 2 minutes. To begin, please choose:
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {SEX_CHOICES.map((c) => (
              <button
                key={c.sex}
                onClick={() => setSex(c.sex)}
                className="rounded-2xl px-6 py-8 text-left transition-transform active:scale-[0.98]"
                style={{ background: "white", border: "2px solid var(--brand-burgundy, #7A2329)" }}
              >
                <span className="block text-xl font-bold" style={{ color: "var(--brand-burgundy, #7A2329)" }}>
                  {c.label}
                </span>
                <span className="block text-sm mt-1" style={{ color: "var(--brand-ink-soft, #5A4A48)" }}>
                  Begin here →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Quiz: all questions in one scroll ───────────────────────── */
  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--brand-cream, #F6F1E7)" }}>
      <div className="mx-auto max-w-3xl px-5 pt-8">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--brand-burgundy, #7A2329)" }}>
          Health Assessment
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ color: "var(--brand-ink, #2A1A18)" }}>
          {patientName ? `${patientName}` : "Please answer each question"}
        </h1>

        <div className="mt-8">
          <QuizQuestions sex={sex} answers={answers} onAnswer={setAnswer} />
        </div>
      </div>

      {/* Sticky submit bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t backdrop-blur px-5 py-4 flex items-center justify-between gap-4"
        style={{ background: "rgba(255,255,255,0.95)", borderColor: "var(--brand-burgundy-soft, #E9D9D6)" }}
      >
        <span className="text-sm" style={{ color: "var(--brand-ink-soft, #5A4A48)" }}>
          {answered} of {questionCount} answered
        </span>
        <div className="flex items-center gap-3">
          {error ? <span className="text-sm" style={{ color: "#B42318" }}>{error}</span> : null}
          <button
            onClick={() => void submit()}
            disabled={!allAnswered || submitting}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--brand-burgundy, #7A2329)" }}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit assessment
          </button>
        </div>
      </div>
    </div>
  )
}
