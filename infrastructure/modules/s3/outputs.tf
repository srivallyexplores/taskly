# S3 Module - Outputs
# All bucket identifiers are exported for use by other modules (CloudFront, Lambda, IAM)

# =============================================================================
# UPLOADS BUCKET
# =============================================================================

output "uploads_bucket_id" {
  description = "ID (name) of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  description = "ARN of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.arn
}

output "uploads_bucket_regional_domain_name" {
  description = "Regional domain name of the uploads S3 bucket (for CloudFront origin)"
  value       = aws_s3_bucket.uploads.bucket_regional_domain_name
}

# =============================================================================
# FRONTEND BUCKET
# =============================================================================

output "frontend_bucket_id" {
  description = "ID (name) of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend S3 bucket (for CloudFront origin)"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}
