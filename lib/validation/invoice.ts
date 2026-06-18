/**
 * Zod schemas for the Invoice / Payment API surface (BE-37).
 *
 * Exports:
 *   - `createInvoiceSchema`        — POST  /api/invoices
 *   - `updateInvoiceSchema`        — PATCH /api/invoices/:id (status + notes)
 *   - `listInvoicesQuerySchema`    — GET   /api/invoices
 *   - `invoiceIdParamSchema`       — :id path param
 *   - `recordPaymentSchema`        — POST  /api/invoices/:id/payments
 *
 * Money is in cents (integer). The service layer is the sole writer for
 * cached totals (`subtotalCents`/`totalCents` on the Invoice, and the
 * `line*Cents` columns on each item).
 */

import { z } from "zod"
import {
  InvoiceItemSourceType,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

const isoDateTime = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Must be an ISO 8601 date-time string",
  })
  .transform((v) => new Date(v))

const statusEnum = z.nativeEnum(InvoiceStatus)

const invoiceStatusListParam = z
  .string()
  .trim()
  .optional()
  .transform((raw) => {
    if (raw === undefined || raw === "") return undefined
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    return tokens.length === 0 ? undefined : tokens
  })
  .pipe(z.array(statusEnum).nonempty().optional())

const limitParam = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
  .pipe(z.number().int().positive().max(100).optional())

// ---------------------------------------------------------------------------
// Allowed invoice transitions (BE-37)
// ---------------------------------------------------------------------------
//
//   DRAFT          -> ISSUED | VOID
//   ISSUED         -> PARTIALLY_PAID | PAID | VOID
//   PARTIALLY_PAID -> PAID | VOID
//   PAID           -> VOID            (refund / void after the fact)
//   VOID           -> (terminal)
//
// PARTIALLY_PAID and PAID are normally driven by `recordPayment` in the
// service layer rather than a direct PATCH — keeping the manual path is
// useful for the May-28 demo's "mark paid" flow on cash invoices.

export const ALLOWED_INVOICE_TRANSITIONS: Record<
  InvoiceStatus,
  readonly InvoiceStatus[]
> = {
  DRAFT: [InvoiceStatus.ISSUED, InvoiceStatus.VOID],
  ISSUED: [
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.VOID,
  ],
  PARTIALLY_PAID: [InvoiceStatus.PAID, InvoiceStatus.VOID],
  PAID: [InvoiceStatus.VOID],
  VOID: [],
}

// ---------------------------------------------------------------------------
// Invoice item — request shape (line totals are computed server-side)
// ---------------------------------------------------------------------------

export const invoiceItemInputSchema = z.object({
  description: z.string().trim().min(1).max(500),
  /**
   * Quantity is a Decimal column server-side but accepted as either a
   * number or string here (Prisma Decimal accepts both). We coerce to
   * string so floating-point doesn't sneak through the JSON layer.
   */
  quantity: z
    .union([z.number().positive(), z.string()])
    .transform((v) => (typeof v === "number" ? v.toString() : v.trim()))
    .refine((v) => /^\d+(\.\d+)?$/.test(v) && Number(v) > 0, {
      message: "quantity must be a positive decimal",
    }),
  unitPriceCents: z.number().int().nonnegative(),
  sourceType: z.nativeEnum(InvoiceItemSourceType).optional(),
  sourceRefId: uuid.optional(),
})

export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>

// ---------------------------------------------------------------------------
// createInvoiceSchema
// ---------------------------------------------------------------------------

export const createInvoiceSchema = z.object({
  patientId: uuid,
  appointmentId: uuid.optional(),
  departmentId: uuid.optional(),
  notes: trimmedOptional(2000),
  dueAt: isoDateTime.optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one item required"),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

// ---------------------------------------------------------------------------
// updateInvoiceSchema — status + notes only
// ---------------------------------------------------------------------------

export const updateInvoiceSchema = z
  .object({
    status: statusEnum.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.notes !== undefined, {
    message: "At least one of `status` or `notes` is required",
  })

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>

// ---------------------------------------------------------------------------
// listInvoicesQuerySchema
// ---------------------------------------------------------------------------

export const listInvoicesQuerySchema = z.object({
  patientId: uuid.optional(),
  appointmentId: uuid.optional(),
  status: invoiceStatusListParam,
  cursor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  limit: limitParam,
})

export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>

// ---------------------------------------------------------------------------
// :id param
// ---------------------------------------------------------------------------

export const invoiceIdParamSchema = z.object({ id: uuid })

// ---------------------------------------------------------------------------
// recordPaymentSchema
// ---------------------------------------------------------------------------

export const recordPaymentSchema = z.object({
  amountCents: z.number().int().positive(),
  method: z.nativeEnum(PaymentMethod),
  /**
   * Defaults to CAPTURED for manual recordings at the desk. The Razorpay
   * webhook (BE-41) will push PENDING -> CAPTURED transitions through a
   * separate code path.
   */
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.CAPTURED),
  gatewayRef: trimmedOptional(120),
  notes: trimmedOptional(500),
  receivedAt: isoDateTime.optional(),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
