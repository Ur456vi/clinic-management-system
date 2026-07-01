/**
 * ClinicalSummary service layer.
 *
 * A clinical summary is a dated entry (title + date) the doctor / RMO records
 * for a patient — typically one per visit — that holds one or more uploaded
 * documents (PDF / image / Word doc) in the private `phi` S3 bucket. The shape
 * mirrors LabResult -> LabResultAttachment: the parent row carries the human
 * metadata, the child rows carry the files.
 *
 * Service functions:
 *   - `createClinicalSummary`      — POST   /api/clinical-summaries
 *   - `listClinicalSummaries`      — GET    /api/clinical-summaries?patientId=…
 *   - `deleteClinicalSummary`      — DELETE /api/clinical-summaries/:id
 *   - `attachClinicalSummaryFile`  — POST   /api/clinical-summaries/:id/files
 *   - `listClinicalSummaryFiles`   — GET    /api/clinical-summaries/:id/files
 *   - `getClinicalSummaryFileDownload` — GET /api/clinical-summaries/:id/files/:fileId
 *   - `deleteClinicalSummaryFile`  — DELETE /api/clinical-summaries/:id/files/:fileId
 *
 * Each read/write writes a best-effort AuditLog row (entityType="ClinicalSummary"),
 * consistent with the LabResult service. We do NOT delete S3 objects on file /
 * summary delete — that's the deferred cleanup job's responsibility, identical
 * to the lab-attachment detach flow.
 */

import type { Prisma } from "@prisma/client"
import { Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import { getDownloadUrl } from "@/lib/services/storage"
import { rolesFor } from "@/lib/rbac"
import type {
  AttachClinicalSummaryFileBody,
  CreateClinicalSummaryInput,
  ListClinicalSummariesQuery,
} from "@/lib/validation/clinical-summary"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create / modify a clinical summary or its files. */
const WRITE_ROLES: readonly Role[] = rolesFor("clinicalSummary:write")
/** Roles allowed to read clinical summaries. Any authenticated staff role. */
const READ_ROLES: readonly Role[] = rolesFor("clinicalSummary:read")

/** Default presigned-download TTL for summary files — 5 minutes. */
const FILE_DOWNLOAD_TTL_SEC = 300

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

/**
 * Best-effort audit write. Failures are logged and swallowed — a broken audit
 * row must not break the underlying read/write (audit is observability, not
 * correctness), matching the LabResult service.
 */
async function writeAudit(
  client: Prisma.TransactionClient | typeof db,
  args: {
    actorUserId: string
    action: "CREATE" | "READ" | "UPDATE" | "DELETE"
    entityId: string | null
    detail?: Prisma.InputJsonValue
  },
): Promise<void> {
  try {
    await client.auditLog.create({
      data: {
        actorUserId: args.actorUserId,
        action: args.action,
        entityType: "ClinicalSummary",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    console.error("[clinical-summary] audit write failed", err)
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ClinicalSummaryListItem = {
  id: string
  title: string
  summaryDate: string
  notes: string | null
  fileCount: number
  createdByName: string | null
  createdAt: string
}

export type ClinicalSummaryFileItem = {
  id: string
  filename: string | null
  attachmentMime: string | null
  sizeBytes: number | null
  uploadedAt: string
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a clinical summary entry for a patient. Files are attached afterwards
 * via `attachClinicalSummaryFile` (the client uploads to S3 first, then links
 * each object). WRITE_ROLES gate; verifies the patient exists.
 */
export async function createClinicalSummary(
  input: CreateClinicalSummaryInput,
  actor: { userId: string; role: Role },
): Promise<ClinicalSummaryListItem> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot create a clinical summary`,
    )
  }

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const created = await tx.clinicalSummary.create({
      data: {
        patientId: input.patientId,
        title: input.title,
        summaryDate: input.summaryDate,
        notes: input.notes ?? null,
        createdById: actor.userId,
      },
      include: {
        createdBy: { select: { staff: { select: { fullName: true } }, email: true } },
        _count: { select: { files: true } },
      },
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: { after: { id: created.id, patientId: created.patientId, title: created.title } },
    })

    return {
      id: created.id,
      title: created.title,
      summaryDate: created.summaryDate.toISOString(),
      notes: created.notes,
      fileCount: created._count.files,
      createdByName:
        created.createdBy?.staff?.fullName ?? created.createdBy?.email ?? null,
      createdAt: created.createdAt.toISOString(),
    }
  })
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListClinicalSummariesResult = {
  items: ClinicalSummaryListItem[]
  nextCursor: string | null
}

/**
 * List a patient's clinical summaries, newest first (`summaryDate desc, id
 * desc`). READ_ROLES gate. Writes a single READ audit row for the query.
 */
export async function listClinicalSummaries(
  input: ListClinicalSummariesQuery,
  actor: { userId: string; role: Role },
): Promise<ListClinicalSummariesResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view clinical summaries`)
  }

  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const rows = await db.clinicalSummary.findMany({
    where: { patientId: input.patientId },
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ summaryDate: "desc" }, { id: "desc" }],
    include: {
      createdBy: { select: { staff: { select: { fullName: true } }, email: true } },
      _count: { select: { files: true } },
    },
  })

  let nextCursor: string | null = null
  if (rows.length > take) {
    const next = rows.pop()
    nextCursor = next?.id ?? null
  }

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "READ",
    entityId: null,
    detail: { query: { patientId: input.patientId, count: rows.length } },
  })

  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      summaryDate: r.summaryDate.toISOString(),
      notes: r.notes,
      fileCount: r._count.files,
      createdByName: r.createdBy?.staff?.fullName ?? r.createdBy?.email ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    nextCursor,
  }
}

