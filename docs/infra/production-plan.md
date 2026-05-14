# AWS Infrastructure — Finalized Plan

Decisions and sizing for the Vyara engagement, **finalized 2026-05-13**.

**Account ownership:** All AWS resources for the Vyara engagement live in **Dr. Yuvraaj's clinic-owned AWS account**, not Algoborne's. Algoborne operates the infrastructure as a data processor under a DPA with the clinic. The AWS bill goes to the clinic; Algoborne does not pay AWS for Vyara.

**Budget scope (₹5k AWS-only ceiling) applies to the client's AWS bill** that Algoborne forecasts on the clinic's behalf. Third-party vendor costs (MSG91, Brevo, Interakt, etc.) sit on top — see [`vendor-costs.md`](./vendor-costs.md). Most vendor accounts are also **client-owned** so billing relationships are consolidated under Dr. Yuvraaj.

## Headline decisions

| | Pick | Why |
|---|---|---|
| **Cloud account** | **Dr. Yuvraaj's clinic AWS account**, region `ap-south-1` (Mumbai) | DPDP Act data residency; client is data fiduciary, Algoborne is data processor. Algoborne gets scoped IAM admin only — no root, no billing. |
| **Phasing** | Dev now → Prod after Milestone 1 client approval | Defer prod spend until client signs off on first deliverable. |
| **Dev access** | Direct via EC2 elastic IP over HTTP (no domain in Phase 1A) | Skips DNS / TLS setup; team accesses dev via `http://<elastic-ip>` for now. |
| **Prod domain** | Deferred until Milestone 1 cutover | Client picks domain at production time. |
| **HA / ALB** | Single EC2 + nginx in Phase 1 (no ALB) | Saves ~₹1,800/mo. Single point of failure — acceptable for MVP scale. |
| **BAA / Business Support** | **Deferred until revenue clears ₹50k/mo** | Saves ~₹8,500/mo. DPDP-only compliance posture written by Aman covers India regs. |
| **Database** | One RDS PostgreSQL `db.t4g.micro` shared between envs (logical DBs `vyara_prod`, `vyara_dev`) | Cost-optimal. Promote sizing when prod traffic warrants it. |
| **CDN** | CloudFront — free tier covers first 1 TB/mo | Adequate for clinic scale. |
| **Monitoring** | CloudWatch basic + Sentry free tier | ~10 alarms, focus on the highest-signal ones. |

## Phase 1A — Dev environment (immediate)

Goal: get the AI dev agents and human developers building against a real cloud database and a public dev URL so the client can see progress.

| Resource | Spec | Cost/mo |
|---|---|---|
| EC2 instance (`vyara-dev-01`) | `t3.micro` reserved (2 vCPU / 1 GB), Ubuntu 22.04, Docker | ₹500 |
| RDS PostgreSQL (`vyara-rds-01`) | `db.t4g.micro` (2 vCPU / 1 GB), 20 GB gp3, single-AZ, 7-day backups | ₹900 |
| S3 buckets | `algoborne-vyara-dev-assets` (public, CloudFront-fronted), `algoborne-vyara-dev-phi` (private, SSE-S3) | ₹150 |
| Route 53 / ACM / CloudFront | **Deferred** — no domain in Phase 1A | ₹0 |
| Secrets Manager | One secret `vyara/dev/app` | ₹40 |
| Backups | RDS automated (included) + 1 weekly EC2 AMI snapshot | ₹50 |
| Data transfer + misc buffer | | ~₹400 |
| **Phase 1A total** | | **~₹2,040/mo** |

**Live in:** ~5 business days from AWS account creation (INF-01 through INF-08).

## Phase 1B — Production cutover (after Milestone 1 approval)

Goal: production traffic, real patients, real money. Triggered by client signing off on Milestone 1 deliverable + paying first invoice.

| Change | Additional cost/mo |
|---|---|
| Add EC2 instance (`vyara-prod-01`) `t3.small` reserved (2 vCPU / 2 GB) | ₹1,200 |
| Add second logical DB `vyara_prod` on the existing RDS instance (no new instance) | ₹0 |
| Add prod S3 buckets `algoborne-vyara-prod-{assets,phi}` | ₹150 |
| Register prod domain (deferred — clinic picks at Milestone 1; estimate ₹400/year amortized) | ₹35 |
| ACM cert for prod domain | ₹0 |
| Extra Secrets Manager secret `vyara/prod/app` | ₹40 |
| CloudWatch alarms for prod EC2 + RDS | ₹50 |
| Increase RDS storage from 20 GB → 40 GB gp3 | ₹200 |
| Data transfer + buffer (prod traffic) | ₹800 |
| **Phase 1B incremental** | **~₹2,475/mo** |
| **Combined Phase 1A + 1B** | **~₹4,515/mo** ✓ within ₹5k cap |

