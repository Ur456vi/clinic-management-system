/**
 * Plan → Appointments materialization (BE-29).
 *
 * On `signPlan` (lib/services/treatment-plan.ts) we walk the plan's
 * items and synthesize a recurring sequence of `Appointment` rows for
 * the in-clinic kinds (IV / REHAB / AESTHETIC). Rx + SUPPLEMENT items
 * don't book a visit — patient takes those at home.
 *
 * Sprint-1 scope: deliberately small. The cadence map is a fixed
 * lookup, the slot picker is "10:00 IST on the next Mon-Sat", and the
 * whole materialization is short-circuited when ANY appointment for
 * this plan already exists (so re-signing or replaying the call is a
 * no-op). A future BE will:
 *   - parse `frequency` more flexibly (every-other-day, custom intervals),
 *   - respect doctor calendar availability (currently we ignore slot
 *     conflicts — the demo seed avoids them),
 *   - link back via a real FK column instead of a notes-JSON prefix.
 *
 * Link-back convention:
 *   `Appointment.notes` first line is a single-line JSON object:
 *     `{"planId":"…","planItemId":"…","sequence":1}`
 *   `parsePlanLinkFromNotes()` (lib/validation/appointment.ts) decodes it.
 *   This avoids a schema migration that's out of scope for BE-29.
 *
 * Counts are returned so the sign endpoint can surface them in its
 * response envelope.
 */

import type { Prisma } from "@prisma/client"
import { AppointmentStatus, PlanItemKind } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

/** Default per-appointment duration. */
const APPOINTMENT_MINUTES = 60

/**
 * Local-clinic start hour. Sprint 1 books all materialized visits at
 * 10:00 IST — calendar UI can later let the patient reschedule.
 *
 * IST is UTC+5:30 with no DST; we hardcode the offset to avoid a
 * tz-database dependency. 10:00 IST == 04:30 UTC.
 */
const SLOT_HOUR_UTC = 4
const SLOT_MINUTE_UTC = 30

/** Default total session count when `durationDays` is unset on an item. */
const DEFAULT_SESSION_COUNT = 3

/** Default cadence interval when `frequency` is unset on an item. */
const DEFAULT_INTERVAL_DAYS = 7

/**
 * Kinds that produce in-clinic appointments. Rx + SUPPLEMENT are
 * take-at-home and intentionally excluded.
 */
const APPOINTMENT_KINDS: ReadonlySet<PlanItemKind> = new Set<PlanItemKind>([
  PlanItemKind.IV,
  PlanItemKind.REHAB,
  PlanItemKind.AESTHETIC,
])

// ---------------------------------------------------------------------------
// Helpers (exported for re-use / unit-testability in later sprints)
// ---------------------------------------------------------------------------

/**
 * True when this kind of plan item is materialized into appointments.
 * RX + SUPPLEMENT return false (patient takes them at home).
 */
export function kindRequiresAppointment(kind: PlanItemKind): boolean {
  return APPOINTMENT_KINDS.has(kind)
}

/**
 * Map a free-text `frequency` string to a day-interval.
 *
 *   "daily"         -> 1
 *   "twice-weekly"  -> 3
 *   "weekly"        -> 7
 *   anything else   -> 7  (safe default for the demo)
 *
 * Matching is case- and punctuation-insensitive. Future sprints can
 * lift this into a richer parser; for Sprint 1 the protocol-library
 * UI will only emit these three tokens.
 */
export function cadenceToDays(frequency: string | null | undefined): number {
  if (!frequency) return DEFAULT_INTERVAL_DAYS
  const normalized = frequency.toLowerCase().replace(/[\s_]+/g, "-").trim()
  if (normalized === "daily" || normalized === "every-day") return 1
  if (
    normalized === "twice-weekly" ||
    normalized === "bi-weekly" ||
    normalized === "two-times-weekly"
  ) {
    return 3
  }
  if (normalized === "weekly" || normalized === "once-weekly") return 7
  return DEFAULT_INTERVAL_DAYS
}

/**
 * Pick the next working-day 10:00-IST slot strictly after `after`.
 *
 * Working week is Mon-Sat (Sunday = 0 in JS Date semantics is skipped).
 * If `after` falls before today's 10:00 IST window we still advance to
 * tomorrow — Sprint-1 simplification, we don't try to fit same-day
 * walk-ins from the sign endpoint.
 */
