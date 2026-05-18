# Module: `rds`

Managed PostgreSQL 16 for Vyara on `ap-south-1`. Provisions the DB instance,
subnet group, security group, parameter group, Secrets Manager entry, and
Enhanced Monitoring IAM role.

## What this module assumes

- An existing VPC + at least 2 private subnets in different AZs (from
  `modules/network`).
- An existing web-tier security group ID — passed in as `web_security_group_id`.
  This module **does not** create that SG; the EC2 module (INF-05) owns it.

## Phase-1 defaults (deliberate)

| Setting | Value | Reason |
|---|---|---|
| Instance | `db.t3.small` (2 vCPU / 2 GB) | Sufficient for single-clinic load; ~₹1,800/mo |
| Storage | 20 GB gp3, autoscale to 100 GB | Clinical record growth is modest; autoscale headroom |
| Multi-AZ | OFF | Save ~₹1,800/mo. Flip `multi_az = true` ~1 week before go-live |
| Backups | 7 days | Vyara policy minimum; AWS max is 35 |
| Backup window | 18:30–19:00 UTC | 00:00–00:30 IST — quietest hour |
| Maintenance | Sun 19:30–20:30 UTC | Mon 01:00–02:00 IST |
| Encryption-at-rest | AWS-managed KMS | Free. Move to CMK in Phase 2 (BAA) |
| `rds.force_ssl` | `1` | Non-SSL connections refused |
| Deletion protection | ON | Final snapshot required on destroy |
| Performance Insights | ON, 7-day retention | Free tier |
| Enhanced monitoring | ON, 60s | OS-level metrics for capacity decisions |
| CloudWatch logs | `postgresql`, `upgrade` | Lock waits, slow queries, version bumps |

## Inputs

See [`variables.tf`](variables.tf). Required: `project`, `environment`, `vpc_id`,
`private_subnet_ids`, `web_security_group_id`.

## Outputs

See [`outputs.tf`](outputs.tf). Key ones: `db_endpoint`, `db_address`,
`secret_arn` (for the EC2 instance profile to read in INF-07).

## Cost (steady-state, ap-south-1, Phase 1)

| Line item | Approx. ₹/mo |
|---|---|
| `db.t3.small` on-demand (730h) | ~1,800 |
| 20 GB gp3 storage | ~200 |
| Backups (~20 GB) | free under 100% of provisioned |
| Enhanced monitoring (60s) | free under 100 MB/mo logs |
| Performance Insights (free tier) | 0 |
| **Total** | **~2,000** |

Reserved (1-yr no upfront) drops the instance cost ~30% — recommend switching
after 4 weeks of steady production load.

## What `terraform apply` will do

1. Create DB subnet group across private subnets.
2. Create RDS security group (no inbound until rule added).
3. Add ingress rule: 5432/tcp from `web_security_group_id`.
4. Create custom parameter group `vyara-prod-rds-pg16`.
5. Generate a 32-char random master password.
6. Create Enhanced Monitoring IAM role + attach AWS managed policy.
7. Create `aws_db_instance` — takes 8–12 min on first apply.
8. Create Secrets Manager secret + version with the connection JSON.

The first apply is slow because RDS provisions a fresh instance. Subsequent
plan/apply against config changes is fast unless `instance_class`,
`engine_version`, or `multi_az` are touched.

## What this module deliberately does NOT do

- **App schema / Prisma migrations** — handled by the application deploy
  pipeline (INF-10).
- **Read replicas** — not needed at Phase-1 traffic; add when CPU > 70% sustained.
- **Cross-region replica** — DR scope (INF-12), requires Aman sign-off.
- **CMK for encryption** — Phase 2, after BAA paperwork. Default KMS today.
- **Rotation Lambda** — set up in INF-07 alongside the app IAM profile.

## Operator runbook

See [`docs/infra/runbooks/rds-backup-restore.md`](../../../../docs/infra/runbooks/rds-backup-restore.md)
for backup verification, point-in-time recovery, and final-snapshot procedures.
