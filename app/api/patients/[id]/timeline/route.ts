/**
 * `/api/patients/[id]/timeline` (BE-21).
 *
 *   GET — aggregated reverse-chronological feed of clinical events for
 *         one patient. Returns the unified `TimelineEvent` shape:
 *
 *           { id, type, occurredAt, summary, ref }
 *
 *         Supports `?limit=` (default 50, max 200) and `?cursor=` (ISO
 *         8601 timestamp; returns rows with `occurredAt < cursor`).
 *         404 when the patient does not exist.
 *
 * Authn: any authenticated staff session (`requireSession()`); role
 * gating is intentionally permissive — clinical staff across roles
 * need this view to do their job.
 */

import { defineHandler, paginated, requireSession } from "@/lib/api"
import { timelineQuerySchema } from "@/lib/validation/timeline"
import { buildTimeline } from "@/lib/services/timeline"

type Params = { id: string }

export const GET = defineHandler<Params>(async ({ req, params }) => {
  await requireSession()
  const { id } = await params

  const sp = req.nextUrl.searchParams
  const { limit, cursor } = timelineQuerySchema.parse({
    limit: sp.get("limit") ?? undefined,
    cursor: sp.get("cursor") ?? undefined,
  })

  const { items, nextCursor } = await buildTimeline({
    patientId: id,
    limit,
    cursor,
  })

  return paginated(items, { next: nextCursor })
})
