/**
 * `POST /api/lab/webhooks/center-status`
 *
 * Partner posts the centre-collection outcome (Completed / Cannot Complete)
 * with an optional reason. Public endpoint guarded by the shared secret.
 */

import { processCenterStatus } from "@/lib/services/lab"

import { labWebhookHandler } from "../_shared"

export const POST = labWebhookHandler(processCenterStatus)
