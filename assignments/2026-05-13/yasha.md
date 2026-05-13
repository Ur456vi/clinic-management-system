To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in
From: Vyara PM <onboarding@resend.dev>
Subject: [Vyara] Unified-portal migration — your steps + today's task (2026-05-13)

Hi Yasha,

Big change in plans — your patient portal needs to come over to `main` (joining Urvi's doctor portal under one unified login). Full context, then your concrete steps.

## What changed

We're collapsing into one portal: a single email+password login at `/`, then role-based middleware routes patients to `/patient/**` and staff to `/admin/**`. Architecture is in `docs/unified-portal.md` on main; full migration plan in `docs/portal-consolidation-plan.md`.

The good news: **your patient-portal pages are kept as-is**. They already live at the right path (`app/patient/(dashboard)/...`). What goes away is your phone+OTP login UI — but only temporarily. We're shipping email+password first because the backend NextAuth provider is already wired for it. Phone+OTP comes back as a tabbed alternative in Phase 2, and your existing OTP UI is the starting point.

## Your steps today

### 1. Sync with the new main

```bash
git fetch origin
git checkout main
git pull origin main
```

You'll see eight chore branches merged today — Prisma, NextAuth, middleware, the unified-portal foundation, etc. Notice `app/patient/` does NOT yet exist on `main` — that's what you'll bring over.

### 2. Create your migration branch off the new main

```bash
git checkout -b yasha/migrate-patient-portal main
```

### 3. Cherry-pick your patient-portal files (NOT your auth files)

```bash
# Bring over the patient route tree:
git checkout yasha -- app/patient/

# Bring over patient-specific components:
git checkout yasha -- components/patient/

# Bring over shared logo if main doesn't already have it:
git checkout yasha -- components/shared/Logo.tsx 2>/dev/null || true
```

**Important:** do NOT cherry-pick:
- `app/auth/page.tsx` and `app/auth/otp/page.tsx` — these would overwrite the unified login. We're parking the phone+OTP UI for Phase 2.
- `app/page.tsx` — main already has the email+password login.
- `app/layout.tsx` — main's version is current.

### 4. Wire patient pages to the new auth

Any page that needs to know who the patient is can use:

```tsx
import { requireUser } from "@/lib/auth"

export default async function PatientDashboardPage() {
  const user = await requireUser()  // throws UnauthorizedError if not signed in
  // ... user.userId is the User.id, look up Patient via the userId FK
  ...
}
```

For client components, use `useSession()` from `next-auth/react`.

### 5. Commit + push

```bash
git add app/patient components/patient components/shared/Logo.tsx
git commit -m "feat(FE-PATIENT-01): port patient portal pages onto unified main

- Bring app/patient/(dashboard)/* from yasha branch
- Bring components/patient/* (Header, PatientNavbar, PatientSidebar, Sidebar)
- Bring components/shared/Logo.tsx
- Auth handled by the new middleware + NextAuth from main
- app/auth/ deferred to Phase 2 (phone+OTP)

Refs: FE-PATIENT-01"
git push origin yasha/migrate-patient-portal
```

PM Agent reviews at 07:30 IST tomorrow and auto-merges if it passes.

## After the migration lands

You'll continue using the `yasha/` branch namespace for new work: e.g. `yasha/FE-PATIENT-02-results-trend`. The long-lived `yasha` branch can be deleted (or kept as historical reference — your call).

## Phase-2 note

Your phone+OTP login UI is staying in the repo as a reference. After we have email+password working end-to-end, the FE-AUTH-OTP task brings phone+OTP back as a second tab on the login page — and it's your starting point.

## Hit a blocker?

Reply to this email; PM picks it up at the next 07:30 review.

Thanks!

— Vyara PM (autonomous agent)
