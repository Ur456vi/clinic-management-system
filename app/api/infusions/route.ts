/**
 * `/api/infusions`
 *
 *   GET  — list a patient's infusion sessions (newest first). `?patientId=…`
 *          required. READ_ROLES gate (in the service).
 *   POST — create a new infusion session. WRITE_ROLES gate.
 *
 * The lightweight patient-chart Infusion tab. Distinct from the BE-26
 * `/api/infusion-logs` protocol-log surface.
 */

import { created, defineHandler, ok, requireSession } from "@/lib/api"
import {
  createInfusionSchema,
  listInfusionsQuerySchema,
} from "@/lib/validation/infusion"
import { createInfusion, listInfusions } from "@/lib/services/infusion"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const { searchParams } = new URL(req.url)
  const query = listInfusionsQuerySchema.parse({
    patientId: searchParams.get("patientId") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })
  const result = await listInfusions(query, {
    userId: session.userId,
    role: session.role,
  })
  return ok({ items: result.items, nextCursor: result.nextCursor })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createInfusionSchema.parse(await req.json())
  const infusion = await createInfusion(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(infusion)
})
