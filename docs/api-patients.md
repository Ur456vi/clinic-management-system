# Patient API

RESTful CRUD over the `Patient` model (BE-03). All routes live under
`/api/patients` and follow the BE-07 conventions: `{ data }` / `{ error }`
envelopes, `x-request-id` response header, cursor pagination.

Every endpoint requires an authenticated session (NextAuth JWT). Unauthenticated
calls return:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

(HTTP 401)

---

## `GET /api/patients`

List patients with search, filtering, and cursor pagination.

| Aspect | Value |
| --- | --- |
| Auth | required |
| Method | `GET` |
| Body | none |

### Query parameters

BE-12 introduced the short-form `q` / `doctorId` / `limit` names. The
legacy `search` / `primaryDoctorId` / `take` aliases continue to work for
backwards compatibility with the BE-07 clients; the short form wins if
both are supplied.

| Name | Type | Notes |
| --- | --- | --- |
| `q` *(alias: `search`)* | string | Case-insensitive substring match across `fullName`, `email`, `phone`, `patientNumber`. |
| `status` | `ACTIVE` / `INACTIVE` / `ARCHIVED` | Single value **or** a comma-separated list (e.g. `status=ACTIVE,INACTIVE`). When omitted, ARCHIVED rows are hidden. |
| `doctorId` *(alias: `primaryDoctorId`)* | uuid | Filter to patients with this primary (assigned) doctor. |
| `cursor` | string | Keyset cursor — the `id` of the last row from the previous page. Omit for page 1. |
| `limit` *(alias: `take`)* | integer | Page size. Default **20**, max **100**. Out-of-range values clamp. |

#### Example request

```
GET /api/patients?q=jane&status=ACTIVE,INACTIVE&doctorId=8b3f...&limit=20
```

### Response (200)

```json
{
  "data": [
    {
      "id": "f5b5...",
      "patientNumber": "PAT-000042",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1-555-0100",
      "dateOfBirth": "1985-04-12",
      "sex": "FEMALE",
      "status": "ACTIVE",
      "primaryDoctorId": "8b3f...",
      "createdAt": "2026-05-13T10:00:00.000Z",
      "updatedAt": "2026-05-13T10:00:00.000Z"
    }
  ],
  "nextCursor": "f5b5...",
  "pagination": { "next": "f5b5..." }
}
```

`nextCursor` is the BE-12 contract; `pagination.next` mirrors it for
clients written against the BE-07 envelope. Both are `null` when the
caller has reached the end of the result set.

Ordering: `createdAt DESC, id DESC` (stable tiebreaker, safe for keyset
pagination).

### Errors

- `400 VALIDATION_ERROR` — bad query string (e.g. malformed UUID, status not in enum, limit out of range, unknown status token in a comma-separated list).
- `401 UNAUTHORIZED`.

---

## `POST /api/patients`

Create a new patient. The server assigns `patientNumber` (`PAT-NNNNNN`).

| Aspect | Value |
| --- | --- |
| Auth | required |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `fullName` | string (1..200) | yes | |
| `email` | string | no | RFC 5322, lower-cased server-side. |
| `phone` | string | no | |
| `dateOfBirth` | ISO 8601 date | no | |
| `sex` | `MALE` / `FEMALE` / `OTHER` / `UNDISCLOSED` | no | |
| `occupation` | string | no | |
| `placeOfResidence` | string | no | |
| `address` | string | no | |
| `referralSource` | string | no | |
| `primaryDoctorId` | uuid | no | Must reference an existing Staff with role DOCTOR (FK enforced by DB). |

### Response (201)

`Location: /api/patients/<id>`

```json
{
  "data": {
    "id": "...",
    "patientNumber": "PAT-000043",
    "fullName": "Jane Doe",
    "status": "ACTIVE",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Errors

- `400 VALIDATION_ERROR` — bad body.
- `401 UNAUTHORIZED`.
- `409 CONFLICT` — unique-constraint collision (rare; retried by the client).

---

## `GET /api/patients/:id`

Fetch one patient. Writes an audit-log row (`action=READ`).

| Aspect | Value |
| --- | --- |
| Auth | required |
| Method | `GET` |

### Response (200)

```json
{ "data": { "id": "...", "patientNumber": "...", "fullName": "...", ... } }
```

### Errors

- `401 UNAUTHORIZED`.
- `404 NOT_FOUND` — no patient with that id.

---

## `PATCH /api/patients/:id`

Partial update. Any subset of the create body is accepted, plus `status`
(`ACTIVE` / `INACTIVE` / `ARCHIVED`). Records an audit row with
`detail = { before, after }`.

| Aspect | Value |
| --- | --- |
| Auth | required |
| Method | `PATCH` |
| Content-Type | `application/json` |

### Response (200)

```json
{ "data": { "id": "...", "fullName": "Jane R. Doe", ... } }
```

### Errors

- `400 VALIDATION_ERROR`.
- `401 UNAUTHORIZED`.
- `404 NOT_FOUND`.

---

## `DELETE /api/patients/:id`

Soft-delete: sets `status = ARCHIVED` and `deletedAt = now()`. The row stays
in the table so the audit trail and any historical consultations remain
referentially intact. Records an audit row (`action=DELETE`).

| Aspect | Value |
| --- | --- |
| Auth | required |
| Method | `DELETE` |

### Response

`204 No Content` (empty body).

### Errors

- `401 UNAUTHORIZED`.
- `404 NOT_FOUND`.

---

## Implementation notes

- **Validation** — Zod schemas in `lib/validation/patient.ts`. `ZodError`
  is mapped to a 400 envelope by `errorResponse` (BE-07).
- **Business logic** — `lib/services/patient.ts`. Routes are thin wrappers.
- **Patient number** — currently `MAX(patient_number) + 1`. This races
  under concurrent inserts; the unique index catches the collision and
  the client retries. BE-09 replaces this with a Postgres sequence.
- **Audit logs** — every read and write produces an `AuditLog` row. Reads
  swallow audit failures (the GET still succeeds); writes are inside a
  `$transaction` and roll back together.
- **Errors** — all `AppError` subclasses come from `@/lib/errors` (BE-04).
  The BE-07 `errorResponse` recognises them structurally.
