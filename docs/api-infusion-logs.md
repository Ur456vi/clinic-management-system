# Infusion Log API

CRUD for the `InfusionLog` model (BE-26). One row per integrative-medicine
IV / infusion encounter — what was administered, by whom, when started and
completed, and whether the patient had a reaction. The per-agent order
lives in the `agents` JSONB array; the lifecycle is a four-state machine
gated in `lib/services/infusion-log.ts`.

All routes live under `/api/infusion-logs` and follow the BE-07 conventions:
`{ data }` / `{ error }` envelopes, `x-request-id` response header,
audit-log writes for every read/write of PHI.

Every endpoint requires an authenticated session (NextAuth JWT).
Unauthenticated calls return:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

(HTTP 401)

---

## Status lifecycle

```
SCHEDULED --+--> IN_PROGRESS --+--> COMPLETED
            |                  +--> ABORTED
            +--> ABORTED
```

`COMPLETED` and `ABORTED` are terminal. PATCH on a terminal row is
rejected with `VALIDATION_ERROR`.

Side-effects on transition (applied in `lib/services/infusion-log.ts`):

| Transition                  | Side-effect                                                                 |
| --------------------------- | --------------------------------------------------------------------------- |
| `SCHEDULED -> IN_PROGRESS`  | Stamps `startedAt = now()` if the stored value is in the future.            |
| `IN_PROGRESS -> COMPLETED`  | Stamps `completedAt = now()` if unset.                                      |
| `* -> ABORTED`              | Stamps `completedAt = now()` if unset; copies `reason` body into `reaction`. |

---

## Agent shape

Each entry in the `agents` array is shaped:

| Field      | Type           | Required | Notes                                            |
| ---------- | -------------- | -------- | ------------------------------------------------ |
| `name`     | string (1..200)| yes      | Agent label, e.g. `"Magnesium Sulphate"`.        |
| `dose`     | number (>= 0)  | yes      | Dose value (loose; protocol library tightens).   |
| `unit`     | string (1..50) | yes      | E.g. `"mg"`, `"mL"`, `"IU"`.                     |
| `sequence` | integer (>= 0) | yes      | Display / administration order within the bag.   |

The array must contain at least one agent and at most 50.

---

## `GET /api/infusion-logs`

List infusion logs (cursor-paginated, filterable).

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |
| Body | none |

### Query parameters

| Name        | Type                          | Required | Notes |
| ----------- | ----------------------------- | -------- | --- |
| `patientId` | uuid                          | no       | Exact match. |
| `staffId`   | uuid                          | no       | Exact match. Filter to logs administered by a staff member. |
| `status`    | `InfusionStatus` or CSV list  | no       | E.g. `?status=SCHEDULED,IN_PROGRESS`. |
| `from`      | ISO 8601 datetime             | no       | Inclusive lower bound on `startedAt`. |
| `to`        | ISO 8601 datetime             | no       | Exclusive upper bound on `startedAt`. |
| `cursor`    | string                        | no       | Keyset cursor — the `id` of the last row from the previous page. |
| `limit`     | integer                       | no       | Page size, default **20**, max **100**. |

Order is `startedAt desc, id desc`. The cursor is the `id` of the last
row returned in the previous page.

### Response (200)

```json
{
  "data": [
    {
      "id": "8f1c...",
      "patientId": "f5b5...",
      "consultationId": null,
      "staffId": "2d4a...",
      "protocol": "Myers' Cocktail",
      "agents": [
        { "name": "Magnesium Sulphate", "dose": 500, "unit": "mg", "sequence": 0 },
        { "name": "B-complex",          "dose": 1,   "unit": "mL", "sequence": 1 }
      ],
      "startedAt":   "2026-05-16T08:00:00.000Z",
      "completedAt": null,
      "reaction":    null,
      "status":      "IN_PROGRESS",
      "notes":       "Patient tolerated well",
      "createdAt":   "2026-05-16T07:55:11.000Z",
      "updatedAt":   "2026-05-16T08:00:00.000Z",
      "patient": { "id": "f5b5...", "patientNumber": "PAT-263040", "fullName": "Jane Doe" },
      "staff":   { "id": "2d4a...", "fullName": "Dr Mehta", "specialization": "Integrative", "departmentId": null },
      "consultation": null
    }
  ],
  "nextCursor": null,
  "pagination": { "next": null }
}
```

---

## `POST /api/infusion-logs`