// ---------------------------------------------------------------------------
// Delete summary
// ---------------------------------------------------------------------------

/**
 * Delete a clinical summary and all its file rows (cascade). Does NOT delete
 * the S3 objects (cleanup deferred, consistent with detach). WRITE_ROLES gate.
 */
export async function deleteClinicalSummary(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot delete a clinical summary`)
  }

  await db.$transaction(async (tx) => {
    const before = await tx.clinicalSummary.findUnique({
      where: { id },
      select: { id: true, title: true },
    })
    if (!before) throw new NotFoundError("Clinical summary not found")

    await tx.clinicalSummary.delete({ where: { id } })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "DELETE",
      entityId: id,
      detail: { before: { id: before.id, title: before.title } },
    })
  })
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

/**
 * Attach an already-uploaded S3 object to a summary as a new file. WRITE_ROLES
 * gate. We do NOT verify the object exists in S3 — a broken key surfaces on the
 * next download, identical to the lab-attachment flow.
 */
export async function attachClinicalSummaryFile(
  id: string,
  payload: AttachClinicalSummaryFileBody,
  actor: { userId: string; role: Role },
): Promise<ClinicalSummaryFileItem> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot attach a summary file`)
  }

  return db.$transaction(async (tx) => {
    const summary = await tx.clinicalSummary.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!summary) throw new NotFoundError("Clinical summary not found")

    const file = await tx.clinicalSummaryFile.create({
      data: {
        summaryId: id,
        attachmentKey: payload.key,
        attachmentMime: payload.contentType ?? null,
        filename: payload.filename ?? null,
        sizeBytes: payload.sizeBytes ?? null,
        uploadedById: actor.userId,
      },
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: id,
      detail: {
        file: { added: { id: file.id, filename: file.filename, sizeBytes: file.sizeBytes } },
      },
    })

    return {
      id: file.id,
      filename: file.filename,
      attachmentMime: file.attachmentMime,
      sizeBytes: file.sizeBytes,
      uploadedAt: file.createdAt.toISOString(),
    }
  })
}

/** List every file on a clinical summary (newest first). READ_ROLES gate. */
export async function listClinicalSummaryFiles(
  id: string,
  actor: { userId: string; role: Role },
): Promise<ClinicalSummaryFileItem[]> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view clinical summaries`)
  }

  const summary = await db.clinicalSummary.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!summary) throw new NotFoundError("Clinical summary not found")

  const rows = await db.clinicalSummaryFile.findMany({
    where: { summaryId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      attachmentMime: true,
      sizeBytes: true,
      createdAt: true,
    },
  })

  return rows.map((f) => ({
    id: f.id,
    filename: f.filename,
    attachmentMime: f.attachmentMime,
    sizeBytes: f.sizeBytes,
    uploadedAt: f.createdAt.toISOString(),
  }))
}

/**
 * Mint a presigned GET URL for ONE summary file. READ_ROLES gate. Returns null
 * when the file doesn't belong to this summary (→ 404 at the route).
 */
export async function getClinicalSummaryFileDownload(
  id: string,
  fileId: string,
  actor: { userId: string; role: Role },
): Promise<{ downloadUrl: string; filename: string | null } | null> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view clinical summaries`)
  }

  const file = await db.clinicalSummaryFile.findFirst({
    where: { id: fileId, summaryId: id },
    select: { attachmentKey: true, filename: true },
  })
  if (!file) return null

  // Inline (not `attachment`) so the browser/app can render the file in place
  // instead of forcing a download — the file is previewed in-system.
  const signed = await getDownloadUrl({
    bucket: "phi",
    key: file.attachmentKey,
    ttlSec: FILE_DOWNLOAD_TTL_SEC,
    asAttachment: false,
    ...(file.filename ? { filename: file.filename } : {}),
  })

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "READ",
    entityId: id,
    detail: { file: { fileId, key: file.attachmentKey } },
  })

  return { downloadUrl: signed.url, filename: file.filename }
}

/**
 * Delete ONE file from a summary. WRITE_ROLES gate. Does NOT delete the S3
 * object (cleanup deferred, consistent with detach).
 */
export async function deleteClinicalSummaryFile(
  id: string,
  fileId: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot modify a summary file`)
  }

  await db.$transaction(async (tx) => {
    const file = await tx.clinicalSummaryFile.findFirst({
      where: { id: fileId, summaryId: id },
      select: { id: true, attachmentKey: true },
    })
    if (!file) throw new NotFoundError("File not found")

    await tx.clinicalSummaryFile.delete({ where: { id: file.id } })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "DELETE",
      entityId: id,
      detail: { file: { removed: { fileId, key: file.attachmentKey } } },
    })
  })
}
