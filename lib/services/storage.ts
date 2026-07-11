/**
 * Object-storage service (BE-19).
 *
 * Thin wrapper over AWS SDK v3 (`@aws-sdk/client-s3` +
 * `@aws-sdk/s3-request-presigner`) that issues short-lived **presigned
 * URLs** for upload + download, plus a server-side delete.
 *
 * Why presigned URLs?
 *   - Big files (lab PDFs, scans) never traverse our Node runtime — the
 *     browser PUTs straight to S3/R2 and the server only signs the URL.
 *   - Works identically against AWS S3 and Cloudflare R2 (R2 implements
 *     the SigV4 PutObject path the SDK uses).
 *
 * Two logical buckets:
 *   - `phi`    — private medical files (lab PDFs, photos). Default for
 *                anything generated inside a consultation.
 *   - `assets` — semi-public assets (profile pics, clinic logos). Still
 *                served via signed GETs; we just keep them in a bucket
 *                that is sized for higher request volume / smaller files.
 *
 * Both bucket names are read from env at call-time (see `lib/env.ts`):
 *   - `AWS_S3_BUCKET_PHI`
 *   - `AWS_S3_BUCKET_ASSETS`
 *
 * Validation
 *   - `MAX_OBJECT_BYTES` — hard cap of 25 MB per object. Anything bigger
 *     should go through a multipart flow we'll add in Sprint 2.
 *   - `ALLOWED_CONTENT_TYPES` — explicit allow-list. Adding a new type
 *     is a one-line change here; we deliberately do not infer from
 *     extensions.
 *
 * Deferred to Sprint 2 (per BE-19 spec):
 *   - Image thumbnailing (Lambda@Edge or sharp post-upload).
 *   - Multipart uploads for very large files.
 *   - Per-clinic bucket prefixes (we currently use yyyy/mm/uuid).
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"

import { env } from "@/lib/env"
import { ForbiddenError, ValidationError } from "@/lib/errors"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Logical bucket — `phi` is the default for anything inside a chart. */
export type BucketName = "phi" | "assets"

/** Allow-list of MIME types accepted by the upload endpoint. */
export const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/csv",
  // Word documents — clinical summaries are often shared as .doc / .docx.
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Excel spreadsheets — .xls / .xlsx (e.g. infusion summaries).
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number]

/** Hard size cap per object — anything bigger needs multipart (Sprint 2). */
export const MAX_OBJECT_BYTES = 25 * 1024 * 1024 // 25 MB

/** Default presigned-URL lifetime for uploads — 5 minutes. */
const DEFAULT_UPLOAD_TTL_SEC = 300
/** Default presigned-URL lifetime for downloads — 5 minutes. */
const DEFAULT_DOWNLOAD_TTL_SEC = 300
/** Hard ceiling for any presigned URL we issue. */
const MAX_TTL_SEC = 60 * 60 // 1 hour

export type UploadUrlInput = {
  bucket?: BucketName
  /**
   * Full object key (path inside the bucket). When omitted, callers
   * should generate one with `buildObjectKey()` first; the route
   * handler does this so the body API stays small.
   */
  key: string
  contentType: string
  contentLength: number
  ttlSec?: number
}

export type UploadUrlResult = {
  /** Bucket the URL targets (resolved name, e.g. `vyara-phi`). */
  bucket: string
  /** Logical bucket label, e.g. `phi`. */
  bucketLabel: BucketName
  /** Object key within the bucket. */
  key: string
  /**
   * Presigned URL — the client should
   *   `fetch(url, { method: "PUT", body, headers: { "content-type": contentType } })`.
   * We use direct PUT (not POST form) so the upload is a single HTTP
   * call from the browser; the form-fields path is reserved for
   * multipart uploads in Sprint 2.
   */
  url: string
  /** Headers the client MUST echo on the PUT for the signature to validate. */
  requiredHeaders: Record<string, string>
  /** ISO timestamp at which the URL stops working. */
  expiresAt: string
  /** Lifetime in seconds — convenience for clients that want to retry. */
  ttlSec: number
  /** Echoed back so clients can show "max 25 MB" / etc. */
  maxBytes: number
}

