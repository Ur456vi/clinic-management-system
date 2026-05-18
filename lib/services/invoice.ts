/**
 * Invoice + Payment service layer (BE-37).
 *
 * Owns the revenue surface for the May-28 demo:
 *
 *   - `createInvoice`        — inserts an Invoice + N InvoiceItems and
 *     computes the cached totals (subtotalCents / taxCents / totalCents).
 *   - `listInvoices`         — cursor-paginated list with status filter.
 *   - `getInvoice`           — single invoice with items + payments
 *     eager-loaded.
 *   - `updateInvoiceStatus`  — status (and/or notes) PATCH, gated by
 *     `ALLOWED_INVOICE_TRANSITIONS`.
 *   - `recordPayment`        — appends a Payment row and re-derives the
 *     invoice's status from the sum of CAPTURED payments.
 *
 * Money is integer cents and tax rate is basis points (1800 == 18%). All
 * writes are wrapped in `db.$transaction` so the AuditLog row commits (or
 * rolls back) atomically with the mutation — matches the appointment /
 * consultation pattern.
 *
 * Out of scope here: Razorpay webhook ingestion (BE-41) and GST-compliant
 * PDF rendering. Those land later in Sprint 1 Day 11.
 */

import type { Prisma } from "@prisma/client"
import {
  InvoiceStatus,
  NotificationKind,
  PaymentMethod,
  PaymentStatus,
  Role,
} from "@prisma/client"

import { db } from "@/lib/db"
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors"
import { ConflictError } from "@/lib/api"
import { emitNotification } from "@/lib/services/notifications"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/api/pagination"
import {
  ALLOWED_INVOICE_TRANSITIONS,
  type CreateInvoiceInput,
  type InvoiceItemInput,
  type ListInvoicesQuery,
  type RecordPaymentInput,
  type UpdateInvoiceInput,
} from "@/lib/validation/invoice"

// ---------------------------------------------------------------------------
// Role gates
// ---------------------------------------------------------------------------

/** Roles allowed to create / mutate invoices and record payments. */
const WRITE_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RECEPTION,
]

/** Roles allowed to read invoices. */
const VIEW_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DOCTOR,
  Role.RMO,
  Role.RECEPTION,
]

// ---------------------------------------------------------------------------
// Include shape
// ---------------------------------------------------------------------------

const INVOICE_INCLUDE = {
  patient: {
    select: {
      id: true,
      patientNumber: true,
      fullName: true,
      status: true,
    },
  },
  appointment: {
    select: { id: true, startsAt: true, endsAt: true, status: true },
  },
  items: { orderBy: { createdAt: "asc" as const } },
  payments: { orderBy: { receivedAt: "desc" as const } },
} as const

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: typeof INVOICE_INCLUDE
}>

// ---------------------------------------------------------------------------
// Invoice number generation
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable invoice number `INV-YYYY-NNNNNN`.
 *
 * We compute the next sequence value off the current year's row count
 * inside the same transaction, then retry once on the off-chance two
 * concurrent inserts pick the same number — the unique constraint on
 * `invoice_number` is the source of truth.
 *
 * A dedicated Postgres sequence is the right long-term answer (see
 * `docs/database.md` for the patient-number pattern). Sequence wiring
 * is deferred to Sprint 2 once we know the year-rollover requirements.
 */
async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getUTCFullYear()
  const prefix = `INV-${year}-`
  const count = await tx.invoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  })
  const padded = String(count + 1).padStart(6, "0")
  return `${prefix}${padded}`
}

// ---------------------------------------------------------------------------
// Line-total math
// ---------------------------------------------------------------------------

type ComputedItem = {
  description: string
  hsnSac: string | null
  quantity: string
  unitPriceCents: number
  taxRateBps: number
  lineSubtotalCents: number
  lineTaxCents: number
  lineTotalCents: number
  sourceType: NonNullable<InvoiceItemInput["sourceType"]>
  sourceRefId: string | null
}

/**
 * Compute the line totals for a single item.
 *
 *   lineSubtotal = round(quantity * unitPriceCents)
 *   lineTax      = round(lineSubtotal * taxRateBps / 10000)
 *   lineTotal    = lineSubtotal + lineTax
 *
 * Rounding is banker's-friendly `Math.round` — half-up on .5 — matching
 * what the GST invoice rules expect.
 */
