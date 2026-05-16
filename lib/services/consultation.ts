/**
 * Consultation domain types, guards & service layer (BE-13 + BE-14).
 *
 * The `Consultation` model is polymorphic: a single table with a `type`
 * discriminator (`RMO` | `MAIN`) and a `sections` JSONB blob whose keys
 * differ per type. The lightweight TypeScript shapes below let callers
 * narrow the JSON without round-tripping through Prisma's generic
 * `Prisma.JsonValue`.
 *
 * Service functions:
 *   - `createConsultation`  — POST  /api/consultations
 *   - `getConsultation`     — GET   /api/consultations/:id
 *   - `updateConsultation`  — PATCH /api/consultations/:id (sections merge)
 *
 * All writes are wrapped in `db.$transaction` so the AuditLog row commits
 * (or rolls back) atomically with the consultation update.
 */

import type { Consultation, Prisma } from "@prisma/client"
import { AuditAction, ConsultationStatus, ConsultationType, Role } from "@prisma/client"

import { db } from "@/lib/db"
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors"
import { recordAudit, recordAuditSampled } from "@/lib/services/audit"
import {
  ALLOWED_STATUS_TRANSITIONS,
  type CreateConsultationInput,
  type UpdateConsultationInput,
} from "@/lib/validation/consultation"

// ---------------------------------------------------------------------------
// Section shapes (BE-13 contract, kept for callers that want type narrowing)
// ---------------------------------------------------------------------------

/** A single sub-section of a consultation — open shape. */
export type ConsultationSection = Partial<Record<string, unknown>>

/**
 * RMO consultation payload. Maps 1:1 to the six tabs on the
 * `/admin/patients/add` RMO panel.
 */
export type RmoSections = {
  informant?: ConsultationSection
  demographics?: ConsultationSection
  medicalHistory?: ConsultationSection
  socialHistory?: ConsultationSection
  personalHistory?: ConsultationSection
  examinationSummary?: ConsultationSection
}

/**
 * Main (senior doctor) consultation payload. Sections are a standard
 * SOAP-style breakdown — actual fields will be locked down in the form layer.
 */
export type MainSections = {
  chiefComplaint?: ConsultationSection
  hpi?: ConsultationSection
  assessment?: ConsultationSection
  diagnosis?: ConsultationSection
  plan?: ConsultationSection
}

/** Type guard — RMO consultation. */
export function isRmo(c: { type: string }): boolean {
  return c.type === ConsultationType.RMO
}

/** Type guard — Main consultation. */
export function isMain(c: { type: string }): boolean {
  return c.type === ConsultationType.MAIN
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Roles allowed to author an RMO consultation. */
const RMO_AUTHOR_ROLES: readonly Role[] = [Role.ADMIN, Role.RMO, Role.DOCTOR]
/** Roles allowed to author a MAIN (senior doctor) consultation. */
const MAIN_AUTHOR_ROLES: readonly Role[] = [Role.ADMIN, Role.DOCTOR]
/**
 * Roles allowed to *see* a consultation. The patient/PHI-access surface
 * is wider than the author surface — reception books appointments, the
 * specialists need history during their own sessions.
 */
const VIEW_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
  Role.INFUSION_SPECIALIST,
  Role.REHAB_SPECIALIST,
  Role.AESTHETICS_SPECIALIST,
]

/**
 * Shallow-merge two `sections` blobs at the top level. This is the
 * autosave semantics promised by the API: `{ sections: { vitals: ... } }`
 * patches *only* the `vitals` key and leaves everything else intact.
 *
 * Deep-merge was rejected because (a) the form posts whole sections at a
 * time, and (b) we want clients to be able to clear a sub-field by
 * omitting it from the next save — deep-merge would make that impossible.
 */
function mergeSections(
  existing: Prisma.JsonValue,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {}
  return { ...base, ...patch }
}

/**
 * Standard include shape for a consultation — pulls in just enough of
 * the author and patient to render the consultation header without a
 * follow-up roundtrip.
 */
const CONSULTATION_INCLUDE = {
  createdBy: {
    select: {
      id: true,
      email: true,
      role: true,
      staff: { select: { fullName: true } },
    },
  },
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      sex: true,
      dateOfBirth: true,
      status: true,
      primaryDoctorId: true,
    },
  },
} as const

export type ConsultationWithRelations = Prisma.ConsultationGetPayload<{
  include: typeof CONSULTATION_INCLUDE
}>

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create a DRAFT consultation against an existing patient.
 *
 *  - Validates the actor's role against the consultation `type`.
 *  - Verifies the patient exists (otherwise FK error becomes a 404).
 *  - Writes a CREATE audit row in the same transaction.
 */
