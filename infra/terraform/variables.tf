variable "environment" {
  description = "Deployment environment — one of: prod, staging, dev."
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["prod", "staging", "dev"], var.environment)
    error_message = "environment must be one of: prod, staging, dev."
  }
}

variable "project" {
  description = "Project slug used in resource names."
  type        = string
  default     = "vyara"
}
