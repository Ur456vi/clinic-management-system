"use client";

/**
 * Health Assessment intro screen.
 *
 * The Figma starts with Question 1 directly, but we need to capture the
 * user's sex first because Question 8 is gender-split (different prompt
 * per sex). We also reset any prior wizard state here so the user always
 * starts fresh from this entry point.
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useQuiz } from "@/components/public/assessment/QuizContext";
import { QuizHeader } from "@/components/public/assessment/QuizPrimitives";
import type { Sex } from "@/components/public/assessment/types";

export default function AssessmentIntroPage() {
  const router = useRouter();
  const { state, setSex, reset, hydrated } = useQuiz();

  // If the user lands here mid-wizard (e.g. browser back from a question),
  // don't auto-reset — they may want to continue. The Start button below
  // will start fresh if no sex is picked yet; the "Continue" button on the
  // header card resumes from the last answered step.

  // Auto-reset on every fresh entry only if there are no answers yet
  // and sex is unset (i.e. first visit). Otherwise leave the state alone.
  useEffect(() => {
    // Nothing to do — explicit Start / Reset buttons drive the flow.
  }, []);

  const begin = (sex: Sex) => {
    if (!hydrated) return;
    setSex(sex);
    router.push("/assessment/q/1");
  };

  const startOver = () => {
    reset();
  };

  const lastAnsweredStep = Object.keys(state.answers).length;
  const hasProgress = state.sex !== null && lastAnsweredStep > 0;

  return (
    <div
      className="w-full"
      style={{ background: "var(--brand-cream-2)" }}
    >
      <div className="mx-auto max-w-[1100px] px-6 pt-10 pb-16 md:px-12 md:pt-14 md:pb-20">
        {/* <QuizHeader /> */}

        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Intro copy */}
          <div className="md:col-span-7">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--brand-burgundy)" }}
            >
              Health Assessment
            </p>
            <h1
              className="font-medium leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(34px, 4vw, 52px)",
              }}
            >
              A 2-minute look beneath the surface of your{" "}
              <span style={{ color: "var(--brand-burgundy)" }}>health.</span>
            </h1>
            <p
              className="mt-5 text-base leading-relaxed max-w-xl"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Sixteen physician-designed questions across six clinical
              areas — energy, metabolism, hormones, stress, inflammation
              and lifestyle. At the end you&apos;ll receive a personalised
              report you can share with the institute to begin a deeper
              evaluation.
            </p>

            <ul className="mt-7 grid grid-cols-2 gap-3 max-w-md text-sm" style={{ color: "var(--brand-ink-soft)" }}>
              <li>· Takes 2 minutes</li>
              <li>· 100% confidential</li>
              <li>· Physician designed</li>
              <li>· Personalised report</li>
            </ul>
          </div>

          {/* Sex picker + Start */}
          <div className="md:col-span-5">
            <div
              className="rounded-2xl p-6 md:p-7 border"
              style={{
                background: "var(--brand-cream)",
                borderColor: "var(--brand-rule)",
              }}
            >
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "var(--brand-ink)" }}
              >
                Before we start
              </p>
              <p
                className="text-xs mb-5"
                style={{ color: "var(--brand-ink-soft)" }}
              >
                One of the questions is tailored by sex. This isn&apos;t
                stored beyond this session unless you book an assessment.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => begin("female")}
                  className="rounded-full py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:opacity-95"
                  style={{
                    background: "var(--brand-burgundy)",
                    letterSpacing: "0.1em",
                  }}
                >
                  I am Female — Start →
                </button>
                <button
                  type="button"
                  onClick={() => begin("male")}
                  className="rounded-full py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:opacity-95"
                  style={{
                    background: "var(--brand-olive)",
                    letterSpacing: "0.1em",
                  }}
                >
                  I am Male — Start →
                </button>
                <button
                  type="button"
                  onClick={() => begin("other")}
                  className="rounded-full py-2.5 text-xs font-semibold uppercase tracking-widest border transition-colors"
                  style={{
                    borderColor: "var(--brand-rule)",
                    color: "var(--brand-ink)",
                    background: "transparent",
                    letterSpacing: "0.1em",
                  }}
                >
                  Prefer not to say — Start →
                </button>
              </div>

              {hasProgress ? (
                <div
                  className="mt-5 pt-5 border-t text-xs"
                  style={{ borderColor: "var(--brand-rule)", color: "var(--brand-ink-soft)" }}
                >
                  You have {lastAnsweredStep} answer{lastAnsweredStep === 1 ? "" : "s"} saved from a previous session.
                  {" "}
                  <button
                    type="button"
                    onClick={startOver}
                    className="font-semibold hover:underline"
                    style={{ color: "var(--brand-burgundy)" }}
                  >
                    Start over
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
