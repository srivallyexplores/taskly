output "environment" {
  description = "Current deployment environment"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "name_prefix" {
  description = "Resource naming prefix (project-environment)"
  value       = local.name_prefix
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# ─── Service Endpoints ────────────────────────────────────────────────────────

output "api_gateway_url" {
  description = "API Gateway endpoint URL"
  value       = module.apigateway.api_endpoint
}

output "cloudfront_frontend_url" {
  description = "CloudFront distribution URL for the frontend"
  value       = module.cloudfront.frontend_distribution_domain_name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.app_client_id
}

output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.documentdb.cluster_endpoint
  sensitive   = true
}

output "s3_uploads_bucket" {
  description = "S3 uploads bucket name"
  value       = module.s3.uploads_bucket_id
}

output "lambda_function_name" {
  description = "API handler Lambda function name"
  value       = module.lambda.api_handler_function_name
}
