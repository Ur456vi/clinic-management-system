# =============================================================================
# Module: web — version pins.
# Mirrors the root module pins (see infra/terraform/versions.tf). Kept local so
# the module can be consumed by other root modules later without surprises.
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}
