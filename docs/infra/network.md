# Network Topology

VPC layout, subnet plan, and security-group matrix for the Vyara AWS deployment in `ap-south-1` (Mumbai).

## VPC

Single VPC, CIDR `10.0.0.0/16`. One per account is enough for both Phase 1A (dev) and Phase 1B (prod) since logical separation comes from subnets + security groups, not VPCs.

```
VPC vyara-vpc            10.0.0.0/16   (ap-south-1)
├── Public subnets       (internet-facing, EC2 + ALB lives here)
│   ├── 10.0.1.0/24      ap-south-1a   subnet-public-a
│   └── 10.0.2.0/24      ap-south-1b   subnet-public-b
├── Private subnets      (RDS + future ECS lives here)
│   ├── 10.0.11.0/24     ap-south-1a   subnet-private-a
│   └── 10.0.12.0/24     ap-south-1b   subnet-private-b
└── Internet Gateway     vyara-igw
    └── Route table:     0.0.0.0/0 → vyara-igw  (attached to public subnets)
```

**No NAT Gateway in Phase 1** — saves ~₹2,800/mo. Private subnets host RDS only, which doesn't need outbound internet. If we add ECS/Lambda later that does, we add NAT then.

## Subnet sizing

24-bit subnets give us 251 usable IPs per subnet (AWS reserves 5). More than enough for clinic-scale workload. Saves us re-IPing if we later need to add Lambda or VPC endpoints.

## Security groups

| SG | Inbound | Outbound | Attached to |
|---|---|---|---|
| `sg-public-web` | 80/tcp from 0.0.0.0/0 (redirected to 443 by nginx)<br>443/tcp from 0.0.0.0/0<br>22/tcp from Kunal + Varun IPs only (via SSM Session Manager preferred) | All / 0.0.0.0/0 | `vyara-dev-01`, later `vyara-prod-01` EC2 |
| `sg-rds` | 5432/tcp from `sg-public-web` only | None | `vyara-rds-01` |
| `sg-internal-mgmt` | (none) | 443/tcp to AWS APIs only (Secrets Manager, S3, CloudWatch) | Future bastion / management |

**SSH access policy:** Prefer SSM Session Manager over direct SSH. Configure once via IAM role on the EC2 instance profile. If we need direct SSH for emergency, allow only from Kunal's and Varun's home IPs explicitly. Never `0.0.0.0/0` on port 22.

## DNS

Existing zone `algoborne.com` is hosted at — **TBD, will confirm in INF-01**. Action: Kunal to identify and either:
- Migrate the zone to Route 53 (clean, one vendor)
- Keep the zone at the current provider and add the `vyara` A record there

For ACM cert (DNS validation) we add a `_acme-challenge.vyara` TXT record wherever the zone lives.

Production domain (Phase 1B) gets its own Route 53 hosted zone — registrar at the user's choice but DNS hosted at AWS for tight integration with ACM and CloudFront.

## Encryption

- **At rest:**
  - EBS volumes: `aws:ebs/default` KMS key (free, AWS-managed)
  - RDS: same — default KMS
  - S3: SSE-S3 for assets, SSE-S3 for PHI bucket in Phase 1A (upgrade to SSE-KMS with customer-managed key in Phase 2 when BAA work starts)
- **In transit:**
  - HTTPS everywhere (nginx + Let's Encrypt → ACM in Phase 1B)
  - RDS connections require SSL (set `rds.force_ssl=1` parameter group flag)

## Logging

- **VPC Flow Logs:** captured to CloudWatch Logs, 7-day retention (free under most usage)
- **CloudTrail:** AWS API audit trail, 90-day retention in S3 (free for first trail)
- **ALB/nginx access logs:** to S3 logs bucket, 30-day lifecycle to Glacier

## What's deliberately not configured in Phase 1

- AWS Network Firewall — adds ₹2k+/mo, overkill
- VPC endpoints (PrivateLink for S3, Secrets Manager) — ₹600/mo per endpoint; defer until we have prod traffic
- Transit Gateway / multi-account — not needed for single-clinic single-account
- Site-to-Site VPN — only if Dr. Yuvraaj's clinic IP needs to whitelist us; defer

These can all be added without re-architecting the VPC. The subnet plan above is forward-compatible.
