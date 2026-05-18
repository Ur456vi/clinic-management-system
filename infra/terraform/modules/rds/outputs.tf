output "db_instance_id" {
  description = "RDS instance identifier."
  value       = aws_db_instance.this.id
}

output "db_instance_arn" {
  description = "RDS instance ARN."
  value       = aws_db_instance.this.arn
}

output "db_endpoint" {
  description = "RDS endpoint (host:port). For app connection string assembly."
  value       = aws_db_instance.this.endpoint
}

output "db_address" {
  description = "RDS hostname only (no port)."
  value       = aws_db_instance.this.address
}

output "db_port" {
  description = "RDS port (5432)."
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Initial database name."
  value       = aws_db_instance.this.db_name
}

output "security_group_id" {
  description = "RDS SG id - consumers should add egress to this SG, not the other way around."
  value       = aws_security_group.rds.id
}

output "secret_arn" {
  description = "Secrets Manager ARN holding {host,port,dbname,username,password} JSON."
  value       = aws_secretsmanager_secret.db.arn
}

output "monitoring_role_arn" {
  description = "Enhanced Monitoring IAM role ARN."
  value       = aws_iam_role.rds_monitoring.arn
}

output "parameter_group_name" {
  description = "Custom parameter group attached to the instance."
  value       = aws_db_parameter_group.this.name
}
