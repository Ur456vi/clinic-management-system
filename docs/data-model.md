# Vyara — Core data model

This document tracks the data model. Each section corresponds to a backend task; new models are added in subsequent commits.

## Conventions

- **Primary keys:** UUID v4 (`@db.Uuid`) for all domain entities, BigInt autoincrement for the audit log only.
- **Naming:** `camelCase` in Prisma, mapped to `snake_case` in Postgres via `@map`. Table names are pluralized (e.g. `patients`).
- **Timestamps:** every domain entity has `createdAt` (`@default(now())`) and `updatedAt` (`@updatedAt`).
- **Soft deletes:** only where explicitly required (e.g. `Patient.deletedAt`). Most tables hard-delete.
- **Email:** stored as `Citext` so lookups are case-insensitive.
- **Audit:** every read/write of PHI writes a row to `audit_logs` (wired up in BE-23).

## Core entities (BE-03)

```
User ──1:1── Staff ──N:1── Department
                  └──1:N── Patient (as primary doctor)

AuditLog (orphan — references actor by id only)
```

### User
The login account. One row per clinic-side staff member; never a Patient. Holds `email`, `passwordHash` (bcrypt/argon2 — implemented in BE-04), and `role`.

### Role (enum)
`ADMIN | DOCTOR | RMO | RECEPTION | INFUSION_SPECIALIST | REHAB_SPECIALIST | AESTHETICS_SPECIALIST`. A user has exactly one role.

### Staff
The clinical/operational profile attached to a User. Holds `fullName`, contact, qualifications, license, biography, etc. — the data the user sees on `/admin/staff/add`.

### Department
One of: Admin, Reception, RMO, Infusion, Rehabilitation, Aesthetics (seeded in BE-09). A Staff member belongs to at most one Department.

### Patient
The patient record. Stores demographics, `patientNumber` (human-readable ID like `PAT-263040`), optional `primaryDoctor` link, and `status`. Soft-deleted by setting `status = ARCHIVED` and writing `deletedAt`.

### AuditLog
Append-only. Captures actor, action, entity, and free-form `detail` JSON. The cornerstone of the compliance posture; every PHI access is logged here.


## Consultations (BE-13)

```
Patient ──1:N── Consultation ──N:1── User (createdBy / signedBy)
```

### Consultation
A clinical encounter. The model is **polymorphic single-table**: a `type`
discriminator (`RMO` | `MAIN`) tells callers which sub-form was filled in, and
the per-section content lives in a `sections` JSONB blob.

- **RMO** rows are first-pass intake from the Resident Medical Officer. The
  `sections` blob carries six keys mirroring the tabs on `/admin/patients/add`:
  `informant`, `demographics`, `medicalHistory`, `socialHistory`,
  `personalHistory`, `examinationSummary`.
- **MAIN** rows are the senior doctor's encounter. `sections` carries
  `chiefComplaint`, `hpi`, `assessment`, `diagnosis`, `plan`.

### Status lifecycle
`DRAFT → RMO_DONE → IN_PROGRESS → SIGNED`. The `SIGNED` transition stamps
`signedById` + `signedAt` and locks the row (enforced in BE-14's service layer).

### Why JSONB over per-section tables
The intake form alone has ~150 fields across 30+ sub-sections, and the field
list is still in flux. Normalizing each sub-section into its own table would
explode the migration and join surface without a real query benefit — we never
filter patients by, say, "smoker yes/no" at clinic scale, we read the whole
consultation as a document. JSONB gives us indexable typed access via
`@db.JsonB` plus the flexibility to evolve the form without a migration per
field. Field-level validation moves into a Zod layer in BE-14.

### Autosave & merge semantics (BE-14)
`PATCH /api/consultations/:id` is the autosave entrypoint. Its `sections`
field is **shallow-merged** into the existing JSONB column at the top
level — `{ ...existing, ...patch }`. Last-write-wins per section key. A
client that wants to update only `vitals` sends
`{ sections: { vitals: { systolic: 120, diastolic: 78 } } }` and the
other section keys (informant, history, etc.) are left untouched. Deep
merge is deliberately *not* supported: clients can clear a sub-field
just by omitting it from the next save. The merge logic lives in
`mergeSections()` in `lib/services/consultation.ts`, and the route
records an `AuditLog UPDATE` row with `{ before, after, patch }` so
reviewers can reconstruct the saved diff. Once a consultation reaches
`SIGNED`, the row is immutable — any further PATCH returns 400.

## Coming in later tasks

| Task | Models | Notes |
|---|---|---|
| BE-16 | `LabResult` | Per-panel rows; analytes JSONB; flags for out-of-range. |
| BE-24 | `TreatmentPlan`, `PlanItem` | Plan header + line items (Rx, Supplement, IV, Rehab, Aesthetic). |
| BE-27 | `Appointment` | Patient + staff + room/chair + modality + time range. |
| BE-37 | `Invoice`, `InvoiceItem`, `Payment` | Standard billing model with package/session draw-down. |

Each task adds:
1. The model definitions in `schema.prisma`.
2. A migration in `prisma/migrations/`.
3. Updates to this document.