**Live in:** ~3 business days after Milestone 1 client sign-off (INF-13 prod cutover task).

## Phase 2 — Triggers for upgrading

Re-evaluate sizing and add the cuts back when any of these hit:

| Trigger | What gets added | Incremental cost/mo |
|---|---|---|
| Revenue clears ₹50k/mo | AWS Business Support → HIPAA-equivalent BAA | ~₹8,500 |
| Concurrent users >50 | ALB + autoscaling group min=2 | ~₹1,800 + extra EC2 |
| Postgres connections >70% utilized | Promote RDS to `db.t3.small` Multi-AZ | ~₹2,500 |
| Multi-clinic / multi-region | Pilot-light DR in `ap-southeast-1` | ~₹3,000 |
| PHI breach risk audit | KMS-encrypted S3 buckets, Object Lock Compliance mode | ~₹100 |

These move us back toward the original ~₹14-16k/mo "compliance-grade" plan. Plan for the upgrade when the business justifies it; don't pre-buy.

## Sequencing — first 5 business days (INF-01 → INF-08)

```
Day 0 (today)  INF-00: Kunal + Varun review this plan + Aman's DPDP memo
Day 1          INF-01: Kunal coordinates with Dr. Yuvraaj to set up the clinic's AWS account (clinic provides card + signs as root; Kunal walks them through it). Kunal gets IAM admin user.
Day 1          INF-02: Cloud Engineer writes Terraform skeleton (state bucket, providers)
Day 2          INF-03: VPC + 2 public + 2 private subnets across 2 AZs (ap-south-1a, 1b)
Day 2          INF-04: RDS PostgreSQL db.t4g.micro + parameter group + security group
Day 3          INF-05: EC2 t3.micro + IAM instance profile + Docker baked into AMI
Day 3          INF-06: S3 buckets + bucket policies
Day 3          INF-07: Secrets Manager + .env injection from instance profile
Day 4          INF-08: nginx HTTP reverse proxy on EC2 + elastic IP allocation (no domain yet)
Day 5          INF-09: CloudWatch alarms (10 alarms — CPU, RDS, disk, 5xx, backup-fail)
Day 5          INF-10: GitHub Actions deploy pipeline (build → SSM run-command on EC2)
Day 5          Smoke test: deploy current main, hit http://<elastic-ip>/api/health
Phase 1B       INF-08b: domain + Route 53 + ACM + HTTPS — added when client picks production domain
```

**Cloud Engineer agent picks up INF-02 onwards** on its 09:30 IST shift. Each INF lands as a separate `infra/INF-XX-<slug>` branch with Terraform code + a `terraform plan` output. Kunal reviews, runs `terraform apply` from their own credentials, and merges.

## What blocks the Cloud Engineer

Until INF-01 completes, the Cloud Engineer agent is stuck in design-only mode — it can write Terraform but nothing can be applied. **INF-01 is the critical path.**

Specifically:

**Dr. Yuvraaj's clinic does** (with Kunal walking them through it):
1. Create AWS account at https://aws.amazon.com/ using an email the clinic controls (e.g. `aws@<clinic-domain>`); clinic's card on file as billing payer.
2. Enable hardware MFA on root user (clinic admin holds the device + recovery codes).
3. Provide Kunal with: (a) account email, (b) temporary console password for the freshly-created account so he can complete setup. (Or, faster path: Kunal sets up the entire account end-to-end using clinic-provided email + card during account-creation flow.)
4. Sign the DPA between the clinic and Algoborne (drafted by Aman — see legal memo).

**Kunal does** (during a single ~90-min session with the clinic admin):
1. Log into the new AWS account (using clinic-provided root credentials with MFA on hand) — `ap-south-1`.
2. Set up hardware MFA on the root user; hand the MFA device + recovery codes to the clinic admin for safekeeping.
3. Create IAM admin user `algoborne-engineering` for himself, with the scoped permissions in `docs/infra/iam-matrix.md`. MFA enabled. Save creds to Kunal's 1Password.
4. Create IAM user `clinic-billing` for clinic finance (billing-view only).
5. Log out as root, log back in as `algoborne-engineering`.
6. Create Terraform state S3 bucket `vyara-tfstate-mumbai` + DynamoDB lock table `vyara-tfstate-lock`.
7. Enable CloudTrail (free for first trail) and AWS Cost Anomaly Detection.
8. Set billing alerts at ₹3k / ₹4k / ₹5k — recipient is clinic billing contact; Kunal + Varun Cc'd.
9. **Lock root credentials away** — hand to clinic admin in sealed envelope or similar offline storage.

Once those are done, the Cloud Engineer can run INF-02 through INF-10 in successive 09:30 shifts and the dev environment is live in ~5 days.
