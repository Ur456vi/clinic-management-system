/**
 * `POST /api/admin/settings/email/test`
 *
 * Sends a test email to the given address using the currently-saved email
 * settings (so the admin can verify SMTP works). ADMIN only. Returns the
 * mailer result, including which provider was used — if it isn't "smtp" the
 * DB SMTP config isn't active yet (save + enable it first).
 */

import { Role } from "@prisma/client"
import { z } from "zod"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { sendMail } from "@/lib/email"

const bodySchema = z.object({
  to: z.string().email("A valid recipient email is required"),
})

export const POST = defineHandler(async ({ req }) => {
  await requireRole(Role.ADMIN)
  const { to } = bodySchema.parse(await req.json())

  const result = await sendMail({
    to,
    subject: "Test email — Dr. Yuvraaj Singh M.D.",
    text: "This is a test email confirming your SMTP settings are working.",
    html: `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#101828;padding:24px">
      <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:#C9A227;margin-bottom:12px">Dr. Yuvraaj Singh M.D.</div>
      <p style="font-size:14px">This is a <strong>test email</strong> confirming your SMTP settings are working.</p>
      <p style="font-size:12px;color:#667085">If you received this, transactional email is configured correctly.</p>
    </body></html>`,
  })

  return ok({ result })
})
