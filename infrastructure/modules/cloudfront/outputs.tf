# CloudFront Module - Outputs
# Exports distribution identifiers for use by other modules (CI/CD, DNS, application config)
#
# NOTE: The two distributions are conditional on var.enable_distributions. When
# disabled (e.g. on an unverified AWS account that cannot create CloudFront
# resources yet), the ID/ARN/domain outputs degrade gracefully:
#   - IDs/ARNs/hosted zone IDs return "" (empty string)
#   - uploads_distribution_domain_name falls back to the uploads S3 bucket
#     regional domain name so downstream consumers (e.g. the API Lambda's
#     CDN_DOMAIN env var) still receive a valid, resolvable domain.

# =============================================================================
# FRONTEND DISTRIBUTION
# =============================================================================

output "frontend_distribution_id" {
  description = "ID of the frontend CloudFront distribution (used for cache invalidation in CI/CD)"
  value       = one(aws_cloudfront_distribution.frontend[*].id) != null ? one(aws_cloudfront_distribution.frontend[*].id) : ""
}

output "frontend_distribution_arn" {
  description = "ARN of the frontend CloudFront distribution (used for S3 bucket policy and WAF association)"
  value       = one(aws_cloudfront_distribution.frontend[*].arn) != null ? one(aws_cloudfront_distribution.frontend[*].arn) : ""
}

output "frontend_distribution_domain_name" {
  description = "Domain name of the frontend CloudFront distribution (e.g., d1234.cloudfront.net). Empty when distributions are disabled."
  value       = one(aws_cloudfront_distribution.frontend[*].domain_name) != null ? one(aws_cloudfront_distribution.frontend[*].domain_name) : ""
}

output "frontend_distribution_hosted_zone_id" {
  description = "Route 53 hosted zone ID for the frontend distribution (for alias records)"
  value       = one(aws_cloudfront_distribution.frontend[*].hosted_zone_id) != null ? one(aws_cloudfront_distribution.frontend[*].hosted_zone_id) : ""
}

# =============================================================================
# UPLOADS DISTRIBUTION
# =============================================================================

output "uploads_distribution_id" {
  description = "ID of the uploads CloudFront distribution (used for cache invalidation)"
  value       = one(aws_cloudfront_distribution.uploads[*].id) != null ? one(aws_cloudfront_distribution.uploads[*].id) : ""
}

output "uploads_distribution_arn" {
  description = "ARN of the uploads CloudFront distribution (used for S3 bucket policy)"
  value       = one(aws_cloudfront_distribution.uploads[*].arn) != null ? one(aws_cloudfront_distribution.uploads[*].arn) : ""
}

output "uploads_distribution_domain_name" {
  description = "Domain name of the uploads CloudFront distribution. Falls back to the uploads S3 bucket regional domain name when distributions are disabled."
  value       = one(aws_cloudfront_distribution.uploads[*].domain_name) != null ? one(aws_cloudfront_distribution.uploads[*].domain_name) : var.uploads_bucket_regional_domain_name
}

output "uploads_distribution_hosted_zone_id" {
  description = "Route 53 hosted zone ID for the uploads distribution (for alias records)"
  value       = one(aws_cloudfront_distribution.uploads[*].hosted_zone_id) != null ? one(aws_cloudfront_distribution.uploads[*].hosted_zone_id) : ""
}

# =============================================================================
# OAC IDENTIFIERS
# =============================================================================

output "frontend_oac_id" {
  description = "ID of the Origin Access Control for the frontend distribution"
  value       = aws_cloudfront_origin_access_control.frontend.id
}

output "uploads_oac_id" {
  description = "ID of the Origin Access Control for the uploads distribution"
  value       = aws_cloudfront_origin_access_control.uploads.id
}
