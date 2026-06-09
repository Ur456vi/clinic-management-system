"use client";

/**
 * Assessment results page. Mirrors the Figma Frame 18 layout:
 *   - hero band: "What You'll Discover" bullets + scoring table
 *   - main band: longevity score (arc gauge), top 3 risk bars,
 *                suggested focus pills
 *   - personalised insight paragraph
 *   - next-step CTA card with checklist + Book CTA
 *   - trust badges
 *
 * When the user lands here without a complete assessment, we redirect
 * them back to /assessment to start over.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useQuiz } from "@/components/public/assessment/QuizContext";
import {
  isAssessmentComplete,
  nextUnansweredStep,
  totalStepsForSex,
} from "@/components/public/assessment/questions";
import { scoreQuiz } from "@/components/public/assessment/scoring";
import { QuizHeader } from "@/components/public/assessment/QuizPrimitives";
import {
  SEVERITY_LABEL,
  type QuizResult,
  type SeverityBand,
} from "@/components/public/assessment/types";
import { CTAButton } from "@/components/public/ui";
import {
  CheckCircleIcon,
  HeartPulseIcon,
  MicroscopeIcon,
  ShieldIcon,
  ClockIcon,
  AwardIcon,
  TargetIcon,
  UserIcon,
} from "@/components/public/icons";

const SCORING_BANDS: {
  range: string;
  label: string;
  bg: string;
  fg: string;
}[] = [
  { range: "0 – 10", label: "Optimal Zone", bg: "#E4EBD6", fg: "#4E7A3F" },
  { range: "11 – 20", label: "Mild Imbalance", bg: "#FFF1D6", fg: "#B5642A" },
  { range: "21 – 35", label: "Moderate Dysfunction", bg: "#FBE2D0", fg: "#B5602A" },
  { range: "36+", label: "Significant Imbalance", bg: "#F4D3D3", fg: "#7A2329" },
];

export default function AssessmentResultPage() {
  const router = useRouter();
  const { state, hydrated } = useQuiz();

  // Reload guard: if the user is missing all answers, bounce to intro.
  useEffect(() => {
    if (!hydrated) return;
    const answered = Object.keys(state.answers).length;
    if (answered === 0) router.replace("/assessment");
  }, [hydrated, state.answers, router]);

  const result = useMemo<QuizResult>(
    () => scoreQuiz(state.answers, state.sex),
    [state.answers, state.sex],
  );

  const totalSteps = totalStepsForSex(state.sex);
  const answeredCount = Object.keys(state.answers).length;
  const isComplete = isAssessmentComplete(state.sex, state.answers);
  const resumeStep = nextUnansweredStep(state.sex, state.answers);

  return (
    <div className="w-full" style={{ background: "var(--brand-cream-2)" }}>
      <div className="mx-auto max-w-[1100px] px-6 pt-10 pb-16 md:px-12 md:pt-14 md:pb-20 space-y-7">
        <QuizHeader />

        {!isComplete ? (
          <div
            className="rounded-xl border px-5 py-4 text-sm"
            style={{
              background: "var(--brand-cream)",
              borderColor: "var(--brand-rule)",
              color: "var(--brand-ink-soft)",
            }}
          >
            You answered <strong>{answeredCount}</strong> of <strong>{totalSteps}</strong>{" "}
            questions. This report is based on what you&apos;ve completed so far.{" "}
            <Link
              href={`/assessment/q/${resumeStep}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--brand-burgundy)" }}
            >
              Resume the assessment →
            </Link>
          </div>
        ) : null}

        {/* ── HERO BAND ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div
            className="md:col-span-7 rounded-2xl p-6 md:p-8"
            style={{ background: "var(--brand-cream)" }}
          >
            <h1
              className="font-medium leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--brand-ink)",
                fontSize: "clamp(28px, 3vw, 36px)",
              }}
            >
              What You&apos;ll Discover
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Your personalised assessment is designed to uncover what&apos;s
              really going on beneath the surface.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                { icon: <HeartPulseIcon size={16} />, label: "Your Hormone Health Score" },
                { icon: <MicroscopeIcon size={16} />, label: "Signs of metabolic imbalance" },
                { icon: <ClockIcon size={16} />, label: "Early indicators of fatigue & weight gain" },
                { icon: <ShieldIcon size={16} />, label: "Key areas affecting your long-term health" },
              ].map((b) => (
                <li
                  key={b.label}
                  className="flex items-center gap-3 text-sm"
                  style={{ color: "var(--brand-ink)" }}
                >
                  <span style={{ color: "var(--brand-burgundy)" }}>{b.icon}</span>
                  {b.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Scoring system */}
          <div
            className="md:col-span-5 rounded-2xl p-6 md:p-8"
            style={{ background: "var(--brand-cream)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--brand-burgundy)" }}
            >
              Scoring System
            </p>
            <p
              className="text-[11px] mb-4"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              Total Score Range: 0 – ~50
            </p>
            <div className="space-y-2">
              {SCORING_BANDS.map((b) => (
                <div
                  key={b.range}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium"
                  style={{ background: b.bg, color: b.fg }}
                >
                  <span className="font-bold">{b.range}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SCORE / RISKS / FOCUS ───────────────────────────────── */}
        <div
          className="rounded-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          style={{ background: "var(--brand-cream)" }}
        >
          {/* Score gauge */}
          <div className="md:col-span-4">
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--brand-ink)" }}
            >
              Your Longevity Score
            </p>
            <div className="flex items-baseline gap-2">
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "64px",
                  fontWeight: 600,
                  color: "var(--brand-burgundy)",
                  lineHeight: 1,
                }}
              >
                {result.totalScore}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--brand-ink-soft)" }}
              >
                / {result.scoreOutOf}
              </span>
            </div>
            <BandPill band={result.band} />
            <div className="mt-5">
              <ArcGauge value={result.totalScore} max={result.scoreOutOf} band={result.band} />
            </div>
          </div>

          {/* Top 3 risk areas */}
          <div className="md:col-span-5">
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--brand-ink)" }}
            >
              Top 3 Risk Areas
            </p>
            <div className="space-y-3">
              {result.topRisks.map((r) => (
                <RiskBar
                  key={r.key}
                  label={r.label}
                  severity={r.severity}
                  value={result.byCategory[r.key]}
                />
              ))}
            </div>
          </div>

          {/* Suggested Focus */}
          <div className="md:col-span-3">
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--brand-ink)" }}
            >
              Suggested Focus
            </p>
            <ul className="space-y-2">
              {result.suggestedFocus.map((f) => (
                <li
                  key={f.key}
                  className="flex items-center gap-2 text-sm rounded-full px-3 py-2"
                  style={{
                    background: "var(--brand-olive-soft)",
                    color: "var(--brand-ink)",
                  }}
                >
                  <TargetIcon size={14} style={{ color: "var(--brand-burgundy)" }} />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── INSIGHT ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 md:p-8 flex items-start gap-4"
          style={{ background: "var(--brand-cream)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "var(--brand-olive-soft)",
              color: "var(--brand-burgundy)",
            }}
          >
            <UserIcon size={18} />
          </div>
          <div>
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--brand-ink)" }}
            >
              Personalised Insight
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--brand-ink-soft)" }}
            >
              {insightFor(result)}
            </p>
          </div>
        </div>

        {/* ── NEXT STEP CTA ───────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--brand-cream)" }}
        >
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--brand-burgundy)" }}
              >
                The Next Step
              </p>
              <h2
                className="font-medium leading-tight mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--brand-ink)",
                  fontSize: "clamp(22px, 2.5vw, 30px)",
                }}
              >
                Understand Your Body at a Deeper Level
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--brand-ink-soft)" }}
              >
                A data-driven, evidence-based approach to hormone and longevity
                optimisation. A Comprehensive Hormone &amp; Metabolic Assessment
                typically includes:
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Advanced biomarker analysis",
                  "Hormonal evaluation",
                  "Metabolic health assessment",
                  "Pre-consultation detailed history & physical examination",
                  "Personalised post-consultation optimisation plan",
                ].map((l) => (
                  <li
                    key={l}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--brand-ink)" }}
                  >
                    <CheckCircleIcon
                      size={14}
                      style={{ color: "var(--brand-burgundy)", marginTop: 3, flexShrink: 0 }}
                    />
                    {l}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl p-6 flex flex-col justify-between gap-5"
              style={{ background: "var(--brand-olive)" }}
            >
              <div>
                <p className="text-white font-medium text-lg leading-snug">
                  Book a Comprehensive Hormone &amp; Metabolic Assessment
                </p>
                <p className="text-white/85 text-sm mt-2">
                  Build a personalised optimisation plan around your biological
                  profile.
                </p>
              </div>
              <div>
                <Link
                  href="/assessment/book"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white shadow-sm transition-all hover:opacity-95"
                  style={{
                    background: "var(--brand-warning)",
                    letterSpacing: "0.1em",
                  }}
                >
                  Book My Assessment →
                </Link>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 md:px-8 pb-6 md:pb-8"
            style={{ color: "var(--brand-ink-soft)" }}
          >
            {[
              { icon: <ShieldIcon size={20} />, title: "Physician Designed", body: "Evidence-based assessment crafted by experts" },
              { icon: <ClockIcon size={20} />, title: "Takes Just 2 Minutes", body: "Quick, simple & designed for your time" },
              { icon: <AwardIcon size={20} />, title: "100% Confidential", body: "Your data is safe and secure" },
              { icon: <UserIcon size={20} />, title: "Personalised For You", body: "Results tailored to your unique biology" },
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-xl p-4 border flex flex-col gap-1.5"
                style={{
                  background: "var(--brand-cream-2)",
                  borderColor: "var(--brand-rule)",
                }}
              >
                <div style={{ color: "var(--brand-burgundy)" }}>{b.icon}</div>
                <p className="text-xs font-bold" style={{ color: "var(--brand-ink)" }}>
                  {b.title}
                </p>
                <p className="text-[11px]">{b.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <CTAButton href="/assessment" variant="burgundy-outline">
            Restart the Assessment
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

function BandPill({ band }: { band: SeverityBand }) {
  const colors: Record<SeverityBand, { bg: string; fg: string }> = {
    optimal: { bg: "#E4EBD6", fg: "#4E7A3F" },
    mild: { bg: "#FFF1D6", fg: "#B5642A" },
    moderate: { bg: "#FBE2D0", fg: "#B5602A" },
    significant: { bg: "#F4D3D3", fg: "#7A2329" },
  };
  const c = colors[band];
  return (
    <span
      className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.fg }}
    >
      {SEVERITY_LABEL[band]}
    </span>
  );
}

function ArcGauge({
  value,
  max,
  band,
}: {
  value: number;
  max: number;
  band: SeverityBand;
}) {
  // Half-doughnut from -90° to +90°, value 0..max sweeps left → right.
  const pct = Math.min(1, Math.max(0, value / max));
  // Semi-circle path constants
  const r = 70;
  const cx = 100;
  const cy = 90;
  const circ = Math.PI * r; // half circumference
  const filled = pct * circ;
  const gap = circ - filled;

  const bandColors: Record<SeverityBand, string> = {
    optimal: "#4E7A3F",
    mild: "#B5642A",
    moderate: "#B5602A",
    significant: "#7A2329",
  };
  const stroke = bandColors[band];

  return (
    <svg width="200" height="110" viewBox="0 0 200 110" aria-hidden="true">
      {/* Background arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#E6DBC4"
        strokeWidth={14}
        strokeLinecap="round"
      />
      {/* Filled arc */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={stroke}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
      />
      <text
        x={cx - r}
        y={cy + 22}
        fontSize="11"
        fill="#6B7280"
        fontFamily="Inter, sans-serif"
      >
        0
      </text>
      <text
        x={cx + r}
        y={cy + 22}
        fontSize="11"
        fill="#6B7280"
        textAnchor="end"
        fontFamily="Inter, sans-serif"
      >
        {max}
      </text>
    </svg>
  );
}

