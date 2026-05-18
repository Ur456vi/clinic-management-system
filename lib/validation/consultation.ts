/**
 * Zod schemas for the Consultation API surface (BE-14).
 *
 * The Consultation model is polymorphic: a single table with a `type`
 * discriminator (`RMO` | `MAIN`) and a per-section JSONB blob. Validation
 * here is intentionally loose at the section-payload level — each leaf
 * value is just `unknown` — because section shapes are still in flux
 * across the RMO intake form and the senior doctor's main consultation.
 * The route/service guarantees only that:
 *
 *   - `sections` is a JSON object (not an array, not a primitive);
 *   - top-level section keys are strings;
 *   - the shallow-merge happens at the top level (vitals -> vitals, etc.).
 *
 * Field-level validation will land alongside the React form, where the
 * shape is known. For now the contract is "anything JSON-serialisable".
 *
 * Schemas:
 *   - `createConsultationSchema`   — POST /api/consultations
 *   - `updateConsultationSchema`   — PATCH /api/consultations/:id
 *   - `consultationIdParamSchema`  — :id path param
 */

import { z } from "zod"
import { ConsultationStatus, ConsultationType } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const sectionPayload = z.record(z.string(), z.unknown())

const sectionsBlob = z.record(
  z.string(),
  z.union([sectionPayload, z.string(), z.number(), z.boolean(), z.null()]),
)

const typeEnum = z.nativeEnum(ConsultationType)
const statusEnum = z.nativeEnum(ConsultationStatus)

/**
 * Allowed status transitions for a PATCH. Keys are the current status,
 * values are the set of statuses we will accept as `next`. Unknown
 * transitions throw 400 in the service layer.
 *
 *   DRAFT       -> RMO_DONE    (RMO finished the intake pass)
 *   DRAFT       -> IN_PROGRESS (doctor opened a draft to continue)
 *   RMO_DONE    -> IN_PROGRESS (doctor picked up the RMO handoff)
 *   IN_PROGRESS -> SIGNED      (doctor signed the chart — handled in BE-15)
 *
 * SIGNED is terminal: the row is immutable from the API.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  ConsultationStatus,
  readonly ConsultationStatus[]
> = {
  DRAFT: ["RMO_DONE", "IN_PROGRESS"],
  RMO_DONE: ["IN_PROGRESS"],
  IN_PROGRESS: ["SIGNED"],
  SIGNED: [],
}

export const createConsultationSchema = z.object({
  patientId: uuid,
  type: typeEnum,
  sections: sectionsBlob.optional(),
  summary: z.string().trim().max(2000).optional(),
})

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>

export const updateConsultationSchema = z.object({
  sections: sectionsBlob.optional(),
  status: statusEnum.optional(),
  summary: z.string().trim().max(2000).nullable().optional(),
})

export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>

export const consultationIdParamSchema = z.object({ id: uuid })

/**
 * `POST /api/consultations/:id/transition` body (BE-15).
 *
 * Drives the explicit state machine declared in ALLOWED_STATUS_TRANSITIONS.
 * `notes` is optional context surfaced to the recipient — for the
 * RMO→doctor handoff it shows up on the doctor's queue card.
 */
export const transitionConsultationSchema = z.object({
  to: statusEnum,
  notes: z.string().trim().max(1000).optional(),
})

export type TransitionConsultationInput = z.infer<
  typeof transitionConsultationSchema
>
