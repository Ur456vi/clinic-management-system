# Appointment Booking API (BE-23)

This document covers the two endpoints added under
`/api/appointments` for the **patient-facing booking flow**:

- `GET  /api/appointments/availability` — list free slots for a staff
  member in a given window.
- `POST /api/appointments/book` — patient self-book, or admin/reception
  on-behalf book, into a free slot.

For the staff-side CRUD surface (list / create / patch / transition),
see [`api-appointments.md`](./api-appointments.md). Both endpoints
share the same `Appointment` shape, error envelope, and audit-log
behavior described there.

> Status: BE-23 in-flight (Sprint 1).

---

## `GET /api/appointments/availability`

Enumerate free slot windows for a staff member.

| Aspect       | Value                                                         |
| ------------ | ------------------------------------------------------------- |
| Auth         | required (any authenticated user)                             |
| Method       | `GET`                                                         |
| Content-Type | n/a                                                           |

### Query parameters

| Param          | Type   | Required | Notes                                                                                                  |
| -------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------ |
| `staffId`      | uuid   | yes      | Staff member whose calendar to scan.                                                                   |
| `from`         | ISO 8601 datetime | yes | Window lower bound (inclusive).                                                                  |
| `to`           | ISO 8601 datetime | yes | Window upper bound (exclusive). `to - from` must be ≤ 14 days.                                  |
| `durationMins` | integer | yes     | Slot length in minutes. Range 5–480. Drives the granularity of returned candidates.                    |

### Working-hours overlay

Sprint 1 has no `WorkingHours` model yet, so the server hard-codes the
clinic's standard day as **09:00–18:00 local time** of the server.
Candidates that straddle a calendar-day boundary or fall outside this
window are filtered out. BE-30 will replace this with per-staff
schedules.

### Response — 200 OK

```json
{
  "data": [
    { "start": "2026-05-17T03:30:00.000Z", "end": "2026-05-17T04:00:00.000Z" },
    { "start": "2026-05-17T04:00:00.000Z", "end": "2026-05-17T04:30:00.000Z" }
  ]
}
```

`data` is a (possibly empty) array of `{ start, end }` slot windows.
Each window is the half-open interval `[start, end)`, ordered by
`start` ascending.

### Errors

| Status | Code               | When                                                  |
| ------ | ------------------ | ----------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | Missing/invalid query parameters; `to <= from`.       |
| 401    | `UNAUTHORIZED`     | No session.                                           |
| 404    | `NOT_FOUND`        | `staffId` does not exist.                             |
| 422    | `VALIDATION_FAILED` | Window exceeds 14 days.                              |

### Example

```bash
curl -s -G \
  --data-urlencode "staffId=44b9b6a4-...." \
  --data-urlencode "from=2026-05-17T00:00:00Z" \
  --data-urlencode "to=2026-05-18T00:00:00Z" \
  --data-urlencode "durationMins=30" \
  http://localhost:3000/api/appointments/availability
```

---

## `POST /api/appointments/book`

Book an appointment as a patient (self-book) or on behalf of one
(ADMIN / RECEPTION).

| Aspect       | Value                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------- |
| Auth         | required                                                                                    |
| Method       | `POST`                                                                                      |
| Content-Type | `application/json`                                                                          |
| Role gates   | Self-book: any authenticated user with a linked `Patient` row. On-behalf: `ADMIN`, `RECEPTION`. |

### Routing rule

- If the body **omits** `patientId`, the server resolves the patient
  from the session (`Patient.userId == session.userId`). This is the
  **self-book** flow.
- If the body **includes** `patientId`, the caller must hold `ADMIN`
  or `RECEPTION` role. This is the **on-behalf** flow.

DOCTOR / RMO callers wanting to create an appointment for an arbitrary
patient should use `POST /api/appointments` (the staff-side surface)
rather than `/book`.

### Request body

| Field        | Type              | Required | Notes                                                            |
| ------------ | ----------------- | -------- | ---------------------------------------------------------------- |
| `staffId`    | uuid              | yes      | Assigned doctor / RMO.                                           |
| `startsAt`   | ISO 8601 datetime | yes      | Slot start.                                                      |
| `endsAt`     | ISO 8601 datetime | yes      | Must be strictly after `startsAt`.                               |
| `reason`     | string (≤500)     | no       | Free-text reason for visit.                                      |
| `notes`      | string (≤2000)    | no       | Reception notes attached to the booking.                         |
| `patientId`  | uuid              | no       | **ADMIN / RECEPTION only.** Patient to book on behalf of.        |

### Server-side checks

1. **Slot conflict** — `hasSlotConflict` re-runs inside the same
   `db.$transaction` as the insert, against `REQUESTED` and `CONFIRMED`
   appointments on the staff member's calendar. A conflict aborts the
   transaction and returns 409.
2. **Patient existence** — `patientId` (whether session-derived or
   body-supplied) must resolve to a `Patient` row.
3. **Staff existence** — `staffId` must resolve to a `Staff` row.

### Response — 201 Created

Same wire shape as `POST /api/appointments` (a fully-included
`Appointment` row). `Location` header points to
`/api/appointments/{id}`. Status of the created row is `REQUESTED`.

### Errors

| Status | Code               | When                                                                              |
| ------ | ------------------ | --------------------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | Schema parse failure; `endsAt <= startsAt`.                                       |
| 401    | `UNAUTHORIZED`     | No session.                                                                       |
| 403    | `FORBIDDEN`        | Self-book by a user with no linked `Patient`; on-behalf book by a non-admin role. |
| 404    | `NOT_FOUND`        | `patientId` or `staffId` not found.                                               |
| 409    | `CONFLICT`         | `SLOT_CONFLICT` — overlap with an existing held appointment.                      |

### Audit-log

A `CREATE / Appointment` audit row is written inside the same
transaction. The `detail.via` field is `"self"` or `"on-behalf"`
depending on which path produced the booking — useful for the
admin-side audit-log filter (BE-24).

### Examples

Patient self-book:

```bash
curl -s -X POST \
  -H 'content-type: application/json' \
  -b 'next-auth.session-token=...' \
  --data '{
    "staffId": "44b9b6a4-....",
    "startsAt": "2026-05-17T03:30:00Z",
    "endsAt":   "2026-05-17T04:00:00Z",
    "reason":   "Follow-up consultation"
  }' \
  http://localhost:3000/api/appointments/book
```

Reception books on a patient's behalf:

```bash
curl -s -X POST \
  -H 'content-type: application/json' \
  -b 'next-auth.session-token=...' \
  --data '{
    "patientId": "9f5e7d2c-....",
    "staffId":   "44b9b6a4-....",
    "startsAt":  "2026-05-17T03:30:00Z",
    "endsAt":    "2026-05-17T04:00:00Z"
  }' \
  http://localhost:3000/api/appointments/book
```