export type DownloadUrlInput = {
  bucket?: BucketName
  key: string
  ttlSec?: number
  /**
   * When `true`, the presigned URL forces a download dialog by setting
   * `response-content-disposition=attachment; filename=...`. Filename
   * defaults to the basename of the key.
   */
  asAttachment?: boolean
  /** Override the suggested filename in the Content-Disposition header. */
  filename?: string
}

export type DownloadUrlResult = {
  bucket: string
  bucketLabel: BucketName
  key: string
  url: string
  expiresAt: string
  ttlSec: number
}

export type DeleteObjectInput = {
  bucket?: BucketName
  key: string
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** Cached SDK client — reused across requests in the same Node process. */
let _client: S3Client | null = null

function getClient(): S3Client {
  if (_client) return _client
  _client = new S3Client({
    region: env.S3_REGION,
    // R2 + minio set a custom endpoint; AWS S3 leaves this undefined so
    // the SDK uses its default region-derived endpoint.
    ...(env.S3_ENDPOINT
      ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
    ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: env.S3_ACCESS_KEY_ID,
            secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  })
  return _client
}

/** Resolve a logical bucket label to the actual env-configured name. */
function resolveBucket(label: BucketName | undefined): {
  bucket: string
  bucketLabel: BucketName
} {
  const bucketLabel: BucketName = label ?? "phi"
  const name =
    bucketLabel === "phi" ? env.AWS_S3_BUCKET_PHI : env.AWS_S3_BUCKET_ASSETS
  if (!name) {
    throw new ForbiddenError(
      `Storage not configured: ${bucketLabel.toUpperCase()} bucket env var is missing`,
    )
  }
  return { bucket: name, bucketLabel }
}

function clampTtl(ttl: number | undefined, fallback: number): number {
  if (ttl === undefined) return fallback
  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new ValidationError("ttlSec must be a positive number")
  }
  if (ttl > MAX_TTL_SEC) {
    throw new ValidationError(`ttlSec must be <= ${MAX_TTL_SEC}`)
  }
  return Math.floor(ttl)
}

function assertAllowedContentType(
  contentType: string,
): asserts contentType is AllowedContentType {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as AllowedContentType)) {
    throw new ValidationError(
      `contentType "${contentType}" is not allowed. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
    )
  }
}

function assertAllowedSize(contentLength: number): void {
  if (
    !Number.isFinite(contentLength) ||
    !Number.isInteger(contentLength) ||
    contentLength <= 0
  ) {
    throw new ValidationError("contentLength must be a positive integer")
  }
  if (contentLength > MAX_OBJECT_BYTES) {
    throw new ValidationError(
      `File too large: ${contentLength} bytes > limit ${MAX_OBJECT_BYTES} bytes (25 MB)`,
    )
  }
}

/**
 * Strip filename to a safe, ascii-only slug. Keeps the extension.
 * Examples:
 *   "Lab Report (Final).pdf" -> "lab-report-final.pdf"
 *   "résumé.docx"            -> "rsum.docx"
 */
function sanitizeFilename(input: string): string {
  const dot = input.lastIndexOf(".")
  const stem = dot > 0 ? input.slice(0, dot) : input
  const ext = dot > 0 ? input.slice(dot + 1) : ""
  const cleanStem = stem
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 64)
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 8)
  const base = cleanStem || "file"
  return cleanExt ? `${base}.${cleanExt}` : base
}

/**
 * Build a deterministic, collision-free object key.
 *
 *   phi/2026/05/<uuid>-<sanitized-filename>
 *
 * The yyyy/mm prefix keeps lifecycle rules / glaciering simple and
 * caps the number of keys per "directory" listing.
 */
export function buildObjectKey(args: {
  bucketLabel: BucketName
  suggestedFilename?: string
}): string {
  const now = new Date()
  const yyyy = String(now.getUTCFullYear())
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  const safeName = sanitizeFilename(args.suggestedFilename ?? "file")
  return `${args.bucketLabel}/${yyyy}/${mm}/${randomUUID()}-${safeName}`
}

// ---------------------------------------------------------------------------
// Public API — presigned upload
// ---------------------------------------------------------------------------

/**
 * Issue a presigned PUT URL the browser can upload to directly.
 *
 * Validates content-type allow-list and the 25 MB cap. The signature
 * pins both `Content-Type` and `Content-Length`, so the client must
 * echo exactly those headers — if it doesn't, S3 rejects the PUT.
 */
export async function getUploadUrl(
  input: UploadUrlInput,
): Promise<UploadUrlResult> {
  assertAllowedContentType(input.contentType)
  assertAllowedSize(input.contentLength)
  if (!input.key || input.key.includes("..")) {
    throw new ValidationError("Invalid object key")
  }

  const { bucket, bucketLabel } = resolveBucket(input.bucket)
  const ttlSec = clampTtl(input.ttlSec, DEFAULT_UPLOAD_TTL_SEC)
  const client = getClient()

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  })

  const url = await getSignedUrl(client, command, { expiresIn: ttlSec })

  return {
    bucket,
    bucketLabel,
    key: input.key,
    url,
    requiredHeaders: {
      "content-type": input.contentType,
      "content-length": String(input.contentLength),
    },
    expiresAt: new Date(Date.now() + ttlSec * 1000).toISOString(),
    ttlSec,
    maxBytes: MAX_OBJECT_BYTES,
  }
}

// ---------------------------------------------------------------------------
// Public API — presigned download
// ---------------------------------------------------------------------------

/**
 * Issue a presigned GET URL.
 *
 * When `asAttachment` is true, we add `response-content-disposition` to
 * the signed query so S3 returns a `Content-Disposition: attachment`
 * header — that triggers the browser's download dialog instead of
 * inline rendering.
 */
export async function getDownloadUrl(
  input: DownloadUrlInput,
): Promise<DownloadUrlResult> {
  if (!input.key || input.key.includes("..")) {
    throw new ValidationError("Invalid object key")
  }
  const { bucket, bucketLabel } = resolveBucket(input.bucket)
  const ttlSec = clampTtl(input.ttlSec, DEFAULT_DOWNLOAD_TTL_SEC)
  const client = getClient()

  const filename =
    input.filename ?? input.key.split("/").pop() ?? "download"

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ...(input.asAttachment
      ? {
          ResponseContentDisposition: `attachment; filename="${sanitizeFilename(
            filename,
          )}"`,
        }
      : {}),
  })

  const url = await getSignedUrl(client, command, { expiresIn: ttlSec })

  return {
    bucket,
    bucketLabel,
    key: input.key,
    url,
    expiresAt: new Date(Date.now() + ttlSec * 1000).toISOString(),
    ttlSec,
  }
}

