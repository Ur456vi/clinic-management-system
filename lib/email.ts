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
  | { ok: true; provider: "console" }
  | { ok: false; provider: "resend" | "console"; error: string }

const RESEND_ENDPOINT = "https://api.resend.com/emails"

/**
 * Send a transactional email. Never throws — returns a result envelope so
 * callers can decide whether a failure is fatal or best-effort.
 *
 * For the password-reset flow the route treats provider failure as
 * best-effort and still returns 200 to the caller, because the user-facing
 * response must be invariant under "does this email exist?" enumeration.
 * Failures are logged and surfaced via the audit log instead.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const { to, subject, text } = input
  const apiKey = env.RESEND_API_KEY

  if (!apiKey) {
    // Dev / test fallback. We log enough to debug the auth flow without
    // dragging in a real provider.
    // eslint-disable-next-line no-console
    console.log(
      `[email:console] to=${to} subject=${JSON.stringify(subject)} body=${JSON.stringify(text)}`,
    )
    return { ok: true, provider: "console" }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
