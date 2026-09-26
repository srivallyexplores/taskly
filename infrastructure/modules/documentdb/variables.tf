# DocumentDB Module - Variables
#  2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 12.2

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

variable "instance_class" {
  description = "DocumentDB instance class (e.g., db.t3.medium, db.r5.large)"
  type        = string
  default     = "db.t3.medium"
}

variable "instance_count" {
  description = "Number of DocumentDB instances (minimum 2 for multi-AZ HA)"
  type        = number
  default     = 2

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 16
    error_message = "Instance count must be between 1 and 16."
  }
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DocumentDB subnet group"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for the DocumentDB cluster (allows inbound from Lambda on port 27017)"
  type        = string
}

variable "master_username" {
  description = "Master username for the DocumentDB cluster"
  type        = string
  default     = "taskly_admin"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for the DocumentDB cluster"
  type        = string
  sensitive   = true
}

variable "engine_version" {
  description = "DocumentDB engine version"
  type        = string
  default     = "5.0.0"
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "preferred_backup_window" {
  description = "Daily time range for automated backups (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Weekly time range for system maintenance (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for encryption at rest. If null, AWS managed key is used."
  type        = string
  default     = null
}

variable "deletion_protection" {
  description = "Enable deletion protection for the cluster"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Whether to skip the final snapshot when the cluster is deleted"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
