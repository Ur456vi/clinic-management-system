# Staff API

RESTful CRUD over the `Staff` model (BE-03). All routes live under
`/api/staff` and follow the BE-07 conventions: `{ data }` / `{ error }`
envelopes, `x-request-id` response header, cursor pagination.

Every endpoint requires an authenticated session (NextAuth JWT). Routes
that mutate or list use additional role gates — see each endpoint.

---

## Wire shape vs. DB schema

The current `Staff` model (BE-03) stores a single `fullName` column. The
spec asks for `firstName` + `lastName`, which the dashboard FE wants
displayed separately. The API accepts both on input and projects them on
output:

- **input** — POST/PATCH take `firstName` and `lastName`; the service
  joins them with a single space before writing to `fullName`.
- **output** — every response splits `fullName` on the **last**
  whitespace: `firstName = everything before`, `lastName = everything
  after`. If `fullName` has no whitespace, `lastName` is the empty
  string.

A schema migration (BE-30b) will split the column proper so callers can
sort by `lastName` and round-trip an apostrophed surname losslessly.

---

## `GET /api/staff`

List staff with role/department filters and cursor pagination.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |
| Body | none |

### Query parameters

| Name | Type | Notes |
| --- | --- | --- |
| `q` | string | Case-insensitive substring match across `fullName` and `user.email`. |
| `role` | `Role` / comma list | One or more `Role` enum values (`ADMIN`, `DOCTOR`, `RMO`, `RECEPTION`, `INFUSION_SPECIALIST`, `REHAB_SPECIALIST`, `AESTHETICS_SPECIALIST`). |
| `departmentId` | uuid | Filter to staff in this department. |
| `cursor` | string | Keyset cursor — the `id` of the last row from the previous page. Omit for page 1. |
| `limit` | integer | Page size. Default **20**, max **100**. Out-of-range values clamp. |

### Response (200)

```json
{
  "data": [
    {
      "id": "f5b5...",
      "userId": "8b3f...",
      "email": "asha.p@vyara.clinic",
      "firstName": "Asha",
      "lastName": "Patel",
      "fullName": "Asha Patel",
      "role": "DOCTOR",
      "phone": "+91-98xxx-xxxxx",
      "departmentId": "0c10...",
      "department": { "id": "0c10...", "name": "Integrative Medicine", "slug": "integrative-medicine" },
      "isActive": true,
      "createdAt": "2026-05-13T10:00:00.000Z",
      "updatedAt": "2026-05-13T10:00:00.000Z"
    }
  ],
  "nextCursor": "f5b5...",
  "pagination": { "next": "f5b5..." }
}
```

`nextCursor` mirrors `pagination.next` for clients written against either
of our list envelopes (BE-07 vs. BE-12). Both are `null` at the end of
the result set.

Ordering: `fullName ASC, id ASC` (stable, safe for keyset pagination).
The spec asked for `lastName ASC` — we treat the alphabetised join as a
reasonable proxy until BE-30b splits the columns.

Soft-deleted rows (Staff.isActive=false) are hidden. There is no flag to
surface them — BE-30b will introduce one once `archivedAt` exists.

### Errors

- `400 VALIDATION_ERROR` — bad query string (malformed UUID, unknown role token, limit out of range).
- `401 UNAUTHORIZED`.

---

## `POST /api/staff`

Create a new staff member. Creates the `User` AND `Staff` rows in a
single transaction.

| Aspect | Value |
| --- | --- |
| Auth | required — **ADMIN only** |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string | yes | RFC 5322, lower-cased server-side. Must be unique across `users`. |
| `firstName` | string (1..100) | yes | |
| `lastName` | string (1..100) | yes | |
| `role` | `Role` | yes | Any clinic role enum value. |
| `departmentId` | uuid | no | FK to `Department`. |
| `phone` | string | no | |
| `password` | string (8..200) | no | If provided, bcrypt-hashed at cost 12 via `lib/passwords.hashPassword`. If omitted, the `User.passwordHash` is the empty string and the credentials provider refuses to sign the user in; the admin must trigger the password-reset OTP flow (BE-05) for the account. |

### Response (201)

`Location: /api/staff/<id>`

