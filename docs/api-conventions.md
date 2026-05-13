# API conventions

> All Next.js Route Handlers under `app/api/**` follow the conventions on
> this page. The helpers live in `lib/api/` — import them from
> `@/lib/api` (the barrel) so the call sites stay tight.

## TL;DR — writing a new route

Ten lines, including imports:

```ts
// app/api/patients/route.ts
import { defineHandler, requireRole, ok, paginated, parsePagination } from "@/lib/api"
import { db } from "@/lib/db"

export const GET = defineHandler(async ({ req }) => {
  await requireRole("ADMIN", "DOCTOR", "RECEPTION")
  const { take, cursor } = parsePagination(req.nextUrl.searchParams)
  const rows = await db.patient.findMany({
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { id: "asc" },
  })
  const next = rows.length > take ? rows.pop()!.id : null
  return paginated(rows, { next })
})
```

That's the whole route. Auth, request id, logging, error envelope, and
pagination shape are all handled by the helpers.

## Response envelope

Every successful response carries a `data` key:

```jsonc
// 200 OK
{ "data": { "id": "cuid_…", "name": "Asha P." } }
```

List endpoints additionally carry `pagination`:

```jsonc
// 200 OK, paginated
{
  "data": [ /* items */ ],
  "pagination": { "next": "cuid_of_last_item", "total": 137 }
}
```

`total` is **optional** — only return it when it's cheap (cached counter,
small table). Cursor-paginated lists over big tables should omit it.

201 Created responses use the same `{ data }` envelope and additionally set
a `Location` header pointing at the new resource:

```http
HTTP/1.1 201 Created
Location: /api/patients/cuid_…
Content-Type: application/json

{ "data": { "id": "cuid_…", … } }
```

204 No Content responses have an empty body (per the HTTP spec); use them
for successful `DELETE` and for `PUT`/`PATCH` calls that have nothing
meaningful to return.

## Error envelope

Errors always have an `error` key, never `data`:

```jsonc
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": ["body", "email"], "message": "Invalid email" }
    ]
  }
}
```

`details` is optional and only included when there's useful structured info
(Zod issues, the conflicting unique key, etc.). The `message` is intended
for log lines and developer-facing UIs — not end-user copy.

### Error codes

| Code               | Status | When it's used                                         |
| ------------------ | ------ | ------------------------------------------------------ |
| `VALIDATION_ERROR` | 400    | Zod parse failed, or `ValidationError` thrown by hand  |
| `UNAUTHORIZED`     | 401    | No session — thrown by `requireSession()`              |
| `FORBIDDEN`        | 403    | Wrong role — thrown by `requireRole(...)`              |
| `NOT_FOUND`        | 404    | `NotFoundError`, or Prisma `P2025`                     |
| `CONFLICT`         | 409    | `ConflictError`, or Prisma `P2002` (unique constraint) |
| `RATE_LIMITED`     | 429    | Reserved — emitted by rate-limit middleware (later)    |
| `INTERNAL_ERROR`   | 500    | Anything not caught above. The original error is       |
|                    |        | `console.error`'d server-side.                         |

Throw `AppError` (or any subclass) from anywhere in the request:
`defineHandler` will route it through `errorResponse()` automatically.

## Status code policy

| Status                | Use for                                                     |
| --------------------- | ----------------------------------------------------------- |
| 200 OK                | Successful GET; PUT/PATCH with a response body              |
| 201 Created           | POST that created a resource (return `Location`)            |
| 204 No Content        | Successful DELETE; PUT/PATCH with no body                   |
| 400 Bad Request       | Validation failures, malformed input                        |
| 401 Unauthorized      | No session                                                  |
| 403 Forbidden         | Session present, wrong role / no access to the resource     |
| 404 Not Found         | Resource id is well-formed but doesn't exist                |
| 409 Conflict          | Unique constraint, optimistic-lock failure, state conflict  |
| 500 Internal          | Anything unexpected. Always logged server-side              |

Do **not** invent new codes for one-off cases — pick the closest existing
one and put the nuance in `error.message` / `error.details`.

## Pagination contract

Cursor-based, opaque, single page size:

```
GET /api/<resource>?take=20&cursor=<id-of-last-row-from-previous-page>
```

- `take` defaults to **20**, max **100**. Out-of-range values clamp silently
  rather than 400 — list endpoints should be forgiving.
- `cursor` is the primary key (cuid/uuid) of the last row from the previous
  page. Omit it for the first page.
- Responses always include `pagination.next`. It is `null` when the caller
  has reached the end.

The standard Prisma idiom is to fetch `take + 1` rows so you can derive
`next` without a second query:

```ts
const rows = await db.patient.findMany({
  take: take + 1,
  ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  orderBy: { id: "asc" },
})
const next = rows.length > take ? rows.pop()!.id : null
return paginated(rows, { next })
```

## Request id + logging

`defineHandler` generates a UUID v4 request id for every call, exposes it
to the handler as `ctx.requestId`, sets it on the response as the
`x-request-id` header, and logs a single line per request:

```
[7f9c…-uuid] GET /api/patients -> 200 in 14.3ms
```

When something explodes, the `console.error(err)` from `errorResponse` is
emitted on the line above the access log — grep the request id to follow
the trail.

## File-level conventions

- One Route Handler file per route segment (`app/api/<resource>/route.ts`).
- Always wrap the export in `defineHandler`. Never `export async function GET`
  directly — you lose logging and the error envelope.
- Auth is the **first** thing inside the handler. Validate input next.
  Do DB work last. This keeps unauthorised calls cheap.
- Throw `AppError` subclasses to signal failure; never build error responses
  by hand.
