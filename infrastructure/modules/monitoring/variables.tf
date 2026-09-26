###############################################################################
# Monitoring Module — Variables
#
#  10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
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

# ─── Lambda Function References ───────────────────────────────────────────────

variable "api_handler_function_name" {
  description = "Name of the API handler Lambda function"
  type        = string
}

variable "api_handler_log_group_name" {
  description = "CloudWatch log group name for the API handler Lambda"
  type        = string
}

variable "processor_function_names" {
  description = "Map of processor Lambda function names"
  type        = map(string)
  default     = {}
}

# ─── DocumentDB References ────────────────────────────────────────────────────

variable "documentdb_cluster_id" {
  description = "DocumentDB cluster identifier for monitoring"
  type        = string
}

# ─── S3 Log Archive ──────────────────────────────────────────────────────────

variable "log_archive_bucket_arn" {
  description = "ARN of the S3 bucket for log archival"
  type        = string
  default     = ""
}

# ─── Notification ─────────────────────────────────────────────────────────────

variable "alarm_email_endpoints" {
  description = "Email addresses to receive alarm notifications"
  type        = list(string)
  default     = []
}

variable "monthly_budget_amount" {
  description = "Monthly budget threshold in USD for billing alerts"
  type        = number
  default     = 100
}

# ─── Retention ────────────────────────────────────────────────────────────────

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "log_archive_retention_days" {
  description = "S3 log archive retention in days"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
