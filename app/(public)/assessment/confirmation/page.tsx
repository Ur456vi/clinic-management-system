"use client";

/**
 * Booking confirmation. Reads the payload stored in sessionStorage by
 * the booking page and renders a clean summary card. Also resets the
 * quiz state so the next visit starts fresh.
 */

import Link from "next/link";
import { useEffect, useState } from "react";

import { useQuiz } from "@/components/public/assessment/QuizContext";
import { QuizHeader } from "@/components/public/assessment/QuizPrimitives";
import { SEVERITY_LABEL, type SeverityBand } from "@/components/public/assessment/types";
import {
  CalendarIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  CheckCircleIcon,
} from "@/components/public/icons";

const CONFIRMATION_KEY = "vyara.quiz.booking.v1";

type Confirmation = {
  bookingId: string;
  createdAt: string;
  patient: { name: string; email: string; phone: string; sex: string | null };
  slot: { date: string; time: string; notes: string | null };
  assessment: {
    totalScore: number;
    scoreOutOf: number;
    band: SeverityBand;
    topRisks: { key: string; label: string; severity: string }[];
  };
};

export default function ConfirmationPage() {
  const [data, setData] = useState<Confirmation | null>(null);
  const [missing, setMissing] = useState(false);
  const { reset } = useQuiz();

  // Read the booking out of sessionStorage exactly once on mount.
  //
  // We deliberately use an empty dependency array (not `[reset]`)
  // because the QuizContext recreates its `reset` setter on every state
  // change. If we depended on `reset`, calling `reset()` here would
  // change the context's state → recreate `reset` → re-trigger this
  // effect → infinite update loop. The captured `reset` closure is fine
  // because internally it only calls React's stable `setState`.
  //
  // The setState calls in here are also the *purpose* of this effect —
  // mirror external browser state into React state. React 18's
  // `set-state-in-effect` lint rule doesn't model that pattern, so we
  // silence it too.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CONFIRMATION_KEY);
      if (!raw) {
        setMissing(true);
        return;
      }
      setData(JSON.parse(raw) as Confirmation);
      // Clear the quiz now that the booking is confirmed.
      reset();
    } catch {
      setMissing(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  if (missing) {
    return (
      <div className="w-full" style={{ background: "var(--brand-cream-2)" }}>
        <div className="mx-auto max-w-[700px] px-6 pt-20 pb-24 md:px-12 text-center space-y-5">
          {/* <QuizHeader /> */}
          <h1
            className="font-medium"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              color: "var(--brand-ink)",
            }}
          >
            We can&apos;t find your booking details
          </h1>
          <p style={{ color: "var(--brand-ink-soft)" }}>
            The confirmation page expects to read a booking from the previous step.
            Please head back to the assessment and try again.
          </p>
          <Link
            href="/assessment"
            className="inline-block rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white"
            style={{ background: "var(--brand-burgundy)", letterSpacing: "0.1em" }}
          >
            Start the Assessment
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full" style={{ background: "var(--brand-cream-2)" }}>
        <div className="mx-auto max-w-[700px] px-6 pt-20 pb-24 text-center">
          <p style={{ color: "var(--brand-ink-soft)" }}>Loading your confirmation…</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.slot.date + "T00:00:00").toLocaleDateString(
    "en-GB",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <div className="w-full" style={{ background: "var(--brand-cream-2)" }}>
      <div className="mx-auto max-w-[900px] px-6 pt-10 pb-16 md:px-12 md:pt-14 md:pb-20 space-y-6">
        {/* <QuizHeader /> */}

        {/* Success banner */}
        <div
          className="rounded-2xl p-7 md:p-9 text-center"
          style={{ background: "var(--brand-olive)" }}
        >
          <div
            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <CheckCircleIcon size={28} style={{ color: "white" }} />
          </div>
          <h1
            className="text-white font-medium leading-tight"
            style={{ fontFamily: "var(--font-display)", fontSize: "32px" }}
          >
            Your assessment is booked
          </h1>
          <p className="text-white/90 mt-2">
            We&apos;ve sent a confirmation to{" "}
            <strong>{data.patient.email}</strong>. Our admissions team will
            reach out within 24 hours to confirm your slot.
          </p>
          <p className="text-white/80 text-xs mt-3">
            Booking reference: <strong>{data.bookingId}</strong>
          </p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DetailCard title="When">
            <DetailRow
              icon={<CalendarIcon size={16} />}
              label="Date"
              value={formattedDate}
            />
            <DetailRow
              icon={<ClockIcon size={16} />}
              label="Time"
              value={data.slot.time}
            />
            {data.slot.notes ? (
              <DetailRow
                icon={<CheckCircleIcon size={16} />}
                label="Notes"
                value={data.slot.notes}
              />
            ) : null}
          </DetailCard>

          <DetailCard title="Patient">
            <DetailRow
              icon={<UserIcon size={16} />}
              label="Name"
              value={data.patient.name}
            />
            <DetailRow
              icon={<MailIcon size={16} />}
              label="Email"
              value={data.patient.email}
            />
            <DetailRow
              icon={<PhoneIcon size={16} />}
              label="Phone"
              value={data.patient.phone}
            />
          </DetailCard>
        </div>

        {/* Assessment snapshot */}
        <div
          className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6"
          style={{ background: "var(--brand-cream)" }}
        >
          <div className="md:flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--brand-burgundy)" }}
            >
              Your Assessment Snapshot
            </p>
            <p
              className="font-medium leading-snug"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                color: "var(--brand-ink)",
              }}
            >
              {SEVERITY_LABEL[data.assessment.band]} —{" "}
              <span style={{ color: "var(--brand-burgundy)" }}>
                {data.assessment.totalScore} / {data.assessment.scoreOutOf}
              </span>
            </p>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Top focus area:{" "}
              <strong>{data.assessment.topRisks[0]?.label ?? "—"}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:max-w-[260px]">
            {data.assessment.topRisks.map((r) => (
              <span
                key={r.key}
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: "var(--brand-olive-soft)",
                  color: "var(--brand-ink)",
                }}
              >
                {r.label} · {r.severity}
              </span>
            ))}
          </div>
        </div>

        {/* What's next */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{ background: "var(--brand-cream)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--brand-burgundy)" }}
          >
            What happens next
          </p>
          <ol className="space-y-3">
            {[
              "Our admissions team calls or emails you within 24 hours to confirm the slot.",
              "You'll receive pre-consultation lab work and a short symptom intake form.",
              "On the day of your visit, you'll meet with Dr. Yuvraaj Singh for a comprehensive evaluation.",
              "A personalised post-consultation plan will be shared, typically within 72 hours.",
            ].map((step, i) => (
              <li
                key={step}
                className="flex items-start gap-3 text-sm"
                style={{ color: "var(--brand-ink)" }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: "var(--brand-burgundy)",
                    color: "white",
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white text-center"
            style={{ background: "var(--brand-burgundy)", letterSpacing: "0.1em" }}
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="inline-block rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest border text-center"
            style={{
              borderColor: "var(--brand-burgundy)",
              color: "var(--brand-burgundy)",
              background: "transparent",
              letterSpacing: "0.1em",
            }}
          >
            Have a Question? Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "var(--brand-cream)" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--brand-burgundy)" }}
      >
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: "var(--brand-olive-soft)",
          color: "var(--brand-burgundy)",
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--brand-mute)" }}
        >
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: "var(--brand-ink)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}
