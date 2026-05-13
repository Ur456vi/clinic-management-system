# Unified portal architecture

Vyara serves two user types through **a single auth surface**. After login, role-based middleware routes each user to the correct dashboard tree.

## High-level flow

```
                  ┌────────────────────────┐
                  │   /  (login)           │
                  │   email + password     │
                  └───────────┬────────────┘
                              ▼
                   middleware reads session.role
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
     /admin/**          /patient/**       /admin/auth/**
     (staff lane)       (patient lane)    (shared: forgot
                                            password, OTP)
```

## Role table

| Role | Lane | Notes |
|---|---|---|
| `ADMIN` | `/admin/**` | Dr. Yuvraj + super-admin |
| `DOCTOR` | `/admin/**` | Main consultations, treatment plans |
| `RMO` | `/admin/**` | Resident — first-pass intake |
| `RECEPTION` | `/admin/**` | Appointments, invoicing |
| `INFUSION_SPECIALIST` | `/admin/**` | Executes infusion sessions |
| `REHAB_SPECIALIST` | `/admin/**` | Executes rehab sessions |
| `AESTHETICS_SPECIALIST` | `/admin/**` | Executes aesthetic procedures |
| `PATIENT` | `/patient/**` | Sees own appointments, results, invoices |

## Auth method

**Email + password** is the canonical login for v1, served by NextAuth's Credentials provider (BE-04, already merged). Patients sign in the same way as staff.

Phone+OTP — which Yasha prototyped on the `yasha` branch — is deferred to a Phase-2 enhancement. The UI stays in the codebase but is re-skinned to the unified flow when the time comes. Patients can still use email+password in the meantime.

## Schema additions (this branch)

- `Role` enum gains `PATIENT`.
- `Patient` gains `userId` (`@unique`, nullable, FK → `User.id`, `onDelete SetNull`) — every new patient has a User row. Nullable during the migration so existing patient rows don't break inserts.
- `User` gains the back-relation `patient Patient?`.

Migration name suggestion: `add_patient_role_and_user_link`.

## Middleware (`middleware.ts`)

At the repo root. Reads the NextAuth JWT cookie via `getToken`, then:

1. Unauthenticated request to `/admin/**` or `/patient/**` → redirect to `/?next=<original-path>`.
2. Authenticated user on `/` or other public-auth pages → redirect to their lane's dashboard.
3. Authenticated user on the wrong lane → redirect to the right lane.

`/api/**`, static assets, and Next.js internals are pass-through.

## Route tree (target)

```
app/
├── page.tsx                          ← unified login (email + password)
├── admin/
│   ├── auth/                         ← shared: forgot-password, OTP, reset
│   └── (dashboard)/                  ← staff routes (Urvi owns this)
│       ├── dashboard/
│       ├── patients/
│       ├── appointments/
│       ├── staff/
│       ├── departments/
│       ├── invoices/
│       └── reports/
└── patient/
    └── (dashboard)/                  ← patient routes (Yasha owns this)
        ├── dashboard/
        ├── appointments/
        ├── lab-management/
        ├── prescriptions/
        ├── reports/
        ├── profile/
        └── help/
```

## What still needs to happen

The consolidation play-by-play — which files move where, who owns each step, what gets deleted — lives in [`portal-consolidation-plan.md`](./portal-consolidation-plan.md).
