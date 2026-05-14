# Consultation API

CRUD for the `Consultation` model (BE-13). A consultation is a clinical
encounter — RMO intake or senior doctor "main" — represented as a single
row with `type` discriminating between the two and `sections` carrying the
form payload as JSONB. The autosave debounce on the frontend hits the
`PATCH` endpoint here.

All routes live under `/api/consultations` and follow the BE-07
conventions: `{ data }` / `{ error }` envelopes, `x-request-id` response
header, audit-log writes for every read/write of PHI.

Every endpoint requires an authenticated session (NextAuth JWT).
Unauthenticated calls return:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

(HTTP 401)

---

## `POST /api/consultations`

Create a new DRAFT consultation linked to a patient + author.

| Aspect | Value |
| --- | --- |
| Auth | required (RMO/DOCTOR/ADMIN; MAIN type also restricted to DOCTOR/ADMIN) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `patientId` | uuid | yes | Must reference an existing Patient. |
| `type` | `RMO` / `MAIN` | yes | Discriminator. RMO authorable by ADMIN/RMO/DOCTOR; MAIN by ADMIN/DOCTOR only. |
| `sections` | object | no | Initial section blob. Optional — most callers POST `{}` and fill via PATCH. |
| `summary` | string (<=2000) | no | Optional one-liner for the patient timeline. |

### Response (201)

`Location: /api/consultations/<id>`

```json
{ "data": { "id": "...", "patientId": "...", "type": "RMO", "status": "DRAFT", "sections": {}, "createdBy": {}, "patient": {} } }
```

### Errors

- `400 VALIDATION_ERROR` — bad body (missing fields, bad `type`, malformed UUID).
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — wrong role for the requested `type`.
- `404 NOT_FOUND` — no patient with `patientId`.

---

## `GET /api/consultations/:id`

Fetch one consultation with author + patient summary. Writes an audit row
(`action=READ`).

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN, DOCTOR, RMO, RECEPTION, INFUSION_SPECIALIST, REHAB_SPECIALIST, AESTHETICS_SPECIALIST) |
| Method | `GET` |

### Response (200)

Full consultation row with `createdBy` (id, email, role, staff.fullName)
and `patient` summary (id, patientNumber, fullName, sex, dateOfBirth,
status, primaryDoctorId) embedded.

### Errors

- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role outside the view allow-list.
- `404 NOT_FOUND`.

---

## `PATCH /api/consultations/:id`

Partial save — the autosave endpoint. Any subset of `sections`, `status`,
`summary` is accepted. Records an UPDATE audit row with
`detail = { before, after, patch }`.

| Aspect | Value |
| --- | --- |
| Auth | required (same role rules as POST: by `type`) |
| Method | `PATCH` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Notes |
| --- | --- | --- |
| `sections` | object | Shallow-merged into the existing JSONB at the **top level**. `{ vitals: {} }` patches only `vitals`. Last-write-wins per section key. Deep-merge is deliberately not supported — clients can clear sub-fields by omitting them from the next save. |
| `status` | `DRAFT` / `RMO_DONE` / `IN_PROGRESS` / `SIGNED` | Must be a legal transition. See matrix below. |
| `summary` | string \| null | Overwrites the existing summary. `null` clears it. |

### Status transition matrix

| From          | Allowed `next`              |
| ------------- | --------------------------- |
| `DRAFT`       | `RMO_DONE`, `IN_PROGRESS`   |
| `RMO_DONE`    | `IN_PROGRESS`               |
| `IN_PROGRESS` | `SIGNED`                    |
| `SIGNED`      | — (terminal; row immutable) |

Any other transition returns `400 VALIDATION_ERROR`. The signing path
itself is owned by BE-15; BE-14 permits `IN_PROGRESS -> SIGNED` so the
state machine is complete but does not bake in the signature metadata.

### Response (200)

Returns the full updated consultation (same shape as GET).

### Errors

- `400 VALIDATION_ERROR` — bad body, illegal status transition, or PATCH against a `SIGNED` consultation.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role does not match the consultation's `type`.
- `404 NOT_FOUND`.

---

## Implementation notes

- **Validation** — Zod schemas in `lib/validation/consultation.ts`.
- **Business logic** — `lib/services/consultation.ts`. Routes are thin wrappers.
- **Sections merge** — implemented as a top-level shallow merge
  (`{ ...existing, ...patch }`). See `mergeSections()` in the service
  module and the autosave semantics paragraph in `docs/data-model.md`.
- **Audit logs** — every read and write produces an `AuditLog` row. The
  UPDATE detail records `{ before, after, patch }` so reviewers can
  reconstruct exactly what the client sent vs. what landed in the DB.
- **Immutability** — once a consultation is `SIGNED`, any PATCH returns
  400. The signing path itself is BE-15.
- **Concurrency** — the autosave pattern is debounced from the frontend;
  the backend does not currently use optimistic locking. Conflicting
  concurrent saves race on the JSONB column with last-write-wins.
