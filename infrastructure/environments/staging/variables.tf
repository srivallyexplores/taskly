variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "taskly"
}

variable "cost_center" {
  description = "Cost center tag for billing visibility"
  type        = string
  default     = "engineering"
}

variable "owner" {
  description = "Team or individual responsible for the resources"
  type        = string
  default     = "platform-team"
}
