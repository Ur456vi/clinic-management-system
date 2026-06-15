"use client"

/**
 * Shared quiz runner — the question-rendering core used by both the
 * in-clinic kiosk (`/admin/kiosk/[id]`) and the patient-portal booking
 * wizard (`/patient/appointments/new`). Controlled: the parent owns
 * `sex` + `answers` and the surrounding chrome (headers, submit bar);
 * this just renders the question cards and reports completeness.
 *
 * The public marketing-site wizard keeps its own step-per-page flow via
 * QuizContext — this runner is for the single-scroll surfaces.
 */

import { questionsForSex } from "./questions"
import { ChipToggle, OptionTile, YesNoToggle, letterPrefix } from "./QuizPrimitives"
import { CATEGORIES, type AnswerValue, type Sex } from "./types"

/** The three intro choices, shared so kiosk + portal label them identically. */
export const SEX_CHOICES: { sex: Sex; label: string }[] = [
  { sex: "female", label: "Women" },
  { sex: "male", label: "Men" },
  { sex: "other", label: "Prefer not to say" },
]

/**
 * Every visible question must be answered, except comorbidities (having
 * none is valid). A multiToggle requires every row set.
 */
export function quizComplete(sex: Sex | null, answers: Record<string, AnswerValue>): boolean {
  if (sex === null) return false
  return questionsForSex(sex).every((q) => {
    if (q.kind === "comorbidities") return true
    const a = answers[q.id]
    if (!a) return false
    if (a.kind === "multiToggle" && q.kind === "multiToggle") {
      return a.yes.length === q.options.length && a.yes.every((x) => x === true || x === false)
    }
    return true
  })
}

export function answeredCount(sex: Sex | null, answers: Record<string, AnswerValue>): number {
  if (sex === null) return 0
  return questionsForSex(sex).filter((q) => q.kind === "comorbidities" || answers[q.id]).length
}

/**
 * Fill any untouched comorbidities card with "none selected" so the score
 * is well-formed even if the patient scrolled past it. Returns a new map.
 */
export function finalizeAnswers(
  sex: Sex | null,
  answers: Record<string, AnswerValue>,
): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = { ...answers }
  for (const q of questionsForSex(sex)) {
    if (q.kind === "comorbidities" && !out[q.id]) {
      out[q.id] = { kind: "comorbidities", selected: [] }
    }
  }
  return out
}

/** All visible questions as cards, controlled by the parent. */
export function QuizQuestions({
  sex,
  answers,
  onAnswer,
}: {
  sex: Sex
  answers: Record<string, AnswerValue>
  onAnswer: (qid: string, value: AnswerValue) => void
}) {
  const questions = questionsForSex(sex)
  return (
    <div className="space-y-6">
      {questions.map((q, i) => {
        const catLabel = CATEGORIES.find((c) => c.key === q.category)?.label ?? ""
        const prompt =
          q.kind === "splitGender"
            ? (sex === "male" ? q.male : sex === "female" ? q.female : q[q.defaultVariant]).prompt
            : q.prompt
        return (
          <div
            key={q.id}
            className="rounded-2xl bg-white p-5 sm:p-6"
            style={{ border: "1px solid var(--brand-burgundy-soft, #E9D9D6)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--brand-burgundy, #7A2329)" }}>
              Q{i + 1} · {catLabel}
            </p>
            <p className="mt-1.5 text-base sm:text-lg font-medium" style={{ color: "var(--brand-ink, #2A1A18)" }}>
              {prompt}
            </p>
            <div className="mt-4">
              <QuestionBody q={q} sex={sex} answer={answers[q.id]} onAnswer={(v) => onAnswer(q.id, v)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Per-question body, reusing the public quiz primitives. */
export function QuestionBody({
  q,
  sex,
  answer,
  onAnswer,
}: {
  q: ReturnType<typeof questionsForSex>[number]
  sex: Sex | null
  answer: AnswerValue | undefined
  onAnswer: (v: AnswerValue) => void
}) {
  if (q.kind === "single" || q.kind === "femaleOnly") {
    const choice = answer?.kind === "single" ? answer.choice : -1
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {q.options.map((o, i) => (
          <OptionTile
            key={i}
            label={`${letterPrefix(i)} ${o.label}`}
            selected={choice === i}
            onClick={() => onAnswer({ kind: "single", choice: i })}
          />
        ))}
      </div>
    )
  }

  if (q.kind === "splitGender") {
    const variant: "male" | "female" = sex === "male" ? "male" : sex === "female" ? "female" : q.defaultVariant
    const opts = q[variant].options
    const choice = answer?.kind === "splitGender" ? answer.choice : -1
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {opts.map((o, i) => (
          <OptionTile
            key={i}
            label={`${letterPrefix(i)} ${o.label}`}
            selected={choice === i}
            onClick={() => onAnswer({ kind: "splitGender", variant, choice: i })}
          />
        ))}
      </div>
    )
  }

  if (q.kind === "multiToggle") {
    const yes = answer?.kind === "multiToggle" ? answer.yes : []
    const setAt = (i: number, val: boolean) => {
      const next = q.options.map((_, j) => (j === i ? val : yes[j]))
      onAnswer({ kind: "multiToggle", yes: next as boolean[] })
    }
    return (
      <div className="space-y-3">
        {q.options.map((o, i) => (
          <YesNoToggle
            key={i}
            label={o.label}
            yesScore={o.yesScore}
            noScore={o.noScore}
            value={yes[i]}
            onChange={(v) => setAt(i, v)}
          />
        ))}
      </div>
    )
  }

  // comorbidities
  const selected = answer?.kind === "comorbidities" ? answer.selected : []
  const toggle = (i: number) => {
    const set = new Set(selected)
    if (set.has(i)) set.delete(i)
    else set.add(i)
    onAnswer({ kind: "comorbidities", selected: Array.from(set).sort((a, b) => a - b) })
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {q.options.map((label, i) => (
        <ChipToggle key={i} label={label} selected={selected.includes(i)} onToggle={() => toggle(i)} />
      ))}
    </div>
  )
}
