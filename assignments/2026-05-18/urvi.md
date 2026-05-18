To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 6 — FE-03 patient list with search (today's target)

Hi Urvi,

Day 6 of Sprint 1, 10 days to demo (Thu May 28). FE-01 (auth/login) is merged into `main` with the avatar/header polish — nice work. Assuming FE-02 (doctor dashboard layout) is still WIP in your local tree since no `urvi/**` ref landed on origin overnight. **Today's headline: FE-03 patient list with search — Day 6 sprint target.**

Backend kept rolling overnight — three more merges this morning: **BE-29 (plan → appointments materialization)**, **BE-41 (Razorpay-mock checkout)**, **INF-04 (RDS terraform module)**. None of these touch your surfaces today, but BE-29 unlocks FE-04 (Day 7, consultation form → sign plan → auto-creates patient appointments) — keep it in your peripheral vision.

## Today's tasks (Day 6)

**1. FE-02 — Doctor dashboard layout (close out)**

Push `urvi/FE-02-doctor-dashboard-layout` to `origin` before lunch so PM can review at the 14:00 dev-shift handoff. From yesterday's spec the open pieces are: side-nav + top bar shell in `app/admin/(dashboard)/layout.tsx`, dashboard widget content in `app/admin/(dashboard)/page.tsx` (today's appointment list via `GET /api/appointments?staffId=<self>&from=<today>&to=<tomorrow>`, quick-actions card, recent patients via `GET /api/patients?limit=5`), and the `getServerSession` role gate.

If FE-02 is mostly done already, fold any remaining polish into FE-03 — single PR is fine.

**2. FE-03 — Patient list with search (today's primary)**

Branch off latest `main` as `urvi/FE-03-patient-list`. The patient list page already exists at `app/admin/(dashboard)/patients/page.tsx` but ships **hardcoded mock data** today (`const patients = [...]` literal at the top of the file). FE-03 replaces that with live data + working search.

Required behaviour:

- Convert the page from a `"use client"` static list to a server component that fetches `GET /api/patients?q=<query>&page=<n>&limit=20`. BE-15 (patient search) is fully merged — query against `name`, `email`, `phone`, `id`. Spec in `docs/api-patients.md`.
- Search input wires to a URL query param (`?q=`) so links/refresh preserve the search. Use Next.js `searchParams` in the server component, debounced client input via a small wrapper component for the actual text field.
- Table columns: Name, ID, Phone, Email, Status, Registration date, Assigned doctor. Keep the existing visual styling (Lucide icons, the table grid as-is) — just swap the data source.
- Pagination: simple Prev/Next based on the API's `meta.totalPages` field.
- Loading state: Suspense fallback with a skeleton row × 5.
- Empty state: when `q` returns zero rows, show a friendly "No patients match `<q>`" with a "Clear search" link.
- Row click → `/admin/(dashboard)/patients/[id]` (FE-04 surface — Yasha/Dhanjay won't have built it yet, so just `Link` to that path; a 404 there for now is fine).
- The "+ Add Patient" button (already in the page header) → keep linking to the existing `patients/add` route.

Commit in slices: data fetch → search wiring → pagination → empty/loading states → polish.

**3. Stretch — FE-04 scaffold (Day 7 target, only if FE-03 lands by 16:00)**

If FE-03 is solid by mid-afternoon, scaffold `app/admin/(dashboard)/patients/[id]/page.tsx` — patient detail header (name, age, contact, last visit) + a `<ConsultationForm/>` placeholder. Don't wire the form yet (that's a Day 7 job once you've seen `docs/api-consultations.md` end-to-end). Pure layout + data fetch via `GET /api/patients/:id`.

**4. Push + PM review**

- `git pull origin main` first — five new commits since yesterday's note (BE-29, BE-41, INF-04, the legal memo, and the FE-01 polish that landed late).
- Push by EOD even if FE-03 is search-only without pagination. PM scans 07:30 IST tomorrow.

## What's new on `main` since yesterday

- **BE-29 plan → appointments** — `POST /api/treatment-plans/:id/sign` now materializes one `Appointment` per planned session. Doesn't touch your FE-03 surface but it's the backend you'll consume in FE-04 when the consultation form signs a plan.
- **BE-41 Razorpay mock** — `/api/payments/razorpay/{order,verify,webhook}`. Yasha + Dhanjay surface (FE-10 invoice screen, Day 11). Not yours today.
- **INF-04 RDS module** — infra only, no app code impact.
- One Day-6 legal memo filed (`docs/legal/2026-05-18-BE-41-razorpay-mock-checkout.md`, advisory).

## Notes from PM

- **CI gate is still ADVISORY** through Sprint 1 — push WIP freely. (Gate failed again this morning with the same `/tmp` permission env artifact as the last few shifts; filed as Sprint 2 follow-up. Real type/lint/prisma quality is fine.)
- **Dhanjay back tomorrow (May 19, Day 7).** I'll resume drafting his file from tomorrow's shift.
- **Coordinate with Yasha** — she's anchored in `app/patient/**` and `app/(public)/register/**`, you're in `app/admin/(dashboard)/**`. No tree overlap expected for FE-03.
- **API quick-ref:** `GET /api/patients?q=&page=&limit=` returns `{ data: Patient[], meta: { page, limit, total, totalPages } }`. Swagger UI at `/swagger` if you need to poke shapes.
- The existing patient list page is currently `"use client"` — converting it to a server component is a small refactor but worth it for the URL-state-driven search. Keep one small client wrapper for the debounced input only.

Reply with blockers — PM picks them up at 07:30 IST tomorrow.

— Vyara PM (autonomous agent)
