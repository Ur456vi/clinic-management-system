# AI Orchestrator brief — Shift 14:00 IST, 2026-05-16 (Sprint 1 Day 4)

**Filed by:** PM Agent, in service of "speed up the backend work."
**Authority:** PM scope (re-sequencing the existing AI shift; not changing cadence).

## Backlog for this shift (sequential, in this order)

Only **2 tasks** to clear out the remaining Sprint 1 BE gaps. Well under the 10-task cap. Spawn agents back-to-back; the second branches off the first's tip if its schema delta has landed on `main` by then (it won't — schema changes propagate only at the next 07:30 PM review — so branch off `main` for both).

### 1. BE-12 — Department CRUD (P0)

**Branch:** `task/BE-12-department-crud` (note: the existing branch label `task/BE-12-patient-search` is already on main with patient-search content; this is the proper Sprint-plan BE-12.)

**Why now:** Department CRUD is the last clear gap for FE-02 (Urvi's doctor-dashboard layout, Day 5 build). Department model already exists in `prisma/schema.prisma` from foundation work — no schema edit needed.

**Files to add:**
- `app/api/departments/route.ts` — GET list (paginated, `?q=`, `?isActive=`), POST create.
- `app/api/departments/[id]/route.ts` — GET, PATCH, DELETE (soft delete via `isActive=false`).
- `lib/services/department.ts` — service layer with role gates and audit-log writes.
- `lib/validation/department.ts` — Zod schemas for create / update / list-query.
- `docs/api-departments.md` — API reference (match the shape of `docs/api-staff.md`).

**Reference template:** `lib/services/staff.ts` and `app/api/staff/route.ts` on `main`. They were merged in today's morning PM shift and are the canonical pattern for "paginated CRUD with role gates, audit log, soft delete." Copy structure verbatim, swap entity, adjust unique constraints (`name` + `slug` are unique on Department).

**Role gates:**
- GET list/detail: `requireSession()` — any authenticated user.
- POST/PATCH/DELETE: `ADMIN` only (matches Staff).

**Test data:** Seed (BE-09) already inserts 3 demo departments. No seed change needed.

**Acceptance:**
- `GET /api/departments` returns `{ data, nextCursor }` paginated, supports `?q=` over `name` and `?isActive=true|false`.
- `POST /api/departments` ADMIN-only, validates unique `name` + `slug`, returns 409 on duplicate.
- `PATCH /api/departments/[id]` ADMIN-only, audit-logged.
- `DELETE /api/departments/[id]` soft-deletes (sets `isActive=false`); rejects with 409 if there are active staff assigned.
- Update `docs/api-reference.md` index to include the new doc.

---

### 2. BE-26 — InfusionLog (P1)

**Branch:** `task/BE-26-infusion-log`

**Why now:** Integrative-medicine specific (the clinic does IV infusions). Not on the demo critical path, but in scope and cheap to ship now that BE-21 (Appointment) is on `main`. FE has no consumer yet — this is backend-only for Sprint 1.

**Schema delta:** add `InfusionLog` model.

```prisma
model InfusionLog {
  id             String   @id @default(uuid()) @db.Uuid
  patientId      String   @map("patient_id") @db.Uuid
  consultationId String?  @map("consultation_id") @db.Uuid
  staffId        String   @map("staff_id") @db.Uuid

  // What was infused — keep as structured JSON to avoid a separate
  // "infusion item" table at this scope. Pattern matches BE-16
  // LabResult.analytes JSON on `task/BE-16-lab-result-model-api`.
  protocol       String                 // human-readable protocol name
  agents         Json                   // [{ name, dose, unit, sequence }]
  startedAt      DateTime               @map("started_at")
  completedAt    DateTime?              @map("completed_at")
  reaction       String?                // free-text adverse-reaction note
  status         InfusionStatus @default(SCHEDULED)
  notes          String?                @db.Text

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  patient        Patient        @relation(fields: [patientId], references: [id], onDelete: Restrict)
  consultation   Consultation?  @relation(fields: [consultationId], references: [id], onDelete: SetNull)
  staff          Staff          @relation("InfusionStaff", fields: [staffId], references: [id], onDelete: Restrict)

  @@index([patientId])
  @@index([staffId])
  @@index([status])
  @@map("infusion_logs")
}

enum InfusionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  ABORTED
}
```

Add back-relations on `Patient`, `Consultation`, `Staff` (`infusionLogs`, `infusions`, etc.).

**Reference template:** Once BE-16 lands on `main` (May 17 07:30 review), `lib/services/lab-result.ts` is the closest analogue. For this shift, **read the file directly off `task/BE-16-lab-result-model-api`** — it has the panel/analyte JSON validation pattern this task needs to mirror.

**Files to add:**
- `app/api/infusion-logs/route.ts` and `app/api/infusion-logs/[id]/route.ts`.
- `app/api/infusion-logs/[id]/transition/route.ts` for status transitions (SCHEDULED → IN_PROGRESS → COMPLETED, or → ABORTED).
- `lib/services/infusion-log.ts`, `lib/validation/infusion-log.ts`.
- `docs/api-infusion-logs.md`.

**Role gates:** DOCTOR, RMO, NURSE can write; any authenticated user can read.

**Acceptance:**
- Status transitions enforced per the diagram above.
- Audit log on every mutation.
- API doc landed.

---

## What this shift should NOT do

- **Do not touch the FE side.** Urvi is building FE-01 today; collision risk if an agent edits `app/layout.tsx` or middleware.
- **Do not edit anything under `app/api/lab-results/**`** — both BE-16 branches are still open and will be deduplicated at tomorrow's 07:30 PM review.
- **Do not re-edit `prisma/schema.prisma` after BE-26's schema delta.** Two tasks this shift; BE-12 doesn't touch schema, BE-26 adds one model + one enum. Sequential model handles this fine.

## Branch-ID drift mapping (for the agents' awareness)

| Sprint plan ID | What's on `main` | Don't confuse with |
|---|---|---|
| BE-12 (Dept CRUD) | not yet shipped — **this shift's job** | `task/BE-12-patient-search` (= plan BE-15) |
| BE-14 (Staff CRUD) | `task/BE-30-staff-crud` merged Day 3 | — |
| BE-15 (Patient search) | `task/BE-12-patient-search` merged Day 2 | — |
| BE-21 (Appointment) | `task/BE-27-appointment-model` merged Day 3 | — |

## Token / shift budget

- 2 tasks queued, cap is 10. Plenty of room. If both finish with budget left over, optional polish work:
  - Audit-log coverage check on `lib/services/appointment.ts` (BE-27) — verify all mutating paths write an audit row.
  - Add OpenAPI YAML entries for the new endpoints once BE-12 and BE-26 are committed.

— PM Agent
