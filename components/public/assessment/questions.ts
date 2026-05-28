/**
 * The 16 questions of the Health Assessment, extracted from the Figma
 * file `clinic-dryuvraaj`. Each question carries its category (used both
 * for the active-level progress bar and per-category subtotals on the
 * results page).
 *
 * Question numbers here map 1:1 to the Figma "Question N:" labels. The
 * sole exception is question 9 ("irregular cycles / hot flashes / sleep
 * disturbances") which is unnumbered in the Figma but slotted between
 * the hormonal-strength/mood-swings split (Q8) and the stress questions.
 */
import type { QuizQuestion } from "./types";

export const QUESTIONS: QuizQuestion[] = [
  /* ---- Level 1 — Energy & Performance ---- */
  {
    kind: "single",
    id: "q1",
    category: "energy",
    prompt:
      "Are you tired and lethargic even after an 8-hr sleep? How is your daily energy level?",
    options: [
      { label: "Excellent, consistent throughout the day", score: 0 },
      { label: "Good but dips after mid-day", score: 1 },
      { label: "Often fatigued", score: 2 },
      { label: "Constant exhaustion", score: 3 },
    ],
  },
  {
    kind: "single",
    id: "q2",
    category: "energy",
    prompt: "Do you experience brain fog or poor concentration or forgetfulness?",
    options: [
      { label: "Never", score: 0 },
      { label: "Occasionally", score: 1 },
      { label: "Frequently", score: 2 },
      { label: "Almost daily", score: 3 },
    ],
  },
  {
    kind: "single",
    id: "q3",
    category: "energy",
    prompt: "How is your sleep quality?",
    options: [
      { label: "Deep and refreshing", score: 0 },
      { label: "Light but manageable", score: 1 },
      { label: "Disturbed / waking up often", score: 2 },
      { label: "Poor sleep / insomnia", score: 3 },
    ],
  },

  /* ---- Level 2 — Metabolic Health ---- */
  {
    kind: "single",
    id: "q4",
    category: "metabolic",
    prompt: "Have you noticed weight gain recently?",
    options: [
      { label: "No", score: 0 },
      { label: "Slight increase", score: 1 },
      { label: "Moderate gain", score: 2 },
      { label: "Significant / difficult to lose", score: 3 },
    ],
  },
  {
    kind: "single",
    id: "q5",
    category: "metabolic",
    prompt:
      "Do you have cravings for sugar or carbs? Or are you hungry even after a full meal?",
    options: [
      { label: "Rarely", score: 0 },
      { label: "Occasionally", score: 1 },
      { label: "Frequently", score: 2 },
      { label: "Strong daily cravings", score: 3 },
    ],
  },
  {
    kind: "single",
    id: "q6",
    category: "metabolic",
    prompt: "Do you feel sleepy after meals?",
    options: [
      { label: "Never", score: 0 },
      { label: "Occasionally", score: 1 },
      { label: "Often", score: 2 },
      { label: "Almost always", score: 3 },
    ],
  },

  /* ---- Level 3 — Hormonal Health ---- */
  {
    kind: "single",
    id: "q7",
    category: "hormonal",
    prompt: "How is your libido?",
    options: [
      { label: "Strong", score: 0 },
      { label: "Slightly reduced", score: 1 },
      { label: "Low", score: 2 },
      { label: "Very low / absent", score: 3 },
    ],
  },
  {
    kind: "splitGender",
    id: "q8",
    category: "hormonal",
    defaultVariant: "female",
    male: {
      prompt: "Have you noticed reduced muscle strength or endurance?",
      options: [
        { label: "No", score: 0 },
        { label: "Slightly", score: 1 },
        { label: "Moderate", score: 2 },
        { label: "Significant", score: 3 },
      ],
    },
    female: {
      prompt: "Do you experience mood swings or irritability?",
      options: [
        { label: "Rarely", score: 0 },
        { label: "Occasionally", score: 1 },
        { label: "Frequently", score: 2 },
        { label: "Severe", score: 3 },
      ],
    },
  },
  {
    kind: "single",
    id: "q9",
    category: "hormonal",
    prompt: "Any irregular cycles / hot flashes / sleep disturbances?",
    options: [
      { label: "No", score: 0 },
      { label: "Mild", score: 1 },
      { label: "Moderate", score: 2 },
      { label: "Severe", score: 3 },
    ],
  },

  /* ---- Level 4 — Stress & Recovery ---- */
  {
    kind: "single",
    id: "q10",
    category: "stress",
    prompt: "How would you rate your stress levels?",
    options: [
      { label: "Low", score: 0 },
      { label: "Moderate", score: 1 },
      { label: "High", score: 2 },
      { label: "Very high", score: 3 },
    ],
  },
  {
    kind: "single",
    id: "q11",
    category: "stress",
    prompt: "Do you feel refreshed after rest or weekends?",
    options: [
      { label: "Yes", score: 0 },
      { label: "Sometimes", score: 1 },
      { label: "Rarely", score: 2 },
      { label: "Never", score: 3 },
    ],
  },

  /* ---- Level 5 — Inflammation & General Health ---- */
  {
    kind: "single",
    id: "q12",
    category: "inflammation",
    prompt: "Do you experience body aches or joint stiffness?",
    options: [
      { label: "No", score: 0 },
      { label: "Mild", score: 1 },
      { label: "Moderate", score: 2 },
      { label: "Severe", score: 3 },
    ],
  },
  {
    kind: "comorbidities",
    id: "q13",
    category: "inflammation",
    prompt: "Do you have any of the following?",
    options: [
      "Hypertension",
      "Diabetes / prediabetes",
      "Thyroid disorder",
      "High cholesterol",
      "Cardiac Disease",
      "Cancer (current treatment or survivor)",
    ],
  },
  {
    kind: "multiToggle",
    id: "q14",
    category: "inflammation",
    prompt: "Do you experience any of the following?",
    options: [
      { label: "Frequent Headaches", yesScore: 1, noScore: 0 },
      { label: "Frequent Constipation", yesScore: 1, noScore: 0 },
      { label: "Frequent Heartburn", yesScore: 1, noScore: 0 },
      { label: "Frequent Diarrhoea", yesScore: 1, noScore: 0 },
    ],
  },

  /* ---- Level 6 — Lifestyle ---- */
  {
    kind: "single",
    id: "q15",
    category: "lifestyle",
    prompt: "How often do you exercise?",
    options: [
      { label: "4–5 times/week", score: 0 },
      { label: "2–3 times/week", score: 1 },
      { label: "Rarely", score: 2 },
      { label: "Never", score: 3 },
    ],
  },
  {
    kind: "single",
    id: "q16",
    category: "lifestyle",
    prompt: "Alcohol consumption",
    options: [
      { label: "None", score: 0 },
      { label: "Occasional", score: 1 },
      { label: "Weekly", score: 2 },
      { label: "Frequent", score: 3 },
    ],
  },
  // q17 is "Smoking" in the design — kept as Q17 (1-indexed in the Figma)
  // but is the 17th question. The Figma labels it "Question 16:" because it
  // re-uses the prior numbering. We keep our own 1..16 (this is index 16).
];

export const TOTAL_STEPS = QUESTIONS.length;
