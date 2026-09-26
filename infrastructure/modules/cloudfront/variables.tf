# CloudFront Module - Input Variables

variable "project" {
  description = "Project name used for resource naming"
  type        = string
  default     = "taskly"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "enable_distributions" {
  description = <<-EOT
    Whether to create the two CloudFront distributions (frontend + uploads) and
    their S3 bucket policies. New/unverified AWS accounts return
    "AccessDenied: Your account must be verified before you can add new
    CloudFront resources" from the CloudFront API until AWS Support verifies the
    account. Set this to false to deploy the rest of the stack (API, Lambda,
    DocumentDB, etc.) without CloudFront; when disabled, cdn_domain falls back to
    the uploads S3 bucket regional domain name. Re-enable and re-apply once the
    account is verified. Defaults to true.
  EOT
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Frontend Distribution Variables
# -----------------------------------------------------------------------------

variable "frontend_bucket_id" {
  description = "ID (name) of the S3 bucket hosting frontend static assets"
  type        = string
}

variable "frontend_bucket_arn" {
  description = "ARN of the S3 bucket hosting frontend static assets"
  type        = string
}

variable "frontend_bucket_regional_domain_name" {
  description = "Regional domain name of the frontend S3 bucket (used as CloudFront origin)"
  type        = string
}

# -----------------------------------------------------------------------------
# Uploads Distribution Variables
# -----------------------------------------------------------------------------

variable "uploads_bucket_id" {
  description = "ID (name) of the S3 bucket storing user uploads"
  type        = string
}

variable "uploads_bucket_arn" {
  description = "ARN of the S3 bucket storing user uploads"
  type        = string
}

variable "uploads_bucket_regional_domain_name" {
  description = "Regional domain name of the uploads S3 bucket (used as CloudFront origin)"
  type        = string
}

# -----------------------------------------------------------------------------
# Optional Configuration
# -----------------------------------------------------------------------------

variable "frontend_aliases" {
  description = "Custom domain aliases for the frontend distribution (e.g., ['app.taskly.com'])"
  type        = list(string)
  default     = []
}

variable "uploads_aliases" {
  description = "Custom domain aliases for the uploads distribution (e.g., ['files.taskly.com'])"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for custom domains. Required if aliases are specified."
  type        = string
  default     = null
}

variable "cloudfront_trusted_key_group_ids" {
  description = "List of CloudFront key group IDs for signed URL validation on the uploads distribution"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all CloudFront resources"
  type        = map(string)
  default     = {}
}
