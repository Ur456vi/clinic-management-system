/**
 * Minimal transactional email helper.
 *
 * Backends (first configured wins): SMTP from the admin Settings → Email
 * page (DB), then a fallback SMTP from `SMTP_*` env vars, then Brevo;
 * otherwise a dev-mode console logger so local + test environments can
 * exercise the auth flows without a live provider.
 *
 *   import { sendMail } from "@/lib/email"
 *   await sendMail({
 *     to: "asha@example.com",
 *     subject: "Your Dr. Yuvraaj Singh M.D. password reset code",
 *     text: "Your code is 123456. It expires in 15 minutes.",
 *   })
 *
 * The helper deliberately exposes a tiny surface (text-only, no templates
 * yet). Richer templating (React Email or MJML) lands when we have more
 * than two transactional templates to maintain — tracked in Sprint 2.
 *
 * NOTE: HTTP providers are called via `fetch` directly (no vendor SDK) so we
 * can drop into the edge runtime if needed without pulling a Node-only
 * dependency.
 */

import { env } from "@/lib/env"
import { getEmailConfig } from "@/lib/settings"

export type SendMailInput = {
  /** Single recipient email. */
  to: string
  /** Plain-text subject line. */
  subject: string
  /** Plain-text body (always sent as a fallback for non-HTML clients). */
  text: string
  /** Optional HTML body. When set, providers send a multipart HTML email. */
  html?: string
}

export type SendMailResult =
  | { ok: true; provider: "smtp"; id: string }
  | { ok: true; provider: "brevo"; id: string }
  | { ok: true; provider: "console" }
  | { ok: false; provider: "smtp" | "brevo" | "console"; error: string }

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
    name: "Dr. Yuvraaj Singh M.D.",
    email: from.trim(),
  }
}

/**
 * Send a transactional email. Never throws — returns a result envelope so
 * callers can decide whether a failure is fatal or best-effort.
 *
 * Tries SMTP (admin Settings) first, then Brevo (BREVO_API_KEY). If neither
 * is configured, logs to console in dev mode.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const { to, subject, text, html } = input

  // 0. SMTP via nodemailer, configured in the admin Settings -> Email page
  //    and stored (encrypted) in the DB. This is the primary path when set.
  const smtp = await getEmailConfig().catch(() => null)
  if (smtp) {
    try {
      const { createTransport } = await import("nodemailer")
      const transport = createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.password },
      })
      const from = smtp.fromEmail
        ? `${smtp.fromName} <${smtp.fromEmail}>`
        : env.EMAIL_FROM
      const info = await transport.sendMail({
        from,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      })
      return { ok: true, provider: "smtp", id: info.messageId ?? "" }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[email:smtp] threw", err)
      return {
        ok: false,
        provider: "smtp",
        error: err instanceof Error ? err.message : "unknown",
      }
    }
  }

  // 1. Fallback SMTP from environment (when no DB-stored config exists).
  if (!smtp && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
    try {
      const { createTransport } = await import("nodemailer")
      const transport = createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        // 465 = implicit TLS; 587/others use STARTTLS (secure: false).
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      })
      const from = env.SMTP_FROM_EMAIL
        ? `${env.SMTP_FROM_NAME ?? "Dr. Yuvraaj Singh M.D."} <${env.SMTP_FROM_EMAIL}>`
        : env.EMAIL_FROM
      const info = await transport.sendMail({
        from,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      })
      return { ok: true, provider: "smtp", id: info.messageId ?? "" }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[email:smtp-env] threw", err)
      return {
        ok: false,
        provider: "smtp",
        error: err instanceof Error ? err.message : "unknown",
      }
    }
  }

  const brevoApiKey = env.BREVO_API_KEY

  // 2. Brevo
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
          ...(html ? { htmlContent: html } : {}),
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

  // 3. Dev fallback (Console)
  // eslint-disable-next-line no-console
  console.log(
    `[email:console] to=${to} subject=${JSON.stringify(subject)} body=${JSON.stringify(text)}`,
  )
  return { ok: true, provider: "console" }
}
