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
