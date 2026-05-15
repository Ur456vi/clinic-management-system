# Terraform — Vyara / Algoborne infrastructure

Owner: **Cloud Engineer** agent. Reviewer / applier: Kunal (PM) and Varun (CEO).
Region: **`ap-south-1` (Mumbai)** — DPDP Act data residency. No resources outside this region without Aman's sign-off.

This directory holds the Terraform code that provisions Vyara's AWS footprint. In Phase 1 the agent **writes** these modules; humans run `terraform apply` from their own IAM credentials.

## Layout

```
infra/terraform/
├── README.md                     # this file
├── versions.tf                   # terraform + provider version pins
├── providers.tf                  # aws provider, region, default_tags
├── backend.tf                    # S3 remote state + DynamoDB lock
├── variables.tf                  # root-level variables (env, project, tags)
├── bootstrap/                    # one-shot: creates the state bucket + lock table
│   ├── README.md
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── envs/
    └── prod/                     # production stack root module (populated by later INF-** tasks)
        └── .gitkeep
```

## State backend

| Resource | Name |
|---|---|
| S3 bucket (state) | `algoborne-vyara-tfstate` |
| S3 key prefix | `vyara/<env>/terraform.tfstate` |
| Region | `ap-south-1` |
| Encryption | SSE-KMS, AWS-managed key (upgrade to CMK in INF-06) |
| Versioning | enabled |
| Public access | fully blocked |
| Lock table | DynamoDB `algoborne-vyara-tflock`, PAY_PER_REQUEST, hash key `LockID` |

The state bucket and lock table are **chicken-and-egg** — they have to exist before the rest of the Terraform can use them as a backend. The `bootstrap/` module creates them with **local state**, after which a human re-runs root Terraform with the S3 backend wired in.

## Bootstrap procedure (run once, by a human with admin creds)

```
cd infra/terraform/bootstrap
terraform init
terraform apply       # creates the state bucket + lock table; keeps local state
```

After bootstrap:

```
cd infra/terraform
terraform init        # uses S3 backend defined in backend.tf
terraform plan
```

## Conventions

- **Region:** every resource pinned to `ap-south-1`. Do not parameterise the region.
- **Tagging:** every resource carries `Project=vyara`, `ManagedBy=terraform`, `Environment=<env>`, `Owner=algoborne` via `default_tags`.
- **Naming:** `<project>-<env>-<resource>` — e.g. `vyara-prod-alb`. Lowercase, hyphen-separated.
- **Modules:** one module per logical layer (network, compute, data, edge, observability). Root modules under `envs/<env>/` instantiate them.
- **Secrets:** **never** in `.tfvars` checked into git. Use `aws_secretsmanager_secret_version` data sources or `TF_VAR_*` env vars at apply time.
- **State:** never commit `.tfstate` or `.tfstate.backup`. `.gitignore` enforces this.

## What this branch (INF-02) does NOT do

Skeleton only — backend, providers, conventions, bootstrap. Application infrastructure (VPC, EC2, RDS, S3, IAM, CloudWatch) each get their own INF-** branch (INF-03 through INF-10).

## Sequence to production

1. INF-01 — AWS account, Business Support, BAA signed (humans).
2. INF-02 — this branch: skeleton + bootstrap.
3. Human applies `bootstrap/` → state bucket + lock table exist.
4. INF-03 — VPC + subnets + routing.
5. INF-04 — RDS PostgreSQL.
6. INF-05 — ALB + ASG + launch template.
7. INF-06 — S3 (PHI + assets) with KMS CMK + Object Lock.
8. INF-07 — Secrets Manager + IAM instance profile.
9. INF-08 — Route 53 + ACM + CloudFront.
10. INF-09 — CloudWatch alarms.
11. INF-10 — GitHub Actions deploy pipeline.
