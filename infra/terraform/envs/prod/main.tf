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
# Placeholder for INF-05: web tier (ALB + EC2 + ASG) will own sg-public-web.
# Until INF-05 lands, we accept the web SG id as a variable so an operator can
# either (a) wait for INF-05 and remove this, or (b) hand-create a stub SG and
# pass its id at apply time. This keeps INF-04 independently appliable.
# -----------------------------------------------------------------------------
module "rds" {
  source = "../../modules/rds"

  project     = var.project
  environment = "prod"

  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_id_list
  web_security_group_id = var.web_security_group_id

  # All other settings inherit the Phase-1 defaults documented in
  # modules/rds/README.md. Tune via -var or a tfvars file at apply time.
}
