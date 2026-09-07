/**
 * Shared-secret guard for inbound partner webhooks.
 *
 * The partner must send the secret in the `x-lab-webhook-secret` header. It is
 * compared to `LAB_WEBHOOK_SECRET` in constant time. When no secret is
 * configured the guard FAILS CLOSED (rejects) so an unconfigured deployment
 * never accepts unauthenticated writes.
 *
 * NOTE: this is the interim scheme pending the partner confirming their
 * preferred mechanism (bearer / HMAC signature / IP allowlist) — see the
 * integration email. Swap the check here when that is agreed.
 */

import { timingSafeEqual } from "node:crypto"

import type { NextRequest } from "next/server"

import { env } from "@/lib/env"

const HEADER = "x-lab-webhook-secret"

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** True when the request carries the correct shared secret. */
export function verifyWebhookSecret(req: NextRequest): boolean {
  const expected = env.LAB_WEBHOOK_SECRET
  if (!expected) return false // fail closed — not configured
  const got = req.headers.get(HEADER)
  if (!got) return false
  return safeEqual(got, expected)
}
