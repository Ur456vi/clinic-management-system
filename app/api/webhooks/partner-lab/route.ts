/**
 * `POST /api/webhooks/partner-lab` — inbound partner-lab results webhook.
 *
 * The partner lab (Salesforce) pushes order status + result updates here. The
 * route lives under `/api/webhooks/` so it is exempt from the same-origin CSRF
 * guard in `lib/api/handler.ts` (external server-to-server posts carry no
 * matching Origin) — auth is a shared bearer token instead.
 *
 * Shape mirrors the Razorpay webhook (`app/api/payments/razorpay/webhook`):
 * read the raw body, verify, tolerant Zod parse, idempotent transactional
 * ingest, return `{ acknowledged, matched }`. An unmatched or unknown-status
 * event is still acknowledged with 200 (parked in `LabWebhookEvent`) so the
 * lab does not retry a delivery we have durably recorded.
 */

import { NextResponse } from "next/server"

import { defineHandler, ok } from "@/lib/api"
import { PARTNER_LAB_WEBHOOK_HEADER } from "@/lib/config/partner-lab"
import { ingestLabWebhook, verifyWebhookToken } from "@/lib/services/partner-lab"
import { labWebhookSchema } from "@/lib/validation/partner-lab"

export const POST = defineHandler(async ({ req, requestId }) => {
  // Read the raw body first so we can hash it for idempotency and keep a
  // verbatim copy — parsing to JSON afterwards.
  const rawBody = await req.text()
  const token = req.headers.get(PARTNER_LAB_WEBHOOK_HEADER)

  if (!verifyWebhookToken(token)) {
    console.warn(`[${requestId}] partner-lab webhook: token verification failed`)
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid webhook token",
          details: { code: "INVALID_TOKEN" },
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

  const parsed = labWebhookSchema.parse(json)
  const result = await ingestLabWebhook({ rawBody, parsed, signatureOk: true })

  console.log(
    `[${requestId}] partner-lab webhook: order=${result.orderNumber ?? "<none>"} outcome=${result.outcome} status=${result.status ?? "-"} labResultUpdated=${result.labResultUpdated}`,
  )

  return ok({
    acknowledged: true,
    matched: result.matched,
    orderNumber: result.orderNumber,
    status: result.status,
  })
})
