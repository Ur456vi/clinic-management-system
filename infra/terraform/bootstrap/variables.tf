variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform remote state."
  type        = string
  default     = "algoborne-vyara-tfstate"
}

variable "lock_table_name" {
  description = "DynamoDB table name for Terraform state locking."
  type        = string
  default     = "algoborne-vyara-tflock"
}
