To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 9 — FE-08 close-out + FE-09 head-start

Hi Yasha,

Day 9 of Sprint 1, 7 days to demo (Thu May 28). Master plan has **FE-08 (appointment booking flow)** as your Day 8 headline and **FE-09 (treatment plan view)** as the Day 10 co-owned (Yasha/Dhanjay) target. Dhanjay's email is still TBD so FE-09 is effectively all yours for now — get a head-start today.

No `yasha/**` ref on origin overnight, so I'm assuming FE-08 is still local WIP. Please push it this morning so I can review before EC2's first deploy later this week.

Backend overnight: **BE-10 (structured logging)** and **BE-52 (CORS + same-origin CSRF guard + security headers)** merged. Direct effect on you: any `POST/PUT/PATCH/DELETE` from the patient portal must be same-origin. You're already on `/patient/**` so no work needed — but if you see a 403 "CSRF: cross-origin mutating request rejected", that's the new guard; please flag it, don't bypass.

Reminder: **BE-50 (patient-self read endpoints, `/api/patient/me/*`)** is on main since Day 7 — those are the endpoints your dashboard + booking flow should be consuming.

## Today's tasks (Day 9)

**1. FE-08 — Appointment booking flow (push & close)**

Push `yasha/FE-08-appointment-booking` to `origin` before lunch. Behaviour I'm expecting from yesterday's spec:
- `/patient/(dashboard)/book` (or wherever you've routed it): pick a doctor → pick a date → see available slots from `GET /api/doctors/{id}/availability?date=` → confirm → `POST /api/appointments` → success screen with the booking summary.
- Optimistic disabled-state on the slot tile during the POST, friendly error on conflict ("That slot was just taken — please pick another").
- After booking, redirect to `/patient/(dashboard)/appointments` with the new booking visible. Re-uses BE-50's `GET /api/patient/me/appointments`.

If partially done is fine — single push so I can review.

**2. FE-09 — Treatment plan view (head-start, Day 10 target)**

Branch off latest `main` as `yasha/FE-09-treatment-plan-view`. Patient-side surface for now (doctor-side will be done by Urvi tomorrow if she has spillover from FE-05):

- `/patient/(dashboard)/treatment-plan` — reads the patient's active treatment plan via `GET /api/patient/me/treatment-plans` (BE-50, already live).
- Show: plan title, prescribed by, start date, status (active/revoked/superseded — BE-25 lands those states), and the ordered list of `TreatmentPlanItem` rows (medication / dose / schedule / duration).
- If a plan has been versioned (BE-25 adds `version` and `parentPlanId`), show "v{N}" badge and a small "View history" link that lists prior versions read-only.
- If a plan is revoked, show a clear inline banner "This plan was revoked on {date}" — don't hide it.
- Empty state: "No active treatment plan yet — your doctor will create one during a consultation."

Stretch (only if time): the doctor-side read at `/admin/(dashboard)/patients/[id]/treatment-plan`. Otherwise leave that to Urvi tomorrow.

## How to ship

1. `git pull origin main`
2. `git checkout -b yasha/FE-09-treatment-plan-view`
3. Commit with `feat(FE-09): <subject>` — small focused commits.
4. Push by 19:00 IST; I'll review at 07:30 tomorrow.
5. If a blocker, reply to this email — PM scans at 07:30.

## Notes from PM

- **EC2 first deploy is today** (separate infra workstream). For your work that means: **no hardcoded `http://localhost:3000` URLs** — use relative paths so it survives behind the nginx reverse proxy.
- **BE-22 (trend endpoint)** is being rebased; doesn't block you.
- Day 12 (Sun May 24) is the full clinical-loop integration test — your patient flow (register → book → view plan → see invoice) is half of that test. Anything you can get to "happy-path works" this week is gold.

— Vyara PM (autonomous agent)
