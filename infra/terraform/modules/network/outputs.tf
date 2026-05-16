output "vpc_id" {
  description = "ID of the Vyara VPC."
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR block of the Vyara VPC."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs keyed by AZ."
  value       = { for az, s in aws_subnet.public : az => s.id }
}

output "private_subnet_ids" {
  description = "Private subnet IDs keyed by AZ."
  value       = { for az, s in aws_subnet.private : az => s.id }
}

output "public_subnet_id_list" {
  description = "Public subnet IDs as an ordered list (for ALB / ASG consumers)."
  value       = [for az in sort(keys(aws_subnet.public)) : aws_subnet.public[az].id]
}

output "private_subnet_id_list" {
  description = "Private subnet IDs as an ordered list (for RDS subnet groups)."
  value       = [for az in sort(keys(aws_subnet.private)) : aws_subnet.private[az].id]
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway attached to the VPC."
  value       = aws_internet_gateway.this.id
}

output "public_route_table_id" {
  description = "ID of the public route table (0.0.0.0/0 -> IGW)."
  value       = aws_route_table.public.id
}

output "private_route_table_id" {
  description = "ID of the private route table (no default route — Phase 1)."
  value       = aws_route_table.private.id
}
