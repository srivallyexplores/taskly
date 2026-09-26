###############################################################################
# WAF Module — Variables
#
#  11.1, 11.2
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

variable "api_gateway_stage_arn" {
  description = "ARN of the API Gateway stage to associate with the WAF WebACL"
  type        = string
}

variable "enable_api_gateway_association" {
  description = <<-EOT
    Whether to associate the WAF WebACL with the API Gateway stage.
    WAFv2 regional WebACLs can only be associated with API Gateway v1 (REST) stages,
    Application Load Balancers, AppSync, Cognito user pools, and App Runner services.
    They CANNOT be associated with API Gateway v2 (HTTP API) stages. Taskly uses an
    HTTP API (aws_apigatewayv2_api, protocol_type = "HTTP"), so this defaults to false.
    The WebACL is still created and can be attached to a compatible resource, or the
    API can be fronted by CloudFront (which supports the CLOUDFRONT-scope WebACL).
  EOT
  type        = bool
  default     = false
}

variable "rate_limit" {
  description = "Maximum requests per IP per 5-minute window before rate limiting"
  type        = number
  default     = 1000
}

variable "rate_limit_action" {
  description = "Action to take when rate limit is exceeded (block or count)"
  type        = string
  default     = "block"

  validation {
    condition     = contains(["block", "count"], var.rate_limit_action)
    error_message = "Rate limit action must be 'block' or 'count'."
  }
}

variable "ip_rate_limit_enabled" {
  description = "Whether to enable IP-based rate limiting"
  type        = bool
  default     = true
}

variable "managed_rules_enabled" {
  description = "Whether to enable AWS Managed Rule groups"
  type        = bool
  default     = true
}

variable "cloudwatch_metrics_enabled" {
  description = "Whether to enable CloudWatch metrics for WAF rules"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
