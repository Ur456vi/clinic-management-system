# Patient Self-Read API (`/api/patient/me/*`)

BE-50. Auth-scoped read endpoints that surface a patient's own data
through the unified portal (BE-47). All endpoints in this namespace:

- Require an authenticated session (401 otherwise).
- Require `session.role === PATIENT` (403 otherwise).
- Resolve the target `Patient` row via `Patient.userId == session.userId`.
  A PATIENT login without a linked Patient gets a 403 with a clear
  message rather than an empty response.
- Hard-pin all queries to the resolved `patientId`. Query-string
  `patientId` overrides are intentionally ignored.
- Write a READ row to `AuditLog` (entityType = the resource, entityId =
  the patient's id, `detail.scope = "self.<resource>"`).

All list endpoints share the BE-12 cursor pagination contract:

```
?cursor=<id>&limit=<1..100>
```

Responses always carry both `nextCursor` (BE-12) and
`pagination.next` (BE-07) so portal clients on either contract work.

## Endpoints

### GET `/api/patient/me`

Patient's own profile.

```json
{
  "data": {
    "id": "…",
    "patientNumber": "PAT-000123",
    "fullName": "Asha Patel",
    "email": "asha@example.com",
    "phone": "+91…",
    "status": "ACTIVE",
    "primaryDoctor": { "id": "…", "fullName": "Dr. Mehta" }
  }
}
```

### GET `/api/patient/me/appointments`

Patient's appointments, soonest-first. Includes assigned staff +
department summary.

### GET `/api/patient/me/treatment-plans`

Patient's plans, newest-first. **DRAFT plans are hidden** — patients
only see `SIGNED` and `REVOKED` plans. Includes plan items + the
clinician who created / signed the plan.

### GET `/api/patient/me/lab-results`

Patient's lab results, newest collection date first. Only rows with
`reportedAt` set are returned (no status enum on `LabResult`; the
presence of a `reportedAt` timestamp is the "finalized" signal —
see `prisma/schema.prisma` BE-16 comment).

### GET `/api/patient/me/invoices`

Patient's invoices, newest-first. Includes line items + payments so
the portal billing view renders in a single round-trip. Payment
status is the standard `InvoiceStatus` enum plus the `payments[]`
array.

## Error envelope

All errors use the standard envelope (`docs/api-conventions.md`):

| Status | Code         | When |
|--------|--------------|------|
| 401    | `unauthorized` | No session / cookie expired |
| 403    | `forbidden`    | Role is not PATIENT, or no Patient row linked |
| 404    | `not_found`    | Profile lookup fails after the helper resolved a row (race) |

## Implementation pointers

- Auth helper: `lib/api/patient-session.ts` (`requirePatientSession`).
- Service layer: `lib/services/patient-self.ts`.
- Routes: `app/api/patient/me/**`.
