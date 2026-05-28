/**
 * Scoring logic for the Health Assessment.
 *
 *   - Sums each answer's score (single / splitGender pick the chosen option's
 *     `score`; multiToggle sums per-toggle yes/no; comorbidities adds 1 per
 *     selection, capped at 3 to keep one mega-comorbidity question from
 *     dominating the band).
 *   - Total is capped to 50 (the design's "Total Score Range: 0 – ~50").
 *   - Severity band mapping mirrors the Figma table:
 *       0–10   Optimal Zone
 *       11–20  Mild Imbalance
 *       21–35  Moderate Dysfunction
 *       36+    Significant Imbalance
 *   - Top-3 Risk Areas: the 3 categories with highest subtotal, each tagged
 *     High / Moderate / Low.
 *   - Suggested Focus: same top 3 categories (de-duplicated).
 */

import { QUESTIONS } from "./questions";
import {
  CATEGORIES,
  type AnswerValue,
  type CategoryKey,
  type QuizResult,
  type SeverityBand,
} from "./types";

const MAX_SCORE = 50;
const COMORBIDITY_CAP = 3;

function bandFor(total: number): SeverityBand {
  if (total <= 10) return "optimal";
  if (total <= 20) return "mild";
  if (total <= 35) return "moderate";
  return "significant";
}

function severityForSubtotal(
  subtotal: number,
  maxForCategory: number,
): "High" | "Moderate" | "Low" {
  if (maxForCategory <= 0) return "Low";
  const ratio = subtotal / maxForCategory;
  if (ratio >= 0.66) return "High";
  if (ratio >= 0.33) return "Moderate";
  return "Low";
}

/** Highest possible subtotal a single category could yield. Used to label
 *  the per-category severity (High/Moderate/Low) on the results page. */
function computeMaxByCategory(): Record<CategoryKey, number> {
  const max: Record<CategoryKey, number> = {
    energy: 0,
    metabolic: 0,
    hormonal: 0,
    stress: 0,
    inflammation: 0,
    lifestyle: 0,
  };
  for (const q of QUESTIONS) {
    switch (q.kind) {
      case "single":
        max[q.category] += Math.max(...q.options.map((o) => o.score));
        break;
      case "splitGender":
        max[q.category] += Math.max(
          ...q.male.options.map((o) => o.score),
          ...q.female.options.map((o) => o.score),
        );
        break;
      case "multiToggle":
        max[q.category] += q.options.reduce(
          (s, o) => s + Math.max(o.yesScore, o.noScore),
          0,
        );
        break;
      case "comorbidities":
        max[q.category] += COMORBIDITY_CAP;
        break;
    }
  }
  return max;
}

export function scoreQuiz(
  answers: Record<string, AnswerValue>,
): QuizResult {
  const byCategory: Record<CategoryKey, number> = {
    energy: 0,
    metabolic: 0,
    hormonal: 0,
    stress: 0,
    inflammation: 0,
    lifestyle: 0,
  };

  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (!a) continue;

    let inc = 0;
    if (a.kind === "single" && q.kind === "single") {
      inc = q.options[a.choice]?.score ?? 0;
    } else if (a.kind === "splitGender" && q.kind === "splitGender") {
      const variant = a.variant === "male" ? q.male : q.female;
      inc = variant.options[a.choice]?.score ?? 0;
    } else if (a.kind === "multiToggle" && q.kind === "multiToggle") {
      inc = q.options.reduce(
        (s, o, i) => s + (a.yes[i] ? o.yesScore : o.noScore),
        0,
      );
    } else if (a.kind === "comorbidities" && q.kind === "comorbidities") {
      inc = Math.min(a.selected.length, COMORBIDITY_CAP);
    }

    byCategory[q.category] += inc;
  }

  const totalUncapped = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const total = Math.min(totalUncapped, MAX_SCORE);

  // Per-category severity using the question-set's possible max.
  const maxByCategory = computeMaxByCategory();

  const ranked = (Object.keys(byCategory) as CategoryKey[])
    .map((k) => ({
      key: k,
      label: CATEGORIES.find((c) => c.key === k)!.label,
      subtotal: byCategory[k],
      severity: severityForSubtotal(byCategory[k], maxByCategory[k]),
    }))
    .sort((a, b) => b.subtotal - a.subtotal);

  const topRisks = ranked.slice(0, 3).map(({ key, label, severity }) => ({
    key,
    label,
    severity,
  }));

  const suggestedFocus = ranked.slice(0, 3).map(({ key, label }) => ({
    key,
    label,
  }));

  return {
    totalScore: total,
    scoreOutOf: MAX_SCORE,
    band: bandFor(total),
    byCategory,
    topRisks,
    suggestedFocus,
  };
}
