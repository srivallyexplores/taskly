# Terraform state backend configuration
# This file is overridden per environment in environments/{env}/backend.tf
# The S3 bucket and DynamoDB table must be created before running terraform init.
#
# To bootstrap state infrastructure, run:
#   aws s3api create-bucket --bucket taskly-terraform-state-{account-id} --region us-east-1
#   aws dynamodb create-table --table-name taskly-terraform-locks \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST

terraform {
  backend "s3" {
    bucket         = "taskly-terraform-state-583168584925"
    key            = "taskly/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "taskly-terraform-locks"
    encrypt        = true
  }
}
