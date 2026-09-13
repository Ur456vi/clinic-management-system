/**
 * `POST /api/v1/webhooks/mahajan/appointment-order-status`
 *
 * Home Collection only. Mahajan reports the phlebotomist's visit outcome — sample collected, or cannot complete with a reason.
 *
 * Path and leaf name are Mahajan's, taken verbatim from their webhook
 * collection, so their config needs no mapping to ours. The equivalent route
 * under `/api/webhooks/mahajan/` is kept until they have moved across.
 */

import { processOrderStatus } from "@/lib/services/lab"
import { labWebhookHandler } from "@/lib/services/lab/webhook-route"

export const POST = labWebhookHandler(processOrderStatus)
