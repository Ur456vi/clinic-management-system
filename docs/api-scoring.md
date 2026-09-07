# IPHMH Scoring API

Read-only endpoints exposing the IPHMH wellness score derived from an RMO
consultation.

All routes follow the BE-07 conventions: `{ data }` / `{ error }` envelopes,
`x-request-id` response header, audit-log writes for every read of PHI.

## Direction of the scale

This is a **wellness** score — **higher is healthier**. The public-site Health
Assessment quiz (`/api/assessments`) is a **risk** score running the opposite
way. Never render the two side by side without labelling which is which.

## What is never exposed

The brief is explicit: score per question internally, expose per section only.
No endpoint returns a question's own point value, in any payload, on any
surface. `lib/scoring/engine.ts` is the serialisation boundary and
`lib/scoring/__tests__/serialization.test.ts` asserts it.

The patient payload is additionally stripped of red flags, completeness, the
scoring version, and answered/applicable counts.

## Manual scoring by the RMO

The RMO scores each question by hand on the **Scoring** tab of the consultation
form. The engine pre-fills a suggestion where it has a rule; the RMO overrules
it or leaves it. **A manual score always beats the derived one.**

Scores ride in one extra top-level key inside `Consultation.sections`:

```jsonc
{
  "personalHistory": { "personal_history__regularity": "Regular" },
  "scores":          { "personal_history__regularity": "10" }
}
```

JSONB, so **no schema change and no migration** — which matters, because
`DATABASE_URL` points at the shared live UAT database.

### What this unblocks

Manual scores also reach questions the config has no rule for, scored out of 10
(the document's universal per-item value). That is how the eight sections the
source document never resolved become scoreable without inventing point values
for them:

| Section | Score boxes |
| --- | --- |
| General Physical Examination | 42 |
| Men's Sexual Health History | 22 |
| Stress (PSS-10) | 10 |
| Energy | 1 |

192 questions carry a score box in total. Fields belonging to no scored section
(informant, demographics, marital status, work history) and every free-text note
or `_specify` helper are excluded, so a score can never be orphaned.

### Blank is not zero

An empty box means *"no override — use the derived score"*. A typed `0` means
*"this question scores nothing"*. `readManualScores` keeps them apart, and drops
any value that is not a finite number in `[0, 100]` rather than clamping it — a
nonsense value is a bug or a bad edit, and quietly making it plausible would
hide that.

### When scores can be entered or changed

Only while the consultation is `DRAFT`, `RMO_DONE` or `IN_PROGRESS`.
`updateConsultation` rejects any PATCH against a `SIGNED` row, so **once the
doctor signs, scores are frozen permanently.** There is currently no path to
correct a scoring mistake after signature. If one is needed, it has to be a
deliberate, audit-logged score-only amendment — not a relaxation of the
immutability rule.

### Section totals do not match the document

The scoring screen offers a box for every scorable control in a section. The
source document scores a different number of them, so the two totals diverge —
Bowel offers 130 against a declared 110, GPE offers 420 against a declared 600.
The screen shows both (`37 / 130   doc says / 110`) rather than quietly picking
one. Resolving it needs the document's own item list (F-1, F-2).

## Derivation, not storage

Scores are computed from `Consultation.sections` on every read. Nothing is
persisted, so:

- a rule change applies retroactively with no backfill;
- a cached score can never drift from the answers it summarises;
- **historical scores move when `SCORING_VERSION` moves.**

That last point is a clinical-governance decision, not a technical one. If the
score a doctor saw at signature must never change, the system needs a
`ConsultationScore` cache table stamped at signature instead. The two policies
are mutually exclusive.

---

## `GET /api/consultations/{id}/score`

The full score for one RMO consultation.

| Aspect | Value |
| --- | --- |
| Auth | required; role must be in `consultation:view` (ADMIN / DOCTOR / RMO) |
| Audit | writes a `READ` row against the consultation |
| 404 | consultation not found, or `type` is `MAIN` |

### Response (200)

```json
{
  "data": {
    "consultationId": "8f2c...",
    "patientId": "1a4b...",
    "consultationDate": "2026-09-06T10:12:00.000Z",
    "status": "SIGNED",
    "scoringVersion": "0.1.0",
    "totalScore": 264,
    "maxScore": 310,
    "completeness": 0.36,
    "redFlagCount": 2,
    "sections": [
      {
        "key": "bowel",
        "name": "Bowel / Gut Considerations",
        "score": 52,
        "maxScore": 60,
        "answered": 6,
        "applicable": 11,
        "indeterminate": 4,
        "unconfirmed": 3,
        "redFlags": [
          { "field": "personal_history__blood_in_stool",
            "label": "Blood in stool", "section": "bowel", "severity": "high" }
        ]
      }
    ]
  }
}
```

### Field notes

| Field | Meaning |
| --- | --- |
| `maxScore` | Points available on the questions **actually answered** (`DENOMINATOR_MODE = "answered"`). Not the document's declared total — see below. |
| `answered` / `applicable` | Drives completeness. `answered / applicable`. |
| `indeterminate` | Questions excluded from the completeness denominator because a blank is ambiguous. See "Indeterminate answers". |
| `unconfirmed` | Rules still awaiting sign-off from the source document. Surface these in the admin diagnostics panel. |
| `redFlags[].severity` | `high` or `moderate`. Never sent to the patient portal. |

### The denominator

`DENOMINATOR_MODE` in `lib/scoring/config/index.ts` selects between:

- **`"answered"` (current default)** — a question nobody answered is excluded
  from both the numerator and the denominator, so a partial intake is not
  punished. Pair it with the visible `completeness` figure: a 95% score at 30%
  completeness must never read as a thorough assessment.
- **`"all"`** — every applicable question counts, so an unanswered question
  scores zero and a half-finished intake looks like a very sick patient.

Each section's `declaredMax` (the document's own printed total) is exposed
through `SCORING_CONFIG` for diagnostics, **not** used as the divisor. Six
active sections do not currently reconcile against their declared total; using
those figures as denominators would make a perfect score unreachable.

