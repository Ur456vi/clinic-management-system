/**
 * Shared-secret guard for inbound partner webhooks.
 *
 * The partner must send the secret in the `x-lab-webhook-secret` header. It is
 * compared in constant time against the secret resolved from admin settings,
 * falling back to `LAB_WEBHOOK_SECRET`. When no secret is configured the guard
 * FAILS CLOSED (rejects) so an unconfigured deployment never accepts
 * unauthenticated writes.
 *
 * Async because the secret can now come from the database.
 *
 * NOTE: this is the interim scheme pending the partner confirming their
 * preferred mechanism (bearer / HMAC signature / IP allowlist) — see the
 * integration email. Swap the check here when that is agreed.
 */

import { timingSafeEqual } from "node:crypto"

import type { NextRequest } from "next/server"

import { getWebhookSettings } from "./config"

const HEADER = "x-lab-webhook-secret"

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** True when the request carries the correct shared secret. */
export async function verifyWebhookSecret(req: NextRequest): Promise<boolean> {
  const { secret: expected } = await getWebhookSettings()
  if (!expected) return false // fail closed — not configured
  const got = req.headers.get(HEADER)
  if (!got) return false
  return safeEqual(got, expected)
}
