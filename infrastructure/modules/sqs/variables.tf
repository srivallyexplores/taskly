###############################################################################
# SQS Module — Variables
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

variable "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role that needs access to queues"
  type        = string
}

variable "event_bus_arn" {
  description = "ARN of the EventBridge event bus (for DLQ policy)"
  type        = string
  default     = ""
}

variable "email_queue_visibility_timeout" {
  description = "Visibility timeout for the email queue in seconds"
  type        = number
  default     = 60
}

variable "notification_queue_visibility_timeout" {
  description = "Visibility timeout for the notification queue in seconds"
  type        = number
  default     = 90
}

variable "dlq_message_retention_days" {
  description = "Number of days to retain messages in dead-letter queues"
  type        = number
  default     = 14
}

variable "max_receive_count" {
  description = "Number of times a message can be received before being sent to DLQ"
  type        = number
  default     = 3
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
