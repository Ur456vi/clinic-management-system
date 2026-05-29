# Module: `web`

Internet-facing **Application Load Balancer**, **EC2 launch template** (Ubuntu 22.04 + Docker), and **Auto Scaling Group** for the Vyara web tier.

Region: `ap-south-1` (Mumbai). Branch of origin: `infra/INF-05-ec2-alb-asg`.

## What this module creates

| Resource | Name | Notes |
|---|---|---|
| `aws_security_group` | `vyara-prod-sg-alb` | 80/443 in from 0.0.0.0/0; egress only to web SG on `app_port`. |
| `aws_security_group` | `vyara-prod-sg-public-web` | `app_port` in from ALB SG; optional 22 from `admin_ssh_cidrs`. |
| `aws_lb` | `vyara-prod-alb` | Internet-facing ALB across the two public subnets. |
| `aws_lb_target_group` | `vyara-prod-tg-app` | HTTP target group on `app_port`, health-checks `/api/health`. |
| `aws_lb_listener` | `:80` | Redirects to `:443` if a cert ARN is set; otherwise forwards to TG. |
| `aws_lb_listener` | `:443` (conditional) | HTTPS, ACM cert from INF-08, `ELBSecurityPolicy-TLS13-1-2-2021-06`. |
| `aws_launch_template` | `vyara-prod-lt-*` | Ubuntu 22.04 amd64 (resolved from SSM), `t3.medium`, IMDSv2, gp3 root, Docker via user-data. |
| `aws_autoscaling_group` | `vyara-prod-asg-web` | min 1 / max 3 / desired 1, ELB health checks, rolling instance refresh. |

## Wiring

```hcl
module "web" {
  source = "../../modules/web"

  project     = var.project
  environment = "prod"

  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_id_list

  # Optional Phase-1 stop-gaps — leave empty until INF-07 / INF-08 land.
  iam_instance_profile_name = ""
  acm_certificate_arn       = ""
}

module "rds" {
  # ...
  web_security_group_id = module.web.web_security_group_id   # <- replaces the stop-gap var
}
```

## Phase-1 stop-gaps (and how they go away)

- **`iam_instance_profile_name = ""`** — instance has no profile yet. The placeholder nginx + bootstrap finish fine. INF-07 will create the profile (Secrets Manager read + `AmazonSSMManagedInstanceCore`) and pass its name here, after which Session Manager + secret fetch start working without re-launching instances (next instance refresh picks it up).
- **`acm_certificate_arn = ""`** — HTTPS listener is skipped, HTTP listener forwards directly. Once INF-08 provisions an ACM cert, set this variable at apply time; HTTP becomes a 301 to HTTPS and the HTTPS listener appears.
- **`admin_ssh_cidrs = []`** — SSH is closed. Operators must use SSM Session Manager (works once INF-07 lands). Populate with `/32` CIDRs ONLY as an emergency break-glass.

## What this module does NOT do

- **Domain / DNS** — Route 53 alias to `alb_dns_name` lives in INF-08.
- **Application secret injection** — instance profile + Secrets Manager wiring lives in INF-07.
- **CI/CD** — `docker pull && docker run` of the real app image lives in INF-10 (`scripts/deploy/`).
- **Scaling policies** — CPU / 5xx / request-count alarms + scale-out policies live in INF-09.
- **ALB access logging** — needs the S3 logs bucket from INF-06; turned on after that lands.

## Cost (Mumbai on-demand, steady state)

| Item | Approx |
|---|---|
| ALB (LCU usage trivial at Phase-1 RPS) | ~₹2,000 / mo |
| 1 × t3.medium on-demand, 730 hrs | ~₹3,600 / mo |
| 30 GB gp3 root volume | ~₹260 / mo |
| **Total** | **~₹5,800 / mo** |

Switching the EC2 instance to a 1-year No-Upfront RI drops it by ~30%. Documented separately in `docs/infra/cost.md`.

## Apply order

INF-02 → INF-03 → INF-04 → **this (INF-05)**. The root module `envs/prod` now wires `module.web` and feeds its `web_security_group_id` into `module.rds`; the stop-gap `web_security_group_id` variable on the root is removed.
