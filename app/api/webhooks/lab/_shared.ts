/**
 * Shared inbound-webhook handler for the partner lab.
 *
 * Not session-authenticated — the partner's server posts here directly. We
 * verify the shared secret (`x-lab-webhook-secret`), parse the JSON body, and
 * hand it to a processor. We always ack fast; a processing miss (no matching
 * order, validation error) is captured on the event row, not surfaced as a
 * 5xx, so the partner isn't pushed into a retry storm.
 */

import { NextResponse } from "next/server"

import { defineHandler, ok } from "@/lib/api"
import { verifyWebhookSecret } from "@/lib/services/lab"

type Processor = (raw: unknown) => Promise<{ matched: boolean; orderNumber: string | null }>

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Invalid webhook secret" } },
    { status: 401 },
  )
}

function badRequest(message: string) {
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message } }, { status: 400 })
}

export function labWebhookHandler(processor: Processor) {
  return defineHandler(async ({ req, requestId }) => {
    if (!verifyWebhookSecret(req)) {
      console.warn(`[${requestId}] lab webhook: secret verification failed`)
      return unauthorized()
    }

    const rawBody = await req.text()
    let json: unknown
    try {
      json = JSON.parse(rawBody)
    } catch {
      return badRequest("Body is not valid JSON")
    }

    try {
      const result = await processor(json)
      return ok({ acknowledged: true, matched: result.matched, orderNumber: result.orderNumber })
    } catch (err) {
      // Zod / unexpected shape — reject so the partner sees the payload was bad.
      const message = err instanceof Error ? err.message : "Invalid payload"
      console.warn(`[${requestId}] lab webhook: ${message}`)
      return badRequest(message)
    }
  })
}
