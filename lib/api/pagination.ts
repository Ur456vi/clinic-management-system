/**
 * Cursor pagination input parser.
 *
 * Vyara uses opaque-cursor pagination on all list endpoints:
 *
 *   GET /api/patients?take=20&cursor=<id-of-last-row-from-previous-page>
 *
 * - `take` defaults to 20 and is clamped to [1, 100].
 * - `cursor` is the primary key of the last row from the previous page
 *   (the route is free to interpret it — most of our models use cuid/uuid).
 *
 * The result is shaped to plug straight into a Prisma `findMany`:
 *
 *   const { take, cursor } = parsePagination(req.nextUrl.searchParams)
 *   const rows = await db.patient.findMany({
 *     take: take + 1,
 *     ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
 *     orderBy: { id: "asc" },
 *   })
 *   const next = rows.length > take ? rows.pop()!.id : null
 *   return paginated(rows, { next })
 */

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export type PaginationInput = {
  /** How many items the caller wants. Clamped to [1, MAX_PAGE_SIZE]. */
  take: number
  /** Opaque cursor from the previous page, or `null` for the first page. */
  cursor: string | null
}

function clampTake(raw: string | null): number {
  if (raw === null || raw === "") return DEFAULT_PAGE_SIZE
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(Math.floor(n), MAX_PAGE_SIZE)
}

/**
 * Parse `?take=` / `?cursor=` off a `URLSearchParams` (e.g.
 * `req.nextUrl.searchParams`).
 *
 * Never throws — bad input falls back to defaults so list endpoints are
 * forgiving. Validation of the cursor's semantic shape (uuid? cuid?) is
 * the route's job.
 */
export function parsePagination(searchParams: URLSearchParams): PaginationInput {
  const take = clampTake(searchParams.get("take"))
  const rawCursor = searchParams.get("cursor")
  const cursor = rawCursor && rawCursor.length > 0 ? rawCursor : null
  return { take, cursor }
}
