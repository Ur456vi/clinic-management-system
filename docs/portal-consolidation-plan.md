# Portal consolidation plan

Migrating from "two separate projects with different logins" → "one unified portal." This is the play-by-play assigned to Urvi and Yasha. PM tracks completion.

## Current state (as of 2026-05-13)

| | Where it lives | What it has |
|---|---|---|
| **Urvi's work** | `main` | Email+password login (`app/page.tsx`), forgot-password (`app/admin/auth/forgot-password`), full `/admin/(dashboard)/` doctor tree |
| **Yasha's work** | `yasha` branch | Phone+OTP login (`app/auth/page.tsx`, `app/auth/otp/page.tsx`), full `/patient/(dashboard)/` patient tree |

The branches diverged early — `yasha` doesn't have any of the backend foundation (Prisma, NextAuth, API helpers).

## End state (target)

A single `main` with:
- `app/page.tsx` — the email+password unified login (Urvi's design wins for v1).
- `app/admin/auth/**` — shared forgot-password / OTP / new-password flow.
- `app/admin/(dashboard)/**` — staff lane, as-is.
- `app/patient/(dashboard)/**` — patient lane, ported from `yasha`.
- `middleware.ts` (already on this foundation branch) routes by `session.role`.
- `prisma/schema.prisma` includes `PATIENT` role + `Patient.userId` link.
- Yasha's `app/auth/page.tsx` and `app/auth/otp/page.tsx` are **deleted**; the OTP-style UI is preserved in a feature flag to revisit in Phase 2.

## Branch conventions going forward

| Dev | Branch | Notes |
|---|---|---|
| Urvi | `urvi/<FE-ID>-<slug>` (e.g. `urvi/FE-12-patient-list-fetch`) or stand-alone `urvi` for WIP | Pushes to GitHub; PM reviews at next 07:30. |
| Yasha | `yasha/<FE-ID>-<slug>` or the existing `yasha` branch during migration | Same review path. |

PM auto-merges branches matching `task/**`, `chore/**`, `urvi/**`, `yasha/**`. Single-name branches (`urvi`, `yasha`) are treated as long-lived WIP and reviewed too.

## Consolidation steps

### Step 1 — Urvi: nothing to move
Her code is already on `main`. She just needs to:
- Branch off the new `main` (after this foundation lands) for new work: `git checkout -b urvi/FE-XX-<slug>`.
- Continue on FE-** tasks per PM assignments.

### Step 2 — Yasha: rebase patient pages onto `main`
Yasha's `yasha` branch needs the patient pages brought onto `main` while dropping the divergent auth UI.

**Recommended approach** (don't do a full merge — too many auth-file conflicts):

```bash
# From an up-to-date main:
git checkout -b yasha/migrate-patient-portal main

# Cherry-pick only the patient/ tree and patient-specific components.
# (Yasha runs these from his local clone of the yasha branch:)
git checkout yasha -- app/patient/
git checkout yasha -- components/patient/
git checkout yasha -- components/shared/Logo.tsx     # if not already on main

# DO NOT cherry-pick app/auth/, app/page.tsx, app/layout.tsx — those would
# overwrite the unified login.

# Add the missing dashboard layout if Yasha's depends on it.
# Wire patient pages to the new auth: server components can call
# `await requireUser()` from `@/lib/auth`; redirect on null.

git add app/patient components/patient components/shared/Logo.tsx
git commit -m "feat(FE-PATIENT-01): port patient portal pages onto unified main"
git push origin yasha/migrate-patient-portal
```

PM reviews and merges. The `yasha` branch can then be deleted (or kept as historical reference).

### Step 3 — Reconcile login UI
Yasha's phone+OTP UI is **deleted from active code** but kept as a reference file (`docs/legacy/yasha-otp-login.tsx`) for the Phase-2 phone-OTP feature.

Owner: PM at the consolidation review. Single commit on a `chore/remove-yasha-auth` branch.

### Step 4 — Add /patient routes to the unified login redirect
After login, the user's role determines where they land:
- Staff → `/admin/dashboard`
- Patient → `/patient/dashboard`

`middleware.ts` (this branch) already handles this once the role is in the JWT. The login form's `signIn()` callback just lets middleware do the redirect — no special-casing needed in the page.

### Step 5 — Seed: add at least one PATIENT user
BE-09 (seed data) gains a `seed-patient.ts` step that creates 1 demo PATIENT for end-to-end testing of the lane separation.

## Acceptance criteria

The unified portal is "consolidated" when ALL of these hold on `main`:
- One login page at `/` (email + password).
- `middleware.ts` redirects unauthenticated users → `/`, staff → `/admin/dashboard`, patients → `/patient/dashboard`.
- `app/patient/(dashboard)/dashboard/page.tsx` exists and renders Yasha's design.
- `app/admin/(dashboard)/dashboard/page.tsx` continues to render Urvi's design.
- Logging in as a PATIENT (manually inserted via Prisma Studio) lands on `/patient/dashboard` — and vice versa for a DOCTOR.
- `yasha` branch's `app/auth/**` files no longer exist on `main`.
- Schema has `PATIENT` role and `Patient.userId` FK; migration applied locally.

## Out of scope (Phase 2)

- Phone+OTP login (rebuilt as a tabbed alternative to email+password).
- Patient self-registration (currently only PM/staff can create a Patient + linked User).
- SSO for staff (Google / Microsoft).
- Email magic-link login.
