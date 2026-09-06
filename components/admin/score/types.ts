/**
 * Wire shapes for the scoring endpoints, as the browser sees them.
 *
 * Mirrors `lib/scoring/types.ts` with dates as ISO strings. Kept separate so a
 * client component never pulls the engine (and its config) into the bundle.
 */

export type RedFlagSeverity = "high" | "moderate"

export type RedFlagRef = {
  field: string
  label: string
  section: string
  severity: RedFlagSeverity
}

export type SectionScore = {
  key: string
  name: string
  score: number
  maxScore: number
  answered: number
  applicable: number
  indeterminate: number
  unconfirmed: number
  redFlags: RedFlagRef[]
}

export type ConsultationScore = {
  consultationId: string
  patientId: string | null
  consultationDate: string
  status: string
  scoringVersion: string
  totalScore: number
  maxScore: number
  completeness: number
  redFlagCount: number
  sections: SectionScore[]
}

export type ScoreHistoryEntry = {
  consultationId: string
  date: string
  status: string
  overallScore: number
  overallMaxScore: number
  delta: number | null
  redFlagCount: number
  completeness: number
}

export { fraction, pct, scoreDate } from "@/components/score/format"
