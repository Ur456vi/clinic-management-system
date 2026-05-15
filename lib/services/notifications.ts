/**
 * Notifications service shim (BE-15).
 *
 * Sprint 1 MVP: log the event to the console and persist a row in
 * `AuditLog` so we can reconstruct the handoff history later. Real
 * channel fan-out (in-app feed, push, email) lands in BE-45 -- at that
 * point this module gains a queue producer and the call sites stay the
 * same.
 *
 * Keep the surface small: each helper takes a strongly-typed payload,
 * returns `void`, and never throws. Notification failures must never
 * roll back the originating transaction.
 */

import { db } from "@/lib/db"

/**
 * Payload for the "RMO finished, doctor please pick up" handoff event.
 * Emitted by `consultation.transition` when a consultation moves
 * `DRAFT -> RMO_DONE`.
 */
export type DoctorHandoffPayload = {
  consultationId: string
  patientId: string
  /** User id of the RMO who completed the intake. */
  fromUserId: string
}

/**
 * Notify on-shift doctors that an RMO consultation is ready for pickup.
 *
 * Sprint 1 behaviour:
 *   - `console.info` a structured event line so it shows up in logs.
 *   - Best-effort `AuditLog` row with `action=UPDATE`, `entityType=
 *     "Consultation"`, and `detail.event = "handoff_to_doctor"`.
 *
 * Both side effects are wrapped in try/catch -- a failed log or audit
 * write must not block the state transition that triggered it.
 */
export async function notifyDoctorHandoff(
  payload: DoctorHandoffPayload,
): Promise<void> {
  // eslint-disable-next-line no-console
  console.info({
    event: "doctor_handoff",
    consultationId: payload.consultationId,
    patientId: payload.patientId,
    fromUserId: payload.fromUserId,
    at: new Date().toISOString(),
  })

  try {
    await db.auditLog.create({
      data: {
        actorUserId: payload.fromUserId,
        action: "UPDATE",
        entityType: "Consultation",
        entityId: payload.consultationId,
        detail: {
          event: "handoff_to_doctor",
          patientId: payload.patientId,
        },
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[notifications.notifyDoctorHandoff] audit write failed", err)
  }
}