function RiskBar({
  label,
  severity,
  value,
}: {
  label: string;
  severity: "High" | "Moderate" | "Low";
  value: number;
}) {
  const sevColor =
    severity === "High" ? "#7A2329" : severity === "Moderate" ? "#B5642A" : "#4E7A3F";
  const max = 12; // visual scale ceiling
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span style={{ color: "var(--brand-ink)" }}>{label}</span>
        <span className="font-semibold" style={{ color: sevColor }}>
          {severity}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "var(--brand-cream-2)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: sevColor }}
        />
      </div>
    </div>
  );
}

function insightFor(r: QuizResult): string {
  const top = r.topRisks[0]?.label.toLowerCase() ?? "your overall health";
  switch (r.band) {
    case "optimal":
      return `Your responses suggest your physiology is well-balanced overall. The strongest signal in your profile is around ${top}, where targeted optimisation can help you stay in this zone for the long term.`;
    case "mild":
      return `Your responses indicate mild but meaningful imbalances, particularly around ${top}. These are exactly the early signals that respond best to structured, physician-guided intervention.`;
    case "moderate":
      return `Your responses suggest early signs of metabolic imbalance and hormonal decline, which may be contributing to fatigue and difficulty managing weight. These changes often occur years before standard tests detect them — this is when your test reports turn out to be "Normal" yet you do not feel great within.`;
    case "significant":
      return `Your symptoms strongly indicate significant hormonal or metabolic dysregulation, particularly around ${top}. A structured clinical evaluation is recommended to identify root drivers and rebuild capacity systematically.`;
  }
}