function computeItem(it: InvoiceItemInput): ComputedItem {
  const qty = Number(it.quantity)
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ValidationError("Item quantity must be > 0")
  }
  const lineSubtotalCents = Math.round(qty * it.unitPriceCents)
  const lineTaxCents = Math.round(
    (lineSubtotalCents * it.taxRateBps) / 10_000,
  )
  const lineTotalCents = lineSubtotalCents + lineTaxCents
  return {
    description: it.description,
    hsnSac: it.hsnSac ?? null,
    quantity: it.quantity,
    unitPriceCents: it.unitPriceCents,
    taxRateBps: it.taxRateBps,
    lineSubtotalCents,
    lineTaxCents,
    lineTotalCents,
    sourceType: it.sourceType ?? "MANUAL",
    sourceRefId: it.sourceRefId ?? null,
  }
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Create an invoice in DRAFT with N items. Totals are computed
 * server-side; clients never pass cached totals.
 *
 *  - Role gate: WRITE_ROLES (ADMIN / DOCTOR / RECEPTION).
 *  - Verifies patient (+ appointment, if supplied) exist.
 *  - Generates `INV-YYYY-NNNNNN`; retries once on unique collision.
 *  - Writes a CREATE audit row.
 */
export async function createInvoice(
  input: CreateInvoiceInput,
  actor: { userId: string; role: Role },
): Promise<InvoiceWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot create invoices`)
  }

  const computed = input.items.map(computeItem)
  const subtotalCents = computed.reduce(
    (acc, it) => acc + it.lineSubtotalCents,
    0,
  )
  const taxCents = computed.reduce((acc, it) => acc + it.lineTaxCents, 0)
  const totalCents = subtotalCents + taxCents

  const tryCreate = async (): Promise<InvoiceWithRelations> => {
    return db.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({
        where: { id: input.patientId },
        select: { id: true },
      })
      if (!patient) throw new NotFoundError("Patient not found")

      if (input.appointmentId) {
        const appt = await tx.appointment.findUnique({
          where: { id: input.appointmentId },
          select: { id: true, patientId: true },
        })
        if (!appt) throw new NotFoundError("Appointment not found")
        if (appt.patientId !== input.patientId) {
          throw new ValidationError(
            "Appointment does not belong to the supplied patient",
          )
        }
      }

      const invoiceNumber = await nextInvoiceNumber(tx)

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          subtotalCents,
          taxCents,
          totalCents,
          gstNumber: input.gstNumber,
          placeOfSupply: input.placeOfSupply,
          status: InvoiceStatus.DRAFT,
          notes: input.notes,
          dueAt: input.dueAt,
          items: { create: computed },
        },
        include: INVOICE_INCLUDE,
      })

      await tx.auditLog.create({
        data: {
          actorUserId: actor.userId,
          action: "CREATE",
          entityType: "Invoice",
          entityId: created.id,
          detail: {
            after: {
              id: created.id,
              invoiceNumber: created.invoiceNumber,
              patientId: created.patientId,
              totalCents: created.totalCents,
              status: created.status,
              itemCount: computed.length,
            },
          },
        },
      })

      return created
    })
  }

  try {
    return await tryCreate()
  } catch (err) {
    // P2002 on invoice_number — extremely unlikely but retry once.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return tryCreate()
    }
    throw err
  }
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export type ListInvoicesResult = {
  items: InvoiceWithRelations[]
  nextCursor: string | null
}

export async function listInvoices(
  input: ListInvoicesQuery,
  actor: { userId: string; role: Role },
): Promise<ListInvoicesResult> {
  if (!VIEW_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view invoices`)
  }

  const take = Math.min(input.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const where: Prisma.InvoiceWhereInput = {}
  if (input.patientId) where.patientId = input.patientId
  if (input.appointmentId) where.appointmentId = input.appointmentId
  if (input.status) where.status = { in: input.status }

  const rows = await db.invoice.findMany({
    where,
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: INVOICE_INCLUDE,
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

export async function getInvoice(
  id: string,
  actor: { userId: string; role: Role },
): Promise<InvoiceWithRelations> {
  if (!VIEW_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot view invoices`)
  }

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: INVOICE_INCLUDE,
  })
  if (!invoice) throw new NotFoundError("Invoice not found")

  try {
    await db.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "READ",
        entityType: "Invoice",
        entityId: invoice.id,
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[invoice.getInvoice] audit write failed", err)
  }

  return invoice
}

// ---------------------------------------------------------------------------
// Update status (+ notes)
// ---------------------------------------------------------------------------

/**
 * PATCH `/api/invoices/:id` — narrow surface: status transition and/or
 * notes. Status transitions are gated by `ALLOWED_INVOICE_TRANSITIONS`.
 * Stamps `issuedAt` when DRAFT -> ISSUED.
 */
export async function updateInvoiceStatus(
  id: string,
  input: UpdateInvoiceInput,
  actor: { userId: string; role: Role },
): Promise<InvoiceWithRelations> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot modify invoices`)
  }

  return db.$transaction(async (tx) => {
    const before = await tx.invoice.findUnique({ where: { id } })
    if (!before) throw new NotFoundError("Invoice not found")

    const data: Prisma.InvoiceUpdateInput = {}

    if (input.status !== undefined && input.status !== before.status) {
      const allowed = ALLOWED_INVOICE_TRANSITIONS[before.status] ?? []
      if (!allowed.includes(input.status)) {
        throw new ValidationError(
          `Illegal invoice transition: ${before.status} -> ${input.status}`,
        )
      }
      data.status = input.status
      if (
        before.status === InvoiceStatus.DRAFT &&
        input.status === InvoiceStatus.ISSUED &&
        !before.issuedAt
      ) {
        data.issuedAt = new Date()
      }
    }

    if (input.notes !== undefined) {
      data.notes = input.notes
    }

    const after = await tx.invoice.update({
      where: { id },
      data,
      include: INVOICE_INCLUDE,
    })

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "UPDATE",
        entityType: "Invoice",
        entityId: after.id,
        detail: {
          before: { status: before.status, notes: before.notes },
          after: { status: after.status, notes: after.notes },
        },
      },
    })

    return after
  })
}

