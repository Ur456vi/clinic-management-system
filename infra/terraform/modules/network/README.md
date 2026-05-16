# Module: `network`

VPC, public + private subnets, IGW, route tables, and VPC Flow Logs for the Vyara stack in `ap-south-1` (Mumbai).

Implements the design in [`docs/infra/network.md`](../../../../docs/infra/README.md). Owner: Cloud Engineer. Reviewer: Kunal / Varun (and Aman for any IAM / encryption changes).

## What this module creates

| Resource | Name pattern | Notes |
|---|---|---|
| VPC | `vyara-<env>-vpc` | CIDR `10.0.0.0/16`, DNS support + hostnames enabled. |
| Internet Gateway | `vyara-<env>-igw` | Attached to the VPC. |
| Public subnets (×2) | `vyara-<env>-subnet-public-a/b` | `10.0.1.0/24` in `ap-south-1a`, `10.0.2.0/24` in `ap-south-1b`. |
| Private subnets (×2) | `vyara-<env>-subnet-private-a/b` | `10.0.11.0/24` in `ap-south-1a`, `10.0.12.0/24` in `ap-south-1b`. |
| Public route table | `vyara-<env>-rt-public` | Default route `0.0.0.0/0 -> IGW`, associated with both public subnets. |
| Private route table | `vyara-<env>-rt-private` | No default route in Phase 1 (RDS-only, no outbound internet). |
| VPC Flow Logs | `/aws/vpc/vyara-<env>-flow-logs` | CloudWatch Log Group, 7-day retention. Traffic type `ALL`. |
| IAM role for Flow Logs | `vyara-<env>-vpc-flow-logs` | Least-privilege: only `logs:*` on log groups. |

## What this module does **not** create (deliberate Phase 1 omissions)

- **NAT Gateway** — saves ~₹2,800/mo. Private subnets host only RDS, which doesn't need outbound internet. Add if/when ECS or Lambda lands.
- **VPC endpoints (PrivateLink)** — ~₹600/mo per endpoint. Defer until prod traffic justifies it.
- **AWS Network Firewall** — ₹2k+/mo, overkill for clinic-scale traffic.
- **Third AZ** — design doc is 2-AZ. CIDR space `10.0.3.0/24` / `10.0.13.0/24` is reserved should we add `ap-south-1c` later. Note: the INF-03 backlog one-liner says "3 AZs"; the canonical design (network.md) is 2-AZ. Confirm with Kunal before extending.

## Usage

The module is consumed from `infra/terraform/envs/<env>/main.tf`:

```hcl
module "network" {
  source      = "../../modules/network"
  project     = var.project
  environment = var.environment
  # vpc_cidr           = "10.0.0.0/16"  (default)
  # enable_flow_logs   = true           (default)
}
```

Downstream modules (RDS subnet group, ALB, EC2 ASG) consume:

- `module.network.vpc_id`
- `module.network.public_subnet_id_list`
- `module.network.private_subnet_id_list`

## Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `project` | string | — | Project slug (e.g. `vyara`). |
| `environment` | string | — | One of `prod`, `staging`, `dev`. |
| `vpc_cidr` | string | `10.0.0.0/16` | VPC CIDR block. |
| `enable_flow_logs` | bool | `true` | Provision VPC Flow Logs to CloudWatch. |

## Outputs

`vpc_id`, `vpc_cidr`, `public_subnet_ids` (map by AZ), `private_subnet_ids` (map by AZ), `public_subnet_id_list`, `private_subnet_id_list`, `internet_gateway_id`, `public_route_table_id`, `private_route_table_id`.

## Apply plan (what `terraform apply` will do)

A first-time `terraform plan` against this module will create **15 resources**:

1. `aws_vpc.this`
2. `aws_internet_gateway.this`
3. `aws_subnet.public["ap-south-1a"]`
4. `aws_subnet.public["ap-south-1b"]`
5. `aws_subnet.private["ap-south-1a"]`
6. `aws_subnet.private["ap-south-1b"]`
7. `aws_route_table.public`
8. `aws_route_table.private`
9. `aws_route_table_association.public["ap-south-1a"]`
10. `aws_route_table_association.public["ap-south-1b"]`
11. `aws_route_table_association.private["ap-south-1a"]`
12. `aws_route_table_association.private["ap-south-1b"]`
13. `aws_cloudwatch_log_group.flow_logs[0]`
14. `aws_iam_role.flow_logs[0]` + `aws_iam_role_policy.flow_logs[0]`
15. `aws_flow_log.this[0]`

No deletions. No replacements. No data plane impact (this is the first network stand-up).

## Estimated cost (steady-state, Phase 1)

| Item | Approx. ₹/mo |
|---|---|
| VPC, subnets, route tables, IGW | ₹0 (free) |
| VPC Flow Logs to CloudWatch (low traffic) | < ₹100 |
| **Total module cost** | **< ₹100/mo** |

NAT Gateway, if later added: +₹2,800/mo (1 GW × ~₹0.045/hr × 730 hr + data processing).

## Blocked by

- **INF-01** — AWS account must exist and Terraform bootstrap (INF-02) must be applied before this module can be applied.

## Follow-up tickets unlocked

- INF-04 (RDS) — consumes `private_subnet_id_list`.
- INF-05 (ALB + ASG) — consumes `public_subnet_id_list` and `vpc_id`.
- INF-06 (S3) — independent of this module.
- INF-08 (Route 53 + ACM + CloudFront) — independent.

## Runbook hooks

See [`docs/infra/runbooks/vpc-incident.md`](../../../../docs/infra/runbooks/vpc-incident.md) (new in this branch) for the on-call procedure if Flow Logs go silent, the IGW is detached, or a route table is mutated outside Terraform.
