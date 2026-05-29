"use client";

/**
 * Booking form — collects a preferred date + time and basic patient
 * info (name / email / phone / optional notes), then POSTs to
 * `/api/assessment-booking` along with the saved quiz answers and score.
 *
 * On success we route to /assessment/confirmation, passing the booking
 * details via sessionStorage so the confirmation page can render them
 * without re-submitting.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CalendarPicker } from "@/components/public/assessment/CalendarPicker";
import { useQuiz } from "@/components/public/assessment/QuizContext";
import { QUESTIONS, TOTAL_STEPS } from "@/components/public/assessment/questions";
import { QuizHeader } from "@/components/public/assessment/QuizPrimitives";
import { scoreQuiz } from "@/components/public/assessment/scoring";
import {
  MailIcon,
  PhoneIcon,
  UserIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldIcon,
} from "@/components/public/icons";
import type { AnswerValue } from "@/components/public/assessment/types";

const CONFIRMATION_KEY = "vyara.quiz.booking.v1";

type FormState = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
};

const empty: FormState = {
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  notes: "",
};

export default function BookAssessmentPage() {
  const router = useRouter();
  const { state, hydrated } = useQuiz();
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => scoreQuiz(state.answers), [state.answers]);
  const answered = Object.keys(state.answers).length;
  const isComplete = answered === TOTAL_STEPS;

  // Bounce to intro if there's nothing to book against.
  useEffect(() => {
    if (hydrated && answered === 0) router.replace("/assessment");
  }, [hydrated, answered, router]);

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.name.trim().length >= 2 &&
    /.+@.+\..+/.test(form.email) &&
    form.phone.trim().length >= 6 &&
    form.date !== "" &&
    form.time !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      patient: {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        sex: state.sex,
      },
      slot: { date: form.date, time: form.time, notes: form.notes.trim() || null },
      assessment: {
        totalScore: result.totalScore,
        scoreOutOf: result.scoreOutOf,
        band: result.band,
        topRisks: result.topRisks,
        suggestedFocus: result.suggestedFocus,
        byCategory: result.byCategory,
        answers: redactAnswersForApi(state.answers),
      },
    };

    try {
      const res = await fetch("/api/assessment-booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Booking failed");
      }
      // Stash the confirmation payload so /confirmation can read it without
      // a follow-up GET. sessionStorage clears when the tab closes.
      try {
        sessionStorage.setItem(
          CONFIRMATION_KEY,
          JSON.stringify({
            ...payload,
            bookingId: json.data?.bookingId ?? "—",
            createdAt: json.data?.createdAt ?? new Date().toISOString(),
          }),
        );
      } catch {
        // ignore
      }
      router.push("/assessment/confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full" style={{ background: "var(--brand-cream-2)" }}>
      <div className="mx-auto max-w-[1100px] px-6 pt-10 pb-16 md:px-12 md:pt-14 md:pb-20 space-y-7">
        {/* <QuizHeader /> */}

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/assessment/result"
            className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: "var(--brand-ink)" }}
          >
            ← Back to your report
          </Link>
          <span
            className="text-xs px-3 py-1 rounded-full"
            style={{
              background: "var(--brand-olive-soft)",
              color: "var(--brand-ink)",
            }}
          >
            Score: <strong>{result.totalScore}</strong> / {result.scoreOutOf}
          </span>
        </div>

        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
            style={{ color: "var(--brand-burgundy)" }}
          >
            Final Step
          </p>
          <h1
            className="font-medium leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--brand-ink)",
              fontSize: "clamp(28px, 3.2vw, 40px)",
            }}
          >
            Book Your Comprehensive Assessment
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed max-w-2xl"
            style={{ color: "var(--brand-ink-soft)" }}
          >
            Pick a date and time that work for you. Our admissions team will
            confirm your slot within 24 hours and share pre-consultation
            preparation guidelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Form */}
          <form
            onSubmit={submit}
            className="md:col-span-7 rounded-2xl p-6 md:p-8 space-y-5"
            style={{ background: "var(--brand-cream)" }}
          >
            <Field
              label="Full Name"
              icon={<UserIcon size={16} />}
              required
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                placeholder="Your full name"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                label="Email"
                icon={<MailIcon size={16} />}
                required
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </Field>
              <Field
                label="Phone Number"
                icon={<PhoneIcon size={16} />}
                required
              >
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-2">
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--brand-ink-soft)" }}
              >
                Preferred Date &amp; Time{" "}
                <span style={{ color: "#B42318" }}>*</span>
              </span>
              <CalendarPicker
                value={{ date: form.date, time: form.time }}
                onChange={({ date, time }) =>
                  setForm((f) => ({ ...f, date, time }))
                }
              />
            </div>

            <Field label="Anything we should know?">
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder="Specific concerns, medications, recent diagnoses…"
                className="rounded-lg border p-3 text-sm w-full resize-y"
                style={{
                  background: "white",
                  borderColor: "var(--brand-rule)",
                  color: "var(--brand-ink)",
                }}
              />
            </Field>

            {error ? (
              <div
                className="rounded-lg border px-4 py-3 text-sm"
                style={{
                  background: "#FEF3F2",
                  borderColor: "#FECDCA",
                  color: "#B42318",
                }}
              >
                {error}
              </div>
            ) : null}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "var(--brand-burgundy)",
                  letterSpacing: "0.1em",
                }}
              >
                {submitting ? "Booking…" : "Confirm Booking"}
                <ArrowRightIcon size={14} />
              </button>
              <p
                className="text-[11px] flex items-center gap-1.5"
                style={{ color: "var(--brand-mute)" }}
              >
                <ShieldIcon size={12} /> Your details are encrypted in transit and only used to schedule this consultation.
              </p>
            </div>

            {!isComplete ? (
              <p
                className="text-xs"
                style={{ color: "var(--brand-warning)" }}
              >
                Note: only {answered} of {TOTAL_STEPS} questions answered.{" "}
                <Link
                  href={`/assessment/q/${Math.max(1, answered + 1)}`}
                  className="font-semibold underline"
                  style={{ color: "var(--brand-warning)" }}
                >
                  Complete your assessment
                </Link>{" "}
                for the most accurate consultation prep.
              </p>
            ) : null}
          </form>

          {/* Summary card */}
          <aside
            className="md:col-span-5 rounded-2xl p-6 md:p-8 space-y-5"
            style={{ background: "var(--brand-olive)" }}
          >
            <p className="text-white/85 text-xs font-semibold uppercase tracking-widest">
              Your Booking Summary
            </p>
            <h3
              className="text-white font-medium leading-snug"
              style={{ fontFamily: "var(--font-display)", fontSize: "24px" }}
            >
              Comprehensive Hormone &amp; Metabolic Assessment
            </h3>

            <ul className="space-y-2.5">
              {[
                "Advanced biomarker analysis",
                "Hormonal evaluation",
                "Metabolic health assessment",
                "Detailed history + physical exam",
                "Personalised optimisation plan",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2 text-sm text-white/90">
                  <CheckCircleIcon
                    size={14}
                    className="mt-1 flex-shrink-0"
                    style={{ color: "white" }}
                  />
                  {l}
                </li>
              ))}
            </ul>

            <div
              className="rounded-xl p-4 mt-4"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <p className="text-white/85 text-xs font-semibold uppercase tracking-widest mb-2">
                Your Assessment
              </p>
              <p className="text-white text-2xl font-bold">
                {result.totalScore}{" "}
                <span className="text-sm font-medium opacity-80">
                  / {result.scoreOutOf}
                </span>
              </p>
              <p className="text-white/85 text-xs mt-1.5">
                Top focus area:{" "}
                <strong>{result.topRisks[0]?.label ?? "—"}</strong>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

const inputCls =
  "h-11 rounded-lg border px-3 text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#7A2329]/15 focus:border-[#7A2329] transition-all";

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-xs font-semibold flex items-center gap-1.5"
        style={{ color: "var(--brand-ink-soft)" }}
      >
        {icon}
        {label}
        {required ? <span style={{ color: "#B42318" }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

/** Strip undefined entries from multiToggle answers before sending. */
function redactAnswersForApi(
  answers: Record<string, AnswerValue>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (!a) continue;
    if (a.kind === "multiToggle") {
      out[q.id] = { kind: "multiToggle", yes: a.yes.map((v) => v ?? false) };
    } else {
      out[q.id] = a;
    }
  }
  return out;
}
