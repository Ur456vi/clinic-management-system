/**
 * Zod schemas for the `/api/files/*` surface (BE-19).
 *
 * Keeps the route handlers tiny — all shape checks live here, all
 * domain checks (size cap, MIME allow-list) live in
 * `lib/services/storage.ts`.
 */

import { z } from "zod"

import {
  ALLOWED_CONTENT_TYPES,
  MAX_OBJECT_BYTES,
} from "@/lib/services/storage"

const bucketEnum = z.enum(["phi", "assets"])

/** Body for `POST /api/files/upload-url`. */
export const uploadUrlBodySchema = z.object({
  bucket: bucketEnum.optional(),
  contentType: z
    .enum([...ALLOWED_CONTENT_TYPES] as [string, ...string[]], {
      errorMap: () => ({
        message: `contentType must be one of: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
      }),
    }),
  contentLength: z
    .number()
    .int()
    .positive()
    .max(MAX_OBJECT_BYTES, {
      message: `contentLength must be <= ${MAX_OBJECT_BYTES} bytes (25 MB)`,
    }),
  /**
   * Filename hint from the client. We never trust this verbatim — the
   * service slugifies it into ascii before composing the object key.
   */
  suggestedFilename: z.string().min(1).max(255).optional(),
  /** Optional override (capped at 1h in the service). */
  ttlSec: z.number().int().positive().optional(),
})

export type UploadUrlBody = z.infer<typeof uploadUrlBodySchema>

/** Query string for `GET /api/files/download-url`. */
export const downloadUrlQuerySchema = z.object({
  bucket: bucketEnum.optional(),
  /** Object key — required. */
  key: z.string().min(1).max(1024),
  /** When `"1"` / `"true"`, force a download disposition. */
  asAttachment: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  ttlSec: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .refine(
      (v) => v === undefined || (Number.isFinite(v) && v > 0),
      { message: "ttlSec must be a positive number" },
    ),
  filename: z.string().min(1).max(255).optional(),
})

export type DownloadUrlQuery = z.infer<typeof downloadUrlQuerySchema>
