# Treatment Plans API

Endpoints for the doctor-side treatment-plan workflow. See
`lib/services/treatment-plan.ts` for the canonical business rules.

## Surface

| Method | Path | Purpose | Roles |
|---|---|---|---|
| `POST`  | `/api/treatment-plans`            | Create a DRAFT plan with optional items | `ADMIN`, `DOCTOR` |
| `GET`   | `/api/treatment-plans?patientId=…` | List plans (cursor-paginated)          | `ADMIN`, `DOCTOR`, `RMO`, `RECEPTION` |
| `GET`   | `/api/treatment-plans/:id`        | Fetch one plan + items                  | `ADMIN`, `DOCTOR`, `RMO`, `RECEPTION` |
| `PATCH` | `/api/treatment-plans/:id`        | Edit DRAFT (header + replace items)     | `ADMIN`, `DOCTOR` |
| `POST`  | `/api/treatment-plans/:id/sign`   | Flip DRAFT → SIGNED; materialize appts  | `ADMIN`, `DOCTOR` |
| `POST`  | `/api/treatment-plans/:id/revoke` | Flip SIGNED → REVOKED                    | `ADMIN`, signing `DOCTOR` |
| `POST`  | `/api/treatment-plans/:id/version`| Clone any status into a fresh DRAFT      | `ADMIN`, `DOCTOR` |

Lifecycle: `DRAFT → SIGNED → REVOKED`. `SIGNED` is immutable from
`PATCH` — only `/sign` and `/revoke` (BE-25) mutate the row past that
point. `/version` (BE-25) does not mutate the source row at all; it
creates a new DRAFT linked back via `previousVersionId`.

## Sign endpoint behaviour (BE-29)

`POST /api/treatment-plans/:id/sign` performs two things atomically,
inside a single Prisma `$transaction`:

1. Flips the plan to `SIGNED`, stamps `signedAt` (server clock) and
   `signedById` (the calling user), and writes an `AuditLog` row with
   `op: "SIGN"`.
2. **Materializes recurring appointments** for any plan items whose
   `kind` is in-clinic (`IV`, `REHAB`, `AESTHETIC`). Take-at-home items
   (`RX`, `SUPPLEMENT`) are skipped — the patient consumes those at
   home; no visit is booked.

If the transaction fails at step (2), the sign at step (1) is rolled
back as well — the plan is never observed as `SIGNED` without its
appointments having been considered.

### Cadence map

The `frequency` free-text field on each `TreatmentPlanItem` is mapped to
a day-interval by `cadenceToDays()` in
`lib/services/plan-materialization.ts`:

| `frequency` value | Day interval |
|---|---|
| `daily` / `every-day` | 1 |
| `twice-weekly` / `bi-weekly` / `two-times-weekly` | 3 |
| `weekly` / `once-weekly` | 7 |
| `null` or anything unrecognized | 7 (default) |

Matching is case-insensitive and treats spaces / underscores / hyphens
interchangeably. The lookup is deliberately narrow for Sprint 1 — the
protocol-library UI (BE-26) only emits these tokens.

### Session count

For each materializable item the number of sessions is:

```
count = max(1, floor(durationDays / interval))     // when durationDays is set
count = 3                                          // when durationDays is null
```

### Slot picking

- First session: the next **working day** (Mon–Sat) after `signedAt`,
  at **10:00 IST** (`pickNextSlot()`).
- Subsequent sessions: previous slot + `interval` days. If a candidate
  lands on Sunday, the slot is bumped forward to Monday.
- Each appointment is **60 minutes** long.
- `status = REQUESTED` (default for the table — there is no `SCHEDULED`
  state in the `AppointmentStatus` enum).
- `staffId` = the signing user's `Staff` row id. If the signing user
  has no `Staff` row (rare; e.g. system / unified-portal accounts)
  materialization is a no-op for the call — the plan still signs and
  the FE can offer a manual-book path.
- `departmentId = null`. `reason = "Treatment plan: <item.name>"`.
- `createdById = null` (system-created — Sprint 1 simplification).

### Plan link back-reference

Because Sprint 1 does **not** add a column to `Appointment` (out of
scope), the link from an appointment back to its source plan/item is
encoded as the **first line** of the appointment's `notes` field, as a
single-line JSON object:

```json
{"planId":"<uuid>","planItemId":"<uuid>","sequence":1}
```

Reception / clinical staff may append free-text on subsequent lines;
the parser only reads the first line. Use
`parsePlanLinkFromNotes(notes)` (in `lib/validation/appointment.ts`)
to decode — it returns `{ planId, planItemId, sequence } | null`.

