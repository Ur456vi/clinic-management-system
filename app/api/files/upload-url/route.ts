/**
 * `POST /api/files/upload-url` (BE-19).
 *
 * Issues a presigned PUT URL the browser uses to upload a file directly
 * to object storage. The Node runtime never sees the bytes — only the
 * shape (size, MIME) and the resulting object key.
 *
 * Request body
 * ------------
 *   {
 *     "bucket": "phi" | "assets",        // optional; defaults to "phi"
 *     "contentType": "application/pdf",  // must be in the allow-list
 *     "contentLength": 1234567,          // bytes, <= 25 MB
 *     "suggestedFilename": "lab.pdf",    // optional, sanitized server-side
 *     "ttlSec": 300                      // optional, default 5 min
 *   }
 *
 * Response (201)
 * --------------
 *   { "data": {
 *       "url": "...presigned PUT URL...",
 *       "key": "phi/2026/05/<uuid>-lab.pdf",
 *       "bucket": "vyara-phi",
 *       "bucketLabel": "phi",
 *       "requiredHeaders": { "content-type": "...", "content-length": "..." },
 *       "expiresAt": "2026-05-15T...Z",
 *       "ttlSec": 300,
 *       "maxBytes": 26214400
 *   } }
 *
 * Audit: writes one `AuditLog` row with action=CREATE,
 * entityType="File", entityId=<key>. We log the issuance, not the upload
 * itself — S3 has its own server-access log for the actual PUT.
 *
 * Roles: ADMIN, DOCTOR, RMO, RECEPTION, INFUSION_SPECIALIST,
 * REHAB_SPECIALIST, AESTHETICS_SPECIALIST. (Rationale: every clinical
 * role attaches files at some point — labs, photos, ID copies.)
 */

import { Role } from "@prisma/client"

import { created, defineHandler, requireRole } from "@/lib/api"
import { db } from "@/lib/db"
import {
  buildObjectKey,
  getUploadUrl,
} from "@/lib/services/storage"
import { uploadUrlBodySchema } from "@/lib/validation/file"

export const POST = defineHandler(async ({ req }) => {
  const session = await requireRole(
    Role.ADMIN,
    Role.DOCTOR,
    Role.RMO,
    Role.RECEPTION,
    Role.INFUSION_SPECIALIST,
    Role.REHAB_SPECIALIST,
    Role.AESTHETICS_SPECIALIST,
  )

  const body = uploadUrlBodySchema.parse(await req.json())
  const bucketLabel = body.bucket ?? "phi"
  const key = buildObjectKey({
    bucketLabel,
    suggestedFilename: body.suggestedFilename,
  })

  const result = await getUploadUrl({
    bucket: bucketLabel,
    key,
    contentType: body.contentType,
    contentLength: body.contentLength,
    ttlSec: body.ttlSec,
  })

  // Audit best-effort — don't block the URL on a logging failure.
  try {
    await db.auditLog.create({
      data: {
        actorUserId: session.userId,
        action: "CREATE",
        entityType: "File",
        entityId: key,
        detail: {
          bucket: result.bucket,
          bucketLabel: result.bucketLabel,
          contentType: body.contentType,
          contentLength: body.contentLength,
          suggestedFilename: body.suggestedFilename ?? null,
          ttlSec: result.ttlSec,
        },
      },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[files.upload-url] audit write failed", err)
  }

  return created(result)
})
