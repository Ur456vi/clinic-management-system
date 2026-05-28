# =============================================================================
# Root module: envs/prod
# Composes the production stack from per-layer modules.
# Apply order is enforced by Terraform's dependency graph.
# =============================================================================

module "network" {
  source = "../../modules/network"

  project     = var.project
  environment = "prod"

  # vpc_cidr         = "10.0.0.0/16"  # default per docs/infra/network.md
  # enable_flow_logs = true            # default
}

# -----------------------------------------------------------------------------
# Web tier — public ALB + EC2 ASG. INF-05.
# Exposes `web_security_group_id` to the RDS module so sg-rds allows 5432 from
# the web tier only.
# -----------------------------------------------------------------------------
module "web" {
  source = "../../modules/web"

  project     = var.project
  environment = "prod"

  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_id_list

  # Phase-1 stop-gaps — see modules/web/README.md.
  # iam_instance_profile_name lands with INF-07.
  # acm_certificate_arn       lands with INF-08.
  # admin_ssh_cidrs stays empty; use SSM Session Manager.
}

module "rds" {
  source = "../../modules/rds"

  project     = var.project
  environment = "prod"

  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_id_list
  web_security_group_id = module.web.web_security_group_id

  # All other settings inherit the Phase-1 defaults documented in
  # modules/rds/README.md. Tune via -var or a tfvars file at apply time.
}