Create a new SCHEDULED infusion log. `status` is server-assigned —
clients cannot pre-set it; use the transition endpoint instead.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, INFUSION_SPECIALIST) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field            | Type              | Required | Notes |
| ---------------- | ----------------- | -------- | --- |
| `patientId`      | uuid              | yes      | Must reference an existing Patient. |
| `consultationId` | uuid              | no       | Optional — when supplied, must belong to `patientId`. |
| `staffId`        | uuid              | yes      | Staff member administering the infusion. |
| `protocol`       | string (1..200)   | yes      | Free-form protocol label. |
| `agents`         | `Agent[]` (1..50) | yes      | See agent shape above. |
| `startedAt`      | ISO 8601 datetime | yes      | When administration began (back-fill allowed). |
| `completedAt`    | ISO 8601 datetime | no       | When supplied, must be strictly after `startedAt`. |
| `reaction`       | string (<=2000)   | no       | Free-text adverse-reaction note. |
| `notes`          | string (<=2000)   | no       | Free-text clinical notes. |

### Response

`201 Created` with the new infusion log and a `Location:
/api/infusion-logs/<id>` header.

Errors:

| Status | Code              | When |
| ------ | ----------------- | --- |
| 400    | `VALIDATION_ERROR` | Zod parse failed (e.g. `completedAt <= startedAt`). |
| 403    | `FORBIDDEN`       | Role not in WRITE_ROLES, or consultation belongs to another patient. |
| 404    | `NOT_FOUND`       | Patient / staff / consultation not found. |

---

## `GET /api/infusion-logs/:id`

Fetch one infusion log with patient + staff + consultation summary.
Writes a READ audit row (best-effort).

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |

### Response (200)

The same row shape as the list endpoint, wrapped in `{ data: <row> }`.

| Status | Code         | When |
| ------ | ------------ | --- |
| 404    | `NOT_FOUND`  | No row with that `id`. |

---

## `PATCH /api/infusion-logs/:id`

Partial update of content fields. **Status changes do not go through
this endpoint** — use `POST /api/infusion-logs/:id/transition` instead.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, INFUSION_SPECIALIST) |
| Method | `PATCH` |
| Content-Type | `application/json` |

### Request body (all optional)

| Field            | Type                       | Notes |
| ---------------- | -------------------------- | --- |
| `consultationId` | uuid or `null`             | `null` clears the link; uuid re-links (must belong to same patient). |
| `protocol`       | string (1..200)            | |
| `agents`         | `Agent[]` (1..50)          | Replaces the array verbatim — no merge semantics. |
| `startedAt`      | ISO 8601 datetime          | |
| `completedAt`    | ISO 8601 datetime or `null`| Must be strictly after `startedAt` (existing or new). |
| `reaction`       | string (<=2000) or `null`  | `null` clears. |
| `notes`          | string (<=2000) or `null`  | `null` clears. |

### Errors

| Status | Code               | When |
| ------ | ------------------ | --- |
| 400    | `VALIDATION_ERROR` | Time bound violation, terminal-row edit, or Zod parse failure. |
| 403    | `FORBIDDEN`        | Role not in WRITE_ROLES, or consultation belongs to another patient. |
| 404    | `NOT_FOUND`        | Row or referenced consultation not found. |

PATCH on a row whose `status` is `COMPLETED` or `ABORTED` returns 400
`VALIDATION_ERROR` — terminal rows are immutable from this endpoint.

---

## `POST /api/infusion-logs/:id/transition`

Apply a status transition.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, INFUSION_SPECIALIST) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field    | Type             | Required | Notes |
| -------- | ---------------- | -------- | --- |
| `to`     | `InfusionStatus` | yes      | Target status. Must satisfy the transition table. |
| `reason` | string (<=500)   | no       | Free-text justification. On `ABORTED`, copied into the row's `reaction` column. |

### Errors

| Status | Code               | When |
| ------ | ------------------ | --- |
| 400    | `VALIDATION_ERROR` | Already in `to`, or transition illegal per the table. |
| 403    | `FORBIDDEN`        | Role not in WRITE_ROLES. |
| 404    | `NOT_FOUND`        | Row not found. |

---

## `DELETE /api/infusion-logs/:id`

Hard-delete an infusion log. **ADMIN only** — operational escape hatch
for cleaning up test data. The expected soft-delete path is to
transition the row to `ABORTED`, which preserves clinical history.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN) |
| Method | `DELETE` |

### Response

`204 No Content` on success.

| Status | Code        | When |
| ------ | ----------- | --- |
| 403    | `FORBIDDEN` | Role is not ADMIN. |
| 404    | `NOT_FOUND` | Row not found. |
