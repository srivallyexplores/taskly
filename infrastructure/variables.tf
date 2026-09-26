variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "taskly"
}

variable "cost_center" {
  description = "Cost center tag for billing visibility"
  type        = string
  default     = "engineering"
}

variable "owner" {
  description = "Team or individual responsible for the resources"
  type        = string
  default     = "platform-team"
}

# ─── Networking ───────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_cloudfront" {
  description = <<-EOT
    Whether to create the CloudFront distributions (frontend + uploads). Set to
    false on AWS accounts that have not been verified for CloudFront (the
    CloudFront API returns "AccessDenied: Your account must be verified before
    you can add new CloudFront resources" until AWS Support verifies the
    account). When false, the rest of the stack (API Gateway, Lambda, DocumentDB,
    etc.) still deploys, and the Lambda CDN_DOMAIN falls back to the uploads S3
    bucket regional domain name. Re-enable and re-apply once the account is
    verified. Defaults to true.
  EOT
  type        = bool
  default     = true
}

# ─── Database ─────────────────────────────────────────────────────────────────

variable "documentdb_master_password" {
  description = "Master password for the DocumentDB cluster"
  type        = string
  sensitive   = true
}

variable "documentdb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "documentdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 1
}

# ─── Secrets ──────────────────────────────────────────────────────────────────

variable "jwt_signing_key" {
  description = "JWT signing key for legacy token compatibility"
  type        = string
  sensitive   = true
}

# ─── Email ────────────────────────────────────────────────────────────────────

variable "ses_domain" {
  description = "Domain name for SES identity verification (e.g., taskly.app)"
  type        = string
  default     = "taskly.app"
}

# ─── DNS / Disaster Recovery ──────────────────────────────────────────────────

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for DNS failover"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the API (e.g., api.taskly.app)"
  type        = string
  default     = "api.taskly.app"
}
