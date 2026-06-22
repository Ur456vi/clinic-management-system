/**
 * LabResult domain helpers + service layer (BE-16).
 *
 * The `LabResult` model is one row per lab panel (CBC, LFT, Vit D, …) with
 * the per-analyte rows packed into an `analytes` JSONB array. We store the
 * panel as a single row rather than normalising into a per-analyte table
 * because clinic-scale volume is small and labs hand the data back panel
 * at a time — JSONB is the path of least friction.
 *
 * Service functions:
 *   - `createLabResult` — POST  /api/lab-results
 *   - `getLabResult`    — GET   /api/lab-results/:id
 *   - `listLabResults`  — GET   /api/lab-results?patientId=…
 *   - `updateLabResult` — PATCH /api/lab-results/:id
 *
 * Every read/write of a single result writes an AuditLog row per BE-23.
 * The list endpoint does NOT audit per row (would be noisy); it audits
 * the query itself with a `READ` row carrying `entityType="LabResult"`
 * and `entityId=null`.
 *
 * Out-of-range flag computation:
 *   For each analyte where the caller did NOT explicitly set `flag`, if
 *   the analyte's `value` is numeric AND both `refLow` / `refHigh` are
 *   present, the helper sets `flag` to:
 *     - LOW   when value < refLow
 *     - HIGH  when value > refHigh
 *     - NORMAL otherwise.
 *   `CRITICAL_*` is reserved for future panic-value support — the helper
 *   never emits it. Non-numeric values without an explicit flag pass
 *   through unflagged (the caller can mark them ABNORMAL if they want).
 */

import type { LabResult, Prisma } from "@prisma/client"
import { LabFlag, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError } from "@/lib/errors"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import { getDownloadUrl } from "@/lib/services/storage"
import { groupSelectedByPanel, parseSelectedTests, testKey } from "@/lib/test-catalog"
import { rolesFor } from "@/lib/rbac"
import type {
  AnalyteInput,
  AttachLabResultBody,
  CreateLabResultInput,
  ListLabResultsQuery,
  UpdateLabResultInput,
} from "@/lib/validation/lab-result"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create or modify a lab result. */
const WRITE_ROLES: readonly Role[] = rolesFor("labResult:write")

/**
 * Roles allowed to attach a report to an existing lab result. Reception is
 * included on top of WRITE_ROLES because the front desk routinely uploads
 * the diagnostic-centre report on the patient's behalf at the follow-up
 * visit — but reception still may NOT create rows or edit analytes.
 */
const ATTACH_ROLES: readonly Role[] = rolesFor("labResult:attach")

/**
 * Roles allowed to read a lab result. Any authenticated clinic role may
 * read — the patient-portal scope is not surfaced through these routes.
 */
const READ_ROLES: readonly Role[] = rolesFor("labResult:read")

// ---------------------------------------------------------------------------
// Flag computation
// ---------------------------------------------------------------------------

/**
 * Walk an analytes array and compute the `flag` field for any entry where
 * the caller did NOT set one explicitly AND the entry has a numeric value
 * with both `refLow` / `refHigh` populated.
 *
 * The function is a pure transform — it returns a new array and never
 * mutates the input. Critical-range computation is intentionally out of
 * scope for BE-16; the lab can still send `flag: "CRITICAL_LOW"` and it
 * will be preserved verbatim.
 */
export function computeAnalyteFlags(
  analytes: readonly AnalyteInput[],
): AnalyteInput[] {
  return analytes.map((a) => {
    if (a.flag !== undefined) return { ...a }
    const numericValue = typeof a.value === "number" ? a.value : Number(a.value)
    const hasRange =
      typeof a.refLow === "number" && typeof a.refHigh === "number"
    if (!hasRange || !Number.isFinite(numericValue)) return { ...a }
    let flag: LabFlag = LabFlag.NORMAL
    if (numericValue < (a.refLow as number)) flag = LabFlag.LOW
    else if (numericValue > (a.refHigh as number)) flag = LabFlag.HIGH
    return { ...a, flag }
  })
}

// ---------------------------------------------------------------------------
// Materialize lab orders from a signed consultation
// ---------------------------------------------------------------------------

