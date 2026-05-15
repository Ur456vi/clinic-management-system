# Appointment API

CRUD for the `Appointment` model (BE-27). An appointment is a scheduled
clinical encounter between a Patient and a Staff member (typically a
doctor or RMO). The slot-conflict check enforced here is the same one
BE-28 (scheduling logic) reuses when proposing free slots.

All routes live under `/api/appointments` and follow the BE-07
conventions: `{ data }` / `{ error }` envelopes, `x-request-id` response
header, audit-log writes for every read/write of PHI.

Every endpoint requires an authenticated session (NextAuth JWT).
Unauthenticated calls return:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

(HTTP 401)

---

## Status lifecycle

```
REQUESTED --+--> CONFIRMED --+--> COMPLETED
            |                +--> CANCELLED
            |                +--> NO_SHOW
            +--> CANCELLED
```

`COMPLETED`, `CANCELLED`, and `NO_SHOW` are terminal. Only `REQUESTED`
and `CONFIRMED` rows "hold" the staff member's time for slot-conflict
purposes.

| Field             | Notes                                                     |
| ----------------- | --------------------------------------------------------- |
| `cancelledAt`     | Stamped to `now()` when status transitions to `CANCELLED` |
| `cancelledReason` | Stored from the transition body when supplied             |

---

## `POST /api/appointments`

Create a new REQUESTED appointment.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, RECEPTION) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field          | Type   | Required | Notes |
| -------------- | ------ | -------- | --- |
| `patientId`    | uuid   | yes      | Must reference an existing Patient. |
| `staffId`      | uuid   | yes      | Assigned doctor/RMO. Must reference an existing Staff row. |
| `departmentId` | uuid   | no       | Optional snapshot for routing/queue display. |
| `startsAt`     | ISO 8601 datetime | yes | Slot start (timestamptz). |
| `endsAt`       | ISO 8601 datetime | yes | Slot end. Must be strictly after `startsAt`. |
| `reason`       | string (<=500) | no | Short chief-complaint shorthand. |
| `notes`        | string (<=2000) | no | Reception/clinical notes for the booking. |

### Server-side slot-conflict check

Two intervals `[a, b)` and `[c, d)` overlap iff `a < d && c < b`. The
service runs the check inside the same transaction as the insert; any
existing appointment for the same `staffId` whose status is in
`{REQUESTED, CONFIRMED}` and that overlaps the requested window causes
the call to fail with:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Requested slot overlaps an existing appointment for this staff member",
    "details": { "code": "SLOT_CONFLICT" }
  }
}
```

HTTP status: `409`. The `details.code = "SLOT_CONFLICT"` discriminator
lets FE distinguish this from generic uniqueness conflicts.

### Response (201)

`Location: /api/appointments/<id>`

```json
{
  "data": {
    "id": "...",
    "patientId": "...",
    "staffId": "...",
    "departmentId": null,
    "startsAt": "2026-05-20T09:30:00.000Z",
    "endsAt":   "2026-05-20T10:00:00.000Z",
    "status": "REQUESTED",
    "reason": null,
    "notes": null,
    "createdById": "...",
    "cancelledAt": null,
    "cancelledReason": null,
    "createdAt": "...",
    "updatedAt": "...",
    "patient": { "id": "...", "patientNumber": "PAT-100001", "fullName": "..." },
    "staff":   { "id": "...", "fullName": "...", "specialization": "..." },
    "department": null,
    "createdBy": { "id": "...", "fullName": "..." }
  }
}
```

### Errors

- `400 VALIDATION_ERROR` -- bad body (missing fields, `endsAt <= startsAt`,
  malformed UUID).
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` -- role outside ADMIN/DOCTOR/RMO/RECEPTION.
- `404 NOT_FOUND` -- patient / staff / department FK target missing.
- `409 CONFLICT` with `details.code = "SLOT_CONFLICT"` -- slot overlap.

---

## `GET /api/appointments`

List appointments (cursor-paginated, filterable).

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |

### Query parameters

| Param          | Type     | Notes |
| -------------- | -------- | --- |
| `patientId`    | uuid     | Exact match. |
| `staffId`      | uuid     | Exact match. |
| `departmentId` | uuid     | Exact match. |
| `status`       | string   | Single value or comma-separated list of `AppointmentStatus`. |
| `from`         | ISO 8601 | Inclusive lower bound on `startsAt`. |
| `to`           | ISO 8601 | Exclusive upper bound on `startsAt`. |
| `cursor`       | string   | Opaque cursor (id of last row of previous page). |
| `limit`        | int      | Page size; default 20, max 100. |

Order is `startsAt asc, id asc` -- calendar-natural, stable for cursoring.