// ---------------------------------------------------------------------------
// Record payment
// ---------------------------------------------------------------------------

/**
 * Append a Payment to an Invoice and re-derive the invoice's status from
 * the running sum of CAPTURED payments.
 *
 *   sum < total  AND sum > 0  -> PARTIALLY_PAID
 *   sum >= total              -> PAID
 *   sum == 0                  -> leave status alone (DRAFT/ISSUED)
 *
 * VOID invoices reject new payments outright. Razorpay-gateway payments
 * land here too — BE-41's webhook handler will call `recordPayment` with
 * `method = RAZORPAY` and a populated `gatewayRef`.
 */
export async function recordPayment(
  invoiceId: string,
  input: RecordPaymentInput,
  actor: { userId: string; role: Role },
): Promise<{ invoice: InvoiceWithRelations; paymentId: string }> {
  if (!WRITE_ROLES.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot record payments`)
  }

  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })
    if (!invoice) throw new NotFoundError("Invoice not found")

    if (invoice.status === InvoiceStatus.VOID) {
      throw new ConflictError(
        "Cannot record a payment on a VOID invoice",
        { code: "INVOICE_VOID" },
      )
    }

    // Razorpay payments must carry a gatewayRef.
    if (
      input.method === PaymentMethod.RAZORPAY &&
      !input.gatewayRef
    ) {
      throw new ValidationError(
        "gatewayRef is required for RAZORPAY payments",
      )
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amountCents: input.amountCents,
        method: input.method,
        status: input.status,
        gatewayRef: input.gatewayRef ?? null,
        receivedAt: input.receivedAt ?? new Date(),
        notes: input.notes ?? null,
      },
    })

    // Recompute status from the sum of CAPTURED payments (including the
    // one we just inserted).
    const captured = [...invoice.payments, payment].filter(
      (p) => p.status === PaymentStatus.CAPTURED,
    )
    const paidCents = captured.reduce((acc, p) => acc + p.amountCents, 0)

    let nextStatus = invoice.status
    if (paidCents >= invoice.totalCents && invoice.totalCents > 0) {
      nextStatus = InvoiceStatus.PAID
    } else if (paidCents > 0 && paidCents < invoice.totalCents) {
      nextStatus = InvoiceStatus.PARTIALLY_PAID
    }

    let updated = invoice as unknown as InvoiceWithRelations
    if (nextStatus !== invoice.status) {
      updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: nextStatus },
        include: INVOICE_INCLUDE,
      })
    } else {
      updated = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: INVOICE_INCLUDE,
      })
    }

    await tx.auditLog.create({
      data: {
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "Payment",
        entityId: payment.id,
        detail: {
          invoiceId,
          amountCents: payment.amountCents,
          method: payment.method,
          status: payment.status,
          gatewayRef: payment.gatewayRef,
          invoiceStatusBefore: invoice.status,
          invoiceStatusAfter: updated.status,
        },
      },
    })

    // BE-45 fan-out: only on the DRAFT/ISSUED/PARTIALLY_PAID -> PAID
    // edge. We deliberately skip the PARTIALLY_PAID transition (clinic
    // staff don't want a bell on every partial payment) and we skip
    // when the patient has no linked portal User.
    if (
      nextStatus === InvoiceStatus.PAID &&
      invoice.status !== InvoiceStatus.PAID
    ) {
      const patient = await tx.patient.findUnique({
        where: { id: invoice.patientId },
        select: { userId: true },
      })
      if (patient?.userId) {
        await emitNotification({
          userId: patient.userId,
          kind: NotificationKind.PAYMENT_RECEIVED,
          title: "Payment received — invoice paid in full",
          body: `Invoice ${invoice.invoiceNumber}`,
          sourceType: "Invoice",
          sourceRefId: invoice.id,
          tx,
        })
      }
    }

    return { invoice: updated, paymentId: payment.id }
  })
}
