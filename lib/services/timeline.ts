/**
 * Patient timeline service (BE-21).
 *
 * Produces a unified reverse-chronological feed of all clinical events
 * for one patient — the "what happened to this person, when, in one
 * scroll" view. The shape is intentionally minimal:
 *
 *     { id, type, occurredAt, summary, ref }
 *
 * where `type` is the source discriminator and `ref` carries a tiny
 * source-specific payload (status, doctor name, total, etc.) so the FE
 * can render a row without a follow-up roundtrip.
 *
 * ## Sources
 *
 * Wired this commit:
 *   - Consultation (occurredAt = createdAt; signed rows carry signedAt
 *     too but we still order by createdAt to keep drafts visible)
 *   - Appointment  (occurredAt = startsAt)
 *
 * TODO (open task branches — wire when these models land on main):
 *   - LabResult     (BE-16) — occurredAt = resultedAt ?? collectedAt
 *   - TreatmentPlan (BE-24) — occurredAt = createdAt
 *   - Invoice       (BE-37) — occurredAt = issuedAt
 *
 * Each source has a `fetch<Source>Events()` helper below. Adding a
 * new source is a one-liner per source:
 *   1) implement `fetch<Source>Events()`
 *   2) push its `Promise.all()` call into `buildTimeline()`
 *   3) add the union arm to `TimelineEventType`
 *
 * ## Pagination
 *
 * We use an ISO-timestamp cursor (`?cursor=<iso8601>` -> only items
 * with `occurredAt < cursor`). Opaque-id cursors don't work here
 * because the merged feed is a union of rows from multiple tables.
 *
 * For Sprint-1 each source is over-fetched to `limit` rows, the union
 * is merged & sorted in-process, and we slice to `limit`. With current
 * volumes (≤ thousands of events per patient) this is well within
 * budget. When a patient is genuinely chatty we'll swap to a
 * Postgres `UNION ALL ... ORDER BY ... LIMIT` view; the wire shape
 * stays stable.
 */

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type TimelineEventType =
  | "consultation"
  | "labResult"
  | "treatmentPlan"
  | "appointment"
  | "invoice"

/**
 * One row in the timeline feed.
 *
 *   - `id`         — globally unique; we prefix the underlying row id with
 *                    the source so a consultation and an appointment that
 *                    share a UUID (they won't, but defensively) can't
 *                    collide in client-side keying.
 *   - `type`       — source discriminator.
 *   - `occurredAt` — the natural "when" of the event, ISO-8601 on the
 *                    wire. Drives both ordering and the `cursor` query.
 *   - `summary`    — short human label; the FE shows this in the row.
 *   - `ref`        — tiny source-specific payload. `id` is the primary
 *                    key of the underlying row so the FE can deep-link.
 */
export type TimelineEvent = {
  id: string
  type: TimelineEventType
  occurredAt: string
  summary: string
  ref: { id: string } & Record<string, unknown>
}

export type TimelineResult = {
  items: TimelineEvent[]
  /** ISO timestamp of the last returned item, or `null` if no more pages. */
  nextCursor: string | null
}

// ---------------------------------------------------------------------------
// Source: Consultation
// ---------------------------------------------------------------------------

async function fetchConsultationEvents(args: {
  patientId: string
  before?: Date
  limit: number
}): Promise<TimelineEvent[]> {
  const where: Prisma.ConsultationWhereInput = { patientId: args.patientId }
  if (args.before) where.createdAt = { lt: args.before }

  const rows = await db.consultation.findMany({
    where,
    take: args.limit,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      type: true,
      status: true,
      summary: true,
      createdAt: true,
      signedAt: true,
      createdBy: {
        select: {
          email: true,
          staff: { select: { fullName: true } },
        },
      },
    },
  })

  return rows.map((r) => {
    const doctorName = r.createdBy?.staff?.fullName ?? r.createdBy?.email ?? null
    const summary =
      r.summary ??
      `${r.type === "RMO" ? "RMO" : "Doctor"} consultation (${r.status})`
    return {
      id: `consultation:${r.id}`,
      type: "consultation" as const,
      occurredAt: r.createdAt.toISOString(),
      summary,
      ref: {
        id: r.id,
        consultationType: r.type,
        status: r.status,
        signedAt: r.signedAt ? r.signedAt.toISOString() : null,
        doctorName,
      },
    }
  })
}

