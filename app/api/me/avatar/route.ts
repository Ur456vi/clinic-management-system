/**
 * `/api/me/avatar` — profile photo upload for the current user.
 *
 *   POST   /api/me/avatar  — multipart upload (form field `file`).
 *                            Bytes are streamed to the `assets` S3 bucket,
 *                            the resulting key is saved on the user's
 *                            Staff or Patient row, and the previous
 *                            avatar (if any) is best-effort deleted.
 *
 *   DELETE /api/me/avatar  — clear the avatar key on the user's row and
 *                            best-effort delete the S3 object.
 *
 * Why server-side upload (not presigned)? Avatars are small (capped at
 * 5 MB here, well below the 25 MB SDK ceiling) and the UX needs only a
 * single network call. The presigned-URL flow is reserved for big files
 * like lab PDFs (see `/api/files/upload-url`).
 *
 * Allowed content types: image/png, image/jpeg, image/webp (no PDFs here
 * — those use the file-upload-url route).
 */

import {
  defineHandler,
  ok,
  requireSession,
  ValidationError,
} from "@/lib/api"
import { db } from "@/lib/db"
import {
  buildObjectKey,
  deleteObject,
  getDownloadUrl,
  putObject,
} from "@/lib/services/storage"

/** Hard cap for avatar uploads — keeps S3 bills and page weight predictable. */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB

const ALLOWED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
])

// ---------------------------------------------------------------------------
// POST — upload + save
// ---------------------------------------------------------------------------

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()

  // Parse multipart manually via Web's built-in FormData support — Next 16
  // ships with this on the Route Handler runtime.
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    throw new ValidationError("Expected multipart/form-data with a `file` field")
  }

  const file = form.get("file")
  if (!file || typeof file === "string") {
    throw new ValidationError("Missing `file` upload")
  }
  // `File` extends `Blob` and is the standard Web upload type.
  const upload = file as File

  if (!ALLOWED_AVATAR_TYPES.has(upload.type)) {
    throw new ValidationError(
      `Unsupported image type "${upload.type}". Use PNG, JPEG, or WebP.`,
    )
  }
  if (upload.size <= 0) {
    throw new ValidationError("Empty file")
  }
  if (upload.size > MAX_AVATAR_BYTES) {
    throw new ValidationError(
      `File too large: ${upload.size} bytes > limit ${MAX_AVATAR_BYTES} bytes (5 MB)`,
    )
  }

  const buffer = Buffer.from(await upload.arrayBuffer())

  // Pick a safe filename (Figma-style: short slug + extension). The
  // sanitizer inside `buildObjectKey` collapses anything weird.
  const ext =
    upload.type === "image/png"
      ? "png"
      : upload.type === "image/webp"
        ? "webp"
        : "jpg"
  const suggested = `${session.userId}-avatar.${ext}`
  const key = buildObjectKey({ bucketLabel: "assets", suggestedFilename: suggested })

  await putObject({
    bucket: "assets",
    key,
    body: buffer,
    contentType: upload.type,
  })

  // Save the new key on the right row, and capture the OLD key so we can
  // best-effort delete it after the DB write succeeds.
  let previousKey: string | null = null
  if (session.role === "PATIENT") {
    const existing = await db.patient.findUnique({
      where: { userId: session.userId },
      select: { avatarUrl: true },
    })
    previousKey = existing?.avatarUrl ?? null
    await db.patient.update({
      where: { userId: session.userId },
      data: { avatarUrl: key },
    })
  } else {
    const existing = await db.staff.findUnique({
      where: { userId: session.userId },
      select: { avatarUrl: true },
    })
    previousKey = existing?.avatarUrl ?? null
    await db.staff.update({
      where: { userId: session.userId },
      data: { avatarUrl: key },
    })
  }

  // Best-effort cleanup of the old object — don't block the response on
  // it. Failures get logged to console; storage lifecycle rules will
  // sweep orphans if this misfires.
  if (previousKey) {
    try {
      await deleteObject({ bucket: "assets", key: previousKey })
    } catch (err) {
      console.error("[me/avatar] failed to delete previous object", err)
    }
  }

  // Sign a fresh GET so the UI can swap the image immediately.
  let signedUrl: string | null = null
  try {
    const { url } = await getDownloadUrl({
      bucket: "assets",
      key,
      ttlSec: 60 * 30,
    })
    signedUrl = url
  } catch {
    signedUrl = null
  }

  return ok({ key, avatarUrl: signedUrl })
})

// ---------------------------------------------------------------------------
// DELETE — clear avatar
// ---------------------------------------------------------------------------

export const DELETE = defineHandler(async () => {
  const session = await requireSession()

  let previousKey: string | null = null
  if (session.role === "PATIENT") {
    const existing = await db.patient.findUnique({
      where: { userId: session.userId },
      select: { avatarUrl: true },
    })
    previousKey = existing?.avatarUrl ?? null
    if (previousKey) {
      await db.patient.update({
        where: { userId: session.userId },
        data: { avatarUrl: null },
      })
    }
  } else {
    const existing = await db.staff.findUnique({
      where: { userId: session.userId },
      select: { avatarUrl: true },
    })
    previousKey = existing?.avatarUrl ?? null
    if (previousKey) {
      await db.staff.update({
        where: { userId: session.userId },
        data: { avatarUrl: null },
      })
    }
  }

  if (previousKey) {
    try {
      await deleteObject({ bucket: "assets", key: previousKey })
    } catch (err) {
      console.error("[me/avatar] failed to delete object on DELETE", err)
    }
  }

  return ok({ key: null, avatarUrl: null })
})