### Idempotency

The materialization step short-circuits when any prior appointment for
this `patientId` already carries a `{"planId":"<this plan>"` prefix.
On a re-call (or a retried request) the response surfaces
`appointmentsCreated: 0` and the existing appointments are left alone.

### Response envelope (additive)

The success body is backward-compatible with the BE-24 shape (plan
fields at top level inside `data`). Three additive fields ride along:

```jsonc
{
  "data": {
    // ... all BE-24 TreatmentPlan fields (id, status, items, ...) ...
    "appointmentsCreated": 3,
    "appointmentsSkipped": 1,
    "appointmentIds": ["<uuid>", "<uuid>", "<uuid>"]
  }
}
```

- `appointmentsCreated` — number of `Appointment` rows inserted in this
  call.
- `appointmentsSkipped` — number of plan items skipped (take-at-home
  items, or all items when the plan was already materialized).
- `appointmentIds` — ids of the newly-inserted rows, in insertion
  order. Empty when nothing was created.

### Out-of-scope for Sprint 1

- Slot-conflict checks against the signing doctor's calendar (demo
  seed avoids overlaps).
- Per-appointment `AuditLog` rows (the plan-sign audit covers the
  trigger; a roll-up "MATERIALIZE" entry can be added later).
- A real FK column on `Appointment` pointing to `TreatmentPlanItem`
  (deferred — requires a schema migration).
- Rescheduling / regeneration when items are edited (plans are
  immutable after sign in Sprint 1, so this can't happen yet).

## Revoke endpoint behaviour (BE-25)

`POST /api/treatment-plans/:id/revoke` flips a `SIGNED` plan to
`REVOKED` in a single transaction with the audit-log write.

### Request

```jsonc
// Body is optional. All three of these are equivalent:
//   1. No body.
//   2. {}
//   3. { "reason": "Patient changed protocol" }
{
  "reason": "Patient changed protocol"   // optional, max 2000 chars
}
```

### Behaviour

- Stamps `revokedAt` (server clock), `revokedById` (the actor), and
  `revokeReason` (or NULL when omitted/blank).
- DRAFT plans cannot be revoked — delete-then-recreate via `PATCH` is
  the right shape for unsigned work. Returns `400` with the message
  `Cannot revoke a plan in status DRAFT`.
- Already-`REVOKED` plans return `400` (same code path, status
  `REVOKED`).
- Authorization: `ADMIN` may revoke any plan; `DOCTOR` may revoke only
  plans they signed or originally authored. Other doctors get `403`.
- Plan items, materialized appointments, and invoice links are left
  untouched — `revoke` is purely a header-state flip. Downstream
  appointment cancellation lives in BE-30 (future work).

### Response

`200 OK` — the updated plan in the standard `data` envelope (same shape
as `GET /api/treatment-plans/:id`, with `status: "REVOKED"` and the
three revoke fields populated).

### Errors

| Code | When |
|---|---|
| `400` | Plan is DRAFT or already REVOKED |
| `403` | Caller is DOCTOR but did not sign / author this plan |
| `404` | `id` does not match any plan |

## Version endpoint behaviour (BE-25)

`POST /api/treatment-plans/:id/version` clones the source plan into a
fresh `DRAFT`. The source row is **not** modified — version chaining is
strictly forward, recorded via the `previousVersionId` back-pointer on
the new row.

### Request

Empty body.

### Behaviour

- Source can be in any status (`DRAFT`, `SIGNED`, or `REVOKED`). Typical
  use case is "edit a signed plan" without breaking the immutable record;
  cloning off a revoked plan is also supported for re-issuance.
- New plan fields:
  - `status = "DRAFT"`
  - `version = source.version + 1`
  - `previousVersionId = source.id`
  - `createdById = <calling user>` (the cloning actor, not the original
    author — keeps the audit trail honest)
  - `signedAt`, `signedById`, `revokedAt`, `revokedById`, `revokeReason`
    all `null` on the clone
- Items copied verbatim (kind, name, dose, frequency, durationDays,
  instructions, sequence). New row ids are generated.
- Materialized appointments are **not** copied — signing the new draft
  re-runs materialization via the standard `/sign` path.

### Response

`201 Created`, `Location: /api/treatment-plans/<new-id>`, body is the
new plan in the `data` envelope.

### Errors

| Code | When |
|---|---|
| `403` | Caller is not ADMIN / DOCTOR |
| `404` | `id` does not match any plan |
