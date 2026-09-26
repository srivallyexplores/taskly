# IAM Module - Input Variables

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

variable "tags" {
  description = "Common tags to apply to all IAM resources"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "VPC ID for scoping network interface permissions"
  type        = string
  default     = ""
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for auth function permissions"
  type        = string
  default     = ""
}

variable "uploads_bucket_arn" {
  description = "ARN of the S3 uploads bucket for file operation permissions"
  type        = string
  default     = ""
}

variable "eventbridge_bus_arn" {
  description = "ARN of the EventBridge bus for event publishing permissions"
  type        = string
  default     = ""
}

variable "ses_sender_email" {
  description = "Verified SES sender email address for email function permissions"
  type        = string
  default     = "noreply@taskly.app"
}
