# AWS Cost — Itemized

Calculated 2026-05-13 using AWS public pricing for `ap-south-1` (Mumbai). USD → INR @ ₹83/$. Reserved-instance pricing assumes 1-year No Upfront. Numbers will vary ±10% with actual usage.

**All costs below hit Dr. Yuvraaj's clinic AWS account directly — Algoborne does not pay AWS for the Vyara engagement.** The ₹5k/mo ceiling is what Algoborne commits to forecasting and keeping under control on behalf of the client.

## Phase 1A — Dev only (current)

| Line item | Calculation | ₹/mo |
|---|---|---|
| EC2 t3.micro, 1-yr RI, Linux | $0.0083/hr × 720 hr × 0.65 (RI discount) × ₹83 | **₹322** |
| EBS volume (gp3, 20 GB) | 20 GB × $0.0928/GB-mo × ₹83 | **₹154** |
| RDS db.t4g.micro, 1-yr RI, PostgreSQL | $0.013/hr × 720 hr × 0.7 (RI discount) × ₹83 | **₹544** |
| RDS storage (gp3, 20 GB) | 20 GB × $0.115/GB-mo × ₹83 | **₹191** |
| RDS backup storage (free for first 100% of instance size) | 20 GB free | ₹0 |
| S3 (Standard, ~5 GB) | 5 GB × $0.025/GB-mo × ₹83 | **₹10** |
| S3 requests (~10k PUT, ~100k GET) | $0.0055 + $0.0044 × ₹83 | **₹1** |
| CloudFront egress (free tier, <1 TB/mo) | 0 | ₹0 |
| Route 53 / ACM | **Deferred** — Phase 1A skips domain entirely | ₹0 |
| Secrets Manager (1 secret + ~1000 API calls/mo) | $0.40 + $0.0005 × ₹83 | **₹34** |
| Data transfer out (~10 GB/mo) | 9 GB × $0.0900/GB × ₹83 (first 1 GB free) | **₹67** |
| CloudWatch metrics + 5 alarms | 5 × $0.10/alarm + 10 metrics × $0.30 × ₹83 | **₹293** |
| EBS snapshot (1× weekly, ~5 GB) | 5 GB × $0.05/GB-mo × ₹83 | **₹21** |
| **Subtotal** |  | **~₹1,640** |
| Buffer (data transfer spikes, snapshots, misc) | +25% | **~₹400** |
| **Phase 1A total** |  | **~₹2,040/mo** |

## Phase 1B — Adding Production (post Milestone 1)

Additional resources on top of Phase 1A.

| Line item | Calculation | ₹/mo |
|---|---|---|
| EC2 t3.small, 1-yr RI | $0.0167/hr × 720 × 0.65 × ₹83 | **₹649** |
| EBS volume (gp3, 30 GB) | 30 GB × $0.0928/GB × ₹83 | **₹231** |
| RDS storage upgrade (40 GB instead of 20 GB) | 20 GB × $0.115 × ₹83 | **₹191** |
| Prod S3 buckets (~15 GB) | 15 GB × $0.025 × ₹83 | **₹31** |
| Domain registration (deferred — clinic picks at Phase 1B cutover; ₹400/year estimate) | annualized | **₹35** |
| Extra Secrets Manager secret | $0.40 × ₹83 | **₹34** |
| CloudWatch alarms (5 more for prod) | 5 × $0.10 × ₹83 | **₹42** |
| Data transfer out (prod, ~100 GB/mo) | 99 GB × $0.0900 × ₹83 | **₹740** |
| Buffer (prod is unpredictable) | +25% | **~₹525** |
| **Phase 1B incremental** | | **~₹2,478** |
| **Combined Phase 1A + 1B total** | | **~₹4,518/mo** |

## What's intentionally NOT in the budget

| Item | Why excluded | Cost if added |
|---|---|---|
| AWS Business Support | Need ≥₹50k/mo revenue to justify | ~₹8,500/mo |
| ALB | Single EC2 is fine for clinic scale | ~₹1,800/mo |
| Multi-AZ RDS | Single AZ accepted as MVP trade-off | ~+50% RDS cost |
| GuardDuty / Security Hub | Add in Phase 2 with Business Support | ~₹500/mo |
| WAF | Free for first 10 rules, but adds ops complexity | ~₹500/mo |
| ElastiCache Redis | Not needed at clinic scale | ~₹400/mo |
| NAT Gateway | All instances in public subnets initially | ~₹2,800/mo |
| Cross-region replication | Not needed for single-clinic | ~₹3,000/mo |

Total "deferred" cost: **~₹17,500/mo** that we'd add when revenue justifies. Phase 1 plan is roughly 1/4 of a "full" production stack.

## Budget vs. Reality — what to track weekly

The Cloud Engineer's Friday infra digest pulls AWS Cost Explorer data from the client account (Phase 2 when read-only IAM exists) and flags variance. For now, **Kunal monitors the client's AWS billing console weekly** (the clinic billing contact gets the official alerts; Kunal is Cc'd) and reports issues to the clinic + Varun if any of these fire:

- Daily spend >₹200 (suggests something is misconfigured — likely runaway data transfer or unused resources)
- Monthly forecast >₹5,500 (approaching the ceiling Algoborne committed to)
- Any single line item >₹1,500/mo (something we didn't plan for)

Variance from forecast is a quality-of-service issue for Algoborne, even though we don't pay the bill — the client should never be surprised.

## Vendor pricing — variable per-message costs (separate from AWS)

| Vendor | Service | Cost | Free tier? |
|---|---|---|---|
| **MSG91** | OTP / transactional SMS | ₹0.15 / SMS | Pay-as-you-go |
| **Brevo** | Patient transactional + marketing email | Free tier 300/day, paid ₹2k/mo for 20k/mo | 300/day |
| **Interakt** | WhatsApp Business API | ₹999/mo base + per-template-msg | No |
| **Resend** | Internal dev-ops email (assignments, reports) | Free tier 3k/mo, $20/mo above | 3k/mo |
| **Razorpay** | Payment gateway | 2% per transaction | No |

Conservative monthly variable estimate at 100 patient visits/mo: ~₹3,000 (SMS + WhatsApp + payment fees). Adds to AWS fixed cost.

**Total Phase 1B operational cost estimate: ~₹4,500 (AWS) + ~₹3,000 (vendor variable) = ~₹7,500/mo**.

This is the number to use in client invoicing if we pass through infrastructure costs.
