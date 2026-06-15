"use client"

/**
 * Patient self-booking — quiz-first flow.
 *
 *   Step 1  Health Assessment quiz (sex pick + questions)
 *   Step 2  Pick doctor + date + slot + reason
 *   Submit  POST /api/appointments/book — creates the REQUESTED appointment
 *           AND attaches the scored assessment in one atomic call, so the
 *           RMO/Doctor see the quiz on this visit.
 *
 *   GET /api/doctors                     pick a clinician
 *   GET /api/appointments/availability   open slots for a doctor + date
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Loader2 } from "lucide-react"

import { notify } from "@/lib/notify"
import { scoreQuiz } from "@/components/public/assessment/scoring"
import { questionsForSex } from "@/components/public/assessment/questions"
import {
  QuizQuestions,
  SEX_CHOICES,
  answeredCount,
  finalizeAnswers,
  quizComplete,
} from "@/components/public/assessment/quiz-runner"
import { type AnswerValue, type Sex } from "@/components/public/assessment/types"

type Doctor = {
  id: string
  fullName: string
  specialization: string | null
  role: string
  department: { id: string; name: string } | null
}
type Slot = { start: string; end: string }
type Step = "quiz" | "booking"

export default function PatientBookAppointmentPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("quiz")

  // Quiz state
  const [sex, setSex] = useState<Sex | null>(null)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const quizDone = useMemo(() => quizComplete(sex, answers), [sex, answers])
  const answered = useMemo(() => answeredCount(sex, answers), [sex, answers])
  const questionCount = useMemo(() => questionsForSex(sex).length, [sex])
  const setAnswer = (qid: string, v: AnswerValue) => setAnswers((p) => ({ ...p, [qid]: v }))

  // Booking state
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [doctorId, setDoctorId] = useState("")
  const [date, setDate] = useState("")
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        // RMOs only — patient self-bookings are triaged by a Medical Officer
        // first; they cannot book a doctor (e.g. Dr. Yuvraaj) directly.
        const res = await fetch("/api/doctors?role=RMO", { credentials: "include" })
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && Array.isArray(json?.data)) {
          setDoctors(json.data)
          if (json.data[0]) setDoctorId(json.data[0].id)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadSlots = useCallback(async () => {
    if (!doctorId || !date) {
      setSlots(null)
      return
    }
    setSlotsLoading(true)
    setSelectedSlot(null)
    try {
      // Clinic hours: 10:00 AM – 6:00 PM. Bounding the window here keeps the
      // patient picker in step with the admin booking + Dr. Yuvraaj slots.
      const from = new Date(`${date}T10:00:00`)
      const to = new Date(`${date}T18:00:00`)
      const qs = new URLSearchParams({
        staffId: doctorId,
        from: from.toISOString(),
        to: to.toISOString(),
        durationMins: "30",
      })
      const res = await fetch(`/api/appointments/availability?${qs.toString()}`, { credentials: "include" })
      if (!res.ok) {
        setSlots([])
        return
      }
      const json = await res.json()
      setSlots(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [doctorId, date])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadSlots()
  }, [loadSlots])
  /* eslint-enable react-hooks/set-state-in-effect */

  const book = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || submitting || !quizDone) return
    setSubmitting(true)
    try {
      const finalAnswers = finalizeAnswers(sex, answers)
      const result = scoreQuiz(finalAnswers, sex)
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staffId: doctorId,
          scheduledAt: selectedSlot.start,
          durationMins: Math.max(
            5,
            Math.round(
              (new Date(selectedSlot.end).getTime() - new Date(selectedSlot.start).getTime()) / 60000,
            ),
          ),
          reason: reason.trim() || undefined,
          assessment: {
            totalScore: result.totalScore,
            scoreOutOf: result.scoreOutOf,
            band: result.band,
            topRisks: result.topRisks,
            suggestedFocus: result.suggestedFocus,
            byCategory: result.byCategory,
            answers: finalAnswers,
            sex,
          },
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't book the appointment")
      setDone(true)
      notify.success("Appointment requested")
    } catch (err) {
      notify.error("Couldn't book", {
        description: err instanceof Error ? err.message : "Please try another slot.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/patient/appointments"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#EAECF0] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:bg-gray-50 dark:hover:bg-[#111827]"
          aria-label="Back to appointments"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#101828] dark:text-[#F9FAFB]">Book an appointment</h1>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            {done
              ? "All set."
              : step === "quiz"
                ? "Step 1 of 2 — a quick health assessment."
                : "Step 2 of 2 — pick a doctor, date, and open slot."}
          </p>
        </div>
      </div>

      {done ? (
        <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#ECFDF3] flex items-center justify-center">
            <CalendarPlus className="h-6 w-6 text-[#027A48]" />
          </div>
          <h2 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB] mt-3">Appointment requested</h2>
          <p className="text-sm text-[#6C7688] dark:text-[#94A3B8] mt-1">
            Your request and health assessment have been sent. Track its status under Appointments.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button
              onClick={() => router.push("/patient/appointments")}
              className="bg-[#2E37A4] hover:bg-[#1d246b] text-white rounded-lg px-4 py-2.5 text-sm font-semibold"
            >
              View my appointments
            </button>
          </div>
        </div>
      ) : step === "quiz" ? (
        /* ── Step 1: quiz ── */
        <div className="flex flex-col gap-5">
          {sex === null ? (
            <div className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-6">
              <p className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">To begin, please choose:</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {SEX_CHOICES.map((c) => (
                  <button
                    key={c.sex}
                    onClick={() => setSex(c.sex)}
                    className="rounded-xl px-5 py-6 text-left transition-transform active:scale-[0.98]"
                    style={{ background: "white", border: "2px solid var(--brand-burgundy, #7A2329)" }}
                  >
                    <span className="block text-lg font-bold" style={{ color: "var(--brand-burgundy, #7A2329)" }}>
                      {c.label}
                    </span>
                    <span className="block text-xs mt-1" style={{ color: "var(--brand-ink-soft, #5A4A48)" }}>
                      Begin here →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <QuizQuestions sex={sex} answers={answers} onAnswer={setAnswer} />
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#6C7688] dark:text-[#94A3B8]">
                  {answered} of {questionCount} answered
                </span>
                <button
                  onClick={() => setStep("booking")}
                  disabled={!quizDone}
                  className="h-11 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 px-6"
                >
                  Continue to booking <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Step 2: booking ── */
        <form onSubmit={book} className="bg-white dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          <button
            type="button"
            onClick={() => setStep("quiz")}
            className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-[#6C7688] dark:text-[#94A3B8] hover:text-[#101828] dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to assessment
          </button>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Medical Officer</span>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB]"
            >
              {doctors.length === 0 ? <option value="">No medical officers available</option> : null}
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                  {d.specialization ? ` — ${d.specialization}` : d.department ? ` — ${d.department.name}` : ""}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#6C7688] dark:text-[#94A3B8]">
              Your first visit is with a Medical Officer (RMO), who will review your assessment and route you to a specialist if needed.
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Date</span>
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 px-3 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] w-full"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">Available slots</span>
            {!date ? (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">Pick a date to see open slots.</p>
            ) : slotsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#667085] dark:text-[#94A3B8]">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
              </div>
            ) : slots && slots.length === 0 ? (
              <p className="text-sm text-[#98A2B3] dark:text-[#94A3B8]">No open slots that day. Try another date.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots?.map((s) => {
                  const active = selectedSlot?.start === s.start
                  return (
                    <button
                      key={s.start}
                      type="button"
                      onClick={() => setSelectedSlot(s)}
                      className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#2E37A4] border-[#2E37A4] text-white"
                          : "bg-white dark:bg-[#111827] border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-[#CBD5E1] hover:border-[#2E37A4]"
                      }`}
                    >
                      {new Date(s.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[#344054] dark:text-[#CBD5E1]">Reason (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="What would you like to discuss?"
              className="px-3 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#101828] dark:text-[#F9FAFB] resize-none"
            />
          </label>

          <button
            type="submit"
            disabled={!selectedSlot || submitting}
            className="h-11 rounded-lg bg-[#2E37A4] hover:bg-[#1d246b] disabled:bg-[#B3B5E2] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitting ? "Booking…" : "Request appointment"}
          </button>
        </form>
      )}
    </div>
  )
}
