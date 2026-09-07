"use client"

import { useMemo } from "react"
import { AlertCircle, Wand2 } from "lucide-react"

import { RMO_FIELDS } from "@/lib/rmo-fields"
import {
  FIELD_SECTION, SCORING_CONFIG, isScorableField, suggestQuestionScores,
} from "@/lib/scoring"
import type { Sex } from "@/lib/scoring"

/** The `name` a score input carries, paired with its answer control. */
export const scoreFieldName = (field: string) => `score__${field}`

type Props = {
  /** The flat form map, holding both answers and `score__*` entries. */
  form: Record<string, string>
  /** The consultation's saved sections, used to derive the suggestions. */
  sections: unknown
  sex: Sex | null
  /** Set a single score input. */
  onScoreChange: (field: string, value: string) => void
  /** Copy every suggestion into the empty boxes of one section. */
  onAcceptSuggestions: (entries: Array<[field: string, value: number]>) => void
  disabled?: boolean
}

const SECTION_NAME = new Map(SCORING_CONFIG.map((s) => [s.key, s.name]))
/** The total printed in the source document, where it declares one. */
const DECLARED_MAX = new Map(SCORING_CONFIG.map((s) => [s.key, s.declaredMax]))

/**
 * The RMO's manual scoring screen.
 *
 * Rendered from `RMO_FIELDS` rather than hand-written per question, so it
 * cannot drift from the registry the form itself is built on — and so the eight
 * sections the engine cannot derive get score boxes for free.
 *
 * Each row shows the answer the RMO recorded, the engine's suggestion where
 * there is one, and the box that overrides it. An empty box means "use the
 * suggestion"; a typed 0 means "this question scores nothing". Those are
 * different, and `readManualScores` keeps them apart.
 */