### Response (200)

```jsonc
{
  "data": [ /* AppointmentWithRelations[] */ ],
  "nextCursor": "uuid-or-null",
  "pagination": { "next": "uuid-or-null" }
}
```

Both `nextCursor` (BE-12-style) and `pagination.next` (BE-07-style) are
emitted so either FE contract keeps working.

### Errors

- `400 VALIDATION_ERROR` -- bad query (malformed UUID, bad ISO date,
  `to < from`).
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN`.

---

## `GET /api/appointments/:id`

Fetch one appointment with patient + staff summary. Writes a READ audit
row.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |

### Response (200)

Full appointment row with `patient`, `staff`, `department`, and
`createdBy` summaries embedded.

### Errors

- `401 UNAUTHORIZED`.
- `403 FORBIDDEN`.
- `404 NOT_FOUND`.

---

## `PATCH /api/appointments/:id`

Partial update of time bounds and free-text fields. Status changes go
through the transition endpoint instead.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, RECEPTION) |
| Method | `PATCH` |
| Content-Type | `application/json` |

### Request body

| Field      | Type           | Notes |
| ---------- | -------------- | --- |
| `startsAt` | ISO 8601 datetime | New start. Optional. |
| `endsAt`   | ISO 8601 datetime | New end. Optional. Combined with the (possibly new) `startsAt`, must be strictly after. |
| `reason`   | string \| null    | Overwrites or clears (`null`). |
| `notes`    | string \| null    | Overwrites or clears (`null`). |

If either time bound is supplied, the slot-conflict check re-runs against
`(staffId, [nextStartsAt, nextEndsAt))`, excluding the row being edited.

Terminal-status rows (`COMPLETED`, `CANCELLED`, `NO_SHOW`) reject the
PATCH with `400 VALIDATION_ERROR`.

### Response (200)

Full updated appointment (same shape as GET).

### Errors

- `400 VALIDATION_ERROR` -- bad body, `endsAt <= startsAt`, or row is in
  a terminal status.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN`.
- `404 NOT_FOUND`.
- `409 CONFLICT` with `details.code = "SLOT_CONFLICT"`.

---

## `POST /api/appointments/:id/transition`

Apply a status transition.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, RECEPTION) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field   | Type              | Required | Notes |
| ------- | ----------------- | -------- | --- |
| `to`    | AppointmentStatus | yes      | Target status. |
| `reason` | string (<=500)   | no       | Stored on `cancelledReason` when `to = CANCELLED`. |

### Transition matrix

| From         | Allowed `to`                             |
| ------------ | ---------------------------------------- |
| `REQUESTED`  | `CONFIRMED`, `CANCELLED`                 |
| `CONFIRMED`  | `COMPLETED`, `CANCELLED`, `NO_SHOW`      |
| `COMPLETED`  | -- (terminal)                            |
| `CANCELLED`  | -- (terminal)                            |
| `NO_SHOW`    | -- (terminal)                            |

Anything else returns `400 VALIDATION_ERROR`.

On `CANCELLED`:
- `cancelledAt = now()`
- `cancelledReason = body.reason ?? null`

### Response (200)

Full updated appointment.

### Errors

- `400 VALIDATION_ERROR` -- bad body, no-op transition (same status), or
  illegal transition.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN`.
- `404 NOT_FOUND`.

---

## Implementation notes

- **Validation** -- Zod schemas in `lib/validation/appointment.ts`. The
  `ALLOWED_APPOINTMENT_TRANSITIONS` table is exported there.
- **Business logic** -- `lib/services/appointment.ts`. Routes are thin
  wrappers. The slot-conflict helper `hasSlotConflict()` is exported
  for reuse by BE-28 (suggested-slot endpoints).
- **Slot-conflict semantics** -- half-open intervals `[startsAt, endsAt)`,
  filtered to slot-holding statuses `{REQUESTED, CONFIRMED}`. The
  service-layer check runs inside `db.$transaction` so a concurrent
  competing insert can't slip past it (Postgres serializable isolation
  is the right escalation if we see hot contention; not needed at
  clinic scale today).
- **`createdBy` is a Staff FK** -- we look up the actor's Staff row by
  `userId` at create time. Patient-portal-initiated bookings (BE-47)
  will leave it null.
- **Audit logs** -- every read and write produces an `AuditLog` row. The
  UPDATE detail records `{ before, after, patch }` for PATCH and
  `{ transition: { from, to }, reason }` for transition.
- **No optimistic locking** -- concurrent PATCHes race on the row;
  last-write-wins. Slot-conflict still cannot be bypassed (it's inside
  the transaction).
