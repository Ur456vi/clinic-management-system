/**
 * Zod schemas for the three inbound partner webhooks (see the partner's
 * "Final Payloads" doc). Deliberately lenient: the partner pads some ids with
 * trailing whitespace, so every id is trimmed. `orderNumber` is the key we
 * match back to our `LabOrder`.
 */

import { z } from "zod"

import type { LabOrderStatus } from "@prisma/client"

const trimmed = z.string().transform((s) => s.trim())
const trimmedOpt = z
  .string()
  .optional()
  .transform((s) => (s == null ? undefined : s.trim() || undefined))

/** 1. Report status — a report (or partial) is ready for a work order. */
export const reportStatusSchema = z.object({
  workOrderId: trimmedOpt,
  orderNumber: trimmed,
  reportUrl: trimmedOpt,
  reportStatus: trimmedOpt,
  labNumber: trimmedOpt,
  appointmentId: trimmedOpt,
})

/** 2. Order / appointment status — the partner booked / advanced the slot. */
export const orderStatusSchema = z.object({
  appointmentId: trimmedOpt,
  orderNumber: trimmed,
  status: trimmedOpt,
})

/** 3. Centre appointment status — centre-collection outcome. */
export const centerStatusSchema = z.object({
  orderCaseId: trimmedOpt,
  orderNumber: trimmed,
  orderStatus: trimmedOpt,
  workOrderId: trimmedOpt,
  appointmentDateTime: trimmedOpt,
  reason: trimmedOpt,
})

export type ReportStatusPayload = z.infer<typeof reportStatusSchema>
export type OrderStatusPayload = z.infer<typeof orderStatusSchema>
export type CenterStatusPayload = z.infer<typeof centerStatusSchema>

/**
 * Map a free-text partner status onto our `LabOrderStatus`. Returns null when
 * the text is unrecognized so the caller leaves the lifecycle status untouched
 * (and just records the raw event).
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

export function mapOrderStatus(raw: string | undefined): LabOrderStatus | null {
  if (!raw) return null
  const s = raw.toLowerCase()
  if (s.includes("cannot")) return "CANNOT_COMPLETE"
  if (s.includes("complet")) return "COMPLETED"
  if (s.includes("cancel")) return "CANCELLED"
  if (s.includes("progress")) return "IN_PROGRESS"
  if (s.includes("schedul")) return "SCHEDULED"
  return null
}
