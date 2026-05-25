/**
 * Quiz data types for the public-site Health Assessment.
 *
 * The quiz is a 16-question wizard split across 6 "levels" (categories).
 * Each question is one of three kinds:
 *   - single        : pick one of N labelled options (the most common shape)
 *   - splitGender   : different question per sex; we pick the variant based
 *                     on the user's declared sex at the intro screen
 *   - multiToggle   : list of yes/no toggles, each scored independently
 *   - comorbidities : multi-select with no individual score (chips), used
 *                     for the "Do you have any of the following?" item.
 *                     Counts as a per-category contribution equal to the
 *                     number of selected items (cap at 3 to keep scoring sane).
 */

export type Sex = "male" | "female" | "other";

export type CategoryKey =
  | "energy"
  | "metabolic"
  | "hormonal"
  | "stress"
  | "inflammation"
  | "lifestyle";

export const CATEGORIES: { key: CategoryKey; label: string; level: number }[] = [
  { key: "energy", label: "Energy & Performance", level: 1 },
  { key: "metabolic", label: "Metabolic Health", level: 2 },
  { key: "hormonal", label: "Hormonal Health", level: 3 },
  { key: "stress", label: "Stress & Recovery", level: 4 },
  { key: "inflammation", label: "Inflammation & General Health", level: 5 },
  { key: "lifestyle", label: "Lifestyle", level: 6 },
];

export type AnswerOption = { label: string; score: number };

export type SingleQuestion = {
  kind: "single";
  id: string;
  category: CategoryKey;
  prompt: string;
  options: AnswerOption[];
};

export type SplitGenderQuestion = {
  kind: "splitGender";
  id: string;
  category: CategoryKey;
  male: { prompt: string; options: AnswerOption[] };
  female: { prompt: string; options: AnswerOption[] };
  /** Fallback shown when sex === "other": which variant to render. */
  defaultVariant: "male" | "female";
};

export type MultiToggleQuestion = {
  kind: "multiToggle";
  id: string;
  category: CategoryKey;
  prompt: string;
  options: { label: string; yesScore: number; noScore: number }[];
};

export type ComorbiditiesQuestion = {
  kind: "comorbidities";
  id: string;
  category: CategoryKey;
  prompt: string;
  /** Labels of the comorbidities. Each selection adds 1 to the category score
   *  (capped at 3 inside `scoring.ts`). */
  options: string[];
};

export type QuizQuestion =
  | SingleQuestion
  | SplitGenderQuestion
  | MultiToggleQuestion
  | ComorbiditiesQuestion;

/* ----- Answer values stored per question id ---------------------------- */

export type SingleAnswer = { kind: "single"; choice: number };
export type SplitGenderAnswer = { kind: "splitGender"; variant: "male" | "female"; choice: number };
export type MultiToggleAnswer = { kind: "multiToggle"; yes: boolean[] };
export type ComorbiditiesAnswer = { kind: "comorbidities"; selected: number[] };

export type AnswerValue =
  | SingleAnswer
  | SplitGenderAnswer
  | MultiToggleAnswer
  | ComorbiditiesAnswer;

export type QuizState = {
  sex: Sex | null;
  answers: Record<string, AnswerValue>;
};

/* ----- Result types ---------------------------------------------------- */

export type SeverityBand =
  | "optimal"
  | "mild"
  | "moderate"
  | "significant";

export const SEVERITY_LABEL: Record<SeverityBand, string> = {
  optimal: "Optimal Zone",
  mild: "Mild Imbalance",
  moderate: "Moderate Dysfunction",
  significant: "Significant Imbalance",
};

export type QuizResult = {
  totalScore: number;
  /** 0-50 capped */
  scoreOutOf: number;
  band: SeverityBand;
  /** subtotals keyed by category */
  byCategory: Record<CategoryKey, number>;
  /** sorted descending by subtotal; max 3 items */
  topRisks: { key: CategoryKey; label: string; severity: "High" | "Moderate" | "Low" }[];
  /** distinct categories to focus on (top 3 by subtotal) */
  suggestedFocus: { key: CategoryKey; label: string }[];
};