export function pickNextSlot(after: Date): Date {
  const next = new Date(
    Date.UTC(
      after.getUTCFullYear(),
      after.getUTCMonth(),
      after.getUTCDate() + 1,
      SLOT_HOUR_UTC,
      SLOT_MINUTE_UTC,
      0,
      0,
    ),
  )
  // Advance off Sunday (UTC day-of-week 0 for 04:30 UTC == 10:00 IST same
  // calendar day, so this is correct in IST as well — the offset never
  // crosses a date boundary for working hours).
  while (next.getUTCDay() === 0) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

/** Encode the plan link into the first line of `Appointment.notes`. */
function encodePlanLinkLine(args: {
  planId: string
  planItemId: string
  sequence: number
}): string {
  // Single-line JSON — `parsePlanLinkFromNotes` reads only the first line.
  return JSON.stringify({
    planId: args.planId,
    planItemId: args.planItemId,
    sequence: args.sequence,
  })
}

// ---------------------------------------------------------------------------
// Idempotency probe
// ---------------------------------------------------------------------------

/**
 * Return true when at least one Appointment for `patientId` already
 * carries a plan-link prefix referencing `planId`. We scope by patient
 * first to hit the (patientId, startsAt) index, then filter by the
 * notes prefix.
 *
 * Sprint-1 simplification: if ANY linked appointment exists, the entire
 * plan is treated as already materialized. A finer-grained "missing
 * sessions only" rebuild is deferred.
 */
async function hasExistingPlanAppointments(args: {
  client: Prisma.TransactionClient | typeof db
  planId: string
  patientId: string
}): Promise<boolean> {
  const prefix = `{"planId":"${args.planId}"`
  const row = await args.client.appointment.findFirst({
    where: {
      patientId: args.patientId,
      notes: { startsWith: prefix },
    },
    select: { id: true },
  })
  return row !== null
}

// ---------------------------------------------------------------------------
// Per-item count
// ---------------------------------------------------------------------------

function sessionCount(durationDays: number | null, interval: number): number {
  if (durationDays === null || durationDays === undefined) {
    return DEFAULT_SESSION_COUNT
  }
  return Math.max(1, Math.floor(durationDays / interval))
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export type MaterializationResult = {
  /** Number of Appointment rows inserted in this call. */
  created: number
  /**
   * Number of items skipped — either because they were take-at-home
   * (Rx / SUPPLEMENT) or because the plan was already materialized.
   * For Sprint 1 this is a simple counter, not a per-item breakdown.
   */
  skipped: number
  /** Ids of the appointments created in this call (in insertion order). */
  appointmentIds: string[]
}

/**
 * Materialize the recurring appointment sequence for a SIGNED plan.
 *
 * Contract:
 *   - Caller MUST have already flipped the plan to SIGNED in the same
 *     transaction (when `opts.tx` is passed). We don't gate on status
 *     here — the caller owns the lifecycle check.
 *   - Idempotent: if any prior call seeded appointments for this plan,
 *     we return `{ created: 0, skipped: <itemCount> }` without writing.
 *   - When `opts.tx` is provided, all DB work runs on that transaction
 *     client. Otherwise we open a self-contained `$transaction`.
 *
 * Slot picking:
 *   - First session: `pickNextSlot(opts.signedAt)` — next Mon-Sat 10:00 IST.
 *   - Subsequent sessions: previous slot + `cadenceToDays(item.frequency)`.
 *   - If a candidate slot lands on Sunday we bump forward to Monday.
 *   - We do NOT run a slot-conflict check in Sprint 1 (demo seed avoids
 *     them; a future BE will integrate `hasSlotConflict`).
 *
 * Audit:
 *   - No per-appointment AuditLog rows. The plan-sign audit row from
 *     `signPlan` already covers the "what triggered this" question;
 *     wiring per-appointment audit here would double-write for every
 *     row and clutter the audit timeline. Future sprints can add a
 *     single roll-up "MATERIALIZE" audit entry on `TreatmentPlan`.
 */
export async function materializeAppointmentsForPlan(
  planId: string,
  opts: {
    tx?: Prisma.TransactionClient
    signedAt: Date
    signedById: string
  },
): Promise<MaterializationResult> {
  const run = async (
    client: Prisma.TransactionClient,
  ): Promise<MaterializationResult> => {
    const plan = await client.treatmentPlan.findUnique({
      where: { id: planId },
      include: {
        items: {
          orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
        },
      },
    })
    if (!plan) throw new NotFoundError("Treatment plan not found")

    // Resolve signing doctor's Staff row. `Appointment.staffId` FKs to
    // Staff, not User — match the convention in `appointment.ts`.
    const signerStaff = await client.staff.findUnique({
      where: { userId: opts.signedById },
      select: { id: true },
    })
    if (!signerStaff) {
      // Without a Staff row we can't satisfy the staffId FK. Treat as
      // a soft no-op so the sign endpoint doesn't 500 — the plan is
      // still signed and the FE can offer a manual-book path.
      return {
        created: 0,
        skipped: plan.items.length,
        appointmentIds: [],
      }
    }

    const alreadyDone = await hasExistingPlanAppointments({
      client,
      planId: plan.id,
      patientId: plan.patientId,
    })
    if (alreadyDone) {
      return {
        created: 0,
        skipped: plan.items.length,
        appointmentIds: [],
      }
    }

    const appointmentIds: string[] = []
    let skipped = 0

    for (const item of plan.items) {
      if (!kindRequiresAppointment(item.kind)) {
        skipped += 1
        continue
      }

      const interval = cadenceToDays(item.frequency)
      const count = sessionCount(item.durationDays, interval)

      let cursor = pickNextSlot(opts.signedAt)
      for (let seq = 1; seq <= count; seq += 1) {
        // Bump Sunday onto Monday for the second-and-later sessions.
        while (cursor.getUTCDay() === 0) {
          cursor.setUTCDate(cursor.getUTCDate() + 1)
        }
        const startsAt = new Date(cursor.getTime())
        const endsAt = new Date(startsAt.getTime() + APPOINTMENT_MINUTES * 60_000)

        const noteLine = encodePlanLinkLine({
          planId: plan.id,
          planItemId: item.id,
          sequence: seq,
        })

        const created = await client.appointment.create({
          data: {
            patientId: plan.patientId,
            staffId: signerStaff.id,
            departmentId: null,
            startsAt,
            endsAt,
            status: AppointmentStatus.REQUESTED,
            reason: `Treatment plan: ${item.name}`,
            notes: noteLine,
            createdById: null,
          },
          select: { id: true },
        })
        appointmentIds.push(created.id)

        // Advance the cursor by `interval` days for the next session.
        cursor = new Date(cursor.getTime())
        cursor.setUTCDate(cursor.getUTCDate() + interval)
      }
    }

    return {
      created: appointmentIds.length,
      skipped,
      appointmentIds,
    }
  }

  if (opts.tx) return run(opts.tx)
  return db.$transaction((tx) => run(tx))
}
