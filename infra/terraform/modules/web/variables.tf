variable "project" {
  description = "Project slug used in resource names (e.g. \"vyara\")."
  type        = string
}

variable "environment" {
  description = "Environment slug — \"prod\", \"staging\", etc."
  type        = string
}

# -----------------------------------------------------------------------------
# Network inputs — wired from module.network in the root module.
# -----------------------------------------------------------------------------
variable "vpc_id" {
  description = "VPC ID the ALB + EC2 ASG land in."
  type        = string
}

variable "public_subnet_ids" {
  description = "Ordered list of public subnet IDs (>=2, in different AZs). ALB + ASG span these."
  type        = list(string)

  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "ALB requires at least two subnets in distinct AZs."
  }
}

# -----------------------------------------------------------------------------
# Compute sizing — defaults match docs/infra/README.md Phase 1 stack.
# -----------------------------------------------------------------------------
variable "instance_type" {
  description = "EC2 instance type. Default t3.medium (2 vCPU / 4 GB) per docs/infra/README.md."
  type        = string
  default     = "t3.medium"
}

variable "ami_id" {
  description = <<-EOT
    AMI ID for the launch template. Leave empty (default) to resolve the latest
    Canonical Ubuntu 22.04 LTS amd64 AMI from SSM Parameter Store at plan time.
    Override only for AMI pinning (golden-image workflow in INF-10).
  EOT
  type        = string
  default     = ""
}

variable "asg_min_size" {
  description = "Minimum ASG size. Default 1 — single instance is fine for Phase 1 traffic."
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum ASG size. Default 3 — caps surprise scale-out cost."
  type        = number
  default     = 3
}

variable "asg_desired_capacity" {
  description = "Initial desired capacity. Default 1; ASG policies move it inside [min,max]."
  type        = number
  default     = 1
}

variable "root_volume_gb" {
  description = "Root EBS volume size in GB."
  type        = number
  default     = 30
}

# -----------------------------------------------------------------------------
# Listener / certificate config. Phase 1 reality: ACM cert is provisioned in
# INF-08, so during the interim apply this variable stays empty and the HTTPS
# listener is skipped. The HTTP listener defaults to a forward (not a redirect)
# in that case, so an operator can smoke-test end-to-end before INF-08 lands.
# After INF-08, set acm_certificate_arn at apply time and HTTP becomes a 301 to
# HTTPS automatically.
# -----------------------------------------------------------------------------
variable "acm_certificate_arn" {
  description = "ARN of an ACM cert for the ALB HTTPS listener. Empty disables the HTTPS listener (Phase-1 stop-gap)."
  type        = string
  default     = ""
}

variable "app_port" {
  description = "Port the application listens on inside the EC2 instance. ALB target group forwards here."
  type        = number
  default     = 8080
}

variable "health_check_path" {
  description = "HTTP path the ALB hits for health checks. Application MUST return 200 here when ready."
  type        = string
  default     = "/api/health"
}

# -----------------------------------------------------------------------------
# Admin access. Phase 1: SSH on 22 is restricted to the operators' known IPs.
# Prefer SSM Session Manager for routine access (instance profile in INF-07
# attaches AmazonSSMManagedInstanceCore).
# -----------------------------------------------------------------------------
variable "admin_ssh_cidrs" {
  description = <<-EOT
    CIDR blocks allowed to reach :22 on the EC2 instances. Default is empty —
    SSH is closed and operators must use SSM Session Manager. Populate ONLY
    Kunal's and Varun's home IPs (/32) if a direct-SSH break-glass is needed.
  EOT
  type        = list(string)
  default     = []
}

variable "iam_instance_profile_name" {
  description = <<-EOT
    Name of an IAM instance profile to attach to the launch template. Empty
    means no profile (Phase-1 stop-gap before INF-07 lands). INF-07 will pass
    the profile that grants Secrets Manager read + SSM Session Manager.
  EOT
  type        = string
  default     = ""
}
