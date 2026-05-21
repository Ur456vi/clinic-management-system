To: Urvi Sharma <sharmaurvi48@gmail.com>
Cc: kunal@chirpin.in, varunpratapsingh191@gmail.com
From: Vyara PM <hello@algoborne.com>
Subject: [Vyara] Sprint 1 Day 9 — FE-05 lab result upload + view (today's headline)

Hi Urvi,

Day 9 of Sprint 1, 7 days to demo (Thu May 28). Today's master-plan target is **FE-05 lab result upload + view** (Day 9, originally Urvi/Dhanjay — Dhanjay's email is still TBD so this is yours solo until that lands). Today is also **first deploy to dev EC2** day on the infra side — so the lab-result flow you ship today is what will get smoke-tested against the deployed backend later this week.

No `urvi/**` ref hit origin in the last 48h, so I'm assuming FE-04 (patient detail + consultation form, your Day 7–8 headline) is still local WIP. Please push it this morning before starting FE-05 so I can review at the 14:00 dev-shift handoff.

Backend overnight: **BE-10 (pino structured logging)** and **BE-52 (CORS allow-list + same-origin CSRF guard + global security headers)** merged this morning. Effect on you: every `fetch()` from the doctor portal must now be same-origin (you're already on `/admin/**` so this is a no-op locally). If you start seeing 403 "CSRF: cross-origin mutating request rejected" anywhere, that's the new guard — please tell me, don't work around it.

## Today's tasks (Day 9)

**1. FE-04 — push to origin (close out)**

Push `urvi/FE-04-patient-detail-consultation` to `origin` before lunch. Even partially-done is fine — single push so I can review and merge it onto `main` before EC2 deploy starts pulling.

**2. FE-05 — Lab result upload + view (today's primary)**

Branch off latest `main` as `urvi/FE-05-lab-result-upload-view`. Two surfaces:

**Upload (inside the consultation form):**
- Add a "Attach lab result" affordance on the consultation form (FE-04 surface). On click → file picker, accept PDF + common image types, max 10MB.
- Get a presigned PUT URL from `POST /api/lab-results/{id}/attachment` (BE-20 — already on main). Upload directly to S3 with the returned URL.
- On success, attach the resulting `LabResult.id` to the in-progress consultation autosave. Show inline "Uploaded ✓ filename.pdf — N KB" with a remove button.
- Loading + error states: a single inline spinner during upload, friendly error toast on failure ("Upload failed — please retry"). Don't block the consultation form on upload failure.

**View (on patient detail):**
- New section on `/admin/(dashboard)/patients/[id]` titled "Lab results" listing the patient's lab results (most recent first), via `GET /api/patients/{id}/lab-results` if present, else iterate from the patient timeline (BE-21).
- Each row: collected date, lab name, analyte count, status flag (use the `flag` field if present), and a "View PDF" link that hits `GET /api/lab-results/{id}/attachment` for the signed download URL.
- Empty state: "No lab results yet" with a one-line hint.
- A small "Trend" affordance per analyte is **not in scope today** — BE-22 (trend endpoint) is still in review (stale branch, returned for rebase). Leave space in the layout for it; ship without.

**3. Spillover (if FE-05 closes early)**

Take a first pass at FE-09 (treatment plan view, Day 10 target — co-owned with Yasha/Dhanjay). Doctor-side read of `GET /api/patients/{id}/treatment-plans` and the active plan's items. No edits — just view. This protects against tomorrow's slip if anything blocks Yasha.

## How to ship

1. `git pull origin main`
2. `git checkout -b urvi/FE-05-lab-result-upload-view`
3. Commit with `feat(FE-05): <subject>` — small focused commits.
4. Push by 19:00 IST; I'll pick it up at the next 07:30 review.
5. If you hit a blocker, reply to this email — PM will pick it up at 07:30 tomorrow.

## Notes from PM

- **Heads-up on CSRF:** if you call any mutating endpoint via a different port/host during dev (e.g., a separate API server), it will now reject with 403. Use Next.js's same-origin proxy or run everything on `localhost:3000`.
- **No new branch from BE-22** — the trend endpoint is being rebased; leave the chart placeholder out of FE-05.
- **EC2 first deploy is today** on the infra side (separate workstream); your FE-05 doesn't need to be deploy-ready, but make sure no `http://localhost:3000` URLs are hardcoded — use relative paths so it works behind the nginx reverse proxy too.

— Vyara PM (autonomous agent)
