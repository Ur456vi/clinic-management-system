To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <onboarding@resend.dev>
Subject: [Vyara] Sprint 1 Day 2 — onboarding to sprint scope + FE-06 prep (2026-05-14)

Hi Yasha,

Sprint 1 is live (Day 2 of 15). Demo target **May 28** — full clinical loop. Your lane is the patient portal: FE-06 → FE-09 (registration, patient dashboard + appointment view, booking flow, treatment plan view).

Day 2 is prep. Your first build day is **Day 5 (Sun May 17) on FE-06**. Today is about scaffolding the surface and getting unblocked.

## Today's tasks (Day 2)

**1. Read the sprint plan end-to-end (30 min)**
- `docs/sprint-1-mvp.md` — focus on FE-06 → FE-09 rows and the patient flow at the top.
- `docs/team.md` and `docs/unified-portal.md` — context on the single-login-surface decision and role-based routing.

**2. Patient-portal scaffold audit (FE-06 prep)**
- `app/patient/` does not exist on main yet. List what needs to be created: `app/patient/layout.tsx`, `app/patient/(dashboard)/page.tsx`, `app/patient/register/page.tsx`.
- Drop the inventory + page-tree sketch at `docs/fe-06-patient-portal-spec.md` on a `yasha` WIP branch (do NOT scaffold the code yet — wait for FE-01 from Urvi on Day 4 so auth wiring lands first).

**3. FE-06 spec — patient self-registration (Day 5 target)**
- Read `BE-11` Patient model in `prisma/schema.prisma` to understand the fields the registration form must collect.
- Draft form fields, validation rules, success state (redirect to login or auto-sign-in?), error states.
- Note dependencies: needs `POST /api/patients/register` endpoint — confirm BE-11 covers self-registration or flag it for the AI shift.

**4. Local env**
- `npm install`, `npx prisma generate`, `docker compose up -d`. Confirm `npm run dev` boots clean.

## Branches I'm aware of

- 4 stale `chore/*` PM-Agent branches from yesterday — none merging today; content already on main. No conflicts.
- AI shift this morning is on BE-12 + BE-14. You'll consume BE-14 (staff/doctor list) in FE-08 booking flow — note the API shape when it lands.

## Notes from PM

- **CI gate is ADVISORY** during Sprint 1. Push when ready; PM reviews at 07:30 IST.
- **Dhanjay is unavailable until May 19.** FE-09 (Day 10) is shared with him — assume solo until then.
- Hold off scaffolding `app/patient/*` page files until Urvi's FE-01 lands Day 4 — saves a rebase. Specs and notes only today.

Reply with blockers. PM picks them up at 07:30.

— Vyara PM (autonomous agent)
