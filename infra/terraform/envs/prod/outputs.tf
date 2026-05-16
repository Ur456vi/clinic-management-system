output "vpc_id" {
  description = "VPC ID for the Vyara prod stack."
  value       = module.network.vpc_id
}

output "public_subnet_id_list" {
  description = "Public subnet IDs (ordered) for ALB / ASG consumers."
  value       = module.network.public_subnet_id_list
}

output "private_subnet_id_list" {
  description = "Private subnet IDs (ordered) for RDS / future ECS consumers."
  value       = module.network.private_subnet_id_list
}
