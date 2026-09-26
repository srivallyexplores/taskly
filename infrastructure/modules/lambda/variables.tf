###############################################################################
# Lambda Module — Variables
#
#  1.3, 1.6, 11.4, 12.1, 12.5
###############################################################################

variable "project_name" {
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

# ─── Networking ───────────────────────────────────────────────────────────────

variable "vpc_id" {
  description = "VPC ID for Lambda function placement"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "lambda_security_group_id" {
  description = "Security group ID for Lambda functions"
  type        = string
}

# ─── IAM ──────────────────────────────────────────────────────────────────────

variable "execution_role_arn" {
  description = "IAM execution role ARN for Lambda functions"
  type        = string
}

# ─── Function Configuration ───────────────────────────────────────────────────

variable "api_handler_memory" {
  description = "Memory allocation for the API handler Lambda (MB)"
  type        = number
  default     = 512
}

variable "api_handler_timeout" {
  description = "Timeout for the API handler Lambda (seconds)"
  type        = number
  default     = 29
}

variable "processor_memory" {
  description = "Memory allocation for event processor Lambdas (MB)"
  type        = number
  default     = 256
}

variable "processor_timeout" {
  description = "Timeout for event processor Lambdas (seconds)"
  type        = number
  default     = 60
}

variable "reserved_concurrency_api" {
  description = "Reserved concurrent executions for the API handler Lambda. Set to -1 for unreserved."
  type        = number
  default     = -1
}

variable "reserved_concurrency_processors" {
  description = "Reserved concurrent executions for processor Lambdas. Set to -1 for unreserved."
  type        = number
  default     = -1
}

# ─── Deployment Package ───────────────────────────────────────────────────────

variable "api_handler_s3_bucket" {
  description = "S3 bucket containing the API handler deployment package"
  type        = string
}

variable "api_handler_s3_key" {
  description = "S3 key for the API handler deployment package"
  type        = string
}

variable "processor_s3_bucket" {
  description = "S3 bucket containing the processor deployment packages"
  type        = string
}

variable "achievement_processor_s3_key" {
  description = "S3 key for the achievement processor deployment package"
  type        = string
}

variable "notification_processor_s3_key" {
  description = "S3 key for the notification processor deployment package"
  type        = string
}

variable "email_processor_s3_key" {
  description = "S3 key for the email processor deployment package"
  type        = string
}

# ─── Environment Variables ────────────────────────────────────────────────────

variable "documentdb_secret_arn" {
  description = "ARN of the Secrets Manager secret for DocumentDB credentials"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "s3_upload_bucket" {
  description = "S3 bucket name for file uploads"
  type        = string
}

variable "event_bus_name" {
  description = "EventBridge event bus name"
  type        = string
}

variable "email_queue_url" {
  description = "SQS email queue URL"
  type        = string
}

variable "email_queue_arn" {
  description = "SQS email queue ARN (for event source mapping)"
  type        = string
}

variable "notification_queue_url" {
  description = "SQS notification queue URL"
  type        = string
}

variable "cdn_domain" {
  description = "CloudFront CDN domain for uploaded files"
  type        = string
  default     = ""
}

variable "ses_from_email" {
  description = "SES verified sender email address"
  type        = string
  default     = "noreply@taskly.app"
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
