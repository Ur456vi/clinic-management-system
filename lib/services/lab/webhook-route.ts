/**
 * Shared inbound-webhook route handler for the partner lab.
 *
 * Not session-authenticated — the partner's server posts here directly. We
 * check the shared secret (`x-lab-webhook-secret`), parse the JSON body, and
 * hand it to a processor. We always ack fast; a processing miss (no matching
 * order, validation error) is captured on the event row, not surfaced as a
 * 5xx, so the partner isn't pushed into a retry storm.
 *
 * Lives in `lib/` rather than beside the routes because two route trees share
 * it: the partner posts to `/api/v1/webhooks/mahajan/...` with their own leaf
 * names, and our original `/api/webhooks/mahajan/...` routes are kept while
 * that transition happens.
 *
 * TEMPORARY UNAUTHENTICATED MODE
 * -----------------------------
 * `LAB_WEBHOOK_ALLOW_UNAUTHENTICATED=true` accepts requests that carry no
 * valid secret, so the partner can start delivering before a credential is
 * agreed. While it is on, anyone who learns the URL can write report links and
 * lab results onto patient records — it is a stopgap, not a configuration.
 * It defaults to false, every bypass is logged at warn level, and a correct
 * secret is still honoured, so the partner can start sending one without any
 * code change here.
 */

import { NextResponse } from "next/server"

import { defineHandler, ok } from "@/lib/api"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

import { verifyWebhookSecret } from "./webhook-auth"

const log = logger.child({ mod: "lab-webhook-route" })

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
    const path = req.nextUrl?.pathname ?? ""
    const authenticated = verifyWebhookSecret(req)

    if (!authenticated) {
      if (!env.LAB_WEBHOOK_ALLOW_UNAUTHENTICATED) {
        log.warn({ requestId, path }, "lab webhook rejected — secret verification failed")
        return unauthorized()
      }
      log.warn(
        { requestId, path, ip: req.headers.get("x-forwarded-for") ?? "unknown" },
        "lab webhook ACCEPTED WITHOUT AUTH — LAB_WEBHOOK_ALLOW_UNAUTHENTICATED is on",
      )
    }

    const rawBody = await req.text()

    // Payload bodies carry patient identifiers and report URLs, so the raw dump
    // is tied to the same temporary flag rather than left on permanently.
    if (env.LAB_WEBHOOK_ALLOW_UNAUTHENTICATED) {
      log.warn({ requestId, path, rawBody }, "lab webhook raw body")
    }

    let json: unknown
    try {
      json = JSON.parse(rawBody)
    } catch {
      return badRequest("Body is not valid JSON")
    }

    try {
      const result = await processor(json)
      return ok({
        acknowledged: true,
        matched: result.matched,
        orderNumber: result.orderNumber,
        authenticated,
      })
    } catch (err) {
      // Zod / unexpected shape — reject so the partner sees the payload was bad.
      const message = err instanceof Error ? err.message : "Invalid payload"
      log.warn({ requestId, path, err: message }, "lab webhook payload rejected")
      return badRequest(message)
    }
  })
}
