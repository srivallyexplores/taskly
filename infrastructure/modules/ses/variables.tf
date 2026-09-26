# SES Module - Input Variables

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

variable "domain" {
  description = "Domain name for SES identity verification (e.g., taskly.app)"
  type        = string
}

variable "dmarc_policy" {
  description = "DMARC policy to apply (none, quarantine, reject)"
  type        = string
  default     = "quarantine"

  validation {
    condition     = contains(["none", "quarantine", "reject"], var.dmarc_policy)
    error_message = "DMARC policy must be one of: none, quarantine, reject."
  }
}

variable "dmarc_rua_email" {
  description = "Email address to receive DMARC aggregate reports"
  type        = string
  default     = ""
}

variable "mail_from_subdomain" {
  description = "Subdomain for custom MAIL FROM (e.g., 'mail' results in mail.example.com)"
  type        = string
  default     = "mail"
}

variable "sending_authorized_principals" {
  description = "List of AWS account ARNs or IAM role ARNs authorized to send email via this SES identity"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all SES resources"
  type        = map(string)
  default     = {}
}
