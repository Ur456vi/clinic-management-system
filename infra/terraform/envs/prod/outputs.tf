output "vpc_id" {
  value       = module.network.vpc_id
  description = "Vyara prod VPC ID."
}

output "private_subnet_ids" {
  value       = module.network.private_subnet_id_list
  description = "Private subnet IDs (RDS subnet group)."
}

output "public_subnet_ids" {
  value       = module.network.public_subnet_id_list
  description = "Public subnet IDs (ALB / EC2)."
}

output "rds_endpoint" {
  value       = module.rds.db_endpoint
  description = "RDS endpoint (host:port). Application connects via the Secrets Manager JSON, not this output."
}

output "rds_secret_arn" {
  value       = module.rds.secret_arn
  description = "Secrets Manager ARN holding the master DB credentials JSON."
}

output "rds_security_group_id" {
  value       = module.rds.security_group_id
  description = "RDS security group ID."
}

output "alb_dns_name" {
  value       = module.web.alb_dns_name
  description = "Public DNS name of the ALB. Route 53 alias target (INF-08)."
}

output "alb_zone_id" {
  value       = module.web.alb_zone_id
  description = "ALB hosted zone ID — needed for Route 53 A-ALIAS records (INF-08)."
}

output "web_security_group_id" {
  value       = module.web.web_security_group_id
  description = "EC2 web tier SG. Already wired into the RDS module; exported for INF-07 / INF-10 reference."
}

output "asg_name" {
  value       = module.web.autoscaling_group_name
  description = "ASG name — INF-09 alarms + INF-10 deploys reference this."
}
