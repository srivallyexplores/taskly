###############################################################################
# API Gateway Module — Variables
#
#  1.1, 1.5, 3.6, 3.7
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

variable "lambda_function_arn" {
  description = "ARN of the Lambda function to integrate with API Gateway"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function (for permissions)"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for JWT authorization"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Client ID of the Cognito User Pool App Client"
  type        = string
}

variable "cognito_user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool (issuer URL)"
  type        = string
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "$default"
}

variable "throttling_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 100
}

variable "throttling_rate_limit" {
  description = "API Gateway throttling rate limit (requests per second)"
  type        = number
  default     = 50
}

variable "access_log_retention_days" {
  description = "CloudWatch log retention in days for API Gateway access logs"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
