# IAM Matrix

Who can do what in **Dr. Yuvraaj's clinic AWS account**. The clinic owns the account; Algoborne operates on it as a data processor with scoped IAM access.

## Account ownership

| | |
|---|---|
| **Account owner** | Dr. Yuvraaj's clinic |
| **Account billing payer** | Clinic |
| **Root user** | Clinic admin (locked away after bootstrap, used only for break-glass) |
| **Region scope** | Only `ap-south-1` (Mumbai) — Algoborne never operates outside this region |

## IAM users on the client account

| User | Holder | Purpose | Permissions | MFA |
|---|---|---|---|---|
| `root` | Clinic admin (Dr. Yuvraaj or designate) | Break-glass + closing the account | Full root. Locked away with hardware MFA. | **Required** (hardware MFA) |
| `clinic-billing` | Clinic finance person | Pays invoices, downloads tax forms | Billing-only view | **Required** |
| `algoborne-engineering` | Kunal (PM, Algoborne) | Day-to-day infra operator. Applies Cloud Engineer's Terraform, debugs issues. | Scoped to `ap-south-1` only: `AmazonEC2FullAccess`, `AmazonRDSFullAccess`, `AmazonS3FullAccess` on Vyara-tagged buckets, `SecretsManagerFullAccess` on Vyara-tagged secrets, `CloudWatchFullAccess`. **Denied:** all IAM-write, billing, root, anything outside `ap-south-1`. | **Required** |
| `algoborne-readonly` (future) | Other Algoborne devs as added | Read-only inspection without write capability | `ReadOnlyAccess` scoped to `ap-south-1` | Required when added |

**Algoborne does NOT have:**
- Root access (clinic-only)
- Billing access (clinic-only)
- IAM-write (cannot create new users or modify permissions on the client account)
- Access to other AWS regions

## AI agent IAM roles (on the client account)

| Role | Phase 1 (now) | Phase 2 (after trust earned) |
|---|---|---|
| `cloud-engineer-role` | **No IAM role assigned.** Agent writes Terraform; Kunal applies it via his `algoborne-engineering` user. | Scoped IAM role on the client account, assumed via STS by Algoborne's agent. `ReadOnlyAccess` for audits + `terraform plan` permissions. **Denied:** IAM-write, billing, anything that changes resource state outside the whitelist. |
| `app-instance-profile` | Created in INF-05, attached to EC2 instance | Same. Allows the app to: read Secrets Manager secret `vyara/<env>/app`, write to S3 PHI + assets buckets, write CloudWatch logs. **No outbound IAM permissions.** |
| `pm-agent-role` | No IAM role | Future: read-only CloudWatch + Cost Explorer to populate the daily reports with real numbers from the client account. |

## Per-resource access matrix

| Resource | Clinic root | Clinic billing | `algoborne-engineering` (Kunal) | App (EC2) | `algoborne-readonly` |
|---|---|---|---|---|---|
| Root account | ✅ break-glass | ❌ | ❌ | ❌ | ❌ |
| Billing console | ✅ | ✅ | view-only summary (Cost Anomaly Detection emails) | ❌ | ❌ |
| IAM (create / modify users) | ✅ | ❌ | ❌ | ❌ | ❌ |
| EC2 (start/stop/terminate) | ✅ | ❌ | ✅ scoped | ❌ | read-only |
| EC2 (SSH / SSM) | ✅ | ❌ | ✅ via SSM | n/a | ❌ |
| RDS (provision / delete) | ✅ | ❌ | ✅ scoped | ❌ | read-only |
| RDS (connect & query) | ✅ via SSM | ❌ | ✅ via SSM | ✅ via app role | read-only via dev DB |
| S3 assets bucket | ✅ | ❌ | ✅ | read/write | read-only |
| S3 PHI bucket | ✅ break-glass — audit logged | ❌ | break-glass — audit logged | read/write | ❌ |
| Secrets Manager | ✅ | ❌ | ✅ | read its own secret | ❌ |
| CloudWatch logs | ✅ | ❌ | ✅ | write logs | read-only |
| Route 53 (Phase 1B only) | ✅ | ❌ | ✅ | ❌ | ❌ |
| ACM (Phase 1B only) | ✅ | ❌ | ✅ | ❌ | ❌ |

## Audit trail

CloudTrail logs every API call. Stored in S3 bucket `vyara-cloudtrail` (client-owned) with 90-day retention. Both clinic and Algoborne can read the trail. If anyone takes an action via the AWS console or CLI:
- Who (IAM user / role) — `algoborne-engineering` calls are clearly attributed to Algoborne
- What (API call name)
- When (timestamp)
- From where (source IP)
- Result (success / error)

The PM Agent's Friday digest should grep CloudTrail for any unusual `algoborne-*` activity weekly — anything unexpected, escalate to the clinic immediately.

## Bootstrap sequence (INF-01)

**Pattern:** clinic provides email + credit card; **Kunal does the actual setup** during a single ~90-min session with the clinic admin on the call.

**Clinic provides up-front:**
- Account email (e.g. `aws@<clinic>.in` or similar — clinic-controlled mailbox)
- Credit / debit card to attach to the account
- Clinic admin available on the setup call to receive root credentials at the end

**Kunal executes during the session:**
1. Create AWS account at https://aws.amazon.com/ using clinic-provided email + card. Clinic admin is on screen-share.
2. Set up hardware MFA on root (Kunal sets up; clinic admin holds the device + recovery codes afterward).
3. Create IAM admin user `algoborne-engineering` (Kunal's day-to-day user) with scoped permissions per the table above. MFA enabled.
4. Create IAM user `clinic-billing` for clinic finance (billing-view only).
5. Log out as root, log back in as `algoborne-engineering`.
6. Create Terraform state bootstrap: S3 bucket `vyara-tfstate-mumbai` (versioning + encryption) + DynamoDB lock table `vyara-tfstate-lock` (one-time, ~5 min).
7. Enable CloudTrail (free for first trail).
8. Enable AWS Cost Anomaly Detection + billing alerts at ₹3k / ₹4k / ₹5k (clinic billing contact = recipient; Kunal + Varun Cc'd).
9. Hand root MFA device + recovery codes to clinic admin in sealed envelope — clinic locks these away.

ETA: ~90 minutes wall-clock with Kunal + clinic admin in the same call. After this, Cloud Engineer agent picks up INF-02 (Terraform skeleton) on the next 09:30 IST shift.

## Tagging convention (mandatory on every resource)

Every AWS resource provisioned via Terraform carries these tags. Lets the clinic split billing if they ever onboard a second vendor.

```
Project       = Vyara
Environment   = dev | prod
ManagedBy     = Algoborne
Customer      = Dr. Yuvraaj Clinic
TerraformDir  = infra/terraform/<module>
```

Kunal verifies the tags on every `terraform apply` — Terraform fails the plan if any required tag is missing (enforced via `default_tags` in the AWS provider config).
