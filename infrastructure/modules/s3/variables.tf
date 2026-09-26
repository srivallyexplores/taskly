# S3 Module - Input Variables

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

variable "force_destroy" {
  description = "Whether to allow Terraform to destroy buckets that contain objects. Set to true for dev/staging, false for prod."
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS on the uploads bucket (e.g., CloudFront domain, localhost for dev)"
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:3000"]
}

# NOTE: The CloudFront distribution ARN is no longer needed here.
# The S3 bucket policy for CloudFront OAC access is managed by the CloudFront module
# (infrastructure/modules/cloudfront/) which has direct access to the distribution ARN.

variable "tags" {
  description = "Common tags to apply to all S3 resources"
  type        = map(string)
  default     = {}
}