```json
{
  "data": {
    "id": "...",
    "userId": "...",
    "email": "asha.p@vyara.clinic",
    "firstName": "Asha",
    "lastName": "Patel",
    "fullName": "Asha Patel",
    "role": "DOCTOR",
    "phone": null,
    "departmentId": null,
    "department": null,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Errors

- `400 VALIDATION_ERROR` — bad body.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — caller is not ADMIN.
- `409 CONFLICT` — `users.email` collision (`error.details.target = ["email"]`).

---

## `GET /api/staff/:id`

Fetch one staff member. Writes an audit-log row (`action=READ`). Returns
`user.email` and a department summary inline.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |

### Response (200)

```json
{ "data": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "role": "DOCTOR", ... } }
```

### Errors

- `401 UNAUTHORIZED`.
- `404 NOT_FOUND`.

---

## `PATCH /api/staff/:id`

Partial update. Accepts any subset of `firstName`, `lastName`, `phone`,
`role`, `departmentId`. Records an audit row with `detail = { before,
after }`.

| Aspect | Value |
| --- | --- |
| Auth | required — ADMIN, OR self (with limits) |
| Method | `PATCH` |
| Content-Type | `application/json` |

### Role gate matrix

| Caller | May patch | May NOT patch |
| --- | --- | --- |
| ADMIN (any staff row) | `firstName`, `lastName`, `phone`, `role`, `departmentId` | `email` (always rejected) |
| Self (their own staff row) | `firstName`, `lastName`, `phone` | `role`, `departmentId`, `email` |
| Anyone else | — | everything (403 `FORBIDDEN`) |

### Errors

- `400 VALIDATION_ERROR` with `details.code = "EMAIL_IMMUTABLE"` when the body includes `email`.
- `400 VALIDATION_ERROR` with `details.code = "SELF_ROLE_CHANGE"` when a non-admin tries to patch their own `role` or `departmentId`.
- `400 VALIDATION_ERROR` for normal Zod failures (no `details.code`).
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` when patching someone else's row as non-admin.
- `404 NOT_FOUND`.

### Response (200)

```json
{ "data": { "id": "...", "firstName": "Asha", "lastName": "P.", ... } }
```

---

## `DELETE /api/staff/:id`

Soft-delete. Flips `Staff.isActive` AND `User.isActive` to `false` so
the credentials provider refuses to sign the user in. The rows stay in
the DB to preserve audit trail and FK references (primary doctor on
patients, consultation creators, etc.).

| Aspect | Value |
| --- | --- |
| Auth | required — **ADMIN only** |
| Method | `DELETE` |

### Response

`204 No Content`.

### Errors

- `400 VALIDATION_ERROR` with `details.code = "CANNOT_ARCHIVE_SELF"` when the actor's `userId` matches the staff row's `userId`.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — caller is not ADMIN.
- `404 NOT_FOUND`.

---

## Implementation notes

- **Validation** — Zod schemas in `lib/validation/staff.ts`. `ZodError`
  is mapped to a 400 envelope by `errorResponse` (BE-07).
- **Business logic** — `lib/services/staff.ts`. Routes are thin wrappers.
- **Audit logs** — every read and write produces an `AuditLog` row.
  Reads swallow audit failures (the GET still succeeds); writes happen
  inside a `$transaction` and roll back together.
- **Email immutability** — checked at the route, NOT the validator, so
  the explicit `EMAIL_IMMUTABLE` code can fire BEFORE Zod strips the
  field. If we ever want to allow email changes we'll add a dedicated
  endpoint that also rotates sessions.

## Known gaps — picked up in BE-30b

- `Staff.archivedAt` + `User.disabledAt` columns are missing. We
  soft-delete via `isActive=false` today. The column work is filed for
  BE-27/BE-30b.
- `Staff.firstName` / `Staff.lastName` columns are missing. We synthesise
  them from `fullName`; BE-30b will split the column properly so we can
  sort by surname and round-trip multi-word names without loss.
- Staff availability (working hours, shift coverage) is out of scope
  for this PR — it goes with BE-28 scheduling. The follow-up note
  BE-30b carries the "+ availability" half of the original ticket.
- No way to LIST archived staff yet. Once `archivedAt` lands a
  `?includeArchived=true` query flag will be added.
