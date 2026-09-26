# Secrets Module - Input Variables

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
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# DocumentDB Credential Variables
# -----------------------------------------------------------------------------

variable "documentdb_master_username" {
  description = "DocumentDB master username"
  type        = string
  default     = "taskly_admin"
}

variable "documentdb_master_password" {
  description = "DocumentDB master password (initial value, rotated automatically)"
  type        = string
  sensitive   = true
}

variable "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  type        = string
  default     = ""
}

variable "documentdb_port" {
  description = "DocumentDB cluster port"
  type        = number
  default     = 27017
}

variable "documentdb_database_name" {
  description = "DocumentDB database name"
  type        = string
  default     = "taskly"
}

variable "documentdb_cluster_identifier" {
  description = "DocumentDB cluster identifier for rotation Lambda"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# JWT Variables
# -----------------------------------------------------------------------------

variable "jwt_signing_key" {
  description = "JWT signing key for legacy token compatibility"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Cognito Variables
# -----------------------------------------------------------------------------

variable "cognito_client_id" {
  description = "Cognito app client ID"
  type        = string
  default     = ""
}

variable "cognito_client_secret" {
  description = "Cognito app client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# SES Variables
# -----------------------------------------------------------------------------

variable "ses_smtp_username" {
  description = "SES SMTP username"
  type        = string
  default     = ""
}

variable "ses_smtp_password" {
  description = "SES SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ses_sender_email" {
  description = "Verified SES sender email address"
  type        = string
  default     = "noreply@taskly.app"
}

# -----------------------------------------------------------------------------
# Rotation Configuration
# -----------------------------------------------------------------------------

variable "rotation_days" {
  description = "Number of days between automatic secret rotation"
  type        = number
  default     = 90
}

# -----------------------------------------------------------------------------
# Networking (for rotation Lambda)
# -----------------------------------------------------------------------------

variable "vpc_id" {
  description = "VPC ID for the rotation Lambda function"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the rotation Lambda function"
  type        = list(string)
  default     = []
}

variable "lambda_security_group_id" {
  description = "Security group ID for the rotation Lambda function"
  type        = string
  default     = ""
}
