To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 2 — onboarding to sprint scope + FE-01 prep (2026-05-14)

Hi Urvi,

Sprint 1 is officially live (Day 2 of 15). The demo target is **May 28** — a full clinical loop, end-to-end. Your lane for the sprint is the doctor portal: FE-01 → FE-05 (auth, dashboard layout, patient list, patient detail + consultation, lab-result UI).

Day 2 is pre-build prep. Your first heavy build day is **Day 4 (Sat May 16) on FE-01**. Today is about being ready to ship the moment auth lands.

## Today's tasks (Day 2)

**1. Read the sprint plan end-to-end (30 min)**
- `docs/sprint-1-mvp.md` — scope, day-by-day, what's out of scope. Note the FE rows you own.
- `docs/team.md` — Sprint 1 banner, AI agent shift cadence, PM agent role.

**2. FE-01 spec sketch — auth/login + role-based redirect (Day 4 target)**
- Read existing `app/auth/` and `middleware.ts` on `main`. NextAuth Credentials + JWT is already wired (BE-04 shipped).
- Draft a one-page spec at `docs/fe-01-auth-spec.md` covering: login form fields, validation, error states, redirect-by-role rule (`DOCTOR` → `/admin/dashboard`, `PATIENT` → `/patient/dashboard`, anything else → `/`).
- Note any backend gaps you'd need for OTP/password-reset (BE-05 is on the AI shift today — coordinate via the assignments branch).
- Branch: `urvi/FE-01-auth-login` once you start coding Day 4. Today's spec can live on `urvi` WIP.

**3. Doctor-portal layout audit (FE-02 prep, Day 5 target)**
- Walk `app/admin/(dashboard)/` and list every page that exists, every page FE-02 will need to add (top nav, side nav, today's-appointments widget on the dashboard home).
- Drop the inventory into the same spec doc under an "FE-02 dependencies" section.

**4. Stay unblocked**
- Local env: `npm install`, `npx prisma generate`, `docker compose up -d` (Postgres). Run `npm run dev` and confirm `app/admin/(dashboard)/patients` still renders.

## Branches I'm aware of

- 4 stale `chore/*` PM-Agent branches from yesterday — none merging today; content was superseded by direct `main` commits. No conflicts for your work.
- AI shift this morning is working BE-12 (Department CRUD) + BE-14 (Staff/Doctor CRUD). Your FE-02 dashboard will eventually consume both — keep them in mind.

## Notes from PM

- **CI gate is ADVISORY** during Sprint 1. Push when ready; PM reviews at 07:30 IST next day.
- **Dhanjay is unavailable until May 19.** FE-05 (Day 9) is shared with him — assume solo until he's back.
- If you finish early today, get a head start on the FE-01 login UI skeleton — even hardcoded form layout helps Day 4.

If anything blocks you, reply here — PM picks it up at the 07:30 review.

— Vyara PM (autonomous agent)
