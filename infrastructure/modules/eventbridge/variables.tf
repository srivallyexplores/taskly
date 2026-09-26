###############################################################################
# EventBridge Module — Variables
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

variable "event_processor_lambda_arn" {
  description = "ARN of the event processor Lambda function (target for EventBridge rules). Used for task.completed and user.activity events."
  type        = string
}

variable "event_processor_lambda_name" {
  description = "Name of the event processor Lambda function (for permissions)"
  type        = string
}

variable "notification_processor_lambda_arn" {
  description = "ARN of the notification processor Lambda function (target for team.member.added and project.updated events)"
  type        = string
  default     = ""
}

variable "notification_processor_lambda_name" {
  description = "Name of the notification processor Lambda function (for permissions)"
  type        = string
  default     = ""
}

variable "event_dlq_arn" {
  description = "ARN of the dead-letter queue for failed EventBridge event deliveries"
  type        = string
}

variable "tags" {
  description = "Common resource tags"
  type        = map(string)
  default     = {}
}
