# Runbook — VPC incident

Owner: Cloud Engineer. Escalate to: Kunal (PM), then Varun (CEO).

Use this runbook when something is wrong at the **network layer** — symptoms like:

- Application can't reach RDS (`could not connect to server: timeout`).
- ALB target health is failing across all targets.
- VPC Flow Logs have stopped flowing into CloudWatch.
- An audit shows route-table or security-group drift from Terraform state.

This is a **Phase 1** runbook — the agent does NOT have AWS credentials. Steps that require AWS API access are done by a human (Kunal or Varun) with their console / CLI session.

---

## 1. Triage — is it actually the VPC?

Before assuming the VPC is broken, rule out the cheap explanations:

| Symptom | Cheap check | If positive |
|---|---|---|
| App can't reach DB | EC2 → RDS security-group rule still present? (`sg-rds` accepts 5432 from `sg-public-web`) | Re-apply Terraform; do NOT hand-edit. |
| ALB 5xx surge | App-level error or unhealthy target group? Check ALB target health and app logs. | Defer to app runbook, not VPC. |
| Flow Logs silent | Log group exists? IAM role still has `logs:PutLogEvents`? | Continue to step 3. |
| Drift in route tables | `terraform plan` shows changes nobody made | Continue to step 4. |

If none of the cheap checks match, this is probably a real VPC issue → continue.

---

## 2. Confirm the blast radius

In the AWS console (human), capture:

- `aws_vpc.this` — still present? Tags intact?
- `aws_internet_gateway.this` — attached?
- Each `aws_subnet.public/private` — present? CIDR matches `10.0.X.0/24` plan?
- Each route table — default route on public present? Associations intact?

A quick `aws ec2 describe-vpcs --region ap-south-1` + `describe-subnets` + `describe-route-tables --filter Name=vpc-id,Values=<vpc-id>` gives the full picture in three commands.

If the VPC itself is gone (somebody ran `terraform destroy` or deleted via console): **STOP** and page Varun. This is a P0; we do not silently re-create the VPC because RDS, EC2, etc. will all need replacement.

---

## 3. Flow Logs gone silent

Most common minor incident.

1. Confirm the log group `/aws/vpc/vyara-<env>-flow-logs` exists.
2. Confirm `aws_flow_log.this` is still attached to the VPC (console: VPC → Flow logs tab).
3. Check the IAM role `vyara-<env>-vpc-flow-logs` — trust policy must allow `vpc-flow-logs.amazonaws.com`; policy must have `logs:PutLogEvents`.
4. If any of the three is missing → `terraform apply` from the `envs/<env>` root will recreate them. No data-plane impact.
5. Log a 5-line note in `reports/cloud-health-<today>.md` describing what was missing and what re-applying fixed.

---

## 4. Route-table or SG drift

If `terraform plan` shows changes that nobody on the team made:

1. Capture the plan output to a file (`terraform plan -out=/tmp/drift.tfplan; terraform show /tmp/drift.tfplan > /tmp/drift.txt`).
2. Diff the live config against Terraform state — what does the drift consist of? (Common case: somebody added a temporary SG rule for debugging and forgot to remove it.)
3. If the drift is benign and intentional → land it in code (PR adds it to Terraform), then apply.
4. If the drift is unknown / unexplained → page Varun. Possible unauthorized access. Do NOT auto-apply away the drift; you'll destroy forensic evidence.

---

## 5. IGW detached or missing

1. Confirm via console.
2. If missing: `terraform apply` re-creates and re-attaches it.
3. **However**, while the IGW is detached, public subnets have no internet route — ALB will return 5xx to users and any EC2 outbound traffic dies. This is a user-facing outage.
4. After fix, log incident in `reports/incidents/` with timestamps and root cause.

---

## 6. Post-incident

For anything above sev-3:

- Open an incident note in `reports/incidents/YYYY-MM-DD-vpc-<summary>.md`.
- File a follow-up `infra/INF-XX-<slug>` branch if a code change is needed to prevent recurrence.
- Mention in the next Friday weekly digest.

## Related

- [`docs/infra/network.md`](../network.md) — the authoritative network design.
- Terraform module: [`infra/terraform/modules/network/`](../../../infra/terraform/modules/network/).
- Backlog ticket: INF-03.
