# Dev Environment — Re-exported Outputs
#
# The dev environment is a thin wrapper that instantiates the root Taskly module
# as `module.taskly`. Terraform does not surface a child module's outputs at the
# root automatically, so we re-export the ones consumers (verification scripts,
# CI/CD, the deployment report) need here.

output "environment" {
  description = "Current deployment environment"
  value       = module.taskly.environment
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = module.taskly.aws_region
}

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.taskly.api_gateway_url
}

output "cloudfront_frontend_url" {
  description = "CloudFront distribution URL for the frontend (empty when CloudFront is disabled/unverified)"
  value       = module.taskly.cloudfront_frontend_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.taskly.cognito_user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.taskly.cognito_client_id
}

output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.taskly.documentdb_endpoint
  sensitive   = true
}

output "s3_uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = module.taskly.s3_uploads_bucket
}

output "lambda_function_name" {
  description = "API handler Lambda function name"
  value       = module.taskly.lambda_function_name
}
