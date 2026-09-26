variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
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

# ─── Required root-module secrets (no defaults) ───────────────────────────────

variable "documentdb_master_password" {
  description = "Master password for the DocumentDB cluster"
  type        = string
  sensitive   = true
}

variable "jwt_signing_key" {
  description = "JWT signing key for legacy token compatibility"
  type        = string
  sensitive   = true
}

# ─── DNS / Email ──────────────────────────────────────────────────────────────

variable "ses_domain" {
  description = "Domain name for SES identity verification"
  type        = string
  default     = "taskly.app"
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for DNS failover (empty disables DNS records)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the API"
  type        = string
  default     = "api.taskly.app"
}

# ─── Sizing (consumed by root module) ─────────────────────────────────────────

variable "documentdb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "documentdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 1
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ─── Accepted-but-currently-unconsumed tuning variables ───────────────────────
# Declared so terraform does not warn about undeclared variables present in
# terraform.tfvars. The root module does not currently wire these; defaults
# match the values in terraform.tfvars.

variable "api_handler_memory" {
  description = "Memory (MB) for the API handler Lambda"
  type        = number
  default     = 256
}

variable "api_handler_timeout" {
  description = "Timeout (seconds) for the API handler Lambda"
  type        = number
  default     = 29
}

variable "processor_memory" {
  description = "Memory (MB) for the processor Lambdas"
  type        = number
  default     = 128
}

variable "reserved_concurrency_api" {
  description = "Reserved concurrency for the API handler Lambda"
  type        = number
  default     = 10
}

variable "reserved_concurrency_processors" {
  description = "Reserved concurrency for the processor Lambdas"
  type        = number
  default     = 5
}

variable "throttling_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 50
}

variable "throttling_rate_limit" {
  description = "API Gateway throttling rate limit"
  type        = number
  default     = 25
}

variable "waf_rate_limit" {
  description = "WAF rate limit threshold"
  type        = number
  default     = 2000
}

variable "waf_rate_limit_action" {
  description = "WAF rate limit action (count or block)"
  type        = string
  default     = "count"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "monthly_budget_amount" {
  description = "Monthly budget amount (USD)"
  type        = number
  default     = 50
}

variable "alarm_email_endpoints" {
  description = "Email endpoints for alarm notifications"
  type        = list(string)
  default     = []
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
}

variable "cors_allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["http://localhost:3000", "http://127.0.0.1:3000"]
}

variable "enable_cloudfront" {
  description = "Whether to create CloudFront distributions. Disable on AWS accounts not yet verified for CloudFront; the rest of the stack still deploys."
  type        = bool
  default     = true
}
