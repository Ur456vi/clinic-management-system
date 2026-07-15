/**
 * Tolerant Zod schema for the inbound partner-lab webhook.
 *
 * We do NOT yet have the lab's 3 real sample payloads, so this schema is
 * deliberately permissive: it captures the handful of fields we can act on
 * (order number, status/event, and an optional result block) and `.passthrough()`
 * preserves everything else. The full body is persisted verbatim into
 * `LabWebhookEvent.rawPayload`, so tightening this schema later (once the real
 * samples arrive) is non-breaking — no data is dropped in the meantime.
 *
 * The two order-number shapes we accept — top-level `orderNumber` and nested
 * `order.orderNumber` — cover the likely wire shapes; `normalizeLabWebhook`
 * (lib/services/partner-lab.ts) collapses them into a single value.
 */

import { z } from "zod"

/** One analyte row, matching the LabResult analytes element shape. */
const analyteSchema = z
  .object({
    name: z.string().trim().min(1),
    value: z.union([z.string(), z.number()]),
    unit: z.string().optional(),
    refLow: z.number().optional(),
    refHigh: z.number().optional(),
    flag: z.string().optional(),
  })
  .passthrough()

/** The result/report block a RESULT_READY event may carry. */
const reportSchema = z
  .object({
    analytes: z.array(analyteSchema).optional(),
    summary: z.string().optional(),
    reportId: z.string().optional(),
    reportUrl: z.string().optional(),
  })
  .passthrough()

export const labWebhookSchema = z
  .object({
    /** Our order number, top-level shape. */
    orderNumber: z.string().trim().min(1).optional(),
    /** Our order number, nested shape (`{ order: { orderNumber } }`). */
    order: z
      .object({ orderNumber: z.string().trim().min(1).optional() })
      .passthrough()
      .optional(),

    /** Any of these may carry the status/event string. */
    event: z.string().optional(),
    eventType: z.string().optional(),
    status: z.string().optional(),

    /** Lab-supplied unique event id — preferred idempotency key when present. */
    eventId: z.string().optional(),

    /** The lab's own Salesforce order id, if echoed back. */
    externalOrderId: z.string().optional(),

    /** Result payload — accepted under either `report` or `result`. */
    report: reportSchema.optional(),
    result: reportSchema.optional(),
  })
  .passthrough()

export type LabWebhookPayload = z.infer<typeof labWebhookSchema>
export type LabWebhookAnalyte = z.infer<typeof analyteSchema>
