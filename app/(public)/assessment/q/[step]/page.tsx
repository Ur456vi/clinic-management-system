"use client";

/**
 * Dynamic question step. `/assessment/q/1` … `/assessment/q/16`.
 *
 * The shell (header, progress bar, left rail, prev/next) is the same on
 * every step; the body switches on the question's `kind`:
 *   - single        → 4 OptionTiles in a 2-col grid
 *   - splitGender   → look up the user's sex from QuizContext and render
 *                     the appropriate variant. For sex === "other" we
 *                     render `defaultVariant` (female).
 *   - multiToggle   → vertical list of YesNoToggles
 *   - comorbidities → grid of ChipToggles
 *
 * Validation: Next is disabled until the question is answered. For
 * splitGender / single this means a choice is made; for multiToggle
 * every toggle must be set (we don't assume false-by-default since some
 * users may want to leave one blank — but we coerce missing to false on
 * submit, so we only require *something* selected for at least one toggle).
 * For comorbidities, even an empty selection is valid (some people have
 * none of those conditions), so Next is always enabled.
 */

import { notFound, useRouter } from "next/navigation";
import { use, useEffect } from "react";

import { useQuiz } from "@/components/public/assessment/QuizContext";
import { QUESTIONS, TOTAL_STEPS } from "@/components/public/assessment/questions";
import {
  CategoryRail,
  ChipToggle,
  LevelProgressBar,
  OptionTile,
  PrevNextBar,
  QuizHeader,
  YesNoToggle,
  letterPrefix,
} from "@/components/public/assessment/QuizPrimitives";
import { CATEGORIES, type AnswerValue } from "@/components/public/assessment/types";

export default function QuizStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const router = useRouter();
  const { step: rawStep } = use(params);
  const step = Number.parseInt(rawStep, 10);

  const { state, hydrated, setAnswer } = useQuiz();

  if (!Number.isInteger(step) || step < 1 || step > TOTAL_STEPS) {
    notFound();
  }

  // If the user lands on /q/N without an intro selection, bounce them
  // back to /assessment to pick a sex.
  useEffect(() => {
    if (hydrated && state.sex === null) {
      router.replace("/assessment");
    }
  }, [hydrated, state.sex, router]);

  const question = QUESTIONS[step - 1];
  const category = CATEGORIES.find((c) => c.key === question.category)!;
  const existing = state.answers[question.id];

  const onPrev = step > 1 ? () => router.push(`/assessment/q/${step - 1}`) : null;
  const onNext = () => {
    if (step < TOTAL_STEPS) {
      router.push(`/assessment/q/${step + 1}`);
    } else {
      router.push("/assessment/result");
    }
  };

  const isAnswered = answeredEnough(question, existing);

  return (
    <div className="w-full" style={{ background: "var(--brand-cream-2)" }}>
      <div className="mx-auto max-w-[1200px] px-6 pt-8 pb-16 md:px-12 md:pt-10 md:pb-20">
        <QuizHeader />

        {/* Prev/Next + progress */}
        <div className="mt-8 space-y-3">
          <PrevNextBar
            onPrev={onPrev}
            onNext={onNext}
            nextDisabled={!isAnswered}
            nextLabel={step === TOTAL_STEPS ? "See Results" : "Next"}
          />
          <LevelProgressBar activeLevel={category.level} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Left rail */}
          <div className="md:col-span-3">
            <CategoryRail active={question.category} />
          </div>

          {/* Question body */}
          <div className="md:col-span-9 flex flex-col gap-7">
            <div>
              <h1
                className="font-medium"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--brand-ink)",
                  fontSize: "clamp(28px, 3vw, 38px)",
                }}
              >
                Question {step}:
              </h1>
              <p
                className="mt-5 text-base md:text-lg leading-relaxed max-w-3xl"
                style={{ color: "var(--brand-ink)" }}
              >
                {promptFor(question, state.sex ?? "other")}
              </p>
            </div>

            <QuestionBody
              question={question}
              existing={existing}
              sex={state.sex ?? "other"}
              onAnswer={(v) => setAnswer(question.id, v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

function promptFor(
  q: (typeof QUESTIONS)[number],
  sex: "male" | "female" | "other",
): string {
  if (q.kind === "splitGender") {
    const variant = sex === "male" ? q.male : sex === "female" ? q.female : q[q.defaultVariant];
    return variant.prompt;
  }
  return q.prompt;
}

function answeredEnough(
  q: (typeof QUESTIONS)[number],
  v: AnswerValue | undefined,
): boolean {
  if (q.kind === "comorbidities") return true; // empty selection is valid
  if (!v) return false;
  if (v.kind === "single" || v.kind === "splitGender") return true;
  if (v.kind === "multiToggle") return v.yes.some((x) => x !== undefined);
  return true;
}

function QuestionBody({
  question,
  existing,
  sex,
  onAnswer,
}: {
  question: (typeof QUESTIONS)[number];
  existing: AnswerValue | undefined;
  sex: "male" | "female" | "other";
  onAnswer: (v: AnswerValue) => void;
}) {
  // SINGLE -----------------------------------------------------------
  if (question.kind === "single") {
    const chosen =
      existing?.kind === "single" ? existing.choice : null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((opt, i) => (
          <OptionTile
            key={i}
            label={`(${letterPrefix(i)}) ${opt.label}`}
            score={opt.score}
            selected={chosen === i}
            onClick={() => onAnswer({ kind: "single", choice: i })}
          />
        ))}
      </div>
    );
  }

  // SPLIT GENDER -----------------------------------------------------
  if (question.kind === "splitGender") {
    const variantKey: "male" | "female" =
      sex === "male" ? "male" : sex === "female" ? "female" : question.defaultVariant;
    const variant = question[variantKey];
    const chosen =
      existing?.kind === "splitGender" && existing.variant === variantKey
        ? existing.choice
        : null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variant.options.map((opt, i) => (
          <OptionTile
            key={i}
            label={`(${letterPrefix(i)}) ${opt.label}`}
            score={opt.score}
            selected={chosen === i}
            onClick={() =>
              onAnswer({ kind: "splitGender", variant: variantKey, choice: i })
            }
          />
        ))}
      </div>
    );
  }

  // MULTI TOGGLE -----------------------------------------------------
  if (question.kind === "multiToggle") {
    const current =
      existing?.kind === "multiToggle"
        ? existing.yes
        : new Array(question.options.length).fill(undefined);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((opt, i) => (
          <YesNoToggle
            key={i}
            label={`(${letterPrefix(i)}) ${opt.label}`}
            yesScore={opt.yesScore}
            noScore={opt.noScore}
            value={current[i]}
            onChange={(yes) => {
              const next = [...current];
              next[i] = yes;
              onAnswer({ kind: "multiToggle", yes: next });
            }}
          />
        ))}
      </div>
    );
  }

  // COMORBIDITIES ----------------------------------------------------
  if (question.kind === "comorbidities") {
    const selected =
      existing?.kind === "comorbidities" ? existing.selected : [];
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((label, i) => (
          <ChipToggle
            key={i}
            label={`(${letterPrefix(i)}) ${label}`}
            selected={selected.includes(i)}
            onToggle={() => {
              const next = selected.includes(i)
                ? selected.filter((s) => s !== i)
                : [...selected, i];
              onAnswer({ kind: "comorbidities", selected: next });
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
