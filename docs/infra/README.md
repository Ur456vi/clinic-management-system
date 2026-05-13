# Infrastructure — Algoborne / Vyara

Owner: **Cloud Engineer** (AI agent, `Cloud-Engineer` author identity).
Reviewer / applier: **Kunal Sani** (PM) and **Varun Pratap Singh** (CEO) — see Phase 1 access model in [`../org-policy.md`](../org-policy.md#aws-access-model-phase-1).

This folder holds **infrastructure design artefacts** — Terraform modules, IAM policies, deployment runbooks, network topology, and operational runbooks. Production AWS resources are provisioned by **humans applying these artefacts**, not by the agent directly.

## Cloud account

| | |
|---|---|
| Provider | AWS |
| Account holder | Algoborne |
| Region (primary) | `ap-south-1` (Mumbai) |
| Region (backup, future) | `ap-southeast-1` (Singapore) — DR only, requires Aman's review |
| Support tier | Business Support ($100/mo minimum) — **required for HIPAA-equivalent BAA** |

## Production stack (target — to be provisioned)

| Layer | Service | Sizing (initial) | Notes |
|---|---|---|---|
| Compute | **EC2** | `t3.medium` (2 vCPU / 4 GB) initially, on Reserved (1-yr) | Ubuntu 22.04 LTS, Docker, behind ALB. Autoscaling group with min=1, max=3. |
| Load balancer | **ALB** | One ALB, two AZs | HTTPS via ACM, redirect HTTP → HTTPS. |
| Database | **RDS PostgreSQL 16** | `db.t3.small` (2 vCPU / 2 GB), 20 GB gp3, Multi-AZ off initially | Enable Multi-AZ before go-live. Automated backups 7-day retention. Performance Insights on. |
| Storage | **S3** | Two buckets: `vyara-phi-{env}` (SSE-KMS, private, VPC endpoint only) and `vyara-assets-{env}` (public, CloudFront-fronted) | PHI bucket has Object Lock in Compliance mode for audit trail. |
| Secrets | **AWS Secrets Manager** | One secret per env: `vyara/prod/app` | Rotated quarterly. Application reads via IAM role, never via env vars. |
| Cache (future) | **ElastiCache Redis** | `cache.t4g.micro` | Add when session count exceeds ~100 concurrent. |
| Monitoring | **CloudWatch** + **Sentry** | Default metrics + custom alarms | Alarms route to PagerDuty (TBD) and email Kunal + Varun. |
| DNS | **Route 53** | Hosted zone for vyara domain | Failover routing once Multi-AZ RDS is on. |
| CDN | **CloudFront** | One distribution in front of S3 assets bucket + ALB | Reduces ALB load; HIPAA-eligible. |
| Certs | **ACM** | Wildcard cert for the production domain | Auto-renew. |
| CI/CD | **GitHub Actions** → SSH/SSM to EC2 | Single deploy script in `scripts/deploy/` | Eventually move to CodeDeploy or ECS. |

**Estimated monthly cost (steady state, no traffic spikes): ~₹9,000–11,000 (~$110–135)**, dominated by EC2, RDS, ALB, and Business Support.

## What lives here

| Path | Purpose |
|---|---|
| `infra/terraform/` | Terraform modules — VPC, EC2, RDS, S3, IAM, CloudFront, Route 53. State in S3 + DynamoDB lock. |
| `infra/iam/` | Per-role policy JSON (least-privilege) — `pm-agent-role.json`, `cloud-engineer-role.json` (future), `app-instance-profile.json`. |
| `infra/scripts/` | Bash deployment scripts, AMI builders, backup scripts. |
| `docs/infra/README.md` | This file. |
| `docs/infra/network.md` | VPC layout, subnet CIDRs, security-group matrix. (TBD) |
| `docs/infra/runbooks/` | Incident response, restore-from-backup, cert renewal, EC2 replacement. (TBD) |
| `docs/infra/aws-bill.md` | Monthly cost tracking, optimization notes. (TBD) |

## Open work (initial backlog)

| ID | Task | Phase |
|---|---|---|
| INF-01 | AWS account setup + Business Support signup + BAA signed | Pre-Terraform |
| INF-02 | Terraform skeleton (state bucket, lock table, providers, ap-south-1) | Phase 1 |
| INF-03 | VPC + 3 public + 3 private subnets across 3 AZs | Phase 1 |
| INF-04 | RDS PostgreSQL with backups + parameter group | Phase 1 |
| INF-05 | EC2 ALB + ASG + launch template (Ubuntu 22.04, Docker) | Phase 1 |
| INF-06 | S3 buckets (PHI with KMS + Object Lock, assets bucket) | Phase 1 |
| INF-07 | Secrets Manager + IAM instance profile | Phase 1 |
| INF-08 | Route 53 zone + ACM cert + CloudFront | Phase 1 |
| INF-09 | CloudWatch alarms (CPU, RDS connections, ALB 5xx, backup failures) | Phase 1 |
| INF-10 | GitHub Actions deploy pipeline (build → push image → SSM run-command) | Phase 1 |
| INF-11 | Backup verification — restore drill (quarterly) | Phase 2 |
| INF-12 | DR plan — pilot-light to ap-southeast-1 (Aman to review) | Phase 2 |

The Cloud Engineer agent picks one INF-** task per shift starting after the chore is merged. Each task lands as a `infra/INF-XX-<slug>` branch with Terraform + a README explaining what changed and what `terraform apply` will do.

## Compliance touch-points (Aman's review needed)

- AWS BAA terms before signing
- KMS key policy for PHI bucket
- IAM policies for any role that touches PHI
- S3 Object Lock retention period (DISHA requires 7 years for clinical records — confirm with Aman)
- Cross-region replication (if/when added)
- Vendor data-processing terms for CloudFront edge caching of any PHI-adjacent content
