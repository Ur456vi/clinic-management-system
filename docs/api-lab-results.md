# Lab Result API

CRUD for the `LabResult` model (BE-16). One row per lab panel (CBC, LFT,
Vit D, etc.); per-analyte rows live in the `analytes` JSONB array. The
attachment fields (`attachmentKey`, `attachmentMime`) are populated by the
S3 presigned-upload flow shipped in BE-19 — until that lands the row exists
without an attachment and the `analytes` array is the source of truth.

All routes live under `/api/lab-results` and follow the BE-07 conventions:
`{ data }` / `{ error }` envelopes, `x-request-id` response header,
audit-log writes for every read/write of PHI.

Every endpoint requires an authenticated session (NextAuth JWT).
Unauthenticated calls return:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

(HTTP 401)

---

## Analyte shape

Each entry in `analytes` is shaped:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string (1..200) | yes | Analyte label, e.g. `"Hemoglobin"`. |
| `value` | string OR number | yes | Numeric labs send a number; categorical labs (e.g. `"POSITIVE"`) send a string. |
| `unit` | string (<=50) | no | E.g. `"g/dL"`, `"mg/dL"`. |
| `refLow` | number | no | Inclusive lower bound of the reference range. |
| `refHigh` | number | no | Inclusive upper bound of the reference range. |
| `flag` | `LOW` / `HIGH` / `CRITICAL_LOW` / `CRITICAL_HIGH` / `NORMAL` / `ABNORMAL` | no | Computed server-side when the caller omits it (see below). |

### Server-side flag computation

For each analyte where the caller does NOT supply `flag` AND the value is
numeric AND both `refLow` / `refHigh` are present, the service sets:

| Condition | `flag` |
| --- | --- |
| `value < refLow` | `LOW` |
| `value > refHigh` | `HIGH` |
| otherwise | `NORMAL` |

`CRITICAL_LOW` / `CRITICAL_HIGH` are never auto-emitted in BE-16 — they are
preserved verbatim if the caller (or the lab) sends them. Non-numeric
analytes with no explicit `flag` pass through unflagged.

---

## `GET /api/lab-results`

List lab results for a patient or a single consultation. Either
`patientId` or `consultationId` is required — calls with neither return
400.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |
| Body | none |

### Query parameters

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `patientId` | uuid | one of patientId / consultationId | Filter to a patient. |
| `consultationId` | uuid | one of patientId / consultationId | Filter to a consultation. |
| `cursor` | string | no | Keyset cursor — the `id` of the last row from the previous page. Omit for page 1. |
| `limit` | integer | no | Page size, default **20**, max **100**. Out-of-range values clamp. |

#### Example request

```
GET /api/lab-results?patientId=f5b5...&limit=20
```

### Response (200)

```json
{
  "data": [
    {
      "id": "9c1a...",
      "patientId": "f5b5...",
      "consultationId": null,
      "panelName": "CBC",
      "collectedAt": "2026-05-14T08:00:00.000Z",
      "reportedAt":  "2026-05-15T11:30:00.000Z",
      "orderingDoctorId": "8b3f...",
      "labName": "Metropolis",
      "analytes": [
        { "name": "Hemoglobin", "value": 13.4, "unit": "g/dL",
          "refLow": 12.0, "refHigh": 16.0, "flag": "NORMAL" }
      ],
      "summary": "Within range",
      "attachmentKey":  null,
      "attachmentMime": null,
      "createdAt": "2026-05-15T11:31:02.140Z",
      "updatedAt": "2026-05-15T11:31:02.140Z",
      "patient": { "id": "f5b5...", "patientNumber": "PAT-000042", "fullName": "Jane Doe" },
      "orderingDoctor": { "id": "8b3f...", "fullName": "Dr. Yuvraaj" }
    }
  ],
  "nextCursor": null,
  "pagination": { "next": null }
}
```

Ordering: `collectedAt DESC, id DESC` (stable tiebreaker, safe for keyset
pagination).

### Errors

- `400 VALIDATION_ERROR` — neither `patientId` nor `consultationId`; bad UUID; bad cursor; limit out of range.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role outside the read allow-list.

---

## `POST /api/lab-results`

Create a new lab result. Roles allowed: `ADMIN`, `DOCTOR`, `RMO`.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN / DOCTOR / RMO) |
| Method | `POST` |
| Content-Type | `application/json` |

### Request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `patientId` | uuid | yes | Must reference an existing Patient. |
| `consultationId` | uuid | no | Must reference an existing Consultation that belongs to `patientId`. |
| `panelName` | string (1..200) | yes | E.g. `"CBC"`, `"LFT"`, `"Vit D"`. |
| `collectedAt` | ISO 8601 date-time | yes | When the sample was drawn. |
| `reportedAt` | ISO 8601 date-time | no | When the lab issued the report. |
| `orderingDoctorId` | uuid | no | Staff id of the ordering doctor. |
| `labName` | string (<=200) | no | Free-form lab/facility name. |
| `analytes` | Analyte[] | no | Defaults to `[]`. See "Analyte shape". |
| `summary` | string (<=2000) | no | One-liner for the patient timeline. |
| `attachmentKey` | string (<=1024) | no | S3 object key (populated by BE-19). |
| `attachmentMime` | string (<=200) | no | Attachment content-type. |

### Response (201)

`Location: /api/lab-results/<id>`