/** Safely read a top-level object section out of a `sections` JSONB blob. */
function readSection(
  sections: Prisma.JsonValue,
  key: string,
): Record<string, unknown> | null {
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) {
    return null
  }
  const v = (sections as Record<string, unknown>)[key]
  if (!v || typeof v !== "object" || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

/**
 * Turn the tests a doctor selected in the consultation "Test" section into
 * real `LabResult` rows so they surface in the patient's Labs & Diagnostics
 * tab the moment the consultation is signed.
 *
 *   - Order date  → `collectedAt = orderedAt` (the sign time).
 *   - Status      → "active" (derived: `reportedAt = null`).
 *   - One row per selected *panel* — e.g. "(A) ROUTINE INVESTIGATIONS PANEL" —
 *     with the chosen tests captured in `summary`. This matches the
 *     one-row-per-panel model (see file header) and the prescription print,
 *     so the patient uploads a single consolidated report per panel rather
 *     than one per individual test. The report PDF is attached later.
 *
 * Idempotent: panels already materialized for this consultation (matched on
 * `panelName`) are skipped, so a re-run never duplicates rows. Returns the
 * number of new orders created. Runs inside the caller's transaction.
 */
export async function materializeLabOrdersFromConsultation(
  tx: Prisma.TransactionClient,
  args: {
    consultationId: string
    patientId: string
    sections: Prisma.JsonValue
    orderedAt: Date
    orderingDoctorId: string | null
  },
): Promise<number> {
  const test = readSection(args.sections, "test")
  if (!test) return 0

  const raw =
    typeof test["test__selected_tests"] === "string"
      ? (test["test__selected_tests"] as string)
      : ""
  const keys = parseSelectedTests(raw)
  if (keys.length === 0) return 0

  const preferredLab = test["test__preferred_lab"]
  const labName =
    typeof preferredLab === "string" && preferredLab.trim()
      ? preferredLab.trim().slice(0, 200)
      : null

  // Group the selected tests by their catalog panel so each panel becomes a
  // single order, labelled "(<code>) <name>" with the chosen tests in summary.
  const grouped = groupSelectedByPanel(keys)
  const rows: { panelName: string; summary: string }[] = grouped.map(
    ({ panel, tests }) => ({
      panelName: `(${panel.code}) ${panel.name}`.slice(0, 200),
      summary: tests.join(", "),
    }),
  )

  // Keep any selected key the catalog no longer knows about (custom/stale) as
  // its own row so an order is never silently dropped.
  const matched = new Set(
    grouped.flatMap(({ panel, tests }) =>
      tests.map((t) => testKey(panel.id, t)),
    ),
  )
  for (const k of keys) {
    if (matched.has(k)) continue
    const name = (k.split("::").pop() ?? k).trim().slice(0, 200)
    if (name) rows.push({ panelName: name, summary: name })
  }
  if (rows.length === 0) return 0

  // Skip panels already ordered for this consultation (idempotent re-sign),
  // and dedupe within this batch.
  const existing = await tx.labResult.findMany({
    where: { consultationId: args.consultationId },
    select: { panelName: true },
  })
  const have = new Set(existing.map((r) => r.panelName))
  const seen = new Set<string>()
  const toCreate = rows.filter((r) => {
    if (have.has(r.panelName) || seen.has(r.panelName)) return false
    seen.add(r.panelName)
    return true
  })
  if (toCreate.length === 0) return 0

  await tx.labResult.createMany({
    data: toCreate.map((r) => ({
      patientId: args.patientId,
      consultationId: args.consultationId,
      panelName: r.panelName,
      summary: r.summary,
      collectedAt: args.orderedAt,
      reportedAt: null,
      orderingDoctorId: args.orderingDoctorId,
      labName,
      analytes: [],
    })),
  })

  return toCreate.length
}

// ---------------------------------------------------------------------------
// Includes
// ---------------------------------------------------------------------------

/**
 * Standard include shape — pulls in just enough patient + ordering-doctor
 * detail to render the lab-results list in the patient-detail view without
 * a follow-up roundtrip.
 */
const LAB_RESULT_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
    },
  },
  orderingDoctor: {
    select: {
      id: true,
      fullName: true,
    },
  },
} as const

export type LabResultWithRelations = Prisma.LabResultGetPayload<{
  include: typeof LAB_RESULT_INCLUDE
}>

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

