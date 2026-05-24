output "alb_arn" {
  description = "ARN of the public ALB."
  value       = aws_lb.this.arn
}

output "alb_dns_name" {
  description = "Public DNS name of the ALB. Route 53 alias target (INF-08)."
  value       = aws_lb.this.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the ALB (needed for Route 53 alias records)."
  value       = aws_lb.this.zone_id
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB."
  value       = aws_security_group.alb.id
}

output "web_security_group_id" {
  description = <<-EOT
    Security group ID for the EC2 web tier. Pass this to the RDS module as
    web_security_group_id so sg-rds can allow 5432 from the web tier only.
  EOT
  value       = aws_security_group.web.id
}

output "target_group_arn" {
  description = "ALB target group ARN — INF-10 deploy pipeline registers instances here."
  value       = aws_lb_target_group.app.arn
}

output "autoscaling_group_name" {
  description = "ASG name — INF-09 CloudWatch alarms and INF-10 deploys reference this."
  value       = aws_autoscaling_group.web.name
}

output "launch_template_id" {
  description = "Launch template ID."
  value       = aws_launch_template.web.id
}
