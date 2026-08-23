/**
 * `POST /api/lab/webhooks/report-status`
 *
 * Partner posts a report pointer (Completed / Partial) for a work order.
 * Public endpoint guarded by the `x-lab-webhook-secret` shared secret.
 */

import { processReportStatus } from "@/lib/services/lab"

import { labWebhookHandler } from "../_shared"

export const POST = labWebhookHandler(processReportStatus)
