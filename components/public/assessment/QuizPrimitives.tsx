"use client";

/**
 * Visual primitives for the Health Assessment wizard, derived from the
 * Figma frames (clinic-dryuvraaj, bottom row). They share the public
 * site's brand palette (--brand-burgundy, --brand-olive, --brand-cream)
 * and Playfair display serif for headings.
 *
 * Components:
 *   - QuizHeader       — cursive logotype + tagline (matches the Figma)
 *   - LevelProgressBar — 6-segment burgundy fill bar across the top
 *   - CategoryRail     — left rail with 6 category cards, active one
 *                        outlined in burgundy with burgundy text
 *   - OptionTile       — selectable answer tile (cream fill, olive outline
 *                        when selected)
 *   - YesNoToggle      — for multi-toggle questions (Q14)
 *   - ChipToggle       — for the comorbidities multi-select (Q13)
 *   - PrevNextBar      — Previous / Next row above the progress bar
 */

import * as React from "react";

import { CATEGORIES, type CategoryKey } from "./types";

/* ──────────────────────────────────────────────────────────────────── */

export function QuizHeader() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span
        style={{
          fontFamily: "var(--font-script)",
          color: "var(--brand-rule)",
          fontSize: "clamp(28px, 3vw, 40px)",
          lineHeight: 1,
          letterSpacing: "0.02em",
        }}
      >
        Dr. Yuvraaj Singh, M.D.
      </span>
      <p
        className="text-sm"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--brand-ink)",
        }}
      >
        A Clinical Approach to Health Optimization
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function LevelProgressBar({
  activeLevel,
}: {
  activeLevel: number; // 1..6, the level currently being filled
}) {
  return (
    <div
      className="flex items-stretch overflow-hidden rounded-full"
      style={{ background: "var(--brand-olive-soft)" }}
    >
      {[1, 2, 3, 4, 5, 6].map((level) => {
        const isPast = level < activeLevel;
        const isActive = level === activeLevel;
        const isFilled = isPast || isActive;
        return (
          <div
            key={level}
            className="flex-1 flex items-center justify-center py-2.5"
            style={{
              background: isFilled ? "var(--brand-burgundy)" : "transparent",
              color: isFilled ? "white" : "var(--brand-ink-soft)",
              borderTopRightRadius: isActive ? 9999 : 0,
              borderBottomRightRadius: isActive ? 9999 : 0,
              transition: "background-color 0.25s ease",
            }}
          >
            <span className="text-xs md:text-sm font-semibold tracking-wide">
              Level {level}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function CategoryRail({ active }: { active: CategoryKey }) {
  return (
    <aside className="flex flex-col gap-4 md:gap-5 sticky top-24">
      {CATEGORIES.map((c) => {
        const isActive = c.key === active;
        return (
          <div
            key={c.key}
            className="rounded-2xl px-5 py-6 flex items-center justify-center text-center min-h-[120px] transition-colors"
            style={
              isActive
                ? {
                    background: "var(--brand-burgundy-soft)",
                    border: "1.5px solid var(--brand-burgundy)",
                    color: "var(--brand-burgundy)",
                  }
                : {
                    background: "var(--brand-olive-soft)",
                    border: "1.5px solid transparent",
                    color: "var(--brand-ink)",
                  }
            }
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "17px",
                lineHeight: 1.2,
                fontWeight: 500,
              }}
            >
              {c.label}
            </span>
          </div>
        );
      })}
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function OptionTile({
  label,
  score,
  selected,
  onClick,
}: {
  label: string;
  score?: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl px-5 py-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: "var(--brand-burgundy-soft)",
        border: selected
          ? "2px solid var(--brand-olive)"
          : "2px solid transparent",
        boxShadow: selected
          ? "0 0 0 1px rgba(109, 121, 86, 0.08)"
          : "none",
      }}
    >
      <span className="text-sm md:text-base" style={{ color: "var(--brand-ink)" }}>
        {/* letter prefix wrapped by caller */}
        {label}
        {/* {typeof score === "number" ? (
          <span style={{ color: "var(--brand-ink-soft)" }}> ({score})</span>
        ) : null} */}
      </span>
    </button>
  );
}

/** Helper: render an (a)/(b)/(c)/(d) prefix in front of an OptionTile. */
export function letterPrefix(i: number): string {
  return String.fromCharCode(97 + i); // 'a'+i
}

/* ──────────────────────────────────────────────────────────────────── */

export function YesNoToggle({
  label,
  yesScore,
  noScore,
  value,
  onChange,
}: {
  label: string;
  yesScore: number;
  noScore: number;
  value: boolean | undefined;
  onChange: (yes: boolean) => void;
}) {
  return (
    <div
      className="w-full rounded-xl px-5 py-4 flex items-center justify-between gap-4"
      style={{
        background: "var(--brand-burgundy-soft)",
        border:
          value !== undefined
            ? "2px solid var(--brand-olive)"
            : "2px solid transparent",
      }}
    >
      <span className="text-sm md:text-base" style={{ color: "var(--brand-ink)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{
            background:
              value === true ? "var(--brand-burgundy)" : "transparent",
            color: value === true ? "white" : "var(--brand-burgundy)",
            border: "1.5px solid var(--brand-burgundy)",
          }}
        >
          Yes 
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{
            background:
              value === false ? "var(--brand-ink)" : "transparent",
            color: value === false ? "white" : "var(--brand-ink)",
            border: "1.5px solid var(--brand-ink-soft)",
          }}
        >
          No 
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function ChipToggle({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full text-left rounded-xl px-5 py-4 transition-all focus:outline-none focus-visible:ring-2"
      style={{
        background: "var(--brand-burgundy-soft)",
        border: selected
          ? "2px solid var(--brand-olive)"
          : "2px solid transparent",
      }}
    >
      <span className="text-sm md:text-base" style={{ color: "var(--brand-ink)" }}>
        {label}
      </span>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function PrevNextBar({
  onPrev,
  onNext,
  nextDisabled,
  nextLabel = "Next",
}: {
  onPrev: (() => void) | null;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: "var(--brand-ink)" }}
        >
          ← Previous
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline disabled:opacity-40 disabled:hover:no-underline disabled:cursor-not-allowed"
        style={{ color: "var(--brand-ink)" }}
      >
        {nextLabel} →
      </button>
    </div>
  );
}