export function RmoScoringPanel({
  form, sections, sex, onScoreChange, onAcceptSuggestions, disabled = false,
}: Props) {
  const suggestions = useMemo(
    () => suggestQuestionScores(sections, { sex }),
    [sections, sex],
  )

  // Group the scorable fields by scored section, in questionnaire order.
  const groups = useMemo(() => {
    const bySection = new Map<string, typeof RMO_FIELDS>()
    for (const f of RMO_FIELDS) {
      if (!isScorableField(f.n, f.l)) continue
      const key = FIELD_SECTION.get(f.n)
      if (!key) continue
      const list = bySection.get(key) ?? []
      list.push(f)
      bySection.set(key, list)
    }
    return [...bySection.entries()].map(([key, fields]) => ({
      key,
      name: SECTION_NAME.get(key as never) ?? key,
      declaredMax: DECLARED_MAX.get(key as never) ?? 0,
      fields,
    }))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#101828] dark:text-[#F9FAFB]">Scoring</h2>
        <p className="text-sm text-[#667085] dark:text-[#94A3B8] mt-1">
          Score each question. Where the system can work a score out from the
          answer it is filled in for you — change any of them. Leave a box empty
          to keep the suggested score; enter <span className="font-semibold">0</span> to
          score the question nothing.
        </p>
      </div>

      {groups.map((g) => {
        const answered = g.fields.filter((f) => (form[f.n] ?? "").trim() !== "").length
        const scored = g.fields.filter(
          (f) => (form[scoreFieldName(f.n)] ?? "").trim() !== "",
        ).length
        const subtotal = g.fields.reduce((n, f) => {
          const manual = (form[scoreFieldName(f.n)] ?? "").trim()
          if (manual !== "") return n + (Number(manual) || 0)
          return n + (suggestions[f.n]?.suggested ?? 0)
        }, 0)
        const outOf = g.fields.reduce((n, f) => n + (suggestions[f.n]?.max ?? 10), 0)
        const fillable: Array<[string, number]> = g.fields
          .filter((f) => (form[scoreFieldName(f.n)] ?? "").trim() === "")
          .flatMap((f) => {
            const v = suggestions[f.n]?.suggested
            return v == null ? [] : [[f.n, v] as [string, number]]
          })

        return (
          <section
            key={g.key}
            className="border border-[#EAECF0] dark:border-[#374151] rounded-xl overflow-hidden"
          >
            <header className="flex flex-wrap items-center gap-3 px-5 py-3 bg-[#F9FAFB] dark:bg-[#111827] border-b border-[#EAECF0] dark:border-[#374151]">
              <h3 className="text-sm font-semibold text-[#101828] dark:text-[#F9FAFB]">
                {g.name}
              </h3>
              <span className="text-xs text-[#667085] dark:text-[#94A3B8]">
                {answered}/{g.fields.length} answered · {scored} scored by hand
              </span>
              <span className="ml-auto text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] tabular-nums">
                {subtotal} / {outOf}
              </span>
              {/* The questions on this screen are every scorable control in the
                  section. The source document scores a different number of them,
                  so the two totals diverge — say so rather than quietly picking
                  one. Resolving it needs the document's own item list. */}
              {g.declaredMax > 0 && g.declaredMax !== outOf ? (
                <span
                  className="text-xs text-[#B54708] whitespace-nowrap"
                  title={`The source document declares this section out of ${g.declaredMax}, but the form has ${g.fields.length} scorable questions here. Confirm which questions the document scores.`}
                >
                  doc says / {g.declaredMax}
                </span>
              ) : null}
              {fillable.length > 0 && !disabled ? (
                <button
                  type="button"
                  onClick={() => onAcceptSuggestions(fillable)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-[#6B2B26] dark:text-[#A5B4FC] hover:bg-white dark:hover:bg-[#1F2937] transition-colors"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Fill {fillable.length} suggested
                </button>
              ) : null}
            </header>

            <div className="divide-y divide-[#EAECF0] dark:divide-[#374151]">
              {g.fields.map((f) => {
                const answer = (form[f.n] ?? "").trim()
                const s = suggestions[f.n]
                const manual = form[scoreFieldName(f.n)] ?? ""
                const effective = manual.trim() !== "" ? Number(manual) : s?.suggested ?? null
                return (
                  <div
                    key={f.n}
                    className="grid grid-cols-[1fr_auto] gap-4 items-start px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">
                        {f.l}
                      </p>
                      <p className="text-sm text-[#101828] dark:text-[#F9FAFB] mt-0.5 break-words">
                        {answer !== "" ? (
                          answer
                        ) : (
                          <span className="italic text-[#98A2B3] dark:text-[#64748B]">
                            Not answered
                          </span>
                        )}
                      </p>
                      {s && s.suggested === null ? (
                        <p className="inline-flex items-center gap-1 text-xs mt-1"
                           style={{ color: s.derivable ? "#667085" : "#B54708" }}>
                          <AlertCircle className="h-3 w-3" />
                          {s.derivable
                            ? "Answer the question for a suggested score, or score it yourself"
                            : "The system cannot score this one — your score is the only score"}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={s?.max ?? 10}
                        disabled={disabled}
                        name={scoreFieldName(f.n)}
                        value={manual}
                        onChange={(e) => onScoreChange(f.n, e.target.value)}
                        placeholder={s?.suggested != null ? String(s.suggested) : "—"}
                        aria-label={`Score for ${f.l}`}
                        className="w-16 h-10 px-2 text-center border border-[#D0D5DD] dark:border-[#374151] rounded-lg bg-white dark:bg-[#1F2937] text-sm font-semibold text-[#101828] dark:text-[#F9FAFB] focus:outline-none focus:ring-2 focus:ring-[#6B2B26]/10 focus:border-[#6B2B26] disabled:opacity-50"
                      />
                      <span className="text-xs text-[#98A2B3] dark:text-[#64748B] w-10">
                        / {s?.max ?? 10}
                      </span>
                      <span
                        className="text-xs w-14 text-right"
                        title={
                          manual.trim() !== ""
                            ? "Your score"
                            : "Suggested by the system — leave the box empty to keep it"
                        }
                      >
                        {manual.trim() !== "" ? (
                          <span className="font-semibold text-[#6B2B26] dark:text-[#A5B4FC]">
                            manual
                          </span>
                        ) : effective !== null ? (
                          <span className="text-[#98A2B3] dark:text-[#64748B]">suggested</span>
                        ) : s?.derivable ? (
                          <span className="text-[#98A2B3] dark:text-[#64748B]">no answer</span>
                        ) : (
                          <span className="text-[#B54708]">needs you</span>
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <p className="text-xs text-[#667085] dark:text-[#94A3B8]">
        Questions not listed here — informant details, demographics, marital
        status, work and family history, and every free-text note — are not part
        of the score.
      </p>
    </div>
  )
}
