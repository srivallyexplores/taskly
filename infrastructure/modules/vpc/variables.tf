# VPC Module - Input Variables

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

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "nat_gateway_count" {
  description = "Number of NAT Gateways to create (1 for dev/staging, 2 for prod HA)"
  type        = number
  default     = 1

  validation {
    condition     = var.nat_gateway_count >= 1 && var.nat_gateway_count <= 2
    error_message = "NAT Gateway count must be 1 (single) or 2 (HA pair)."
  }
}

variable "enable_interface_endpoints" {
  description = "Whether to create VPC Interface Endpoints (Secrets Manager, SQS, EventBridge, CloudWatch Logs). Set to true for staging/prod, false for dev to save costs."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common tags to apply to all VPC resources"
  type        = map(string)
  default     = {}
}