export async function createConsultation(
  input: CreateConsultationInput,
  actor: { userId: string; role: Role },
): Promise<ConsultationWithRelations> {
  const allowed =
    input.type === ConsultationType.RMO ? RMO_AUTHOR_ROLES : MAIN_AUTHOR_ROLES
  if (!allowed.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot create a ${input.type} consultation`,
    )
  }

  return db.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    })
    if (!patient) throw new NotFoundError("Patient not found")

    const sections: Prisma.InputJsonValue =
      (input.sections as Prisma.InputJsonValue | undefined) ?? {}

    const created = await tx.consultation.create({
      data: {
        patientId: input.patientId,
        type: input.type,
        status: ConsultationStatus.DRAFT,
        createdById: actor.userId,
        sections,
        summary: input.summary,
      },
      include: CONSULTATION_INCLUDE,
    })

    await recordAudit(
      {
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "Consultation",
        entityId: created.id,
        detail: {
          after: {
            id: created.id,
            type: created.type,
            patientId: created.patientId,
          },
        },
      },
      { tx },
    )

    return created
  })
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

/**
 * Fetch one consultation with author + patient summary. Writes a READ
 * audit row (best-effort — audit failures do not block the read).
 *
 * Throws `NotFoundError` when no row exists, `ForbiddenError` when the
 * caller's role is not in `VIEW_ROLES`.
 */
export async function getConsultation(
  id: string,
  actor: { userId: string; role: Role },
): Promise<ConsultationWithRelations> {
  if (!VIEW_ROLES.includes(actor.role)) {
    throw new ForbiddenError(
      `Role ${actor.role} cannot view consultations`,
    )
  }

  const consultation = await db.consultation.findUnique({
    where: { id },
    include: CONSULTATION_INCLUDE,
  })
  if (!consultation) throw new NotFoundError("Consultation not found")

  await recordAudit({
    actorUserId: actor.userId,
    action: "READ",
    entityType: "Consultation",
    entityId: consultation.id,
  })

  return consultation
}

// ---------------------------------------------------------------------------
// Update (PATCH — autosave + status transitions)
// ---------------------------------------------------------------------------

/**
 * Apply a partial PATCH.
 *
 *   - `sections` (when present) is shallow-merged into the existing JSONB
 *     at the top level — `{...existing, ...input.sections}`. Last-write-
 *     wins per section key. This is the autosave contract.
 *   - `status` (when present) must be in `ALLOWED_STATUS_TRANSITIONS[from]`
 *     for the current row, else 400.
 *   - `summary` is overwritten verbatim. `null` clears it.
 *
 * SIGNED consultations are immutable — any PATCH throws 400.
 *
 * Records an UPDATE audit row with `{ before, after, patch }` so a
 * reviewer can reconstruct exactly what the client sent vs. what landed.
 */
export async function updateConsultation(
  id: string,
  input: UpdateConsultationInput,
  actor: { userId: string; role: Role },
): Promise<ConsultationWithRelations> {
  return db.$transaction(async (tx) => {
    const before = await tx.consultation.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Consultation not found")

    // SIGNED is terminal — no further mutation from this endpoint.
    if (before.status === ConsultationStatus.SIGNED) {
      throw new ValidationError(
        "Consultation is SIGNED and cannot be modified",
      )
    }

    // Author-role gate: enforce the same role rules as create.
    const allowedAuthors =
      before.type === ConsultationType.RMO
        ? RMO_AUTHOR_ROLES
        : MAIN_AUTHOR_ROLES
    if (!allowedAuthors.includes(actor.role)) {
      throw new ForbiddenError(
        `Role ${actor.role} cannot modify a ${before.type} consultation`,
      )
    }

    const data: Prisma.ConsultationUpdateInput = {}

    if (input.sections !== undefined) {
      data.sections = mergeSections(
        before.sections,
        input.sections as Record<string, unknown>,
      ) as Prisma.InputJsonValue
    }

    if (input.summary !== undefined) {
      data.summary = input.summary
    }

    if (input.status !== undefined && input.status !== before.status) {
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[before.status] ?? []
      if (!allowedNext.includes(input.status)) {
        throw new ValidationError(
          `Illegal status transition: ${before.status} -> ${input.status}`,
        )
      }
      data.status = input.status
    }

    const after = await tx.consultation.update({
      where: { id },
      data,
      include: CONSULTATION_INCLUDE,
    })

    // Autosave is the dominant caller of this endpoint. To keep the
    // table readable we sample by (actor, consultationId) on 60-second
    // windows. Status changes are infrequent and should always land,
    // so they bypass the sampler.
    const isStatusChange =
      input.status !== undefined && input.status !== before.status
    const auditInput = {
      actorUserId: actor.userId,
      action: AuditAction.UPDATE,
      entityType: "Consultation",
      entityId: after.id,
      detail: {
        before: {
          status: before.status,
          sections: before.sections as unknown as Prisma.InputJsonValue,
          summary: before.summary,
        },
        after: {
          status: after.status,
          sections: after.sections as unknown as Prisma.InputJsonValue,
          summary: after.summary,
        },
        patch: input as unknown as Prisma.InputJsonValue,
      } as unknown as Prisma.InputJsonValue,
    }
    if (isStatusChange) {
      await recordAudit(auditInput, { tx })
    } else {
      await recordAuditSampled(auditInput, { tx })
    }

    return after
  })
}

// ---------------------------------------------------------------------------
// Re-exports for callers that don't want to reach into Prisma directly.
// ---------------------------------------------------------------------------

export type { Consultation }
