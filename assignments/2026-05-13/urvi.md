To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in
From: Vyara PM <onboarding@resend.dev>
Subject: [Vyara] Unified-portal migration — your steps + today's task (2026-05-13)

Hi Urvi,

Quick context first, then your action items.

## What changed

Yasha had been building the patient portal on the `yasha` branch with a phone+OTP login, while your work (the doctor portal) lived on `main` with an email+password login. We're consolidating both into ONE portal at a single login surface — middleware routes by role after sign-in.

Architecture lives at `docs/unified-portal.md` on main. The migration play-by-play is in `docs/portal-consolidation-plan.md`.

## Good news for you: your code stays where it is

Your doctor portal is already on `main`. Nothing to move. Going forward you'll just branch off the new `main` for each task using the `urvi/` namespace.

## Your tasks this shift

### 1. Pull the new main

```bash
git fetch origin
git checkout main
git pull origin main
```

You'll see fresh foundation work merged (Prisma schema, NextAuth, middleware, etc.). The doctor portal pages in `app/admin/(dashboard)/` are untouched.

### 2. Start FE-12 — Patient list (real fetch)

Replace the hardcoded patient array in `app/admin/(dashboard)/patients/page.tsx` with a real fetch against the new `/api/patients` endpoint (built by the backend team — see `docs/api-patients.md`).

Acceptance:
- Table renders patients fetched from `GET /api/patients?take=20` instead of the hardcoded array.
- Loading state with a skeleton (or a simple spinner is fine for now).
- Empty state when the list is empty ("No patients yet — add the first one").
- Error state when the fetch fails ("Couldn't load patients — retry button").
- The "Add New Patient" button still links to `/admin/patients/add` (no change).
- Search input still works visually (you can leave it as a controlled state that doesn't yet hit the server; we'll add server-side search in a follow-up).
- The "29 patients" count label is bugged today — replace it with the actual total from the API response.

Branch + commit:

```bash
git checkout -b urvi/FE-12-patient-list-fetch
# do the work
git add app/admin/\(dashboard\)/patients/page.tsx
git commit -m "feat(FE-12): fetch patient list from /api/patients

- Replace hardcoded array with TanStack Query call to GET /api/patients
- Loading skeleton, empty state, error state
- Show real total in the count label (was '29')

Refs: FE-12"
git push origin urvi/FE-12-patient-list-fetch
```

### 3. Optionally: FE-13 — Patient list pagination

If you finish FE-12 with time to spare, layer pagination on top: the API returns a `nextCursor` in the response. Wire a "Load more" button that re-fetches with `?cursor=<next>`.

## How review works

PM Agent runs at 07:30 IST every morning and auto-reviews any branch matching `urvi/**`. If it approves, your branch is merged to `main` and you'll see it in the next morning's email. If it needs changes, you'll get specifics in tomorrow's assignment email.

## Anything else?

If you hit a blocker, reply to this email — PM picks up the thread at the next 07:30 review.

Thanks for the work!

— Vyara PM (autonomous agent)