### Indeterminate answers

Four bowel symptom controls and the 16-item parasomnias block are bare
checkboxes with no explicit "None" (defect B-20). A healthy patient ticks
nothing, `save()` drops the empty value, and the result is indistinguishable
from never having been asked.

Those questions are therefore reported as `indeterminate` and kept out of the
completeness denominator. Counting them as unanswered would cap a perfectly
completed intake at **72% completeness**, making any completeness gate
unreachable. They return to the denominator once M-14 gives them real
None/Present controls.

---

## `GET /api/patients/{id}/scores?limit=10`

Newest-first score history for one patient, one entry per RMO consultation.

| Aspect | Value |
| --- | --- |
| Auth | required; role must be in `consultation:view` |
| `limit` | 1–50, default 10 |

```json
{
  "data": [
    { "consultationId": "...", "date": "2026-09-06T10:12:00.000Z",
      "status": "SIGNED", "overallScore": 1204, "overallMaxScore": 1620,
      "delta": 102, "redFlagCount": 2, "completeness": 0.87 }
  ]
}
```

`delta` is **null** whenever the two consultations have different denominators —
a section became applicable, or a different set of questions was answered.
Subtracting raw totals across different maxima is misleading; compare
percentages and label the row.

---

## `GET /api/patient/me/scores?limit=10`

The calling patient's own history. PATIENT role only, ownership-pinned:
`patientId` comes from `requirePatientSession()` and is never read from the
query string.

```json
{
  "data": [
    { "consultationId": "...", "date": "2026-09-06T10:12:00.000Z",
      "overallScore": 1204, "overallMaxScore": 1620, "delta": 102 }
  ]
}
```

Excluded from this list:

- `DRAFT` consultations — a half-filled intake would show a misleadingly low
  number with no clinician present to explain it;
- anything below `PATIENT_COMPLETENESS_THRESHOLD` (currently `0.8`).

---

## `GET /api/patient/me/scores/{id}`

Section breakdown of one of the caller's own scores.

```json
{
  "data": {
    "consultationId": "...",
    "consultationDate": "2026-09-06T10:12:00.000Z",
    "totalScore": 1204,
    "maxScore": 1620,
    "sections": [
      { "key": "bowel", "name": "Bowel / Gut Considerations",
        "score": 90, "maxScore": 110 }
    ]
  }
}
```

A consultation id belonging to another patient returns **404**, not 403 — the
session's `patientId` is part of the `where` clause, so there is no branch that
could return someone else's row.

Returns 404 with `"Assessment still in progress"` below the completeness
threshold.

---

## `GET /api/patients?include=score`

Adds each patient's overall score from their latest RMO consultation to the
existing list response. Opt-in, because it derives a score per row and the
default list must stay cheap.

```json
{ "data": [ { "id": "...", "fullName": "...",
  "score": { "overallScore": 1204, "overallMaxScore": 1620,
             "consultationDate": "2026-09-06T10:12:00.000Z",
             "scoringVersion": "0.1.0" } } ] }
```

`score` is `null` when the patient has no RMO consultation.

**Always render the denominator or the percentage.** Male and female maxima
differ, so a bare total is not comparable between rows.

---

## `GET /api/appointments/{id}/rmo-summary`

Now also carries a `score` object (the same shape as
`GET /api/consultations/{id}/score`, minus the id/date wrapper) for the RMO
intake it returns, so the doctor sees section totals and red flags on the same
screen as the answers. `null` when there is no RMO intake.

---

## Sections not yet scored

Eight sections are declared but inactive; they contribute nothing to either
side of the score and are listed with their reason in `SCORING_OPEN_QUESTIONS`.

| Section | Declared | Blocked on |
| --- | --- | --- |
| General Physical Examination | 600 | F-2 — no reading of the document produces 600 (min 250, max 730) |
| Men's Sexual Health History | 190 | F-1 — two decompositions both total 190 |
| Systemic Examination | 160 | B-14 — not collected; `RMO_SHOW_FULL_GPE = false` |
| Energy | 50 | B-4 — form offers 5 options, document defines 6 tiers, no mapping |
| Stress (PSS-10) | — | F-3 — no point values, no reverse-scoring, opposite direction |
| Past Medical History | — | F-4 — negative-only, no base, no floor |
| Past Surgical History | — | F-4 |
| Personal Habits | — | F-5 — total not declared |

Six active sections also do not reconcile against their declared total (Sleep,
Mentation, Women's Health, Personal Hygiene, Miscellaneous, Body Weight). Each
carries a `note` explaining which defect blocks it.
