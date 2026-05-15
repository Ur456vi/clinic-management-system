# Remote state in S3 with DynamoDB locking.
# This block is commented until INF-02 bootstrap has been applied — see bootstrap/README.md.
# After bootstrap, uncomment, then run `terraform init -migrate-state`.
#
# terraform {
#   backend "s3" {
#     bucket         = "algoborne-vyara-tfstate"
#     key            = "vyara/prod/terraform.tfstate"
#     region         = "ap-south-1"
#     dynamodb_table = "algoborne-vyara-tflock"
#     encrypt        = true
#   }
# }
