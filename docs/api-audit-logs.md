# Audit Logs API

Admin viewer for the append-only `AuditLog` table (BE-23). Every read
or write of PHI in `lib/services/**` writes a row here through the
`recordAudit()` helper; this endpoint surfaces them for compliance
review.

The route lives under `/api/admin/audit-logs` and follows the standard
BE-07 conventions: `{ data }` envelope, `x-request-id` response header,
cursor pagination.

---

## Wire shape

The `AuditLog.id` column is a Postgres `BigInt`. The API serialises it
to a **string** so JSON round-trips losslessly and cursors are stable
between pages. `occurredAt` is ISO 8601 in UTC.

```json
{
  "id": "1042",
  "occurredAt": "2026-05-16T04:55:11.214Z",
  "actorUserId": "8b3f1c2e-9c11-4e8a-9a4a-1f1c8d52e7f8",
  "action": "UPDATE",
  "entityType": "Patient",
  "entityId": "f5b5a0d2-3d1c-4e63-9a4f-2d6b9c1e8a55",
  "detail": { "before": { /* ... */ }, "after": { /* ... */ } }
}
```

`actorUserId`, `entityId`, and `detail` are all nullable. The writer
helper skips the row entirely when **both** `actorUserId` and
`entityId` are null AND the action is not `LOGIN` / `LOGOUT`, so the
table never carries pure-noise rows.

---

## `GET /api/admin/audit-logs`

List audit rows, descending by `occurredAt` (newest first).

| Aspect | Value |
| --- | --- |
| Auth | **ADMIN only** |
| Method | `GET` |
| Body | none |

### Query parameters

| Name | Type | Notes |
| --- | --- | --- |
| `entityType` | string (1..64) | Exact match. Matches what the service wrote (`"Patient"`, `"Consultation"`, `"Staff"`, `"Appointment"`). |
| `entityId` | string (1..128) | Exact match on the affected row's primary key. |
| `actorUserId` | uuid | Filter to one User's actions. |
| `action` | `AuditAction` | `CREATE` / `READ` / `UPDATE` / `DELETE` / `LOGIN` / `LOGOUT` / `EXPORT`. |
| `from` | ISO 8601 datetime | Inclusive lower bound on `occurredAt`. |
| `to` | ISO 8601 datetime | Exclusive upper bound on `occurredAt`. |
| `cursor` | string | Keyset cursor — the `id` (stringified BigInt) of the last row from the previous page. Omit for page 1. |
| `limit` | integer | Page size. Default **100**, max **500**. Out-of-range values clamp silently. |

### Response (200)

```json
{
  "data": [
    {
      "id": "1042",
      "occurredAt": "2026-05-16T04:55:11.214Z",
      "actorUserId": "8b3f1c2e-9c11-4e8a-9a4a-1f1c8d52e7f8",
      "action": "UPDATE",
      "entityType": "Patient",
      "entityId": "f5b5a0d2-3d1c-4e63-9a4f-2d6b9c1e8a55",
      "detail": { "before": {}, "after": {} }
    }
  ],
  "nextCursor": "1041"
}
```

`nextCursor` is `null` once the result set is exhausted.

Ordering: `occurredAt DESC, id DESC`. The BigInt `id` is monotonic so
the trailing tie-break is sufficient for stable keyset pagination.

### Errors

- `400 VALIDATION_ERROR` — bad query string (malformed UUID, unknown
  action token, non-ISO datetime, bad cursor).
- `401 UNAUTHORIZED`.
- `403 FORBIDDEN` — caller is not ADMIN.

### Example

