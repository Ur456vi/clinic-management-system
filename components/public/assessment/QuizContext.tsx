"use client";

/**
 * Quiz state context for the Health Assessment wizard.
 *
 * Holds the user's sex selection (set on the intro screen) plus the map
 * of answers keyed by question id. Persists to localStorage so a refresh
 * mid-wizard doesn't lose progress, but lazy-hydrates so SSR doesn't
 * mismatch.
 *
 * Exposes:
 *   - `useQuiz()`               — full state + setters
 *   - `useQuizAnswered(id)`     — convenience: is this question answered?
 *
 * Reset behaviour: `reset()` clears both memory and localStorage. The
 * intro screen calls this when the user clicks "Start over"; the booking
 * confirmation page calls it after a successful booking.
 */

import * as React from "react";

import type { AnswerValue, QuizState, Sex } from "./types";

const STORAGE_KEY = "vyara.quiz.v1";

type QuizContextValue = {
  state: QuizState;
  hydrated: boolean;
  setSex(sex: Sex): void;
  setAnswer(id: string, value: AnswerValue): void;
  reset(): void;
};

const QuizContext = React.createContext<QuizContextValue | null>(null);

function emptyState(): QuizState {
  return { sex: null, answers: {} };
}

function loadFromStorage(): QuizState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizState>;
    return {
      sex: parsed.sex ?? null,
      answers: parsed.answers ?? {},
    };
  } catch {
    return null;
  }
}

function saveToStorage(state: QuizState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / unavailable — silently ignore. The wizard still works in
    // memory; refresh will just reset.
  }
}

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<QuizState>(emptyState);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage AFTER mount so SSR markup stays empty. The
  // setState calls here are the *purpose* of the effect (mirror external
  // browser state into React state); the React 18 lint rule doesn't
  // recognise that pattern so we silence it.
  React.useEffect(() => {
    const loaded = loadFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (loaded) setState(loaded);
    setHydrated(true);
  }, []);

  // Persist any change once hydrated.
  React.useEffect(() => {
    if (!hydrated) return;
    saveToStorage(state);
  }, [state, hydrated]);

  const value = React.useMemo<QuizContextValue>(
    () => ({
      state,
      hydrated,
      setSex: (sex) => setState((s) => ({ ...s, sex })),
      setAnswer: (id, val) =>
        setState((s) => ({ ...s, answers: { ...s.answers, [id]: val } })),
      reset: () => {
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            // ignore
          }
        }
        setState(emptyState());
      },
    }),
    [state, hydrated],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const ctx = React.useContext(QuizContext);
  if (!ctx) {
    throw new Error("useQuiz must be used inside a <QuizProvider>");
  }
  return ctx;
}

export function useQuizAnswered(id: string): boolean {
  const { state } = useQuiz();
  return id in state.answers;
}
