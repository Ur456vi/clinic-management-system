# infra/

Terraform modules, IAM policy JSON, deployment scripts.

Phase 1: design-only. Humans run `terraform apply`. See [`../docs/infra/README.md`](../docs/infra/README.md).

## Subfolders (to be added)

- `terraform/` — modules + environment compositions (staging, prod)
- `iam/` — least-privilege role policies as JSON
- `scripts/` — deploy, backup, restore, AMI build

## Conventions

- Terraform state backend: S3 bucket `algoborne-tfstate` in `ap-south-1`, DynamoDB table `algoborne-tfstate-lock`.
- One workspace per environment: `staging`, `prod`.
- Every PR includes a committed `terraform plan` output for human review.
- Never commit AWS credentials, even in examples. Use `.tfvars` files outside the repo.
