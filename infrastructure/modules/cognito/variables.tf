# Cognito Module - Input Variables

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

variable "ses_email_identity_arn" {
  description = "ARN of the verified SES email identity (domain or email) used for Cognito email delivery"
  type        = string
  default     = ""
}

variable "ses_from_email" {
  description = "The FROM email address for Cognito emails (e.g., no-reply@taskly.app)"
  type        = string
  default     = "no-reply@taskly.app"
}

variable "callback_urls" {
  description = "List of allowed OAuth callback URLs for the app client"
  type        = list(string)
  default     = ["http://localhost:5173/auth/callback"]
}

variable "logout_urls" {
  description = "List of allowed logout URLs for the app client"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "access_token_validity" {
  description = "Access token validity duration in hours"
  type        = number
  default     = 1
}

variable "refresh_token_validity" {
  description = "Refresh token validity duration in days"
  type        = number
  default     = 7
}

variable "id_token_validity" {
  description = "ID token validity duration in hours"
  type        = number
  default     = 1
}

variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 6
}

variable "enable_user_pool_domain" {
  description = "Whether to create a Cognito hosted UI domain prefix"
  type        = bool
  default     = true
}

variable "domain_prefix" {
  description = "Cognito hosted UI domain prefix (e.g., taskly-dev). Only used if enable_user_pool_domain is true."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all Cognito resources"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Google OAuth Federation (Requirement 3.3)
# -----------------------------------------------------------------------------

variable "enable_google_idp" {
  description = "Whether to enable Google as a federated identity provider"
  type        = bool
  default     = false
}

variable "google_client_id" {
  description = "Google OAuth 2.0 Client ID for Cognito federation"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth 2.0 Client Secret for Cognito federation"
  type        = string
  default     = ""
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Post-Confirmation Lambda Trigger
# -----------------------------------------------------------------------------

variable "post_confirmation_lambda_arn" {
  description = "ARN of the Lambda function to invoke after user confirmation (creates Taskly user record in DocumentDB). Leave empty to disable."
  type        = string
  default     = ""
}
