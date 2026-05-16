variable "project" {
  description = "Project slug used in resource names (e.g. \"vyara\")."
  type        = string
}

variable "environment" {
  description = "Deployment environment — one of: prod, staging, dev."
  type        = string

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "environment must be one of: prod, staging, dev."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC. Default matches docs/infra/network.md."
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_flow_logs" {
  description = "Whether to provision VPC Flow Logs to CloudWatch (7-day retention)."
  type        = bool
  default     = true
}
