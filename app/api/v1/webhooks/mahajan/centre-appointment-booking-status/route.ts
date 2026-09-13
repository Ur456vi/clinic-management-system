/**
 * `POST /api/v1/webhooks/mahajan/centre-appointment-booking-status`
 *
 * Centre Visit only. Carries either `orderStatus` (the call-centre booking outcome) or `registrationStatus` (what happened at the centre on the day).
 *
 * Path and leaf name are Mahajan's, taken verbatim from their webhook
 * collection, so their config needs no mapping to ours. The equivalent route
 * under `/api/webhooks/mahajan/` is kept until they have moved across.
 */

import { processCenterStatus } from "@/lib/services/lab"
import { labWebhookHandler } from "@/lib/services/lab/webhook-route"

export const POST = labWebhookHandler(processCenterStatus)