/**
 * Best-effort audit write. Failures are logged and swallowed — a broken
 * audit row must not break the underlying read/write because the audit
 * subsystem is observability, not correctness.
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
        entityType: "LabResult",
        entityId: args.entityId,
        ...(args.detail !== undefined ? { detail: args.detail } : {}),
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[lab-result] audit write failed", err)
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a new lab result against a patient (and optionally a consultation).
 *
 *  - Validates the actor's role (`WRITE_ROLES`).
 *  - Verifies the patient exists; otherwise the FK error becomes a 404.
 *  - Computes any missing analyte flags server-side.
 *  - Writes a CREATE audit row in the same transaction.
 */
export async function createLabResult(
  input: CreateLabResultInput,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot create a lab result`,
    )
  }

  const analytes = computeAnalyteFlags(input.analytes ?? [])

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    if (input.consultationId) {
      const consultation = await tx.consultation.findUnique({
        where: { id: input.consultationId },
        select: { id: true, patientId: true },
      })
      if (!consultation) throw new NotFoundError("Consultation not found")
      if (consultation.patientId !== input.patientId) {
        throw new ForbiddenError(
          "Consultation does not belong to the supplied patient",
        )
      }
    }

    const created = await tx.labResult.create({
      data: {
        patientId: input.patientId,
        consultationId: input.consultationId,
        panelName: input.panelName,
        collectedAt: input.collectedAt,
        reportedAt: input.reportedAt,
        orderingDoctorId: input.orderingDoctorId,
        labName: input.labName,
        analytes: analytes as unknown as Prisma.InputJsonValue,
        summary: input.summary,
        attachmentKey: input.attachmentKey,
        attachmentMime: input.attachmentMime,
      },
      include: LAB_RESULT_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "CREATE",
      entityId: created.id,
      detail: {
        after: {
          id: created.id,
          patientId: created.patientId,
          panelName: created.panelName,
        },
      },
    })

    return created
  })
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

/**
 * Fetch one lab result with patient + ordering-doctor summary.
 *
 *  - Throws `ForbiddenError` if the actor's role is not in `READ_ROLES`.
 *  - Throws `NotFoundError` if no row exists.
 *  - Writes a READ audit row (best-effort).
 */
export async function getLabResult(
  id: string,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view lab results`)
  }

  const row = await db.labResult.findUnique({
    where: { id },
    include: LAB_RESULT_INCLUDE,
  })
  if (!row) throw new NotFoundError("Lab result not found")

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "READ",
    entityId: row.id,
  })

  return row
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListLabResultsResult = {
  items: LabResultWithRelations[]
  nextCursor: string | null
}

/**
 * List lab results for a patient or a consultation. Either `patientId`
 * or `consultationId` is required — the validator's `.refine` enforces
 * that and the route surfaces a 400.
 *
 * Ordering is `collectedAt desc, id desc` so the patient-detail view
 * shows newest results first; the cursor is the `id` of the last row
 * from the previous page.
 *
 * Writes a single READ audit row for the query (entityId=null) so we
 * have a record of who pulled the list, without exploding the audit
 * table on every bulk-fetch.
 */
