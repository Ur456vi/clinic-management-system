# Single AWS provider, region pinned to ap-south-1 (Mumbai) for DPDP Act data residency.
# default_tags applies to every resource; per-resource tags can extend but should not override.
provider "aws" {
  region = "ap-south-1"

  default_tags {
    tags = {
      Project     = "vyara"
      ManagedBy   = "terraform"
      Environment = var.environment
      Owner       = "algoborne"
      Repo        = "clinic-management-system"
    }
  }
}
