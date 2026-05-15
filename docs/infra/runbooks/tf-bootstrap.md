# Runbook — Bootstrapping the Terraform remote state backend

**When to run:** once, immediately after INF-01 (AWS account + Business Support + BAA) is complete.
**Who runs it:** a human with AWS admin credentials in the Algoborne AWS account (Varun or Kunal in Phase 1).
**Estimated time:** 5 minutes.

## Pre-flight

1. AWS CLI v2 installed and authenticated against the Algoborne AWS account.
2. `aws sts get-caller-identity` returns the expected account ID. Capture it.
3. Terraform `>= 1.7.0` on PATH (`terraform version`).
4. You are on branch `infra/INF-02-terraform-skeleton` (or main, after merge).

## Apply

```bash
cd infra/terraform/bootstrap
terraform init
terraform plan -out=bootstrap.tfplan
# Review the plan — expect ONE S3 bucket, ONE bucket policy, versioning, SSE config,
# public-access-block, ONE DynamoDB table. No IAM. No other resources.
terraform apply bootstrap.tfplan
```

## Post-apply verification

```bash
aws s3api get-bucket-versioning --bucket algoborne-vyara-tfstate --region ap-south-1
# Expect: { "Status": "Enabled" }

aws s3api get-public-access-block --bucket algoborne-vyara-tfstate --region ap-south-1
# Expect: all four flags = true

aws dynamodb describe-table --table-name algoborne-vyara-tflock --region ap-south-1 \
  --query 'Table.{Status:TableStatus,Billing:BillingModeSummary.BillingMode}'
# Expect: Status=ACTIVE, Billing=PAY_PER_REQUEST
```

## Wire the root configuration to the backend

1. Edit `infra/terraform/backend.tf` — uncomment the `backend "s3"` block.
2. Commit the change on a new infra branch (do **not** commit on `infra/INF-02-terraform-skeleton` — that branch is now historical).
3. Have the next INF-** branch include the `backend.tf` edit so reviewers see it.
4. `cd infra/terraform && terraform init` — Terraform will create an empty state object in the bucket.

## Rollback

Bootstrap resources have `prevent_destroy = true`. Do not roll back without first:

1. Confirming no other Terraform configurations are using the backend.
2. Coordinating with Kunal.
3. Removing the lifecycle block, emptying the bucket of all object versions, then `terraform destroy`.

## Safety net

After successful apply, store a copy of `bootstrap/terraform.tfstate` in the Algoborne 1Password vault under `Infrastructure / Vyara / tf-bootstrap-state`. This protects against accidental loss of the local state file — without it, the backend resources become unmanaged (still functional, but Terraform won't know about them).
