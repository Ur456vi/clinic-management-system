To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 7 — FE-04 patient detail + consultation form (today's headline)

Hi Urvi,

Day 7 of Sprint 1, 9 days to demo (Thu May 28). FE-01 (auth/login) and FE-02 (doctor dashboard layout) are merged on `main`. FE-03 (patient list with search) is the carryover from yesterday — no `urvi/**` ref hit origin overnight, so assuming it's still local WIP. **Today's headline is FE-04 patient detail + consultation form — Day 7–8 sprint target** but only after FE-03 is on `origin` for review.

Backend overnight: **BE-25 (treatment-plan revoke + version)** and **BE-50 (patient-self read endpoints)** both merged this morning. BE-25 lands the two action routes you'll need from the consultation form when a doctor signs and later wants to revoke or re-version a plan. BE-50 is patient-side only — doesn't touch your surfaces. Bumping BE-29 + BE-41 visibility (both merged Day 6, no change today).

## Today's tasks (Day 7)

**1. FE-03 — Patient list with search (close out)**

Push `urvi/FE-03-patient-list` to `origin` before lunch so PM can review at the 14:00 dev-shift handoff. From yesterday's spec: convert `app/admin/(dashboard)/patients/page.tsx` from hardcoded mock data to a server component that hits `GET /api/patients?q=&page=&limit=20`, with URL-state-driven search (`?q=`), Prev/Next pagination on `meta.totalPages`, skeleton loading state, friendly empty state, and row click → `/admin/(dashboard)/patients/[id]` (FE-04 surface — 404 there is fine for now since you'll be building it later today). Keep the existing visual table styling — just swap the data source.

If FE-03 is mostly done already, fold any remaining polish into the FE-04 PR — single push at EOD is fine.

**2. FE-04 — Patient detail + consultation form (today's primary, Day 7–8 target)**

Branch off latest `main` as `urvi/FE-04-patient-detail-consultation`. This is the doctor's working surface — it's the screen Dr. Yuvraaj will live in during the demo.

Required behaviour:

- `app/admin/(dashboard)/patients/[id]/page.tsx` (server component): fetch `GET /api/patients/:id` → header band with name, age, sex, phone, email, registration date, assigned doctor. Below that, a two-column layout: left = patient timeline / history (call `GET /api/patients/:id/timeline` from BE-21 — chronological consultations, lab results, treatment plans, appointments), right = today's consultation form.
- `<ConsultationForm/>` client component: chief complaint, history of present illness, examination notes, diagnosis, vitals (BP, pulse, temp, weight). Wire to `POST /api/consultations` and `PATCH /api/consultations/:id` (BE-14 autosave already shipping every 5s). Patient ID comes from the URL.
- **Lab attach** within the consultation form: a small upload button that hits `POST /api/lab-results` with `consultationId`. BE-19 file-upload + BE-20 lab-pdf-attach are merged — use the presigned-URL flow documented in `docs/api-lab-results.md`.
- **Prescribe a treatment plan** button: opens a side drawer / modal with the plan composer (header + items: medication / infusion / lifestyle entries). Submit `POST /api/treatment-plans` (BE-24). Once created, surface a "Sign plan" button → `POST /api/treatment-plans/:id/sign` (BE-25 line — wait, sign is BE-24's responsibility; **BE-25 adds revoke + version**). If the plan needs to be replaced after signing, use `POST /api/treatment-plans/:id/version` to clone into a fresh DRAFT; if it needs to be cancelled outright, `POST /api/treatment-plans/:id/revoke` with an optional reason string.
- **History panel:** clicking a past consultation in the timeline opens its read-only summary inline (don't navigate away). Past treatment plans show their status (DRAFT / SIGNED / REVOKED) with the relevant action buttons.
- Loading: Suspense fallback. Empty state on a fresh patient: "No history yet — start a new consultation below."

Commit in slices: header + timeline read → consultation form (create + autosave) → lab attach → treatment-plan composer → sign / revoke / version actions. Don't try to land it all on Day 7 — the spec gives you Day 7 *and* Day 8 for this.

**3. Push + PM review**

- `git pull origin main` first — three new commits since yesterday: BE-25, BE-50, and the Day-7 legal memos.
- Push by EOD even if FE-04 only has the patient-detail header + timeline read working. PM scans 07:30 IST tomorrow.

## What's new on `main` since yesterday

- **BE-25 plan revoke + version** — `POST /api/treatment-plans/:id/revoke` (status flip with optional reason, audit-logged) and `POST /api/treatment-plans/:id/version` (clone any plan into a fresh DRAFT, increments `version`, links via `previousVersionId`). Both surface directly in FE-04. Spec extension in `docs/api-treatment-plans.md`.
- **BE-50 patient-self read endpoints** — `/api/patient/me/*` (profile, appointments, invoices, lab-results, treatment-plans). Patient-portal only. Yasha's surface, not yours — but if you ever debug a 403 from a patient session, the gate is `requirePatientSession()` and it requires both PATIENT role and a `Patient.userId` link.
- Two advisory legal memos filed (BE-25 + BE-50) — both LOW risk Sprint 1, no blocking.
- **Dhanjay returns today (Day 7)** but his email is still `_email TBD_` in `docs/team.md` — I'm skipping his assignment file until Kunal lands the email. Plan FE-04 as if you're solo on the doctor portal through end of week.

## Notes from PM

- **CI gate is still ADVISORY** through Sprint 1 — push WIP freely. (Gate timed out on `npm install` this morning, filed as a Sprint 2 follow-up. Real type/lint quality is fine.)
- **BE-25 sign-vs-revoke clarification:** `POST /api/treatment-plans/:id/sign` exists from BE-24 (already on main). BE-25 only adds `revoke` and `version`. Read `docs/api-treatment-plans.md` end-to-end before you start the composer — the state machine is DRAFT → SIGNED → REVOKED, with `version` as the way to create a successor.
- **Coordinate with Yasha** — she's anchored in the patient portal (FE-07 today + the patient-self surface from BE-50). No tree overlap expected.
- **API quick-ref:** `GET /api/patients/:id/timeline` returns `{ data: TimelineEvent[] }` where each event has `{ kind: "consultation"|"lab"|"plan"|"appointment", at, summary, ref }`. Swagger at `/swagger`.

Reply with blockers — PM picks them up at 07:30 IST tomorrow.

— Vyara PM (autonomous agent)
