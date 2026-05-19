/**
 * Patient-portal session helper (BE-50).
 *
 * `requirePatientSession()` is the gate every `/api/patient/me/*` route
 * runs as its first line. It guarantees three things at once:
 *
 *   1. There is an authenticated session — otherwise `UnauthorizedError`
 *      (401) is thrown via `requireSession()`.
 *   2. The session's role is `PATIENT` — otherwise `ForbiddenError`
 *      (403). Staff roles are intentionally rejected here even though
 *      they have broader access elsewhere; the patient portal is a
 *      self-only surface and we never want a clinic user accidentally
 *      hitting these endpoints.
 *   3. The `User` row is linked to a `Patient` row via `Patient.userId`.
 *      If a PATIENT login somehow exists with no Patient backing it
 *      (e.g. the Patient row was archived), we 403 with a clear
 *      message rather than leaking an empty response.
 *
 * The returned `{ userId, patientId }` is what downstream services use
 * to hard-pin queries to the caller's own data.
 *
 * NOTE: scoping is enforced at the *helper* boundary, not by trusting
 * a `patientId` from the query string. Routes that build a `where`
 * clause MUST use the `patientId` returned here.
 */

import { Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError } from "./errors"
import { requireSession, type Session } from "./auth"

export type PatientSession = {
  /** The authenticated User.id. */
  userId: string
  /** The Patient.id the user is linked to. */
  patientId: string
  /** Echo of the raw session for callers that want the email/full-name. */
  session: Session
}

/**
 * Resolve a PATIENT-role session and the linked Patient row.
 *
 * Throws:
 *   - `UnauthorizedError` (401) — no session.
 *   - `ForbiddenError`    (403) — role is not PATIENT, or no Patient row
 *     is linked to this user.
 */
export async function requirePatientSession(): Promise<PatientSession> {
  const session = await requireSession()

  if (session.role !== Role.PATIENT) {
    throw new ForbiddenError("Patient portal endpoints require PATIENT role")
  }

  const patient = await db.patient.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  })

  if (!patient) {
    throw new ForbiddenError("No patient profile linked to this account")
  }

  return { userId: session.userId, patientId: patient.id, session }
}