export async function listLabResults(
  input: ListLabResultsQuery,
  actor: { userId: string; role: Role },
): Promise<ListLabResultsResult> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view lab results`)
  }

  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.LabResultWhereInput = {}
  if (input.patientId) where.patientId = input.patientId
  if (input.consultationId) where.consultationId = input.consultationId

  const rows = await db.labResult.findMany({
    where,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ collectedAt: "desc" }, { id: "desc" }],
    include: LAB_RESULT_INCLUDE,
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
    detail: {
      query: {
        patientId: input.patientId ?? null,
        consultationId: input.consultationId ?? null,
        count: rows.length,
      },
    },
  })

  return { items: rows, nextCursor }
}

// ---------------------------------------------------------------------------
// Update (PATCH)
// ---------------------------------------------------------------------------

/**
 * Partial update.
 *
 *  - `analytes` (when present) replaces the existing array verbatim AFTER
 *    flag computation — there is no merge semantics here because each
 *    re-test ships a fresh full panel and partial-analyte edits are not a
 *    real workflow.
 *  - `consultationId` and the other nullable fields accept `null` to
 *    explicitly clear them.
 *  - Writes an UPDATE audit row with `{ before, after, patch }` so a
 *    reviewer can reconstruct what changed.
 */
export async function updateLabResult(
  id: string,
  input: UpdateLabResultInput,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot modify a lab result`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.labResult.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Lab result not found")

    if (input.consultationId) {
      const consultation = await tx.consultation.findUnique({
        where: { id: input.consultationId },
        select: { id: true, patientId: true },
      })
      if (!consultation) throw new NotFoundError("Consultation not found")
      if (consultation.patientId !== before.patientId) {
        throw new ForbiddenError(
          "Consultation does not belong to the lab result's patient",
        )
      }
    }

    const data: Prisma.LabResultUpdateInput = {}

    if (input.consultationId !== undefined) {
      data.consultation =
        input.consultationId === null
          ? { disconnect: true }
          : { connect: { id: input.consultationId } }
    }
    if (input.panelName !== undefined) data.panelName = input.panelName
    if (input.collectedAt !== undefined) data.collectedAt = input.collectedAt
    if (input.reportedAt !== undefined) data.reportedAt = input.reportedAt
    if (input.orderingDoctorId !== undefined) {
      data.orderingDoctor =
        input.orderingDoctorId === null
          ? { disconnect: true }
          : { connect: { id: input.orderingDoctorId } }
    }
    if (input.labName !== undefined) data.labName = input.labName
    if (input.analytes !== undefined) {
      data.analytes = computeAnalyteFlags(
        input.analytes,
      ) as unknown as Prisma.InputJsonValue
    }
    if (input.summary !== undefined) data.summary = input.summary
    if (input.attachmentKey !== undefined) data.attachmentKey = input.attachmentKey
    if (input.attachmentMime !== undefined) data.attachmentMime = input.attachmentMime

    const after = await tx.labResult.update({
      where: { id },
      data,
      include: LAB_RESULT_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: after.id,
      detail: {
        before: {
          panelName: before.panelName,
          collectedAt: before.collectedAt,
          analytes: before.analytes,
          consultationId: before.consultationId,
        },
        after: {
          panelName: after.panelName,
          collectedAt: after.collectedAt,
          analytes: after.analytes,
          consultationId: after.consultationId,
        },
        patch: input as unknown as Prisma.InputJsonValue,
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export type { LabResult }

// ---------------------------------------------------------------------------
// Attachment helpers (BE-20)
// ---------------------------------------------------------------------------
//
// `attachToLabResult` links an already-uploaded S3 object (the caller went
// through BE-19's presigned-PUT flow first) to the row. We do NOT verify
// the object exists in S3 — that would mean an extra HEAD round-trip per
// attach and the worst case (broken key) surfaces immediately on the next
// download attempt. The cleanup of orphaned S3 objects is a Sprint-2 job.

/** Default presigned-download TTL for lab attachments — 5 minutes. */
const ATTACHMENT_DOWNLOAD_TTL_SEC = 300

export type LabResultAttachmentDownload = {
  downloadUrl: string
  expiresInSeconds: number
  attachmentKey: string
  attachmentUploadedAt: Date
}

/**
 * Attach an uploaded S3 object to an existing lab result.
 *
 *  - Restricted to `ATTACH_ROLES` (WRITE_ROLES + RECEPTION).
 *  - Persists `attachmentKey`, optionally `attachmentMime`, and stamps
 *    `attachmentUploadedAt = now()` in a single transaction.
 *  - Stamps `reportedAt = now()` when it was still null, so the row flips
 *    from "active" (ordered) to "completed" the moment a report lands —
 *    no separate PATCH needed, which is what lets RECEPTION finish the
 *    upload without the (WRITE_ROLES-only) update endpoint.
 *  - Writes an UPDATE audit row with `{ before, after }` describing the
 *    attachment fields (not the whole row).
 */
export async function attachToLabResult(
  id: string,
  payload: AttachLabResultBody,
  actor: { userId: string; role: Role },
): Promise<LabResultWithRelations> {
  if (!ATTACH_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot attach a lab report`,
    )
  }

  return db.$transaction(async (tx) => {
    const before = await tx.labResult.findUnique({
      where: { id },
      select: {
        id: true,
        attachmentKey: true,
        attachmentMime: true,
        attachmentUploadedAt: true,
        reportedAt: true,
      },
    })
    if (!before) throw new NotFoundError("Lab result not found")

    const now = new Date()
    const after = await tx.labResult.update({
      where: { id },
      data: {
        attachmentKey: payload.key,
        ...(payload.contentType !== undefined
          ? { attachmentMime: payload.contentType }
          : {}),
        attachmentUploadedAt: now,
        // First report in → mark it reported (status active → completed).
        ...(before.reportedAt == null ? { reportedAt: now } : {}),
      },
      include: LAB_RESULT_INCLUDE,
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: after.id,
      detail: {
        attachment: {
          before: {
            attachmentKey: before.attachmentKey,
            attachmentMime: before.attachmentMime,
            attachmentUploadedAt: before.attachmentUploadedAt,
          },
          after: {
            attachmentKey: after.attachmentKey,
            attachmentMime: after.attachmentMime,
            attachmentUploadedAt: after.attachmentUploadedAt,
          },
          sizeBytes: payload.sizeBytes ?? null,
        },
      },
    })

    return after
  })
}

/**
 * Clear `attachmentKey` + `attachmentUploadedAt` on a lab result. We
 * deliberately do NOT issue a `DeleteObject` against S3 — that's the
 * Sprint-2 cleanup job's responsibility, so detaching is idempotent and
 * cannot corrupt a row by tearing it half-way down.
 */
export async function detachFromLabResult(
  id: string,
  actor: { userId: string; role: Role },
): Promise<void> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot modify a lab result`,
    )
  }

  await db.$transaction(async (tx) => {
    const before = await tx.labResult.findUnique({
      where: { id },
      select: {
        id: true,
        attachmentKey: true,
        attachmentMime: true,
        attachmentUploadedAt: true,
      },
    })
    if (!before) throw new NotFoundError("Lab result not found")

    await tx.labResult.update({
      where: { id },
      data: {
        attachmentKey: null,
        attachmentMime: null,
        attachmentUploadedAt: null,
      },
    })

    await writeAudit(tx, {
      actorUserId: actor.userId,
      action: "UPDATE",
      entityId: before.id,
      detail: {
        attachment: {
          before: {
            attachmentKey: before.attachmentKey,
            attachmentMime: before.attachmentMime,
            attachmentUploadedAt: before.attachmentUploadedAt,
          },
          after: {
            attachmentKey: null,
            attachmentMime: null,
            attachmentUploadedAt: null,
          },
        },
      },
    })
  })
}

/**
 * Mint a presigned GET URL for the lab result's attachment.
 *
 *  - `READ_ROLES` gate.
 *  - Returns `null` when the row exists but has no attachment — the
 *    route handler turns that into a 404.
 *  - Writes a READ audit row (action=READ, entityType=LabResult) with
 *    the attachment key in the detail.
 *  - Throws `NotFoundError` when the row itself does not exist.
 */
export async function getLabResultAttachmentDownload(
  id: string,
  actor: { userId: string; role: Role },
): Promise<LabResultAttachmentDownload | null> {
  if (!READ_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view lab results`)
  }

  const row = await db.labResult.findUnique({
    where: { id },
    select: {
      id: true,
      attachmentKey: true,
      attachmentUploadedAt: true,
    },
  })
  if (!row) throw new NotFoundError("Lab result not found")
  if (!row.attachmentKey || !row.attachmentUploadedAt) return null

  const signed = await getDownloadUrl({
    bucket: "phi",
    key: row.attachmentKey,
    ttlSec: ATTACHMENT_DOWNLOAD_TTL_SEC,
    asAttachment: true,
  })

  await writeAudit(db, {
    actorUserId: actor.userId,
    action: "READ",
    entityId: row.id,
    detail: {
      attachment: {
        key: row.attachmentKey,
        ttlSec: signed.ttlSec,
      },
    },
  })

  return {
    downloadUrl: signed.url,
    expiresInSeconds: signed.ttlSec,
    attachmentKey: row.attachmentKey,
    attachmentUploadedAt: row.attachmentUploadedAt,
  }
}
