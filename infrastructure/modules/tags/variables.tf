variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project" {
  description = "Project name used in resource naming and tagging"
  type        = string
  default     = "taskly"
}

variable "cost_center" {
  description = "Cost center tag for billing visibility"
  type        = string
  default     = "engineering"
}

variable "managed_by" {
  description = "Tool managing the infrastructure"
  type        = string
  default     = "terraform"
}

variable "owner" {
  description = "Team or individual owning the resources"
  type        = string
  default     = "platform-team"
}

variable "additional_tags" {
  description = "Additional tags to merge with the standard tag map"
  type        = map(string)
  default     = {}
}
