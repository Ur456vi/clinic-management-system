/**
 * Inbound partner webhook processing.
 *
 * Every event is first recorded verbatim in `lab_webhook_events` (audit +
 * replay), then applied to the matching `LabOrder` (matched on `orderNumber`).
 * Applying is idempotent — it sets the latest values, so a partner replay is
 * harmless. Processing errors are captured on the event row rather than thrown,
 * so we can always return a fast 200 ack to the partner.
 */

import type { LabWebhookKind, Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { istInstant } from "@/lib/date-utils"
import { logger } from "@/lib/logger"
import {
  centerStatusSchema,
  mapCenterOrderStatus,
  mapCenterRegistrationStatus,
  mapHomeOrderStatus,
  orderStatusSchema,
  reportStatusSchema,
  type CenterStatusPayload,
  type OrderStatusPayload,
  type ReportStatusPayload,
} from "@/lib/validation/lab"

const log = logger.child({ mod: "lab-webhooks" })

type ProcessResult = { matched: boolean; orderNumber: string | null }

/**
 * Partner datetimes are IST wall-clock ("2026-09-20 10:00:00"), matching the
 * convention their booking endpoints use. An ISO string carrying a zone is
 * taken at face value.
 */
function parsePartnerDateTime(s: string | undefined): Date | undefined {
  if (!s) return undefined
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(s.trim())
  if (m) return istInstant(m[1], m[2])
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? undefined : d
}

async function findOrderId(orderNumber: string): Promise<string | null> {
  const order = await db.labOrder.findUnique({
    where: { orderNumber },
    select: { id: true },
  })
  return order?.id ?? null
}

/** Log the raw event, returning its id so the applier can back-link the order. */
async function recordEvent(
  kind: LabWebhookKind,
  orderNumber: string | null,
  payload: unknown,
): Promise<string> {
  const ev = await db.labWebhookEvent.create({
    data: { kind, orderNumber: orderNumber ?? undefined, payload: payload as Prisma.InputJsonValue },
  })
  return ev.id
}

async function finishEvent(eventId: string, labOrderId: string | null, error?: string): Promise<void> {
  await db.labWebhookEvent.update({
    where: { id: eventId },
    data: { processed: !error, labOrderId: labOrderId ?? undefined, error: error ?? null },
  })
}

/** REPORT_STATUS — store the latest report pointer + status on the order. */
export async function processReportStatus(raw: unknown): Promise<ProcessResult> {
  const payload: ReportStatusPayload = reportStatusSchema.parse(raw)
  const eventId = await recordEvent("REPORT_STATUS", payload.orderNumber, payload)
  try {
    const orderId = await findOrderId(payload.orderNumber)
    if (!orderId) {
      await finishEvent(eventId, null, "no matching order")
      return { matched: false, orderNumber: payload.orderNumber }
    }
    // A "Completed" (non-partial) report advances the order; a partial one
    // only updates the pointer.
    const isComplete =
      !!payload.reportStatus &&
      /complet/i.test(payload.reportStatus) &&
      !/partial/i.test(payload.reportStatus)

    await db.labOrder.update({
      where: { id: orderId },
      data: {
        reportUrl: payload.reportUrl ?? undefined,
        reportStatus: payload.reportStatus ?? undefined,
        labNumber: payload.labNumber ?? undefined,
        workOrderId: payload.workOrderId ?? undefined,
        appointmentId: payload.appointmentId ?? undefined,
        orderCaseId: payload.caseId ?? undefined,
        ...(isComplete ? { status: "COMPLETED" as const } : {}),
      },
    })
    await finishEvent(eventId, orderId)
    return { matched: true, orderNumber: payload.orderNumber }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error({ orderNumber: payload.orderNumber, err: message }, "processReportStatus failed")
    await finishEvent(eventId, null, message.slice(0, 500))
    return { matched: false, orderNumber: payload.orderNumber }
  }
}

/**
 * ORDER_STATUS — home-collection visit outcome. "Completed" here is the phlebo
 * having collected the sample, which is IN_PROGRESS for us; COMPLETED comes
 * later from `report-status`.
 */
export async function processOrderStatus(raw: unknown): Promise<ProcessResult> {
  const payload: OrderStatusPayload = orderStatusSchema.parse(raw)
  const eventId = await recordEvent("ORDER_STATUS", payload.orderNumber, payload)
  try {
    const orderId = await findOrderId(payload.orderNumber)
    if (!orderId) {
      await finishEvent(eventId, null, "no matching order")
      return { matched: false, orderNumber: payload.orderNumber }
    }
    const mapped = mapHomeOrderStatus(payload.status)
    await db.labOrder.update({
      where: { id: orderId },
      data: {
        appointmentId: payload.appointmentId ?? undefined,
        reason: payload.reason ?? undefined,
        ...(mapped ? { status: mapped } : {}),
      },
    })
    await finishEvent(eventId, orderId)
    return { matched: true, orderNumber: payload.orderNumber }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error({ orderNumber: payload.orderNumber, err: message }, "processOrderStatus failed")
    await finishEvent(eventId, null, message.slice(0, 500))
    return { matched: false, orderNumber: payload.orderNumber }
  }
}

/** CENTER_STATUS — centre-collection outcome (completed / cannot complete). */
export async function processCenterStatus(raw: unknown): Promise<ProcessResult> {
  const payload: CenterStatusPayload = centerStatusSchema.parse(raw)
  const eventId = await recordEvent("CENTER_STATUS", payload.orderNumber, payload)
  try {
    const orderId = await findOrderId(payload.orderNumber)
    if (!orderId) {
      await finishEvent(eventId, null, "no matching order")
      return { matched: false, orderNumber: payload.orderNumber }
    }
    // One endpoint, two payload shapes. `registrationStatus` reports what
    // happened at the centre on the day; `orderStatus` reports the call-centre
    // booking outcome. Each has its own mapping — see the mappers for why
    // "Completed" does not mean COMPLETED in either case.
    const mapped = payload.registrationStatus
      ? mapCenterRegistrationStatus(payload.registrationStatus)
      : mapCenterOrderStatus(payload.orderStatus)

    // A reschedule or cancellation mints a fresh centre case id, so always take
    // the newest one; `orderCaseId` and `caseId` are the same field under two
    // names depending on which shape arrived.
    const caseId = payload.orderCaseId ?? payload.caseId
    const appointmentStart = parsePartnerDateTime(payload.appointmentDateTime)

    await db.labOrder.update({
      where: { id: orderId },
      data: {
        orderCaseId: caseId ?? undefined,
        workOrderId: payload.workOrderId ?? undefined,
        labNumber: payload.labNumber ?? undefined,
        reason: payload.reason ?? undefined,
        ...(appointmentStart ? { appointmentStart } : {}),
        ...(mapped ? { status: mapped } : {}),
      },
    })
    await finishEvent(eventId, orderId)
    return { matched: true, orderNumber: payload.orderNumber }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error({ orderNumber: payload.orderNumber, err: message }, "processCenterStatus failed")
    await finishEvent(eventId, null, message.slice(0, 500))
    return { matched: false, orderNumber: payload.orderNumber }
  }
}
