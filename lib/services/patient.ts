/**
 * Patient service layer.
 *
 * Routes are intentionally thin: they parse input, call into one of these
 * functions, and return the result. All business rules live here — most
 * importantly:
 *
 *   - `patientNumber` generation (temporary MAX+1; replaced by a Postgres
 *     sequence in BE-09's seed/migration);
 *   - soft-delete (status=ARCHIVED + deletedAt timestamp);
 *   - audit-log writes for every read/write of PHI.
 *
 * The service module never depends on Next.js types — it can be reused
 * from a CLI, a background job, or a future tRPC layer.
 */

import type { Patient, Prisma } from "@prisma/client"
import { PatientStatus } from "@prisma/client"

import { db } from "@/lib/db"
import { NotFoundError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import type {
  CreatePatientInput,
  ListPatientsQuery,
  UpdatePatientInput,
} from "@/lib/validation/patient"

// ---------------------------------------------------------------------------
// Patient number generation (temporary)
// ---------------------------------------------------------------------------

/**
 * Generate the next `PAT-XXXXXX` identifier.
 *
 * TEMPORARY: this scans for the largest existing patient number and adds
 * one. There is an obvious race here (two concurrent inserts will collide
 * and one will be retried by the unique index). BE-09 swaps this for a
 * Postgres sequence; we still want POST /api/patients to work in dev today.
 */
async function nextPatientNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const last = await tx.patient.findFirst({
    where: { patientNumber: { startsWith: "PAT-" } },
    orderBy: { patientNumber: "desc" },
    select: { patientNumber: true },
  })
  let n = 1
  if (last) {
    const tail = Number(last.patientNumber.slice(4))
    if (Number.isFinite(tail) && tail > 0) n = tail + 1
  }
  return `PAT-${String(n).padStart(6, "0")}`
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListPatientsResult = {
  items: Patient[]
  nextCursor: string | null
}

/**
 * Search / filter / paginate patients.
 *
 * The cursor is the `id` of the last row of the previous page. We over-fetch
 * by one row to know whether a next page exists. Ordering is stable —
 * `createdAt desc, id desc` — so the cursor identifies a unique row.
 *
 * `status` defaults to "anything that is not ARCHIVED" (i.e. soft-deleted
 * rows are hidden unless the caller explicitly asks for them).
 */
export async function listPatients(
  input: ListPatientsQuery,
): Promise<ListPatientsResult> {
  const take = Math.min(input.take ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.PatientWhereInput = {}

  if (input.status) {
    where.status = input.status
  } else {
    where.status = { not: PatientStatus.ARCHIVED }
  }

  if (input.primaryDoctorId) {
    where.primaryDoctorId = input.primaryDoctorId
  }

  if (input.search && input.search.length > 0) {
    const q = input.search
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { patientNumber: { contains: q, mode: "insensitive" } },
    ]
  }

  const rows = await db.patient.findMany({
    where,
    take: take + 1,
    ...(input.cursor
      ? { cursor: { id: input.cursor }, skip: 1 }
      : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

/**
 * Fetch a single patient by id. Writes an audit log (action=READ) so we
 * know who looked at the record — required by the data-access policy.
 *
 * Throws `NotFoundError` (404) if no row exists.
 */
export async function getPatient(
  id: string,
  actorUserId: string,
): Promise<Patient> {
  const patient = await db.patient.findUnique({ where: { id } })
  if (!patient) throw new NotFoundError("Patient not found")

  try {
    await db.auditLog.create({
      data: {
        actorUserId,
        action: "READ",
        entityType: "Patient",
        entityId: patient.id,
      },
    })
  } catch (err) {
    // Audit failure must not break the read; log and continue.
    // eslint-disable-next-line no-console
    console.error("[patient.getPatient] audit write failed", err)
  }

  return patient
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a patient and the matching CREATE audit log atomically.
 */
export async function createPatient(
  input: CreatePatientInput,
  actorUserId: string,
): Promise<Patient> {
  return db.$transaction(async (tx) => {
    const patientNumber = await nextPatientNumber(tx)

    const created = await tx.patient.create({
      data: {
        patientNumber,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        sex: input.sex,
        occupation: input.occupation,
        placeOfResidence: input.placeOfResidence,
        address: input.address,
        referralSource: input.referralSource,
        primaryDoctorId: input.primaryDoctorId,
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "CREATE",
        entityType: "Patient",
        entityId: created.id,
        detail: { after: created },
      },
    })

    return created
  })
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Apply a partial update and record an UPDATE audit row with `{ before, after }`
 * so reviewers can reconstruct the diff later.
 */
export async function updatePatient(
  id: string,
  input: UpdatePatientInput,
  actorUserId: string,
): Promise<Patient> {
  return db.$transaction(async (tx) => {
    const before = await tx.patient.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Patient not found")

    const data: Prisma.PatientUpdateInput = {}
    if (input.fullName !== undefined) data.fullName = input.fullName
    if (input.email !== undefined) data.email = input.email
    if (input.phone !== undefined) data.phone = input.phone
    if (input.dateOfBirth !== undefined) data.dateOfBirth = input.dateOfBirth
    if (input.sex !== undefined) data.sex = input.sex
    if (input.occupation !== undefined) data.occupation = input.occupation
    if (input.placeOfResidence !== undefined)
      data.placeOfResidence = input.placeOfResidence
    if (input.address !== undefined) data.address = input.address
    if (input.referralSource !== undefined)
      data.referralSource = input.referralSource
    if (input.primaryDoctorId !== undefined) {
      data.primaryDoctor = input.primaryDoctorId
        ? { connect: { id: input.primaryDoctorId } }
        : { disconnect: true }
    }
    if (input.status !== undefined) data.status = input.status

    const after = await tx.patient.update({ where: { id }, data })

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "UPDATE",
        entityType: "Patient",
        entityId: after.id,
        detail: { before, after },
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

/**
 * Soft-delete: flip status to ARCHIVED and stamp `deletedAt`. The row stays
 * in the table so the audit trail and historical consultations stay
 * referentially intact.
 */
export async function softDeletePatient(
  id: string,
  actorUserId: string,
): Promise<Patient> {
  return db.$transaction(async (tx) => {
    const before = await tx.patient.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Patient not found")

    const after = await tx.patient.update({
      where: { id },
      data: {
        status: PatientStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "DELETE",
        entityType: "Patient",
        entityId: after.id,
        detail: { before, after },
      },
    })

    return after
  })
}