// ---------------------------------------------------------------------------
// Public API — server-side upload (for small files like avatars)
// ---------------------------------------------------------------------------

/**
 * Stream a Buffer / Uint8Array straight to S3 from the Node runtime.
 *
 * The presigned-URL flow is preferred for big files (lab PDFs, scans) so
 * the bytes don't traverse our server. For small files like profile
 * avatars (≤ a few hundred KB), it's simpler — and avoids a three-round-
 * trip dance — to accept the multipart upload on the server and PUT it
 * straight to S3 here.
 */
export async function putObject(input: {
  bucket?: BucketName
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<{ bucket: string; key: string; bucketLabel: BucketName }> {
  assertAllowedContentType(input.contentType)
  assertAllowedSize(input.body.byteLength)
  if (!input.key || input.key.includes("..")) {
    throw new ValidationError("Invalid object key")
  }
  const { bucket, bucketLabel } = resolveBucket(input.bucket)
  const client = getClient()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ContentLength: input.body.byteLength,
    }),
  )
  return { bucket, key: input.key, bucketLabel }
}

// ---------------------------------------------------------------------------
// Public API — server-side delete (admin only at the route layer)
// ---------------------------------------------------------------------------

/**
 * Hard-delete an object. The route handler is expected to gate this on
 * `requireRole("ADMIN")` and to write its own DELETE audit row — this
 * function is a thin SDK wrapper.
 */
export async function deleteObject(
  input: DeleteObjectInput,
): Promise<{ bucket: string; key: string }> {
  if (!input.key || input.key.includes("..")) {
    throw new ValidationError("Invalid object key")
  }
  const { bucket } = resolveBucket(input.bucket)
  const client = getClient()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: input.key }))
  return { bucket, key: input.key }
}

// ---------------------------------------------------------------------------
// Test/admin escape hatch — reset the cached client (used by integration
// tests that switch endpoints between cases). Not exported from the
// barrel; import directly when needed.
// ---------------------------------------------------------------------------

export function __resetStorageClientForTests(): void {
  _client = null
}
