variable "project" {
  description = "Project slug for resource naming (e.g. 'vyara')."
  type        = string
}

variable "environment" {
  description = "Environment slug ('prod', 'dev')."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the RDS security group lives."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs (>=2 AZs) for the DB subnet group."
  type        = list(string)
  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "RDS requires at least 2 private subnets in different AZs."
  }
}

variable "web_security_group_id" {
  description = "Web tier SG ID (sg-public-web) allowed to reach Postgres on 5432."
  type        = string
}

variable "engine_version" {
  description = "Postgres major.minor version. Pin to a minor to avoid surprise upgrades."
  type        = string
  default     = "16.4"
}

variable "instance_class" {
  description = "RDS instance class. Phase 1: db.t3.small."
  type        = string
  default     = "db.t3.small"
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB."
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Upper bound for storage autoscaling in GB. Set 0 to disable."
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Initial database name created at provisioning."
  type        = string
  default     = "vyara"
}

variable "master_username" {
  description = "Master DB username. App connects via a less-privileged role created by Prisma migration."
  type        = string
  default     = "vyara_admin"
}

variable "multi_az" {
  description = "Enable Multi-AZ standby. OFF in Phase 1, flip before go-live."
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Automated backup retention in days. AWS max is 35."
  type        = number
  default     = 7
  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Vyara policy: retain backups for at least 7 days."
  }
}

variable "deletion_protection" {
  description = "Refuse `terraform destroy` until explicitly disabled. ALWAYS true in prod."
  type        = bool
  default     = true
}
