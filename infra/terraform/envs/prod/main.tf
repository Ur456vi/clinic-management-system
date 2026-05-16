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