```json
{ "data": { "id": "...", "patientId": "...", "panelName": "CBC", "analytes": [...], ... } }
```

### Errors

- `400 VALIDATION_ERROR` — bad body.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — wrong role, or `consultationId` belongs to a different patient.
- `404 NOT_FOUND` — `patientId` or `consultationId` does not exist.

---

## `GET /api/lab-results/:id`

Fetch one lab result with patient + ordering-doctor summary embedded.
Writes a READ audit row.

| Aspect | Value |
| --- | --- |
| Auth | required (any clinic role) |
| Method | `GET` |

### Response (200)

```json
{ "data": { "id": "...", "panelName": "CBC", "analytes": [...], "patient": {...}, "orderingDoctor": {...} } }
```

### Errors

- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role outside the read allow-list.
- `404 NOT_FOUND`.

---

## `PATCH /api/lab-results/:id`

Partial update. Roles allowed: `ADMIN`, `DOCTOR`, `RMO`. Records an
UPDATE audit row with `{ before, after, patch }`.

| Aspect | Value |
| --- | --- |
| Auth | required (ADMIN / DOCTOR / RMO) |
| Method | `PATCH` |
| Content-Type | `application/json` |

### Request body

Any subset of the create body. Nullable fields accept `null` to clear:
`consultationId`, `reportedAt`, `orderingDoctorId`, `labName`, `summary`,
`attachmentKey`, `attachmentMime`.

`analytes` (when present) **replaces** the existing array verbatim — the
service runs the flag-computation helper across the new array before
storing it. There is no merge semantics; clients re-post the full panel.

### Response (200)

```json
{ "data": { "id": "...", "panelName": "CBC", "analytes": [...], ... } }
```

### Errors

- `400 VALIDATION_ERROR`.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — wrong role, or `consultationId` belongs to a different patient.
- `404 NOT_FOUND`.

---

## Attachment endpoints

Three routes rooted at `/api/lab-results/:id/attachment` (BE-20) link an
already-uploaded S3 object — uploaded via the BE-19 presigned-PUT flow at
`POST /api/files/upload-url` — to a `LabResult` row, and mint short-lived
presigned download URLs for it.

The lab attachment is stored on the row itself as
`attachmentKey` (S3 object key), `attachmentMime`, and
`attachmentUploadedAt`. The actual PDF/image lives in the `phi` bucket;
this server never sees the bytes.

### `PUT /api/lab-results/:id/attachment`

Attach an uploaded object to the lab result. The S3 PUT must already have
completed against the URL returned by `POST /api/files/upload-url`; this
endpoint just persists the `key` plus optional metadata.

**Auth**: `ADMIN`, `DOCTOR`, `RMO` (WRITE_ROLES).

#### Request body

```json
{
  "key": "phi/2026/05/abc123.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 184320
}
```

| Field         | Type    | Required | Notes                                     |
| ------------- | ------- | -------- | ----------------------------------------- |
| `key`         | string  | yes      | S3 object key returned by the upload-URL route. |
| `contentType` | string  | no       | When provided, stored as `attachmentMime`. |
| `sizeBytes`   | integer | no       | Recorded on the audit row; not persisted on the LabResult. |

#### Response (200)

The updated lab result, in the same shape as `GET /api/lab-results/:id`.

#### Errors

- `400 VALIDATION_ERROR` — missing/invalid `key`.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — caller's role is not in WRITE_ROLES.
- `404 NOT_FOUND` — lab result does not exist.

#### Audit

One `AuditLog` row with `action=UPDATE`, `entityType=LabResult`,
`entityId=<id>`, and `detail.attachment.{before,after,sizeBytes}`.

### `DELETE /api/lab-results/:id/attachment`

Detach the current attachment by clearing `attachmentKey`,
`attachmentMime`, and `attachmentUploadedAt`. **Does not delete the
underlying S3 object** — that is the responsibility of a Sprint-2
cleanup job, so detach is idempotent and safe to retry.

**Auth**: `ADMIN`, `DOCTOR`, `RMO` (WRITE_ROLES).

#### Response

`204 No Content`.

#### Errors

- `401 UNAUTHORIZED`.
- `403 FORBIDDEN`.
- `404 NOT_FOUND` — lab result does not exist.

#### Audit

One `AuditLog` row with `action=UPDATE` and a `detail.attachment.before`
snapshot.

### `GET /api/lab-results/:id/attachment`

Mint a short-lived presigned GET URL for the current attachment.
Returns `404` when the row exists but has no attachment.

**Auth**: every authenticated clinic role (READ_ROLES).

#### Response (200)

```json
{
  "data": {
    "downloadUrl": "https://...signed-get-url...",
    "expiresInSeconds": 300,
    "attachmentKey": "phi/2026/05/abc123.pdf",
    "attachmentUploadedAt": "2026-05-18T08:24:11.000Z"
  }
}
```

The URL is `Content-Disposition: attachment` so browsers open the
download dialog rather than inlining the PDF.

#### Errors

- `401 UNAUTHORIZED`.
- `403 FORBIDDEN`.
- `404 NOT_FOUND` — either the lab result does not exist, or it has no
  attachment set.

#### Audit

One `AuditLog` row with `action=READ`, `entityType=LabResult`,
`entityId=<id>`, and `detail.attachment.{key,ttlSec}`.