```bash
# Last 50 actions on a specific patient
curl -s 'http://localhost:3000/api/admin/audit-logs?entityType=Patient&entityId=<uuid>&limit=50' \
  -H 'Cookie: next-auth.session-token=<jwt>'

# Every action a doctor took in the last 24 hours
curl -s "http://localhost:3000/api/admin/audit-logs?actorUserId=<uuid>&from=$(date -u -d '-1 day' +%FT%TZ)" \
  -H 'Cookie: next-auth.session-token=<jwt>'

# Pagination — second page
curl -s 'http://localhost:3000/api/admin/audit-logs?limit=100&cursor=1041' \
  -H 'Cookie: next-auth.session-token=<jwt>'
```

---

## What gets written

The audit table is populated by `recordAudit()` from
`lib/services/audit.ts`. Current coverage:

| Service | Mutations audited | Reads audited |
| --- | --- | --- |
| `patient` | CREATE / UPDATE / DELETE (soft) | `GET /api/patients/:id` |
| `consultation` | CREATE / UPDATE (autosave sampled, see below) | `GET /api/consultations/:id` |
| `staff` | CREATE / UPDATE / DELETE (soft) | `GET /api/staff/:id` |
| `appointment` | CREATE / UPDATE / transition | `GET /api/appointments/:id` |

**READ scope.** Only *detail* GETs write a READ row. List endpoints
deliberately do **not** instrument per-item READs — for a calendar or
patient list with 100 items per page that would 10x the audit table
for negligible compliance value. If a forensic question ever requires
list-level "who saw which row", that conversation goes through PM
first.

**Autosave sampling.** `PATCH /api/consultations/:id` is the autosave
endpoint and fires roughly once per 750 ms on the FE. To keep the
table readable, `UPDATE` rows on `Consultation` are sampled at **one
row per 60-second window** per `(actorUserId, consultationId)`. Status
transitions (`DRAFT → RMO_DONE`, etc.) bypass the sampler and always
write. The sampler is in-memory (`Map`) on the server process — a pod
restart resets the windows, which is fine because each window's
`detail.patch` blob already carries the full diff for the rows that
*were* written.

### `recordAudit()` helper

```ts
import { recordAudit } from "@/lib/services/audit"

await recordAudit({
  actorUserId: session.userId,
  action: "READ",
  entityType: "Patient",
  entityId: patient.id,
})
```

- **Fail-soft.** Best-effort writes (no `tx`) swallow + log on DB error
  so the originating request never fails because of an audit miss.
- **Transactional.** Pass `{ tx }` to commit the audit row inside the
  same transaction as a mutation; errors propagate so the whole tx can
  roll back.
- **No-op skip.** When both `actorUserId` and `entityId` are null AND
  the action is not LOGIN/LOGOUT, the call returns without writing.

---

## Implementation notes

- **Validation** — `lib/validation/audit-log.ts` (`listAuditLogsQuerySchema`).
- **Service** — none; the route is thin enough that the Prisma query
  lives inline. Filters/cursor logic is well-isolated and easy to read.
- **No audit-on-audit.** We intentionally do not write a row when an
  ADMIN reads this endpoint. Doing so would feed a runaway loop (each
  inspection adding rows to the table being inspected). The HTTP access
  log + `x-request-id` are sufficient for traceability.
- **BigInt serialisation.** The `id` PK is `BigInt`; we stringify
  manually in the route. Standard `JSON.stringify` on a BigInt throws.

## Known gaps — picked up in Sprint 2

- Lab-result writes are not yet routed through `recordAudit()` (BE-16
  is still on a feature branch). When that lands, plumb the helper
  through the same way as patient/consultation.
- No export endpoint (CSV / JSONL). For Sprint 1 the demo flow is "look
  at the list" — bulk export is filed for compliance week.
- Sampling state is per-pod. Once we have more than one app pod in
  prod, two pods can each write a row in the same 60-second window.
  Move the bookkeeping to Redis if/when that becomes load-bearing.
- The route currently exposes the raw `detail` JSON which may contain
  PHI snippets (`before`/`after` patient fields). The viewer is ADMIN-
  only today; if we ever expose a read-only "compliance viewer" role,
  the route will need a PHI-redaction projection.
