/**
 * Zod schema for the `GET /api/admin/audit-logs` query string (BE-23).
 *
 * All fields are optional — a no-filter request returns the latest 100
 * rows. Mirror the patient/staff validator style so callers see a
 * consistent error shape.
 */

import { z } from "zod"
import { AuditAction } from "@prisma/client"

const uuid = z.string().uuid({ message: "Must be a valid UUID" })

const isoDateTime = z
  .string()
  .datetime({ offset: true, message: "Must be an ISO 8601 datetime" })
  .transform((v) => new Date(v))

export const listAuditLogsQuerySchema = z.object({
  /** Logical entity name. Free string — matches what the writer recorded. */
  entityType: z.string().trim().min(1).max(64).optional(),
  /** Primary key of the affected row (UUID or BigInt string). */
  entityId: z.string().trim().min(1).max(128).optional(),
  /** Filter to one actor's actions. */
  actorUserId: uuid.optional(),
  /** Filter to one audit verb. */
  action: z.nativeEnum(AuditAction).optional(),
  /** Inclusive lower bound on `occurredAt`. */
  from: isoDateTime.optional(),
  /** Exclusive upper bound on `occurredAt`. */
  to: isoDateTime.optional(),
  /**
   * Keyset cursor — the `id` (BigInt-as-string) of the last row of the
   * previous page. We page over `(occurredAt desc, id desc)` so the
   * cursor is just the row id; the service translates that back to the
   * pair on the way in.
   */
  cursor: z.string().trim().min(1).max(40).optional(),
  /** Page size. Default 100, max 500. */
  limit: z
    .union([z.string(), z.number()])
    .transform((v) => {
      const n = typeof v === "number" ? v : Number(v)
      if (!Number.isFinite(n) || n <= 0) return 100
      return Math.min(Math.floor(n), 500)
    })
    .optional(),
})

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>
