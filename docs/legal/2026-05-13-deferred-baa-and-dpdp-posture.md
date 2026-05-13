# Legal advisory — Deferred BAA & DPDP-only compliance posture for Phase 1

**Filed by:** PM Agent
**Filed on:** 2026-05-13
**Owner for review:** Adv. Aman Kaushik (Legal Head)
**Status:** Awaiting Aman's review and DPDP-posture memo

## Background

Algoborne is building the Vyara Clinic Management System for Dr. Yuvraaj's clinic. **All AWS resources live in the clinic-owned AWS account**, not Algoborne's. Algoborne operates the infrastructure as a **data processor** on the clinic's behalf — the clinic is data fiduciary AND account owner.

The system handles patient health information (PHI) and will process payments via the clinic's Razorpay merchant account. Standard practice for healthcare apps is to operate under HIPAA-equivalent contractual protection — for AWS that means the **account owner** signs a Business Associate Addendum (BAA) with AWS, which is gated behind AWS Business Support ($100/mo minimum, ~₹8,500/mo).

Algoborne, on behalf of the clinic, has forecasted an AWS budget cap of **₹5,000/mo**. AWS Business Support alone would consume 170% of this budget. Continuing with the full BAA stack is not financially viable at MVP stage. **The decision to sign the AWS BAA sits with the clinic, not Algoborne** — they're the account owner. Algoborne's recommendation: defer the BAA until revenue clears ₹50k/mo.

## What we're proposing

**Defer the BAA until revenue clears ₹50,000/mo.** Until then, operate under a DPDP-only compliance posture aligned with Indian data-protection law.

Specifically:

1. All patient data stored in AWS resources will reside in **`ap-south-1` (Mumbai)** — Indian jurisdiction satisfied for DPDP Act Section 16 (cross-border transfer) without notification requirements.
2. Data fiduciary obligations under DPDP Act §§ 7–13 apply directly to Vyara / Dr. Yuvraaj's clinic — not to Algoborne (we are the data processor). Clinic-side obligations include:
   - Notice + consent collection before processing patient data (UX-side responsibility)
   - Right to access, correct, erase, and grievance redress
   - Breach notification within 72 hours to the Data Protection Board
3. Algoborne, as data processor operating on the clinic's AWS account, will document and maintain:
   - **Data Processing Agreement (DPA)** between Algoborne and the clinic (template attached as separate doc — TBD; Aman to draft)
   - **Access logging** — CloudTrail (clinic-owned), app audit logs. Every action by `algoborne-engineering` IAM user is logged and visible to the clinic.
   - Encryption at rest (EBS, RDS, S3 — using AWS-managed KMS keys initially)
   - Encryption in transit (HTTPS only, TLS 1.2+)
   - 7-day backup retention with quarterly restore drills
   - Incident-response runbook with defined response time
   - **Scoped IAM access** — Algoborne operates only in `ap-south-1`, only on Vyara-tagged resources, never on billing or IAM-write.
4. **No HIPAA-style BAA exists between the clinic and AWS during Phase 1.** This means if AWS has a security incident affecting the Vyara environment, neither the clinic nor Algoborne has contractual indemnification or breach-notification SLA from AWS specific to PHI. The clinic carries this risk as data fiduciary.

## Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AWS infrastructure breach affecting Vyara data | Low (AWS posture is industry-leading) | High (PHI exposure, regulatory fine, reputation) | Move to BAA before revenue / patient volume material; encrypt at rest; minimize PHI surface |
| DPDP Act enforcement action against Vyara clinic | Medium (rules active, enforcement ramping up) | Medium-high (fines up to ₹250 crore for serious violations) | Aman drafts compliant consent/notice templates; clinic UX implements them; we document data flows |
| Patient data subject access request (DPDP §11) | Medium (will happen eventually) | Low if process exists; high if not | App-level DSR endpoint planned (BE-** backlog) |
| DISHA Bill enacted with retroactive requirements | Low-medium (Bill has been pending for years) | Medium (compliance retrofit cost) | Track via Aman's monthly check; DISHA is largely aligned with DPDP so retrofit gap is small |
| Cross-border data transfer (vendor: Resend, MSG91 servers) | Resend = US, MSG91 = India, Brevo = EU | Medium for Resend | Use only Indian-domiciled vendors for PHI-bearing comms (MSG91 for SMS, Interakt for WhatsApp). Restrict Resend to non-PHI dev-ops comms only. |

## What we need from Aman

1. **Review this risk assessment** and confirm acceptability for Phase 1 MVP. **Critical addition since this memo was first drafted:** AWS account ownership has shifted to the client. Aman, please confirm:
   - Algoborne is a data processor (not co-controller) under DPDP Act § 2(1)(g)
   - Clinic is data fiduciary AND data controller for all PHI in the system
   - Algoborne's scope is limited to operations within the clinic's AWS account, as documented in `docs/infra/iam-matrix.md`
2. **Draft a DPDP-compliant DPA** between Algoborne and Dr. Yuvraaj's clinic — covers data fiduciary / processor split, breach notification, **scoped-IAM access terms** (what Algoborne can and cannot touch on the clinic's AWS account), sub-processor list. Note: AWS, MSG91, Brevo, Interakt, Razorpay are all **clinic-direct contracts** (clinic-named accounts), not Algoborne sub-processors — confirm this routes their compliance obligations correctly.
3. **Draft a sub-processor disclosure** for the clinic to share with patients in their consent flow.
4. **Set a trigger condition** for when we revisit the BAA decision — proposed: revenue clears ₹50k/mo OR patient count clears 500 OR multi-clinic expansion, whichever comes first.
5. **Confirm Phase 1 vendor stack** is DPDP-compatible:
   - AWS (ap-south-1) — Indian region ✓
   - MSG91 — India-based, presumably DPDP-aware ✓
   - Brevo — EU-based, used only for non-PHI patient comms ⚠️
   - Interakt — India-based ✓
   - Resend — US-based, used only for internal Algoborne ops (no PHI) ✓
   - Razorpay — India-based, RBI-regulated ✓
6. **Recommend any additional safeguards** that fit the budget (free or low-cost) — e.g., field-level encryption for specific PHI columns, additional consent text, audit-log retention extension.

## Decision required

Either approve Phase 1 under DPDP-only posture, or surface a blocker that requires us to revisit the budget. If approval is given, Aman files this memo as accepted in `docs/legal/` and writes the corresponding DPA in `docs/legal/dpa-vyara-clinic.md`.

— PM Agent
