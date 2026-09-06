/**
 * Read-side service for IPHMH consultation scores.
 *
 * Scores are derived from `Consultation.sections` on every read — nothing is
 * persisted, so a rule change applies retroactively and a cached score can
 * never drift from the answers it summarises. See `lib/scoring/engine.ts`.
 *
 * Access control is deliberately NOT reimplemented here:
 *   - staff reads go through `getConsultation`, which already enforces
 *     `VIEW_ROLES` and writes the READ audit row;
 *   - patient reads take their `patientId` from `requirePatientSession()` and
 *     pin every query to it, so a patient cannot address another patient's
 *     consultation even by guessing its id.
 */

import { ConsultationStatus, ConsultationType, type Role } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/api"
import { getConsultation } from "./consultation"
import {
  PATIENT_COMPLETENESS_THRESHOLD,
  SCORING_VERSION,
  scoreForAdmin,
  scoreForPatient,
  type PatientScoreResult,
  type ScoreResult,
  type Sex,
} from "@/lib/scoring"

/**
 * Statuses a patient may see a score for. A DRAFT is excluded: a half-filled
 * intake would show a misleadingly low number in a self-service portal with no
 * clinician present to explain it.
 */
export const PATIENT_VISIBLE_STATUSES = [
  ConsultationStatus.RMO_DONE,
  ConsultationStatus.IN_PROGRESS,
  ConsultationStatus.SIGNED,
] as const

export type ConsultationScore = ScoreResult & {
  consultationId: string
  patientId: string | null
  consultationDate: Date
  status: ConsultationStatus
}

/** Admin / clinician view of one consultation's score. */
export async function getConsultationScore(
  consultationId: string,
  actor: { userId: string; role: Role },
): Promise<ConsultationScore> {
  const consultation = await getConsultation(consultationId, actor)

  if (consultation.type !== ConsultationType.RMO) {
    throw new NotFoundError("Scoring applies to RMO consultations only")
  }

  const result = scoreForAdmin(consultation.sections, {
    sex: (consultation.patient?.sex ?? null) as Sex | null,
  })

  return {
    ...result,
    consultationId: consultation.id,
    patientId: consultation.patientId,
    consultationDate: consultation.createdAt,
    status: consultation.status,
  }
}

export type ScoreHistoryEntry = {
  consultationId: string
  date: Date
  status: ConsultationStatus
  overallScore: number
  overallMaxScore: number
  /**
   * Change against the previous consultation, or null when the two are not
   * comparable — a different denominator means a section became applicable (or
   * stopped being), and subtracting raw totals across different maxima is
   * misleading. Compare the percentages instead.
   */
  delta: number | null
  redFlagCount: number
  completeness: number
}

/** Newest-first score history for one patient. Staff-facing. */
export async function listPatientScores(
  patientId: string,
  actor: { userId: string; role: Role },
  limit = 10,
): Promise<ScoreHistoryEntry[]> {
  const rows = await fetchRmoConsultations({ patientId, limit })
  // Reuse the audited single-consultation path so every score read is logged.
  const scored: ConsultationScore[] = []
  for (const row of rows) {
    scored.push(await getConsultationScore(row.id, actor))
  }
  return withDeltas(scored)
}

/** Newest-first score history for the calling patient. Portal-facing. */
export async function listSelfScores(
  patientId: string,
  limit = 10,
): Promise<Array<{ consultationId: string; date: Date; overallScore: number; overallMaxScore: number; delta: number | null }>> {
  const rows = await fetchRmoConsultations({
    patientId,
    limit,
    statuses: PATIENT_VISIBLE_STATUSES,
  })

  const scored = rows.map((row) => ({
    ...scoreForAdmin(row.sections, { sex: (row.patient?.sex ?? null) as Sex | null }),
    consultationId: row.id,
    patientId,
    consultationDate: row.createdAt,
    status: row.status,
  }))

  // A thin assessment must not read as a health verdict, so anything below the
  // completeness threshold is withheld from the portal entirely.
  return withDeltas(scored)
    .filter((_, i) => scored[i].completeness >= PATIENT_COMPLETENESS_THRESHOLD)
    .map((e) => ({
      consultationId: e.consultationId,
      date: e.date,
      overallScore: e.overallScore,
      overallMaxScore: e.overallMaxScore,
      delta: e.delta,
    }))
}

export type SelfScoreDetail = PatientScoreResult & {
  consultationId: string
  consultationDate: Date
}

/**
 * One consultation's score for the calling patient.
 *
 * `patientId` comes from the session, never the URL, and is part of the `where`
 * clause — so a mismatched id is a 404, not a leak.
 */
export async function getSelfScore(
  consultationId: string,
  patientId: string,
): Promise<SelfScoreDetail> {
  const row = await db.consultation.findFirst({
    where: {
      id: consultationId,
      patientId,
      type: ConsultationType.RMO,
      status: { in: [...PATIENT_VISIBLE_STATUSES] },
    },
    select: {
      id: true, sections: true, createdAt: true,
      patient: { select: { sex: true } },
    },
  })
  if (!row) throw new NotFoundError("No scored consultation found")

  const ctx = { sex: (row.patient?.sex ?? null) as Sex | null }
  const admin = scoreForAdmin(row.sections, ctx)
  if (admin.completeness < PATIENT_COMPLETENESS_THRESHOLD) {
    throw new NotFoundError("Assessment still in progress")
  }

  return {
    ...scoreForPatient(row.sections, ctx),
    consultationId: row.id,
    consultationDate: row.createdAt,
  }
}

/** Overall score of a patient's most recent RMO consultation, or null. */
export async function latestScoreSummary(
  patientId: string,
): Promise<{ overallScore: number; overallMaxScore: number; consultationDate: Date; scoringVersion: string } | null> {
  const [row] = await fetchRmoConsultations({ patientId, limit: 1 })
  if (!row) return null

  const result = scoreForAdmin(row.sections, {
    sex: (row.patient?.sex ?? null) as Sex | null,
  })
  return {
    overallScore: result.totalScore,
    overallMaxScore: result.maxScore,
    consultationDate: row.createdAt,
    scoringVersion: SCORING_VERSION,
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function fetchRmoConsultations(args: {
  patientId: string
  limit: number
  statuses?: readonly ConsultationStatus[]
}) {
  return db.consultation.findMany({
    where: {
      patientId: args.patientId,
      type: ConsultationType.RMO,
      ...(args.statuses ? { status: { in: [...args.statuses] } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: args.limit,
    select: {
      id: true, sections: true, status: true, createdAt: true,
      patient: { select: { sex: true } },
    },
  })
}

/** Attach the delta against the next-older consultation. Input is newest-first. */
function withDeltas(scored: ConsultationScore[]): ScoreHistoryEntry[] {
  return scored.map((s, i) => {
    const older = scored[i + 1]
    const comparable = older !== undefined && older.maxScore === s.maxScore
    return {
      consultationId: s.consultationId,
      date: s.consultationDate,
      status: s.status,
      overallScore: s.totalScore,
      overallMaxScore: s.maxScore,
      delta: comparable ? s.totalScore - older.totalScore : null,
      redFlagCount: s.redFlagCount,
      completeness: s.completeness,
    }
  })
}
