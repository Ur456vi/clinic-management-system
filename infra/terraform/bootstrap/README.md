# Bootstrap — Terraform remote state backend

**Run this once, by a human with AWS admin credentials, after INF-01 is complete.**

Creates the two resources that the root `infra/terraform/` configuration needs as its remote backend:

1. S3 bucket `algoborne-vyara-tfstate` — versioned, SSE-KMS, public access blocked.
2. DynamoDB table `algoborne-vyara-tflock` — PAY_PER_REQUEST, hash key `LockID`, used by Terraform's S3 backend to serialise `terraform plan/apply`.

State for this bootstrap module itself is **local** (`terraform.tfstate` in this directory). That's intentional — chicken-and-egg. Do not commit the resulting state file to git; the `.gitignore` already excludes it. After apply, store a copy of the state file in 1Password or the Algoborne ops vault as a safety net.

## Procedure

```bash
cd infra/terraform/bootstrap

# Authenticate with an admin role (SSO or `aws configure`).
aws sts get-caller-identity        # sanity check — confirm correct account.

terraform init
terraform plan -out=bootstrap.tfplan
terraform apply bootstrap.tfplan
```

Verify:

```bash
aws s3api get-bucket-versioning --bucket algoborne-vyara-tfstate --region ap-south-1
aws dynamodb describe-table --table-name algoborne-vyara-tflock --region ap-south-1 \
  --query 'Table.{Name:TableName,Status:TableStatus,Billing:BillingModeSummary.BillingMode}'
```

Then go back to `../` (root terraform), uncomment the `backend "s3"` block in `backend.tf`, and:

```bash
cd ..
terraform init -migrate-state    # there's no prior state to migrate; it just initialises the backend.
terraform plan
```

## Outputs

- `state_bucket_name` — pass to root `backend.tf` (already hard-coded for consistency).
- `lock_table_name`  — same.

## Reversibility

Destroying the bootstrap is intentionally hard:
- S3 bucket has versioning + public-access-block; you must empty all versions before `terraform destroy` succeeds.
- DynamoDB table has `prevent_destroy = true` lifecycle.

If you genuinely need to tear down (e.g. account migration), edit the lifecycle blocks, empty the bucket, then destroy. **Coordinate with Kunal first** — destroying the state backend orphans all downstream Terraform-managed resources.
