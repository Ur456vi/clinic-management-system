/**
 * `POST /api/lab/webhooks/order-status`
 *
 * Partner posts the appointment/order status (e.g. "Scheduled") once their
 * team books the slot. Public endpoint guarded by the shared secret.
 */

import { processOrderStatus } from "@/lib/services/lab"

import { labWebhookHandler } from "../_shared"

export const POST = labWebhookHandler(processOrderStatus)