// ---------------------------------------------------------------------------
// Source: Appointment
// ---------------------------------------------------------------------------

async function fetchAppointmentEvents(args: {
  patientId: string
  before?: Date
  limit: number
}): Promise<TimelineEvent[]> {
  const where: Prisma.AppointmentWhereInput = { patientId: args.patientId }
  if (args.before) where.startsAt = { lt: args.before }

  const rows = await db.appointment.findMany({
    where,
    take: args.limit,
    orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      status: true,
      reason: true,
      startsAt: true,
      endsAt: true,
      staff: { select: { fullName: true } },
      department: { select: { name: true } },
    },
  })

  return rows.map((r) => {
    const who = r.staff?.fullName ?? "staff"
    const where = r.department?.name ? ` (${r.department.name})` : ""
    const summary = r.reason
      ? `Appointment: ${r.reason} with ${who}${where}`
      : `Appointment with ${who}${where}`
    return {
      id: `appointment:${r.id}`,
      type: "appointment" as const,
      occurredAt: r.startsAt.toISOString(),
      summary,
      ref: {
        id: r.id,
        status: r.status,
        startsAt: r.startsAt.toISOString(),
        endsAt: r.endsAt.toISOString(),
        doctorName: r.staff?.fullName ?? null,
        department: r.department?.name ?? null,
      },
    }
  })
}

// ---------------------------------------------------------------------------
// TODO sources — wire when their models land on main
// ---------------------------------------------------------------------------

// TODO(BE-16): wire LabResult source.
// async function fetchLabResultEvents(args: {
//   patientId: string; before?: Date; limit: number
// }): Promise<TimelineEvent[]> { ... }

// TODO(BE-24): wire TreatmentPlan source.
// async function fetchTreatmentPlanEvents(args: {
//   patientId: string; before?: Date; limit: number
// }): Promise<TimelineEvent[]> { ... }

// TODO(BE-37): wire Invoice source.
// async function fetchInvoiceEvents(args: {
//   patientId: string; before?: Date; limit: number
// }): Promise<TimelineEvent[]> { ... }

// ---------------------------------------------------------------------------
// Aggregator
// ---------------------------------------------------------------------------

/**
 * Build the merged timeline for a single patient.
 *
 *   1) verify the patient exists (404 otherwise — even an empty timeline
 *      should distinguish "no events" from "no patient").
 *   2) fan out to each source, each over-fetching to `limit` rows.
 *   3) merge, sort by `occurredAt desc` (then by id desc for stability),
 *      and slice to `limit`.
 *   4) return `nextCursor` = `occurredAt` of the final row, or null when
 *      no source had more rows than we took.
 */
export async function buildTimeline(args: {
  patientId: string
  limit: number
  cursor?: Date
}): Promise<TimelineResult> {
  const patient = await db.patient.findUnique({
    where: { id: args.patientId },
    select: { id: true },
  })
  if (!patient) throw new NotFoundError("Patient not found")

  const before = args.cursor
  const perSourceLimit = args.limit

  const [consultations, appointments] = await Promise.all([
    fetchConsultationEvents({
      patientId: args.patientId,
      before,
      limit: perSourceLimit,
    }),
    fetchAppointmentEvents({
      patientId: args.patientId,
      before,
      limit: perSourceLimit,
    }),
    // TODO(BE-16): fetchLabResultEvents({ patientId, before, limit: perSourceLimit }),
    // TODO(BE-24): fetchTreatmentPlanEvents({ patientId, before, limit: perSourceLimit }),
    // TODO(BE-37): fetchInvoiceEvents({ patientId, before, limit: perSourceLimit }),
  ])

  const merged: TimelineEvent[] = [...consultations, ...appointments]

  merged.sort((a, b) => {
    if (a.occurredAt === b.occurredAt) return a.id < b.id ? 1 : -1
    return a.occurredAt < b.occurredAt ? 1 : -1
  })

  const sliced = merged.slice(0, args.limit)

  // We only know there's a "next" page when at least one source returned
  // its full `perSourceLimit` AND we didn't include all of its rows in
  // the final slice. Cheap heuristic: if `merged.length > args.limit`,
  // a next page exists.
  const hasMore = merged.length > args.limit
  const nextCursor =
    hasMore && sliced.length > 0
      ? sliced[sliced.length - 1].occurredAt
      : null

  return { items: sliced, nextCursor }
}
