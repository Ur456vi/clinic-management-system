/**
 * Typed response helpers for Next.js Route Handlers.
 *
 * Every API response in `app/api/**` should go through one of these helpers
 * so the envelope is consistent: `{ data }` for success, `{ error }` for
 * failure (see `./errors.ts`).
 *
 *   ok({ id: "..." })                       -> 200 { "data": { "id": "..." } }
 *   created(patient, "/api/patients/123")   -> 201 + Location header
 *   noContent()                             -> 204 (empty body)
 *   paginated(rows, { next, total })        -> 200 { "data": [...], "pagination": {...} }
 */

import { NextResponse } from "next/server"

export type ApiEnvelope<T> = { data: T }

export type PaginationCursor = {
  /** Opaque cursor for the next page; `null` when there are no more pages. */
  next?: string | null
  /**
   * Optional total count. Only include when cheap to compute — most
   * cursor-paginated endpoints should omit it.
   */
  total?: number
}

export type PaginatedEnvelope<T> = {
  data: T[]
  pagination: PaginationCursor
}

/** 200 OK with a `{ data }` envelope. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiEnvelope<T>> {
  return NextResponse.json<ApiEnvelope<T>>({ data }, init)
}

/**
 * 201 Created with a `{ data }` envelope. If `location` is provided it is
 * set as the `Location` response header (per RFC 7231 §7.1.2).
 */
export function created<T>(
  data: T,
  location?: string,
): NextResponse<ApiEnvelope<T>> {
  const headers = new Headers()
  if (location) headers.set("Location", location)
  return NextResponse.json<ApiEnvelope<T>>({ data }, { status: 201, headers })
}

/** 204 No Content. Body must be empty per the HTTP spec. */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/**
 * 200 with a paginated envelope. Use for list endpoints that support
 * cursor pagination via `parsePagination()`.
 */
export function paginated<T>(
  items: T[],
  cursor: PaginationCursor,
): NextResponse<PaginatedEnvelope<T>> {
  return NextResponse.json<PaginatedEnvelope<T>>({
    data: items,
    pagination: {
      next: cursor.next ?? null,
      ...(cursor.total !== undefined ? { total: cursor.total } : {}),
    },
  })
}
