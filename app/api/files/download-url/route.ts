/**
 * `GET /api/files/download-url` (BE-19).
 *
 * Issues a short-lived presigned GET URL for a stored object.
 *
 * Query
 * -----
 *   ?bucket=phi               (optional, defaults to "phi")
 *   &key=phi/2026/05/...pdf   (required)
 *   &asAttachment=1           (optional — forces download dialog)
 *   &ttlSec=300               (optional — default 5 min, max 1 h)
 *   &filename=lab.pdf         (optional override for the disposition)
 *
 * Response (200)
 * --------------
 *   { "data": {
 *       "url": "...presigned GET URL...",
 *       "key": "phi/2026/05/...pdf",
 *       "bucket": "vyara-phi",
 *       "bucketLabel": "phi",
 *       "expiresAt": "2026-05-15T...Z",
 *       "ttlSec": 300
 *   } }
 *
 * Audit: writes one `AuditLog` row with action=READ, entityType="File",
 * entityId=<key>. Same best-effort policy as the upload route.
 *
 * Roles: same allow-list as upload — every clinical role might need to
 * view a file they didn't create (handoff, multidisciplinary review).
 *
 * NOTE on access control: this endpoint currently authorises by *role*,
 * not by per-object ownership. Per-object ACLs land alongside the
 * patient/document join (BE-16, BE-25). Until then, treat any signed
 * URL as a "this user is allowed to read this file" assertion that
 * relies on the caller having received the key from a legitimate
 * source (LabResult row, ConsultationAttachment, etc.).
 */

import { Role } from "@prisma/client"

import { defineHandler, ok, requireRole } from "@/lib/api"
import { db } from "@/lib/db"
import { getDownloadUrl } from "@/lib/services/storage"
import { downloadUrlQuerySchema } from "@/lib/validation/file"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireRole(
    Role.ADMIN,
    Role.DOCTOR,
    Role.RMO,
    Role.RECEPTION,
    Role.INFUSION_SPECIALIST,
    Role.REHAB_SPECIALIST,
    Role.AESTHETICS_SPECIALIST,
  )

  const params = downloadUrlQuerySchema.parse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  )

  const result = await getDownloadUrl({
    bucket: params.bucket,
    key: params.key,
    ttlSec: params.ttlSec,
    asAttachment: params.asAttachment,
    filename: params.filename,
  })

  try {
    await db.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: "READ",
        entityType: "File",
        entityId: params.key,
        detail: {
          bucket: result.bucket,
          bucketLabel: result.bucketLabel,
          asAttachment: params.asAttachment ?? false,
          ttlSec: result.ttlSec,
        },
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[files.download-url] audit write failed", err)
  }

  return ok(result)
})
