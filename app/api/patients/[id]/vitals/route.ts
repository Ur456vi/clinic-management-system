/**
 * `/api/patients/[id]/vitals` — staff-facing vitals for a patient.
 *
 *   GET  — recent readings (newest first). Any authenticated staff member.
 *   POST — record a new reading. Staff only.
 */

import { Role } from "@prisma/client"

import { created, defineHandler, ok, requireRole, requireSession } from "@/lib/api"
import { createVital, listVitals } from "@/lib/services/vitals"
import { createVitalSchema, listVitalsQuerySchema } from "@/lib/validation/vital"
import { rolesFor } from "@/lib/rbac"

type Params = { id: string }

const STAFF_ROLES: readonly Role[] = rolesFor("vitals:write")

export const GET = defineHandler<Params>(async ({ req, params }) => {
  await requireSession()
  const { id } = await params
  const { limit } = listVitalsQuerySchema.parse({
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  })
  const items = await listVitals(id, limit ?? 20)
  return ok(items)
})

export const POST = defineHandler<Params>(async ({ req, params }) => {
  const session = await requireRole(...STAFF_ROLES)
  const { id } = await params
  const body = createVitalSchema.parse(await req.json())
  const vital = await createVital(id, session.userId, body)
  return created(vital, `/api/patients/${id}/vitals`)
})
