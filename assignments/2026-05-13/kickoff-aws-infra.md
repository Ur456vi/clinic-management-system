To: Kunal <kunal@chirpin.in>, Varun Pratap Singh <varunpratapsingh191@gmail.com>
Cc: Adv. Aman Kaushik <amankaushik39@gmail.com>
Subject: [Algoborne / Vyara] AWS infra plan finalized — client-account model, action items

Hi Kunal, Varun, Aman,

The Cloud Engineer agent has finalized the AWS infrastructure plan for the Vyara engagement. **Major change: all AWS resources live in Dr. Yuvraaj's clinic-owned AWS account — Algoborne does not pay AWS for Vyara.** We operate the infrastructure on the client's account as a data processor under a DPA. The clinic doesn't have an AWS account yet, so **Algoborne will set it up on their behalf** (clinic provides email + card, Kunal does the actual setup). Full details are in the repo under `docs/infra/` and `docs/legal/`.

## What changes vs. typical agency engagement

| Aspect | Convention | Our model |
|---|---|---|
| AWS account | Vendor owns, bills client | **Client owns, pays AWS directly** |
| Account setup | Client does it themselves | **Algoborne sets it up on the client's behalf** (clinic provides email + card; Kunal executes; root credentials handed back to clinic at end) |
| Patient-facing vendor accounts (MSG91, Brevo, Interakt) | Vendor owns | **Client owns** (sender names = clinic) |
| Internal tools (Resend, GitHub, Sentry) | Vendor owns | Algoborne owns (existing free tiers) |
| BAA decision | Vendor signs with AWS | **Client signs with AWS** (Aman to advise) |
| DPA | Vendor → client | Algoborne → clinic (Aman to draft) |
| Algoborne's monthly Vyara cost exposure | High (entire infra spend) | **~₹0** |

This is a cleaner setup for everyone: clinic owns the business assets (account, sender identities, merchant account), Algoborne owns the engineering work, no awkward vendor-pays-then-invoices-client churn.

## Plan summary

**Phasing:**
- **Phase 1A (now):** Dev only. Access via direct EC2 elastic IP (`http://<ip>`) — **no domain in Phase 1A**, deferred to Milestone 1 cutover. ~₹2,000/mo on the clinic's AWS bill. Live in ~5 business days after INF-01 completes.
- **Phase 1B (after Milestone 1 client approval):** Production cutover. Adds prod EC2 + prod DB + prod domain (client picks). ~₹4,500/mo total clinic AWS spend. Live in ~3 business days after sign-off.

**Stack (Phase 1A starting point):**
- Region: `ap-south-1` (Mumbai) — DPDP Act data residency
- 1× EC2 `t3.micro` running nginx + Docker + the Vyara Next.js app
- 1× RDS PostgreSQL `db.t4g.micro` (one instance, two logical DBs `vyara_dev` now, `vyara_prod` in Phase 1B)
- S3 buckets for assets + PHI documents
- **Domain / Route 53 / ACM / CloudFront — all deferred to Phase 1B.** Dev team accesses via the EC2 elastic IP for now.

**Budget scope:** the ₹5,000/mo ceiling is **AWS infrastructure only** on the clinic's account. Vendor costs (Interakt ₹999/mo etc.) sit on top, in vendor accounts owned by the clinic.

## Total operational cost — who pays what

| Bucket | Phase 1A | Phase 1B (MVP) | Steady state | Paid by |
|---|---|---|---|---|
| AWS (clinic account) | ~₹2,000 | ~₹4,500 | ~₹6,000 | **Clinic** |
| Vendor fixed (Interakt + DLT) | ₹0 | ~₹1,400 | ~₹3,650 | **Clinic** |
| Vendor variable (SMS + WA templates) | ₹0 | ~₹200 | ~₹670 | **Clinic** |
| Razorpay fees (2.36% per txn) | ₹0 | ~₹2,360 | ~₹7,080 | **Clinic** (auto-deducted from settlements) |
| **Total clinic ops cost** | **~₹2,000** | **~₹8,460** | **~₹17,400** | |
| Algoborne ongoing exposure | ₹0 | ₹0 | ₹0 | (Internal free tiers only) |

## Vendor stack — finalized picks

