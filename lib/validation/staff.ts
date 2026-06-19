/**
 * Zod schemas for the Staff API surface (BE-30).
 *
 * Three schemas are exported, mirroring the patient validators:
 *   - `createStaffSchema`       — POST  /api/staff
 *   - `updateStaffSchema`       — PATCH /api/staff/:id   (partial)
 *   - `listStaffQuerySchema`    — GET   /api/staff       (query string)
 *
 * Notes on the wire shape vs. the DB schema
 * -----------------------------------------
 * The current `Staff` row stores a single `fullName` column (BE-03 schema).
 * The product spec for BE-30 talks about `firstName`/`lastName` because the
 * doctor-dashboard FE displays them separately and BE-28 scheduling joins
 * them differently in summary cards. To bridge the gap we accept
 * `firstName` + `lastName` at the API boundary and the service layer joins
 * them with a single space before writing. On read, the service splits
 * `fullName` on the last whitespace so the response carries both pieces.
 *
 * Tightening that split semantically (splitting the columns in the DB) is
 * filed under BE-30b — see `docs/api-staff.md`.
 */

import { z } from "zod"
import { Role } from "@prisma/client"

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

const trimmedOptional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v))

const uuid = z.string().uuid({ message: "Must be a valid UUID" })
const roleEnum = z.nativeEnum(Role)

// ---------------------------------------------------------------------------
// createStaffSchema
// ---------------------------------------------------------------------------

export const createStaffSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Must be a valid email" })
    .max(254),
  firstName: z.string().trim().min(1, "Required").max(100),
  lastName: z.string().trim().min(1, "Required").max(100),
  role: roleEnum,
  departmentId: uuid.optional(),
  phone: trimmedOptional(50),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .optional(),
  /** Per-staff page access (RBAC area keys). Sanitized in the service. */
  allowedAreas: z.array(z.string().max(40)).max(40).optional(),
})

export type CreateStaffInput = z.infer<typeof createStaffSchema>

// ---------------------------------------------------------------------------
// updateStaffSchema
// ---------------------------------------------------------------------------

export const updateStaffSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: trimmedOptional(50),
  role: roleEnum.optional(),
  departmentId: z.union([uuid, z.null()]).optional(),
  /** Per-staff page access (RBAC area keys). Sanitized in the service. */
  allowedAreas: z.array(z.string().max(40)).max(40).optional(),
})

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>

// ---------------------------------------------------------------------------
// listStaffQuerySchema
// ---------------------------------------------------------------------------

const roleListParam = z
  .string()
  .trim()
  .optional()
  .transform((raw) => {
    if (raw === undefined || raw === "") return undefined
    const tokens = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
    return tokens.length === 0 ? undefined : tokens
  })
  .pipe(z.array(roleEnum).nonempty().optional())

export const listStaffQuerySchema = z
  .object({
    q: trimmedOptional(200),
    role: roleListParam,
    departmentId: uuid.optional(),
    cursor: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .pipe(z.number().int().positive().max(100).optional()),
  })
  .transform((v) => ({
    q: v.q,
    role: v.role,
    departmentId: v.departmentId,
    cursor: v.cursor,
    limit: v.limit,
  }))

export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>
