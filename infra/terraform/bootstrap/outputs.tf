output "state_bucket_name" {
  description = "Name of the S3 bucket holding Terraform remote state."
  value       = aws_s3_bucket.state.bucket
}

output "state_bucket_arn" {
  description = "ARN of the Terraform state bucket."
  value       = aws_s3_bucket.state.arn
}

output "lock_table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking."
  value       = aws_dynamodb_table.lock.name
}

output "region" {
  description = "AWS region where the backend lives."
  value       = "ap-south-1"
}
