/**
 * Minimal transactional email helper.
 *
 * Backend: **Resend** (https://resend.com) when `RESEND_API_KEY` is set,
 * otherwise a dev-mode console logger so local + test environments can
 * exercise the auth flows without a live provider.
 *
 *   import { sendMail } from "@/lib/email"
 *   await sendMail({
 *     to: "asha@example.com",
 *     subject: "Your Vyara password reset code",
 *     text: "Your code is 123456. It expires in 15 minutes.",
 *   })
 *
 * The helper deliberately exposes a tiny surface (text-only, no templates
 * yet). Richer templating (React Email or MJML) lands when we have more
 * than two transactional templates to maintain — tracked in Sprint 2.
 *
 * NOTE: This file uses `fetch` directly rather than the `resend` SDK so we
 * can drop into the edge runtime if needed without pulling a Node-only
 * dependency. The Resend HTTP API is small enough to call by hand.
 */

import { env } from "@/lib/env"

export type SendMailInput = {
  /** Single recipient email. */
  to: string
  /** Plain-text subject line. */
  subject: string
  /** Plain-text body. (HTML support deferred to Sprint 2.) */
  text: string
}

export type SendMailResult =
  | { ok: true; provider: "resend"; id: string }
  | { ok: true; provider: "brevo"; id: string }
  | { ok: true; provider: "console" }
  | { ok: false; provider: "resend" | "brevo" | "console"; error: string }

const RESEND_ENDPOINT = "https://api.resend.com/emails"
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"

function parseEmailFrom(from: string): { name: string; email: string } {
  const match = from.match(/^([^<]+)<([^>]+)>$/)
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    }
  }
  return {
    name: "Vyara",
    email: from.trim(),
  }
}

/**
 * Send a transactional email. Never throws — returns a result envelope so
 * callers can decide whether a failure is fatal or best-effort.
 *
 * Checks BREVO_API_KEY first; if set, routes via Brevo. If not set, falls back
 * to RESEND_API_KEY. If neither is configured, logs to console in dev mode.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const { to, subject, text } = input
  const brevoApiKey = env.BREVO_API_KEY
  const resendApiKey = env.RESEND_API_KEY

  // 1. Brevo
  if (brevoApiKey) {
    try {
      const sender = parseEmailFrom(env.EMAIL_FROM)
      const res = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject,
          textContent: text,
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        // eslint-disable-next-line no-console
        console.error(
          `[email:brevo] failed status=${res.status} body=${detail.slice(0, 500)}`,
        )
        return {
          ok: false,
          provider: "brevo",
          error: `brevo ${res.status}`,
        }
      }

      const data = (await res.json().catch(() => ({}))) as { messageId?: string }
      return { ok: true, provider: "brevo", id: data.messageId ?? "" }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[email:brevo] threw", err)
      return {
        ok: false,
        provider: "brevo",
        error: err instanceof Error ? err.message : "unknown",
      }
    }
  }

  // 2. Resend
  if (resendApiKey) {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to,
          subject,
          text,
        }),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        // eslint-disable-next-line no-console
        console.error(
          `[email:resend] failed status=${res.status} body=${detail.slice(0, 500)}`,
        )
        return {
          ok: false,
          provider: "resend",
          error: `resend ${res.status}`,
        }
      }

      const data = (await res.json().catch(() => ({}))) as { id?: string }
      return { ok: true, provider: "resend", id: data.id ?? "" }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[email:resend] threw", err)
      return {
        ok: false,
        provider: "resend",
        error: err instanceof Error ? err.message : "unknown",
      }
    }
  }

  // 3. Dev fallback (Console)
  // eslint-disable-next-line no-console
  console.log(
    `[email:console] to=${to} subject=${JSON.stringify(subject)} body=${JSON.stringify(text)}`,
  )
  return { ok: true, provider: "console" }
}
