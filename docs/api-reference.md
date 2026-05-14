# Vyara API Reference — Sprint 1

> Audience: Vyara frontend developers (Urvi, Yasha, Dhanjay).
> Last updated: 2026-05-14 (Sprint 1 Day 2).
> Interactive Swagger UI: [/swagger](/swagger) (served from [`docs/openapi.yaml`](./openapi.yaml)).
> Status of each endpoint is marked: shipped ✅, in-flight 🚧, backlog 📋.
> Deep dives: [`api-patients.md`](./api-patients.md), [`api-consultations.md`](./api-consultations.md), [`auth.md`](./auth.md), [`api-conventions.md`](./api-conventions.md).

This is the one-stop entry point for integrating the Vyara backend from the
frontend. Every endpoint that has shipped to `main` as of Sprint 1 Day 2 is
listed here with request/response shapes, error semantics, and example calls.
For finer-grained design rationale, follow the deep-dive links above.

---

## Table of contents

1. [Quickstart for FE](#1-quickstart-for-fe)
2. [Conventions](#2-conventions)
3. [Endpoint reference](#3-endpoint-reference)
   - 3.1 [Health](#31-health)
   - 3.2 [Auth](#32-auth)
   - 3.3 [Patients](#33-patients)
   - 3.4 [Consultations](#34-consultations)
4. [FE-impact notes](#4-fe-impact-notes)
5. [Coming soon (Sprint 1 backlog)](#5-coming-soon-sprint-1-backlog)
6. [Open questions / gotchas](#6-open-questions--gotchas)

---

## 1. Quickstart for FE

### Base URL

| Environment | URL                                   |
| ----------- | ------------------------------------- |
| Local dev   | `http://localhost:3000`               |
| Dev EC2     | TBD (lands on Day 9 — INF-05 + INF-08) |
| Production  | TBD (Sprint 2)                        |

All examples below use `localhost:3000`.

### Smoke-test cURL

```bash
curl -s http://localhost:3000/api/health | jq
# -> { "data": { "status": "ok", "time": "...", "version": "0.1.0" } }
```

### Demo credentials (from `prisma/seed.ts`)

| Role    | Email                       | Password   | Notes                                  |
| ------- | --------------------------- | ---------- | -------------------------------------- |
| Doctor  | `dr.yuvraaj@example.com`    | `Demo@123` | The "main" demo doctor login.          |
| Patient | `priya.patient@example.com` | `Demo@123` | Has `PAT-100001` and historical data.  |

There are also seeded RMO, RECEPTION, and ADMIN logins — see
`prisma/seed.ts` for the full list. All seeded users share `Demo@123` until
patient-portal self-enrollment lands (BE-47).

### Logging in

NextAuth handles the cookie dance. The FE can drive it two ways:

1. **React helper (preferred for the login page).** Use
   `signIn("credentials", { email, password, redirect: false })` from
   `next-auth/react`. The cookie is set by the server; subsequent
   `fetch()` calls just include `credentials: "include"`.
2. **Direct POST.** `POST /api/auth/callback/credentials` with the form
   payload. NextAuth responds with a `Set-Cookie` for the session token
   (`next-auth.session-token` in dev, `__Secure-...` in prod). See
   [§3.2 Auth](#32-auth) for the wire shape.

After login, read the session at `GET /api/auth/session` to get
`{ user: { userId, email, role }, expires }`. The role drives the
post-login redirect (Doctor → `/doctor`, Patient → `/patient`, …).

---

## 2. Conventions

### 2.1 Auth model

- **Cookie-based sessions, signed JWT.** Strategy is `jwt`, TTL 12 hours
  (clinic-shift length). No DB lookup per request.
- **The cookie is `HttpOnly` and `SameSite=Lax`** — set by NextAuth. The
  FE never sees the token directly. Use `credentials: "include"` (or the
  `next-auth/react` helpers) on every authenticated request.
- **Roles** come from the Prisma `Role` enum:
  - `ADMIN`
  - `DOCTOR`
  - `RMO`
  - `RECEPTION`
  - `INFUSION_SPECIALIST`
  - `REHAB_SPECIALIST`
  - `AESTHETICS_SPECIALIST`
- Patient-portal logins are out of scope until BE-47; today's "patient"
  seed users sign in via the same credentials provider, just with no
  staff role assigned beyond what the seed sets.

### 2.2 Response envelope

Every success response carries a `data` key:

```jsonc
// 200 OK
{ "data": { "id": "cuid_…", "name": "Asha P." } }
```

List endpoints additionally carry `pagination` (see [§2.4](#24-pagination)):

```jsonc
// 200 OK, paginated
{
  "data": [ /* items */ ],
  "pagination": { "next": "<id>", "total": 137 }
}
```

`total` is optional and only present on cheap-to-count lists.

`201 Created` responses use the same `{ data }` envelope and set a
`Location` header pointing at the new resource:

```http
HTTP/1.1 201 Created
Location: /api/patients/<id>
Content-Type: application/json

{ "data": { "id": "<id>", … } }
```

`204 No Content` responses have an empty body. Used for successful
`DELETE` and for `PUT`/`PATCH` calls with nothing to return.

### 2.3 Error envelope

Errors always carry `error`, never `data`:

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

`details` is optional. The `message` is developer-facing — surface it in
logs, but write your own end-user copy on top.

#### Error codes table

| HTTP | `code`             | When it happens                                                        |
| ---- | ------------------ | ---------------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR` | Zod parse failed, illegal status transition, PATCH against SIGNED row. |
| 401  | `UNAUTHORIZED`     | No session cookie / expired session.                                   |
| 403  | `FORBIDDEN`        | Signed in but role not in the allow-list for this route.               |
| 404  | `NOT_FOUND`        | Resource id well-formed but no matching row.                           |
| 409  | `CONFLICT`         | Unique-constraint collision (rare, retry).                             |
| 429  | `RATE_LIMITED`     | Reserved — not emitted by any route yet (Sprint 2).                    |
| 500  | `INTERNAL_ERROR`   | Anything unhandled. Logged server-side with the request id.            |

Password-reset endpoints additionally return their own bland 400s
(`Invalid or expired code` / `Invalid or expired reset ticket`) — see
[§3.2](#32-auth) for the enumeration-resistance rationale.

### 2.4 Pagination

Cursor-based, opaque cursor, single page size.

**Canonical names (BE-12):** `limit`, `cursor`, response field
`nextCursor`.
**Legacy aliases (BE-07, still accepted):** `take`, `cursor`, response
field `pagination.next`.

The patient-list response carries **both** `nextCursor` and
`pagination.next` for backward compatibility. New FE code should read
`nextCursor`; both fields hold the same value (or `null` at the end).

Request:

```
GET /api/patients?q=jane&limit=20&cursor=<id-of-last-row>
```

- `limit` (alias `take`) defaults to **20**, max **100**. Out-of-range
  values clamp silently — they do not 400.
- `cursor` is the `id` of the last row from the previous page. Omit on
  the first request.

Response shape (mirror fields):

```jsonc
{
  "data": [ /* items */ ],
  "nextCursor": "<id-of-last-row>",
  "pagination": { "next": "<id-of-last-row>" }
}
```

When the caller has reached the end, both `nextCursor` and
`pagination.next` are `null`.

### 2.5 Encoding rules

| Type        | Wire format                                              |
| ----------- | -------------------------------------------------------- |
| Dates       | ISO 8601 in UTC, e.g. `2026-05-14T09:00:00.000Z`.        |
| `Date`-only | ISO 8601 date, e.g. `1985-04-12` (no time).              |
| UUIDs       | Lowercase, hyphenated, e.g. `8b3f1c2e-...`.              |
| Enums       | `SCREAMING_SNAKE` string literals (e.g. `ACTIVE`, `RMO`).|
| Booleans    | JSON `true` / `false`.                                   |
| Nulls       | JSON `null` (not omitted) when the field is "cleared".   |

### 2.6 Headers

| Header         | Direction | Notes                                                              |
| -------------- | --------- | ------------------------------------------------------------------ |
| `Content-Type` | request   | `application/json` on every body-carrying request.                 |
| `Cookie`       | request   | Carries the NextAuth session token. Set automatically by browsers. |
| `x-request-id` | response  | UUID v4 per request — log it; the server logs match the same id.   |
| `Location`     | response  | On `201 Created`, points at the new resource.                      |

### 2.7 Audit logging (silent)

Every read and write of PHI (Patient, Consultation) writes an `AuditLog`
row server-side: actor user id, action, entity, before/after diff.
The FE does **not** see this — but be aware that:

- Reads (`GET /api/patients/:id`, `GET /api/consultations/:id`) are
  logged, even if they fail silently in the audit table. The GET still
  returns 200.
- Writes are inside a `$transaction` with the audit row, so a partial
  failure rolls both back.

No FE action required; just don't be surprised if a row exists in
`audit_logs` for a "read-only" call.

### 2.8 Rate limits

| Endpoint                                | Limit                                | Behaviour on excess              |
| --------------------------------------- | ------------------------------------ | -------------------------------- |
| `POST /api/auth/password-reset/request` | 5 per user per rolling hour          | Silent drop, still returns 200.  |
| `POST /api/auth/password-reset/verify`  | 5 attempts per OTP row               | OTP row becomes permanently dead, returns 400 `Invalid or expired code`. |
| All others                              | None (Sprint 1).                     | —                                |

Per-IP edge rate-limiting is on the Sprint 2 hardening list.

---

## 3. Endpoint reference

Status legend: ✅ shipped to `main` · 🚧 in-flight · 📋 backlog.

### 3.1 Health

#### `GET /api/health` ✅

Liveness probe. Anonymous.

| Aspect  | Value                              |
| ------- | ---------------------------------- |
| Auth    | **Public** (no session required).  |
| Headers | None required.                     |
| Body    | None.                              |

**Response 200**

```json
{
  "data": {
    "status": "ok",
    "time": "2026-05-14T09:00:00.000Z",
    "version": "0.1.0"
  }
}
```

**Example**

```bash
curl -s http://localhost:3000/api/health
```

Notes: safe to poll from uptime monitors, the dev workflow, and the
nginx healthcheck (INF-05/INF-08). The `version` field is the
`package.json` version — handy for confirming what's deployed.

---

### 3.2 Auth

#### `POST /api/auth/callback/credentials` ✅

NextAuth credentials login. Sets the session cookie on success and
redirects per NextAuth's defaults. The FE typically calls this via
`signIn("credentials", ...)` from `next-auth/react` rather than
hand-rolling a fetch.

| Aspect       | Value                                |
| ------------ | ------------------------------------ |
| Auth         | **Public**.                          |
| Content-Type | `application/x-www-form-urlencoded` (when called directly). |
| Body         | `email`, `password`, `csrfToken`.    |

**Body fields**

| Field       | Type     | Required | Notes                                  |
| ----------- | -------- | -------- | -------------------------------------- |
| `email`     | string   | yes      | Trimmed + lowercased server-side.      |
| `password`  | string   | yes      | Plain text. Verified with bcrypt cost 12. |
| `csrfToken` | string   | yes      | Fetch from `GET /api/auth/csrf`. The `next-auth/react` helper handles this for you. |

**On success**

- `Set-Cookie: next-auth.session-token=<jwt>` (HttpOnly, SameSite=Lax,
  Secure in production). TTL 12h.
- NextAuth's default `200` JSON response: `{ "url": "<callback-url>" }`.

**On failure** (bad credentials, inactive user)

- NextAuth redirects to `/login?error=CredentialsSignin` (per the
  `pages.error` setting in `lib/auth.ts`). The `next-auth/react` helper
  surfaces this as `{ error: "CredentialsSignin", ok: false }`.

**Example (via the React helper)**

```ts
import { signIn } from "next-auth/react"

const res = await signIn("credentials", {
  email: "dr.yuvraaj@example.com",
  password: "Demo@123",
  redirect: false,
})
if (res?.ok) {
  // session cookie is set; read role and redirect
  const session = await fetch("/api/auth/session").then((r) => r.json())
  const role = session.user?.role  // "DOCTOR"
  router.push(role === "DOCTOR" ? "/doctor" : "/patient")
}
```

**Reading the session**

```bash
curl -s http://localhost:3000/api/auth/session \
  -H 'Cookie: next-auth.session-token=<jwt>'
```

```json
{
  "user": {
    "userId": "...uuid...",
    "email": "dr.yuvraaj@example.com",
    "role": "DOCTOR"
  },
  "expires": "2026-05-14T21:00:00.000Z"
}
```

**Sign out:** `POST /api/auth/signout` (CSRF-protected; use
`signOut()` from `next-auth/react`).

Notes:
- Inactive users (`isActive = false`) are rejected with the same
  `CredentialsSignin` error as bad passwords. No enumeration signal.
- A `LOGIN` audit row is written on successful sign-in (best-effort —
  failure to log does not fail the login).

---

#### `POST /api/auth/password-reset/request` ✅

Step 1 of the email-OTP reset flow. **Always returns 200** when the body
parses, regardless of whether the email matches a user — this is the
enumeration-resistance guarantee.

| Aspect       | Value                  |
| ------------ | ---------------------- |
| Auth         | **Public**.            |
| Content-Type | `application/json`.    |

**Body**

| Field   | Type   | Required | Notes                                 |
| ------- | ------ | -------- | ------------------------------------- |
| `email` | string | yes      | RFC 5322. Trimmed + lowercased. ≤254. |

**Response 200**

```json
{ "data": { "ok": true } }
```

**Errors**

- `400 VALIDATION_ERROR` — body fails Zod (malformed JSON, missing
  email, malformed email).

**Example**

```bash
curl -s -X POST http://localhost:3000/api/auth/password-reset/request \
  -H 'Content-Type: application/json' \
  -d '{"email":"dr.yuvraaj@example.com"}'
```

Notes:
- If the email maps to an active user, a 6-digit OTP is generated,
  bcrypt-hashed, stored with a 15-minute TTL, and emailed via Resend
  (or logged to stdout when `RESEND_API_KEY` is unset in dev).
- Rate-limit: 5 OTPs per user per rolling hour. Excess requests are
  silently dropped — the caller still sees 200.
- The FE must never branch on "user exists" inferred from this
  response. Always show the same confirmation UI.

---

#### `POST /api/auth/password-reset/verify` ✅

Step 2: exchange the 6-digit OTP for a short-lived reset ticket (JWT,
5-minute TTL) used to call `confirm`.

| Aspect       | Value                  |
| ------------ | ---------------------- |
| Auth         | **Public**.            |
| Content-Type | `application/json`.    |

**Body**

| Field   | Type   | Required | Notes                                 |
| ------- | ------ | -------- | ------------------------------------- |
| `email` | string | yes      | Same normalisation as `request`.      |
| `otp`   | string | yes      | Exactly 6 digits (leading zeros ok).  |

**Response 200**

```json
{ "data": { "ticket": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." } }
```

The ticket is opaque to the FE — pass it back to `confirm` verbatim.

**Errors**

- `400 VALIDATION_ERROR` — body fails Zod (missing fields, OTP not 6
  digits).
- `400 VALIDATION_ERROR` with message `Invalid or expired code` — bad
  OTP, expired OTP, no OTP issued, or attempts exhausted. All four
  failure modes return the same shape on purpose; do not try to
  distinguish.

**Example**

```bash
curl -s -X POST http://localhost:3000/api/auth/password-reset/verify \
  -H 'Content-Type: application/json' \
  -d '{"email":"dr.yuvraaj@example.com","otp":"123456"}'
```

Notes:
- 5 verify attempts per OTP row. Once exhausted, the row is dead even
  for the correct code — the user must re-request.
- On success the OTP row is burned (`usedAt = now()`).

---

#### `POST /api/auth/password-reset/confirm` ✅

Step 3 (final): set a new password using the ticket from `verify`.

| Aspect       | Value                  |
| ------------ | ---------------------- |
| Auth         | **Public**.            |
| Content-Type | `application/json`.    |

**Body**

| Field         | Type   | Required | Notes                                 |
| ------------- | ------ | -------- | ------------------------------------- |
| `ticket`      | string | yes      | The JWT from `verify`. ≥1 char.        |
| `newPassword` | string | yes      | 8..128 chars. (Upper bound prevents bcrypt 72-byte truncation surprises.) |

**Response 200**

```json
{ "data": { "ok": true } }
```

**Errors**

- `400 VALIDATION_ERROR` — body fails Zod (missing ticket, password too
  short / too long).
- `400 VALIDATION_ERROR` with message `Invalid or expired reset ticket` —
  ticket signature invalid, expired, wrong scope, or its OTP row has
  been replayed.

**Example**

```bash
curl -s -X POST http://localhost:3000/api/auth/password-reset/confirm \
  -H 'Content-Type: application/json' \
  -d '{"ticket":"<from-verify>","newPassword":"new-pass-1234"}'
```

Notes:
- On success the user's `passwordHash` is updated, any other
  outstanding OTPs for them are invalidated, and a
  `password-reset.confirmed` audit row is written, all atomically.
- The ticket is single-use — replaying it returns the bland 400.

---

### 3.3 Patients

> Deep dive: [`api-patients.md`](./api-patients.md).

All patient endpoints require an authenticated session (any role).
Role-based view restrictions land later in the sprint (BE-15+).

#### `GET /api/patients` ✅

List, search, filter, and paginate patients.

| Aspect | Value      |
| ------ | ---------- |
| Auth   | **Required** (any role). |
| Body   | None.      |

**Query parameters**

The short-form names (`q`, `doctorId`, `limit`) are canonical; the
legacy `search` / `primaryDoctorId` / `take` aliases continue to work
for backwards compatibility. The short form wins if both are supplied.

| Name                                   | Type                                  | Notes |
| -------------------------------------- | ------------------------------------- | ----- |
| `q` *(alias `search`)*                 | string ≤200                           | Case-insensitive substring match across `fullName`, `email`, `phone`, `patientNumber`. |
| `status`                               | enum or comma-separated list of enums | `ACTIVE` / `INACTIVE` / `ARCHIVED`. When omitted, `ARCHIVED` rows are hidden. Example: `status=ACTIVE,INACTIVE`. |
| `doctorId` *(alias `primaryDoctorId`)* | UUID                                  | Filter to patients with this assigned primary doctor. |
| `cursor`                               | string                                | Keyset cursor — `id` of the last row from the previous page. Omit for page 1. |
| `limit` *(alias `take`)*               | integer 1..100, default 20            | Out-of-range values clamp silently. |

**Response 200**

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
      "userId": null,
      "occupation": null,
      "placeOfResidence": null,
      "address": null,
      "referralSource": null,
      "deletedAt": null,
      "createdAt": "2026-05-13T10:00:00.000Z",
      "updatedAt": "2026-05-13T10:00:00.000Z"
    }
  ],
  "nextCursor": "f5b5...",
  "pagination": { "next": "f5b5..." }
}
```

Ordering: `createdAt DESC, id DESC` (stable, safe for keyset pagination).

**Errors**

- `400 VALIDATION_ERROR` — bad query string (malformed UUID, unknown
  status token, limit not an integer).
- `401 UNAUTHORIZED`.

**Example**

```bash
curl -s 'http://localhost:3000/api/patients?q=jane&status=ACTIVE,INACTIVE&limit=20' \
  -H 'Cookie: next-auth.session-token=<jwt>'
```

Notes:
- Response carries both `nextCursor` (BE-12 canonical) and
  `pagination.next` (legacy). New code should read `nextCursor`.
- `total` is not currently included — Patient counts are cheap but
  this lets us scale to millions without changing the contract.

---

#### `POST /api/patients` ✅

Create a new patient. The server assigns `patientNumber` (`PAT-NNNNNN`).

| Aspect       | Value                |
| ------------ | -------------------- |
| Auth         | **Required**.        |
| Content-Type | `application/json`.  |

**Body**

| Field             | Type                                        | Required | Notes |
| ----------------- | ------------------------------------------- | -------- | ----- |
| `fullName`        | string 1..200                               | yes      | Trimmed. |
| `email`           | string ≤254                                 | no       | RFC 5322. Lowercased server-side. Empty string treated as absent. |
| `phone`           | string ≤50                                  | no       |       |
| `dateOfBirth`     | ISO 8601 date string                        | no       | Parsed to `Date`. |
| `sex`             | `MALE` / `FEMALE` / `OTHER` / `UNDISCLOSED` | no       |       |
| `occupation`      | string ≤200                                 | no       |       |
| `placeOfResidence`| string ≤200                                 | no       |       |
| `address`         | string ≤500                                 | no       |       |
| `referralSource`  | string ≤200                                 | no       |       |
| `primaryDoctorId` | UUID                                        | no       | Must reference an existing Staff with `role=DOCTOR` (FK). |

**Response 201**

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

**Errors**

- `400 VALIDATION_ERROR` — bad body.
- `401 UNAUTHORIZED`.
- `409 CONFLICT` — unique-constraint collision on `patientNumber`. Rare
  race; retry the POST.

**Example**

```bash
curl -s -X POST http://localhost:3000/api/patients \
  -H 'Cookie: next-auth.session-token=<jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Jane Doe","email":"jane@example.com","sex":"FEMALE"}'
```

Notes:
- `patientNumber` is currently `MAX(patient_number) + 1` — it races
  under concurrent inserts but the unique index catches collisions.
  The 409 on collision is FE-recoverable: retry once.

---

#### `GET /api/patients/:id` ✅

Fetch one patient. Writes a `READ` audit row.

| Aspect | Value         |
| ------ | ------------- |
| Auth   | **Required**. |

**Response 200**

```json
{ "data": { "id": "...", "patientNumber": "PAT-000042", "fullName": "...", "status": "ACTIVE", "...": "..." } }
```

Full Patient shape (same as the items in `GET /api/patients`).

**Errors**

- `401 UNAUTHORIZED`.
- `404 NOT_FOUND` — no patient with that id.

**Example**

```bash
curl -s http://localhost:3000/api/patients/<uuid> \
  -H 'Cookie: next-auth.session-token=<jwt>'
```

---

#### `PATCH /api/patients/:id` ✅

Partial update. Any subset of the create body plus `status`.

| Aspect       | Value                |
| ------------ | -------------------- |
| Auth         | **Required**.        |
| Content-Type | `application/json`.  |

**Body**

All fields from `POST /api/patients` plus:

| Field    | Type                                | Notes |
| -------- | ----------------------------------- | ----- |
| `status` | `ACTIVE` / `INACTIVE` / `ARCHIVED`  | Lets admins toggle without going through soft-delete. |

Sending `{}` is a no-op (an audit row still gets written, but the diff
is empty).

**Response 200**

```json
{ "data": { "id": "...", "fullName": "Jane R. Doe", "...": "..." } }
```

**Errors**

- `400 VALIDATION_ERROR`.
- `401 UNAUTHORIZED`.
- `404 NOT_FOUND`.

**Example**

```bash
curl -s -X PATCH http://localhost:3000/api/patients/<uuid> \
  -H 'Cookie: next-auth.session-token=<jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+1-555-0199"}'
```

Notes: setting `primaryDoctorId: null` disconnects the doctor relation.

---

#### `DELETE /api/patients/:id` ✅

Soft delete — sets `status = ARCHIVED` and `deletedAt = now()`. The row
stays in the table so historical consultations and the audit trail
remain referentially intact.

| Aspect | Value         |
| ------ | ------------- |
| Auth   | **Required**. |

**Response**

`204 No Content` (empty body).

**Errors**

- `401 UNAUTHORIZED`.
- `404 NOT_FOUND`.

**Example**

```bash
curl -s -X DELETE http://localhost:3000/api/patients/<uuid> \
  -H 'Cookie: next-auth.session-token=<jwt>'
```

Notes: archived patients are hidden from the default `GET /api/patients`
list. Pass `status=ARCHIVED` explicitly to see them.

---

### 3.4 Consultations

> Deep dive: [`api-consultations.md`](./api-consultations.md).

A consultation is a clinical encounter — RMO intake or senior doctor's
"main" pass — represented as a single row with a `type` discriminator
and a `sections` JSONB blob carrying the form payload. The autosave
endpoint on the consultation form is `PATCH /api/consultations/:id`.

#### Role rules at a glance

| Action                                   | Allowed roles                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Create / modify a `RMO` consultation     | `ADMIN`, `RMO`, `DOCTOR`                                                      |
| Create / modify a `MAIN` consultation    | `ADMIN`, `DOCTOR`                                                             |
| View (`GET`) any consultation            | `ADMIN`, `DOCTOR`, `RMO`, `RECEPTION`, `INFUSION_SPECIALIST`, `REHAB_SPECIALIST`, `AESTHETICS_SPECIALIST` |

Wrong role → `403 FORBIDDEN`.

#### Status transition matrix

| From          | Allowed `next`              | Notes                                       |
| ------------- | --------------------------- | ------------------------------------------- |
| `DRAFT`       | `RMO_DONE`, `IN_PROGRESS`   | RMO finishing intake / doctor picking up.   |
| `RMO_DONE`    | `IN_PROGRESS`               | Doctor starting the main consultation.      |
| `IN_PROGRESS` | `SIGNED`                    | Sign-off (BE-15 owns the signing path).     |
| `SIGNED`      | — (terminal)                | Row is immutable from this API.             |

Any other transition → `400 VALIDATION_ERROR` with message
`Illegal status transition: <from> -> <to>`. PATCH against a `SIGNED`
row → `400 VALIDATION_ERROR` with message `Consultation is SIGNED and
cannot be modified`.

#### Sections shape

`sections` is JSONB; top-level keys differ by `type`:

- **`RMO`**: `informant`, `demographics`, `medicalHistory`,
  `socialHistory`, `personalHistory`, `examinationSummary`.
- **`MAIN`**: `chiefComplaint`, `hpi`, `assessment`, `diagnosis`, `plan`.

The server only validates that `sections` is a JSON object at the top
level — sub-field shapes are deliberately FE-owned until they
stabilise. Don't expect 400s for missing or extra sub-fields today.

**Shallow merge on PATCH.** When a PATCH sends `sections`, it is merged
into the existing JSONB **at the top level only** — `{...existing,
...patch}`. Sending `{ sections: { vitals: ... } }` overwrites only
`vitals` and leaves the other keys alone. To clear a sub-field, omit
it from the next save; deep-merge is deliberately not supported.

---

#### `POST /api/consultations` ✅

Create a new `DRAFT` consultation linked to a patient + author.

| Aspect       | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Auth         | **Required** (role gate by `type` — see above).            |
| Content-Type | `application/json`.                                        |

**Body**

| Field       | Type             | Required | Notes |
| ----------- | ---------------- | -------- | ----- |
| `patientId` | UUID             | yes      | Must reference an existing Patient. |
| `type`      | `RMO` or `MAIN`  | yes      | Discriminator; gates the author-role check. |
| `sections`  | object           | no       | Initial blob. Most callers POST `{}` and fill via PATCH. |
| `summary`   | string ≤2000     | no       | Optional one-liner for the patient timeline. |

**Response 201**

`Location: /api/consultations/<id>`

```json
{
  "data": {
    "id": "...",
    "patientId": "...",
    "type": "RMO",
    "status": "DRAFT",
    "sections": {},
    "summary": null,
    "createdById": "...",
    "signedById": null,
    "signedAt": null,
    "createdAt": "...",
    "updatedAt": "...",
    "createdBy": {
      "id": "...",
      "email": "rmo@example.com",
      "role": "RMO",
      "staff": { "fullName": "Asha N." }
    },
    "patient": {
      "id": "...",
      "patientNumber": "PAT-000042",
      "fullName": "Jane Doe",
      "sex": "FEMALE",
      "dateOfBirth": "1985-04-12",
      "status": "ACTIVE",
      "primaryDoctorId": "..."
    }
  }
}
```

**Errors**

- `400 VALIDATION_ERROR` — bad body (missing fields, bad `type`,
  malformed UUID).
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role not allowed for the requested `type`.
- `404 NOT_FOUND` — no patient with `patientId`.

**Example**

```bash
curl -s -X POST http://localhost:3000/api/consultations \
  -H 'Cookie: next-auth.session-token=<jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"patientId":"<patient-uuid>","type":"RMO","sections":{}}'
```

---

#### `GET /api/consultations/:id` ✅

Fetch one consultation with author + patient summary embedded.
Writes a `READ` audit row.

| Aspect | Value                                              |
| ------ | -------------------------------------------------- |
| Auth   | **Required** (any of the seven view-allowed roles).|

**Response 200**

Same shape as `POST` response above (full Consultation row plus
embedded `createdBy` and `patient`).

**Errors**

- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role outside the view allow-list.
- `404 NOT_FOUND`.

**Example**

```bash
curl -s http://localhost:3000/api/consultations/<uuid> \
  -H 'Cookie: next-auth.session-token=<jwt>'
```

---

#### `PATCH /api/consultations/:id` ✅

Partial save — the **autosave endpoint** for the consultation form.

| Aspect       | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Auth         | **Required** (same role rules as POST, gated by `type`).   |
| Content-Type | `application/json`.                                        |

**Body** (every field is optional)

| Field      | Type                                                            | Notes |
| ---------- | --------------------------------------------------------------- | ----- |
| `sections` | object                                                          | Shallow-merged into the existing JSONB at the **top level**. See above. |
| `status`   | `DRAFT` / `RMO_DONE` / `IN_PROGRESS` / `SIGNED`                 | Must be a legal transition from the current `status`. |
| `summary`  | string ≤2000 \| `null`                                          | Overwrites verbatim. `null` clears it. |

**Response 200**

Full updated consultation (same shape as GET).

**Errors**

- `400 VALIDATION_ERROR` — bad body, illegal status transition, or
  PATCH against a SIGNED consultation.
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — role does not match the consultation's `type`.
- `404 NOT_FOUND`.

**Example — autosave the `vitals` section**

```bash
curl -s -X PATCH http://localhost:3000/api/consultations/<uuid> \
  -H 'Cookie: next-auth.session-token=<jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"sections":{"vitals":{"bp":"120/80","pulse":72}}}'
```

**Example — RMO handoff**

```bash
curl -s -X PATCH http://localhost:3000/api/consultations/<uuid> \
  -H 'Cookie: next-auth.session-token=<jwt>' \
  -H 'Content-Type: application/json' \
  -d '{"status":"RMO_DONE"}'
```

Notes:
- **Concurrency**: autosaves race on the JSONB column with
  last-write-wins. Debounce on the FE (see [§4](#4-fe-impact-notes)).
- A `SIGNED` consultation rejects every PATCH including no-op `{}`.
- The audit row records `{ before, after, patch }` — what the client
  sent vs. what landed in the DB.

---

## 4. FE-impact notes

### Mapping to Sprint 1 FE tasks

| FE task                                             | Endpoints                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **FE-01** Auth/login + role-based redirect (Urvi)   | `POST /api/auth/callback/credentials`, `GET /api/auth/session`, all three `/password-reset/*`, `POST /api/auth/signout`. |
| **FE-02** Doctor dashboard layout + nav (Urvi)      | `GET /api/auth/session` (read role). Appointment list lands on BE-21/23.                    |
| **FE-03** Patient list with search (Urvi)           | `GET /api/patients` (use `q`, `status`, `limit`, `cursor`).                                 |
| **FE-04** Patient detail + consultation form (Urvi) | `GET /api/patients/:id`, `POST /api/consultations`, `GET /api/consultations/:id`, `PATCH /api/consultations/:id`. |
| **FE-05** Lab result upload + view (Urvi/Dhanjay)   | Pending BE-16 + BE-19. Watch the [coming-soon table](#5-coming-soon-sprint-1-backlog).      |
| **FE-06** Patient registration page (Yasha)         | `POST /api/patients`. Patient-portal self-enroll lands later (BE-47).                       |
| **FE-07** Patient dashboard + appointment view (Yasha) | Pending BE-21. Use `GET /api/auth/session` + `GET /api/patients/:id` for now.            |
| **FE-08** Appointment booking flow (Yasha)          | Pending BE-23.                                                                              |
| **FE-09** Treatment plan view (Yasha/Dhanjay)       | Pending BE-24.                                                                              |
| **FE-10** Invoice + receipt screen (Dhanjay)        | Pending BE-37.                                                                              |

Cross-reference: [`sprint-1-mvp.md`](./sprint-1-mvp.md) for the full
sprint plan and day-by-day timeline.

### Debounce recommendations

| Surface                                        | Action                                          | Recommended debounce |
| ---------------------------------------------- | ----------------------------------------------- | -------------------- |
| FE-03 search input → `GET /api/patients?q=…`   | One request per keystroke is wasteful.          | **300 ms**.          |
| FE-04 consultation form → `PATCH /api/consultations/:id` | Server does last-write-wins per section.| **750 ms**.          |

### Field-clearing semantics

- `PATCH /api/patients/:id` — to clear an optional field, omit it from
  the body. Sending `null` is **not** currently accepted on patient
  fields (Zod rejects).
- `PATCH /api/consultations/:id` — `summary: null` is accepted and
  clears the field. `sections` clears at the sub-field level by
  omission from the next save (shallow merge).

### Working with the role enum

The seven roles in `Role` map to two FE portals (Sprint 1):

- **Doctor portal** (Urvi's lane): `ADMIN`, `DOCTOR`, `RMO`,
  `RECEPTION`, `INFUSION_SPECIALIST`, `REHAB_SPECIALIST`,
  `AESTHETICS_SPECIALIST`.
- **Patient portal** (Yasha's lane): currently driven by the seeded
  patient user (no role field of its own — patient-portal auth is
  BE-47).

Read `session.user.role` after login and branch the post-login
redirect on it.

---

## 5. Coming soon (Sprint 1 backlog)

These are not yet shipped to `main` — track [`sprint-1-mvp.md`](./sprint-1-mvp.md).

| Status | ID         | Endpoint(s)                                              | Day | FE tasks blocked      |
| ------ | ---------- | -------------------------------------------------------- | --- | --------------------- |
| 📋     | BE-15      | Consultation signing (`IN_PROGRESS -> SIGNED` write path)| 3   | FE-04 final state.    |
| 📋     | BE-16      | LabResult model + API                                    | 4–5 | FE-05.                |
| 📋     | BE-19      | File upload via S3 presigned URL                         | 5   | FE-05.                |
| 📋     | BE-21      | Appointment model + slots                                | 6   | FE-07, FE-08.         |
| 📋     | BE-23      | Appointment booking endpoint                             | 7   | FE-08.                |
| 📋     | BE-24      | TreatmentPlan model + API                                | 8   | FE-09.                |
| 📋     | BE-26      | InfusionLog (integrative-medicine specific)              | 9   | FE-09 (history view). |
| 📋     | BE-37      | Invoice + Razorpay-mock checkout                         | 11  | FE-10.                |

When these ship, this reference will be updated. Until then, stub the
FE call sites against the expected shape (the deep-dive docs will land
alongside each merge).

---

## 6. Open questions / gotchas

- **`userId` on Patient is nullable.** It stays `null` until that
  patient self-enrolls for the patient portal (BE-47). Clinic-created
  patients won't have a User row. The FE should not assume `patient.userId`
  is present.
- **`RESET_TICKET_SECRET` falls back to `NEXTAUTH_SECRET`.** Acceptable
  in dev; in production these MUST be distinct env values so a leaked
  reset ticket cannot impersonate session JWTs (and vice versa). Filed
  as a Sprint 2 hardening item.
- **Consultation `sections` is not server-validated below the top
  level.** The FE owns the section payload shapes until a later BE
  task closes that gap. Send sane shapes; the API will accept them.
- **Email sender is console-only in dev.** `lib/email.ts` logs
  payloads to stdout unless `RESEND_API_KEY` is set. Useful for FE
  testing of the password-reset flow without a real inbox — tail the
  server logs to read the OTP.
- **`patientNumber` race.** `POST /api/patients` uses `MAX+1` and can
  409 under concurrent inserts. Retry once. BE-09 swaps this for a
  Postgres sequence; that work is queued.
- **Per-IP rate limits absent.** The 5/hour reset cap is per-user,
  counted in the DB. A per-IP cap at the edge is on the Sprint 2 list;
  in the meantime, expect aggressive scripts to still be slow but not
  fully blocked.
- **`429 RATE_LIMITED` is reserved but unused.** No production endpoint
  emits it today; the password-reset routes intentionally do not
  surface their rate-limit state (enumeration resistance). Do not
  build retry logic around it yet.

---

*Questions, gaps, or wire shapes that don't match what the FE sees?
File an issue in the Sprint 1 thread on the team channel, or page the
PM Agent (cron `vyara-pm-review-0730`).*
