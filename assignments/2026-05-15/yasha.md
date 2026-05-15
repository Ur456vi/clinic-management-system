To: Yasha Sakeel <yasha6519@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 3 — FE-06 spec refinement + patient-portal scaffold prep

Hi Yasha,

Day 3 of Sprint 1 (12 days to demo). Your first **build** day is still Day 5 (Sun May 17) on **FE-06** — patient self-registration. Today: deepen yesterday's spec so it's implementation-ready, and pre-wire what you can without colliding with Urvi's FE-01.

## Today's tasks (Day 3)

**1. Finalize `docs/fe-06-patient-portal-spec.md` on a `yasha` WIP branch**
- Pull main first — 5 new commits this morning (BE-27 Appointment, BE-30 Staff CRUD, BE-56 Swagger UI at `/swagger`, INF-02 Terraform).
- Lock the field list against current `prisma/schema.prisma` Patient model. Confirm phone (E.164), DOB (yyyy-mm-dd), gender, address subfields.
- Decide and document: post-registration UX — auto-sign-in vs. redirect to login. Auto-sign-in is friendlier; flag the security trade-off in the spec.
- Add the validation table (per-field rules, error messages, max lengths).

**2. Backend gap check for FE-06 → file in spec doc**
- Confirm in `app/api/patients/route.ts` (POST) whether self-registration creates a `User` row with role `PATIENT` and links it to `Patient`. If BE-11 didn't cover the auth side, that's a backend gap — log it under "FE-06 dependencies" and PM will add it to the AI backlog.
- Read the freshly merged `docs/api-staff.md` and `docs/api-appointments.md` while you're in the API reference — FE-07/FE-08 will lean on the appointment endpoints.

**3. Patient dashboard layout sketch (FE-07 prep, Day 7 target)**
- In the same spec doc, append a "FE-07 layout sketch" section: nav, upcoming appointments card, treatment plan card, invoice card. ASCII-art or a Figma-export PNG checked into `docs/img/` both fine.

**4. Hold off on `app/patient/*` page files** — Urvi's FE-01 lands Day 4; scaffolding before that wastes a rebase. Spec + sketch only today.

## Branches I'm aware of

- **Merged into main:** BE-27 Appointment, BE-30 Staff CRUD, BE-56 OpenAPI+Swagger, INF-02 Terraform, + legal memo. Pull before branching.
- **AI shift today:** BE-15 (patient search) + BE-16 (LabResult). FE-06 won't collide with either.
- 4 stale `chore/*` branches left unmerged on remote — ignore them, they'll be closed next shift.

## Notes from PM

- **CI gate is ADVISORY** in Sprint 1; push WIP freely.
- **Dhanjay back May 19.** FE-09 (Day 10) assumes solo for now.
- The Swagger UI at `/swagger` is live as of this morning — use it as your interactive API reference while specing.

Reply with blockers — PM 07:30 tomorrow.

— Vyara PM (autonomous agent)
