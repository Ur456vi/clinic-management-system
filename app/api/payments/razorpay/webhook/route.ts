/**
 * `POST /api/payments/razorpay/webhook` (BE-41 — mock).
 *
 * Razorpay webhook ingest. **Not** session-authenticated — Razorpay's
 * server posts here directly. We verify the `x-razorpay-signature`
 * header against the raw request body using `RAZORPAY_WEBHOOK_SECRET`,
 * then upsert the corresponding Payment row.
 *
 * Idempotency: keyed on `gatewayRef` (the Razorpay payment id). If the
 * row already exists we update its status (e.g. PENDING -> CAPTURED on
 * a delayed capture) rather than inserting a duplicate.
 *
 * The matching invoice is resolved by:
 *   1. `payload.payment.entity.notes.invoiceId` (preferred — set by
 *      `createMockOrder` callers in Sprint 2);
 *   2. fallback: the existing Payment row keyed on `gatewayRef` (so a
 *      late status flip still finds its invoice).
 *
 * Sprint 1 ships with mock signing; the wire shape is identical to the
 * real Razorpay webhook so the route body does not change in Sprint 2.
 */

import { NextResponse } from "next/server"

import {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client"

import { defineHandler, ok } from "@/lib/api"
import { db } from "@/lib/db"
import { verifyWebhookSignature } from "@/lib/services/razorpay"
import {
  RAZORPAY_STATUS_MAP,
  webhookPayloadSchema,
} from "@/lib/validation/payment"

const SIGNATURE_HEADER = "x-razorpay-signature"

export const POST = defineHandler(async ({ req, requestId }) => {
  // Razorpay signs the raw body — we must read it as text BEFORE
  // parsing as JSON, otherwise the bytes the HMAC was computed over
  // can drift.
  const rawBody = await req.text()
  const signature = req.headers.get(SIGNATURE_HEADER)

  if (!verifyWebhookSignature(rawBody, signature)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[${requestId}] razorpay webhook: signature verification failed`,
    )
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid webhook signature",
          details: { code: "INVALID_SIGNATURE" },
        },
      },
      { status: 401 },
    )
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Webhook body is not valid JSON",
        },
      },
      { status: 400 },
    )
  }

  const parsed = webhookPayloadSchema.parse(json)
  const entity = parsed.payload.payment.entity
  const mappedStatus =
    RAZORPAY_STATUS_MAP[entity.status] ?? PaymentStatus.PENDING

  // eslint-disable-next-line no-console
  console.log(
    `[${requestId}] razorpay webhook: event=${parsed.event} order=${entity.order_id} payment=${entity.id} status=${entity.status} -> ${mappedStatus}`,
  )

  // Resolve the invoice — prefer the explicit note, fall back to any
  // existing payment row already keyed on this gateway ref.
  const result = await db.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({
      where: { gatewayRef: entity.id },
    })

    const invoiceId =
      entity.notes?.invoiceId ?? existing?.invoiceId ?? null
    if (!invoiceId) {
      return { kind: "no-invoice" as const }
    }

    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    })
    if (!invoice) {
      return { kind: "invoice-missing" as const, invoiceId }
    }

    let paymentId: string
    if (existing) {
      const updated = await tx.payment.update({
        where: { id: existing.id },
        data: { status: mappedStatus },
      })
      paymentId = updated.id
    } else {
      const created = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amountCents: entity.amount,
          method: PaymentMethod.RAZORPAY,
          status: mappedStatus,
          gatewayRef: entity.id,
        },
      })
      paymentId = created.id
    }

    // Recompute invoice status from CAPTURED payments (including the
    // one we just wrote/updated).
    const allPayments = await tx.payment.findMany({
      where: { invoiceId: invoice.id },
    })
    const paidCents = allPayments
      .filter((p) => p.status === PaymentStatus.CAPTURED)
      .reduce((acc, p) => acc + p.amountCents, 0)

    let nextStatus: InvoiceStatus = invoice.status
    if (invoice.status !== InvoiceStatus.VOID) {
      if (paidCents >= invoice.totalCents && invoice.totalCents > 0) {
        nextStatus = InvoiceStatus.PAID
      } else if (paidCents > 0 && paidCents < invoice.totalCents) {
        nextStatus = InvoiceStatus.PARTIALLY_PAID
      }
    }

    if (nextStatus !== invoice.status) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: nextStatus },
      })
    }

    await tx.auditLog.create({
      data: {
        actorUserId: null,
        action: existing ? "UPDATE" : "CREATE",
        entityType: "Payment",
        entityId: paymentId,
        detail: {
          source: "razorpay-webhook",
          event: parsed.event,
          gatewayRef: entity.id,
          razorpayStatus: entity.status,
          mappedStatus,
          amountCents: entity.amount,
          invoiceStatusBefore: invoice.status,
          invoiceStatusAfter: nextStatus,
        },
      },
    })

    return {
      kind: "ok" as const,
      invoiceId: invoice.id,
      paymentId,
      invoiceStatus: nextStatus,
    }
  })

  if (result.kind === "no-invoice") {
    // eslint-disable-next-line no-console
    console.warn(
      `[${requestId}] razorpay webhook: no invoiceId resolvable for gatewayRef=${entity.id}`,
    )
    return ok({ acknowledged: true, matched: false })
  }
  if (result.kind === "invoice-missing") {
    // eslint-disable-next-line no-console
    console.warn(
      `[${requestId}] razorpay webhook: invoice ${result.invoiceId} not found for gatewayRef=${entity.id}`,
    )
    return ok({ acknowledged: true, matched: false })
  }

  return ok({
    acknowledged: true,
    matched: true,
    invoiceId: result.invoiceId,
    paymentId: result.paymentId,
    invoiceStatus: result.invoiceStatus,
  })
})
