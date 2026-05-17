To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 5 — finish FE-01, start FE-02 (Doctor dashboard layout)

Hi Urvi,

Day 5 of Sprint 1, 11 days to demo (Thu May 28). Quick state-of-the-world: no `urvi/**` branch hit `origin` yesterday — assuming FE-01 is local-only WIP. Today's plan is **finish FE-01, then pivot to FE-02 (today's sprint target).**

Backend kept accelerating overnight — two more merges this morning: **BE-23 (appointment booking endpoint)** and **BE-26 (infusion log)**. The doctor dashboard you're building today now has nearly every backend it needs already on `main`.

## Today's tasks (Day 5)

**1. FE-01 — auth/login (close out)**

If FE-01 is still local, push `urvi/FE-01-auth-login` before lunch so PM can review at 14:00. Carry over the spec from yesterday:
- Replace `router.push("/admin/patients")` in `app/page.tsx` with `signIn("credentials", { email, password, redirect: false })`.
- Read session role → redirect: staff roles to `/admin/(dashboard)`, `PATIENT` to `/patient/dashboard` (route still won't exist — Yasha is building it today).
- Loading state, error states, password min-length (8) matching `lib/validation/password-reset.ts`.
- Stub the "Forgot password?" link to `/admin/auth/password-reset` (no form yet — file FE-01b as Sprint 2).

**2. FE-02 — Doctor dashboard layout + nav (today's sprint target)**

Branch off latest `main` as `urvi/FE-02-doctor-dashboard-layout`. The scaffold already exists on main at `app/admin/(dashboard)/page.tsx` (placeholder "Welcome Doctor") and `app/admin/(dashboard)/layout.tsx`. What FE-02 adds:

- **Layout shell** in `app/admin/(dashboard)/layout.tsx` if not already wired: side-nav (Patients, Appointments, Departments, Staff, Reports, Invoices), top bar with user menu (name + sign-out), main content area. There are already sub-folders for each (`patients/`, `appointments/`, `departments/`, `staff/`, `reports/`, `invoices/`) so the nav targets exist.
- **Doctor dashboard widget content** in `app/admin/(dashboard)/page.tsx`: today's appointment list (fetch `GET /api/appointments?staffId=<self>&from=<today>&to=<tomorrow>`), quick-actions card (New consultation, New patient, Search), recent patients (last 5 you saw — pull from `GET /api/patients?limit=5&orderBy=lastSeen` or simulate if that param isn't supported yet).
- **Role gating**: read session via `getServerSession`, redirect non-staff to `/`. The middleware already handles the broad `/admin/**` gate.
- **API references on main right now** that you'll need: `docs/api-appointments.md`, `docs/api-patients.md`, `docs/api-staff.md`. Swagger UI at `/swagger`.

Commit by section: layout shell → dashboard widgets → role gate → polish.

**3. Push + PM review**

- `git pull origin main` first — three new commits since yesterday's note (BE-23 booking, BE-26 infusion-log, plus Day-5 legal memos).
- Push by EOD even if FE-02 is only the layout shell. PM scans 07:30 IST tomorrow.

## What's new on `main` since yesterday

- **BE-23 appointment booking endpoint** — `POST /api/appointments/book`, `GET /api/appointments/availability`. Spec in `docs/api-appointment-booking.md`. This is mostly Yasha's surface (patient self-book), but the availability endpoint is reusable on your dashboard if you want a "next free slot" widget.
- **BE-26 infusion log** — clinical-side endpoint `POST/GET/PATCH /api/infusion-logs`. Not on the doctor dashboard's critical path for FE-02 but informative for FE-05 (Day 9, lab + infusion view).
- Two Day-5 legal memos filed in `docs/legal/` (advisory only).

## Notes from PM

- **CI gate is ADVISORY** through Sprint 1 — push WIP freely. (CI gate sandbox issue this morning was an environment artifact, not a real failure; filed as Sprint 2 follow-up.)
- **Dhanjay back May 19** (Day 7). FE-05 (Day 9) still planned shared with him.
- **Avoid colliding with Yasha** on `app/page.tsx` and `app/layout.tsx`. She's working under `app/(public)/register/` and `app/patient/**` — different trees, no overlap.
- If FE-02 layout shell lands by 16:00, stretch into FE-03 (patient list with search) — `GET /api/patients?q=` is fully wired (BE-15) so it's mostly UI work. Day-6 target either way.

Reply with blockers — PM picks them up at 07:30 IST tomorrow.

— Vyara PM (autonomous agent)
