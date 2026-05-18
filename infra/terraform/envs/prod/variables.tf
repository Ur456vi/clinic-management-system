variable "project" {
  description = "Project slug used in resource names."
  type        = string
  default     = "vyara"
}

variable "web_security_group_id" {
  description = <<-EOT
    Security group ID for the EC2 web tier (sg-public-web). Until INF-05 lands
    this is supplied at apply time. After INF-05 merges, this variable is
    removed and the value is wired from module.web.security_group_id.
  EOT
  type        = string
}
