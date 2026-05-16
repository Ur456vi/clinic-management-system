/**
 * `/api/treatment-plans` collection routes (BE-24).
 *
 *   GET  — cursor-paginated list, filterable by `patientId` + `status`.
 *          Roles: ADMIN / DOCTOR / RMO / RECEPTION (enforced in service).
 *   POST — create a DRAFT plan with optional initial items.
 *          Roles: ADMIN / DOCTOR (enforced in service).
 *
 * Both require an authenticated session. Status transitions (DRAFT ->
 * SIGNED) live on the dedicated `[id]/sign` endpoint, not here.
 */

import { NextResponse } from "next/server"

import { created, defineHandler, requireSession } from "@/lib/api"
import {
  createTreatmentPlanSchema,
  listTreatmentPlansQuerySchema,
} from "@/lib/validation/treatment-plan"
import { createPlan, listPlans } from "@/lib/services/treatment-plan"

export const GET = defineHandler(async ({ req }) => {
  const session = await requireSession()

  const sp = req.nextUrl.searchParams
  const query = listTreatmentPlansQuerySchema.parse({
    patientId: sp.get("patientId") ?? undefined,
    status: sp.get("status") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  })

  const { items, nextCursor } = await listPlans(query, {
    userId: session.userId,
    role: session.role,
  })

  return NextResponse.json({
    data: items,
    nextCursor,
    pagination: { next: nextCursor },
  })
})

export const POST = defineHandler(async ({ req }) => {
  const session = await requireSession()
  const body = createTreatmentPlanSchema.parse(await req.json())
  const plan = await createPlan(body, {
    userId: session.userId,
    role: session.role,
  })
  return created(plan, `/api/treatment-plans/${plan.id}`)
})
