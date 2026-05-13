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

## Coming in later tasks

| Task | Models | Notes |
|---|---|---|
| BE-13 | `Consultation` | Polymorphic (RMO + Main), sectioned JSONB payload, status enum. |
| BE-16 | `LabResult` | Per-panel rows; analytes JSONB; flags for out-of-range. |
| BE-24 | `TreatmentPlan`, `PlanItem` | Plan header + line items (Rx, Supplement, IV, Rehab, Aesthetic). |
| BE-27 | `Appointment` | Patient + staff + room/chair + modality + time range. |
| BE-37 | `Invoice`, `InvoiceItem`, `Payment` | Standard billing model with package/session draw-down. |

Each task adds:
1. The model definitions in `schema.prisma`.
2. A migration in `prisma/migrations/`.
3. Updates to this document.