| Category | Vendor | Owned by | Onboarding lead |
|---|---|---|---|
| OTP / SMS | **MSG91** | Clinic (clinic-named DLT sender) | Kunal coordinates KYC with clinic |
| Patient email | **Brevo** | Clinic | Kunal coordinates KYC with clinic |
| WhatsApp Business | **Interakt** | Clinic (clinic's WABA + Facebook Business) | Kunal coordinates with clinic |
| Payment gateway | **Razorpay** | Clinic | Already clinic-owned; Kunal handles API key handoff |
| Internal dev-ops email | **Resend** | Algoborne | Already in place |
| Error monitoring | **Sentry** (free) | Algoborne | Anyone in eng |
| Uptime monitoring | **UptimeRobot** (free) | Algoborne | Anyone in eng |
| Hosting + DB | **AWS** (`ap-south-1`) | **Clinic** | INF-01 — Kunal sets up on clinic's behalf |

**What we explicitly deferred** (to fit ₹5k AWS ceiling):
- **AWS Business Support + BAA** — saves ₹8,500/mo. Phase 1 operates under DPDP-only compliance. **Clinic** (account owner) makes the final call; Aman, please review the deferred-BAA memo at `docs/legal/2026-05-13-deferred-baa-and-dpdp-posture.md`.
- **ALB** — saves ₹1,800/mo. Single EC2 with nginx. Trade-off: single point of failure, ~10 min downtime to restore.
- **Multi-AZ RDS** — single AZ. Rare AZ outages accepted as MVP trade-off.
- **Domain / Route 53 / ACM** — deferred. Dev accessed via raw EC2 elastic IP for Phase 1A. Wired in at Phase 1B when the clinic picks a production domain.

Re-evaluate all four when revenue clears ₹50k/mo.

## What we need from each of you

### Varun (CEO) — review + approve

One thing only — review this plan, confirm the client-account model is the direction you want, and approve the deferred-BAA decision (which the clinic also has to approve). After approval, you're hands-off; Kunal owns execution.

### Kunal (PM) — coordinates with clinic + runs INF-01

You're the bridge between the clinic and Algoborne. Approximate time over the next week: ~2 hours total.

**Step 1 — coordinate with Dr. Yuvraaj (~30 min call or email)**

Ask the clinic for:
- An email address they control to use as the AWS root account email (e.g. `aws@<clinic-domain>.in` or whatever they prefer)
- A credit / debit card they're comfortable attaching to AWS for billing (clinic-name preferred)
- A clinic admin (Dr. Yuvraaj or a designate) available for a ~90-min call to receive root credentials at the end of setup

**Step 2 — INF-01 setup session (~90 min with the clinic admin on-call)**

You execute on screen-share:
1. Create AWS account at https://aws.amazon.com/ using clinic email + card
2. Set up hardware MFA on root user (clinic admin holds the MFA device + recovery codes afterward — never Algoborne)
3. Create IAM admin user `algoborne-engineering` (your day-to-day user) scoped to `ap-south-1` with MFA
4. Create IAM user `clinic-billing` for clinic finance (billing-view only)
5. Enable CloudTrail + AWS Cost Anomaly Detection
6. Set billing alerts at ₹3k / ₹4k / ₹5k (clinic billing contact = recipient; you + Varun Cc'd)
7. Log out as root, log back in as `algoborne-engineering`
8. Create Terraform state S3 bucket `vyara-tfstate-mumbai` + DynamoDB lock table `vyara-tfstate-lock`
9. Hand root MFA + recovery codes to clinic admin in sealed envelope — clinic locks these away

**Step 3 — vendor onboarding clocks (start in parallel, don't block AWS):**
- MSG91 KYC + DLT registration — **clinic-named accounts** — coordinate KYC docs with the clinic
- Interakt + WhatsApp Business approval — **clinic's WABA**, needs Facebook Business Manager verified by clinic
- Brevo signup — **clinic-named account** for patient email
- **Razorpay handoff** — Dr. Yuvraaj's clinic creates its own Razorpay merchant account (if not already); you receive API key + webhook secret for the integration

**Step 4 — ongoing operations:**
- From INF-01 completion onwards, you're the human applier for INF-02 → INF-10. Cloud Engineer agent writes Terraform on `infra/INF-XX-*` branches; you `terraform apply` from your `algoborne-engineering` creds.
- Track the clinic's AWS bill weekly — flag anything over ₹200/day or any single line item >₹1,500/mo.

### Aman (Legal Head) — compliance posture

1. **Review `docs/legal/2026-05-13-deferred-baa-and-dpdp-posture.md` within ~1 week.** Latest version reflects the client-account model:
   - Confirm Algoborne is a data processor (not co-controller) under DPDP § 2(1)(g)
   - Confirm clinic is data fiduciary AND data controller for all PHI
   - Confirm Algoborne's scope is appropriately limited to operations within the clinic's AWS account
2. **Draft the DPA** between Algoborne and Dr. Yuvraaj's clinic — data-fiduciary/processor split, breach notification, scoped-IAM access terms, sub-processor list. Note: AWS / MSG91 / Brevo / Interakt / Razorpay are all **clinic-direct contracts** (clinic-named accounts), not Algoborne sub-processors. Confirm this routes their compliance obligations correctly.
3. **Draft the sub-processor disclosure** for the clinic to use in its patient consent flow.
4. **BAA recommendation** — confirm whether the clinic should defer or sign AWS BAA now. If sign-now, that adds ~₹8,500/mo to the clinic's AWS bill.

## Sequencing

Once Kunal completes INF-01 with the clinic (target: this week, depends on scheduling the 90-min session), the Cloud Engineer agent begins running its 09:30 IST shifts and ships one INF-** task per day for ~5 days. Kunal applies each one. By end of Week 2, the dev environment is live (accessed via EC2 elastic IP), the team can deploy against real cloud, and we move on to clinical features.

**Aman's review can happen in parallel** — Phase 1A uses no real PHI (test data only). PHI lands in Phase 1B with production cutover, which is when Aman's DPA must be signed and the clinic picks its production domain.

## Open question (one)

**Clinic IT contact** — is Dr. Yuvraaj setting up AWS himself (on the call with Kunal), or does the clinic have an IT admin who'll be the long-term holder of root credentials? Knowing this lets Kunal schedule the setup session with the right person.

Reply when you've reviewed. After Varun's approval and any pushback from Aman, I'll send a separate brief to Dr. Yuvraaj (via Kunal) with the clinic-side checklist (email + card + admin availability).

— Vyara PM Agent (autonomous, on behalf of Algoborne)
Algoborne | AI-augmented engineering for the Vyara engagement
