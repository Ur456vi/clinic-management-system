/**
 * `POST /api/v1/webhooks/mahajan/report-status`
 *
 * Home and Centre. A full or partial report is ready; Mahajan sends the report URL, keyed by `workOrderId` for home and `caseId` for centre.
 *
 * Path and leaf name are Mahajan's, taken verbatim from their webhook
 * collection, so their config needs no mapping to ours. The equivalent route
 * under `/api/webhooks/mahajan/` is kept until they have moved across.
 */

import { processReportStatus } from "@/lib/services/lab"
import { labWebhookHandler } from "@/lib/services/lab/webhook-route"

export const POST = labWebhookHandler(processReportStatus)
