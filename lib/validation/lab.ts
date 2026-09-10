/**
 * Zod schemas for the three inbound partner webhooks (see the partner's
 * "Final Payloads" doc). Deliberately lenient: the partner pads some ids with
 * trailing whitespace, so every id is trimmed. `orderNumber` is the key we
 * match back to our `LabOrder`.
 */

import { z } from "zod"

import type { LabOrderStatus } from "@prisma/client"

const trimmed = z.string().transform((s) => s.trim())
// MI sends explicit `null` (not `undefined`) for every field that does not
// apply to a given event, so this must be `.nullish()`. With `.optional()` the
// entire centre `orderStatus` family failed to parse.
const trimmedOpt = z
  .string()
  .nullish()
  .transform((s) => (s == null ? undefined : s.trim() || undefined))

/** 1. Report status — a report (or partial) is ready for a work order. */
export const reportStatusSchema = z.object({
  workOrderId: trimmedOpt,
  orderNumber: trimmed,
  reportUrl: trimmedOpt,
  reportStatus: trimmedOpt,
  labNumber: trimmedOpt,
  appointmentId: trimmedOpt,
  /** Centre reports are keyed by `caseId`; home reports by `workOrderId`. */
  caseId: trimmedOpt,
})

/** 2. Order / appointment status — the partner booked / advanced the slot. */
export const orderStatusSchema = z.object({
  appointmentId: trimmedOpt,
  orderNumber: trimmed,
  status: trimmedOpt,
  /** Required by MI when status is "Cannot Complete". */
  reason: trimmedOpt,
})

/**
 * 3. Centre appointment status. MI posts TWO different shapes to this one
 * endpoint and sends exactly one of `orderStatus` / `registrationStatus`:
 *
 *   - `orderStatus`       + `orderCaseId` — the CALL-CENTRE booking outcome
 *     (slot confirmed / cannot complete / cancelled / rescheduled).
 *   - `registrationStatus` + `caseId`     — what happened at the centre on the
 *     day (sample collected or CT started / no-show).
 *
 * Kept lenient rather than a discriminated union: a parse failure here is not
 * recorded as an event, so a strict schema loses the payload entirely.
 */
export const centerStatusSchema = z.object({
  orderNumber: trimmed,
  // Booking-outcome shape.
  orderCaseId: trimmedOpt,
  orderStatus: trimmedOpt,
  workOrderId: trimmedOpt,
  appointmentDateTime: trimmedOpt,
  reason: trimmedOpt,
  // Registration shape — same centre case, different field name.
  caseId: trimmedOpt,
  registrationStatus: trimmedOpt,
  labNumber: trimmedOpt,
})

export type ReportStatusPayload = z.infer<typeof reportStatusSchema>
export type OrderStatusPayload = z.infer<typeof orderStatusSchema>
export type CenterStatusPayload = z.infer<typeof centerStatusSchema>

/**
 * Partner statuses are free text and each webhook uses its own vocabulary, so
 * every inbound event has a dedicated mapper below. They all return null on
 * unrecognized text, which leaves the lifecycle status untouched and just
 * records the raw event.
 */
// ---------------------------------------------------------------------------
// Scheduling (our side) — availability, book, cancel, reschedule
// ---------------------------------------------------------------------------

export const availabilitySchema = z.object({
  pincode: z.string().trim().min(3).max(12),
  preferredDateTime: z.string().trim().min(10).max(40),
})

export const slotSelectionSchema = z.object({
  startTime: z.string().trim().min(10).max(40),
  endTime: z.string().trim().min(10).max(40),
  serviceTerritoryId: z.string().trim().max(64).optional(),
  serviceMemberId: z.string().trim().max(64).optional(),
})

const addressSchema = z
  .object({
    street: z.string().trim().max(255).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().max(12).optional(),
    country: z.string().trim().max(120).optional(),
  })
  .optional()

export const bookOrderSchema = z.object({
  collectionMode: z.enum(["HOME", "CENTER"]),
  centerCode: z.string().trim().max(64).optional().nullable(),
  slot: slotSelectionSchema,
  address: addressSchema,
  paymentMode: z.string().trim().max(40).optional(),
})

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1).max(500),
})

export const rescheduleOrderSchema = z.object({
  slot: slotSelectionSchema,
})

export type BookOrderBody = z.infer<typeof bookOrderSchema>
export type AvailabilityBody = z.infer<typeof availabilitySchema>

/**
 * Centre `orderStatus` — the CALL-CENTRE booking outcome, not the visit outcome.
 * "Completed" here means the slot was confirmed, so it maps to SCHEDULED, not
 * COMPLETED; an order only reaches COMPLETED when the report lands
 * (`processReportStatus`). Order of checks matters — "Cannot Complete" contains
 * "complet" and "Rescheduled" contains "schedul".
 */
export function mapCenterOrderStatus(raw: string | undefined): LabOrderStatus | null {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes("cannot")) return "CANNOT_COMPLETE"
  if (s.includes("cancel")) return "CANCELLED"
  if (s.includes("reschedul")) return "SCHEDULED"
  if (s.includes("complet")) return "SCHEDULED"
  return null
}

/**
 * Centre `registrationStatus` — what actually happened at the centre.
 * "Completed" = blood drawn or CT under way, with the report still to come, so
 * IN_PROGRESS. "Cancelled" = sample not collected / CT not done / patient
 * no-show, which is CANNOT_COMPLETE rather than a deliberate CANCELLED.
 */
export function mapCenterRegistrationStatus(raw: string | undefined): LabOrderStatus | null {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes("cancel")) return "CANNOT_COMPLETE"
  if (s.includes("complet")) return "IN_PROGRESS"
  return null
}

/**
 * Home `appointment-order-status` — the phlebotomist's visit outcome.
 * "Completed" means the blood sample was COLLECTED, not that the order is
 * finished: the report still has to arrive via `report-status`, which is the
 * only thing that sets COMPLETED. Order of checks matters — "Cannot Complete"
 * contains "complet".
 */
export function mapHomeOrderStatus(raw: string | undefined): LabOrderStatus | null {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes("cannot")) return "CANNOT_COMPLETE"
  if (s.includes("cancel")) return "CANCELLED"
  if (s.includes("complet")) return "IN_PROGRESS"
  return null
}
