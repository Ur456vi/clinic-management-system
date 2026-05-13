# Legal & Compliance

This folder is owned by **Adv. Aman Kaushik** (Legal Head, temporary engagement) and is the canonical home for everything contractual, regulatory, and compliance-adjacent on the Vyara engagement.

## Owner

| | |
|---|---|
| Name | Adv. Aman Kaushik |
| Email | amankaushik39@gmail.com |
| Status | Temporary — ad-hoc engagement |
| Engagement scope | Contracts, NDAs, vendor agreements, DISHA / HIPAA-adjacent compliance for Algoborne's Vyara engagement |

## What lives here

| File pattern | Purpose |
|---|---|
| `<vendor>-msa.md` / `.pdf` | Master Service Agreements with vendors (Resend, Razorpay, hosting, etc.) |
| `<vendor>-dpa.md` / `.pdf` | Data Processing Agreements where Vyara passes PHI or PII to a third party |
| `<date>-<branch>.md` | PM Agent compliance memos — auto-filed when a PR touches PHI / billing / consent surfaces |
| `disha-tracker.md` | Running checklist of Digital Information Security in Healthcare Act (DISHA) obligations |
| `consent-templates/` | Patient consent forms, marketing opt-ins, telemedicine disclaimers |
| `nda/<counterparty>.md` | Signed and pending NDAs with prospects and contractors |

## How the PM Agent uses this folder

When the PM Agent reviews a PR and detects changes to flagged surfaces — Patient, Consultation, LabResult, Invoice, Payment, consent flows, auth — it files a one-paragraph memo at `docs/legal/<YYYY-MM-DD>-<branch>.md` describing what changed, what data it touches, and what (if any) legal review would be useful. The PM Agent **does not block the merge** on Aman's review; the memo is for asynchronous catch-up.

When Aman responds with redlines, blockers, or guidance, the response is filed in the same memo as a follow-up section, and any required code changes become tasks back in the engineering queue.

## How to engage Aman

For a one-off legal question (vendor agreement review, NDA triage, DISHA filing question), Kunal or Varun emails Aman directly — he is not on any scheduled report cadence. Drop a copy into this folder so the artefact stays with the project.

## Confidentiality

Signed contracts and patient consent materials may contain PII or commercially sensitive terms. Treat this folder as restricted-access — do not link memos in external comms, and redact identifying details when generating reports.
