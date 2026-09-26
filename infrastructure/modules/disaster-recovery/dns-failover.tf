###############################################################################
# DNS Failover and Maintenance Page
#
# Configures:
# - Route 53 health check for API Gateway endpoint
# - DNS failover to static S3 maintenance page
# - Failover TTL of 60 seconds
#
# : 13.7, 13.6
###############################################################################

variable "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for health checking"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the API (e.g., api.taskly.app)"
  type        = string
}

variable "maintenance_bucket_website_endpoint" {
  description = "S3 website endpoint for the maintenance page"
  type        = string
  default     = ""
}

# ─── Route 53 Health Check ────────────────────────────────────────────────────

resource "aws_route53_health_check" "api" {
  fqdn              = replace(var.api_gateway_endpoint, "https://", "")
  port              = 443
  type              = "HTTPS"
  resource_path     = "/api/health"
  failure_threshold = 3
  request_interval  = 30

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api-health"
    Component = "disaster-recovery"
  })
}

# ─── Maintenance Page S3 Bucket ───────────────────────────────────────────────

resource "aws_s3_bucket" "maintenance" {
  bucket = "${var.project_name}-${var.environment}-maintenance"

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-maintenance"
    Component = "disaster-recovery"
  })
}

resource "aws_s3_bucket_website_configuration" "maintenance" {
  bucket = aws_s3_bucket.maintenance.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "maintenance" {
  bucket = aws_s3_bucket.maintenance.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "maintenance" {
  bucket = aws_s3_bucket.maintenance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.maintenance.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.maintenance]
}

# Upload maintenance page
resource "aws_s3_object" "maintenance_page" {
  bucket       = aws_s3_bucket.maintenance.id
  key          = "index.html"
  content_type = "text/html"

  content = <<-HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Taskly - Maintenance</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
        .container { text-align: center; padding: 2rem; max-width: 500px; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        p { color: #64748b; line-height: 1.6; }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔧</div>
        <h1>We'll be right back</h1>
        <p>Taskly is currently undergoing scheduled maintenance. We expect to be back shortly. Thank you for your patience.</p>
      </div>
    </body>
    </html>
  HTML
}

# ─── DNS Failover Records ─────────────────────────────────────────────────────

# Primary record — points to API Gateway
# Only created when a hosted zone is provided (skipped when hosted_zone_id == "")
resource "aws_route53_record" "api_primary" {
  count = var.hosted_zone_id != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = replace(var.api_gateway_endpoint, "https://", "")
    zone_id                = "Z1UJRXOUMOOFQ8" # API Gateway hosted zone (us-east-1)
    evaluate_target_health = true
  }

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.api.id
}

# Secondary record — points to maintenance page
# Only created when a hosted zone is provided (skipped when hosted_zone_id == "")
resource "aws_route53_record" "api_secondary" {
  count = var.hosted_zone_id != "" ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_s3_bucket_website_configuration.maintenance.website_endpoint
    zone_id                = aws_s3_bucket.maintenance.hosted_zone_id
    evaluate_target_health = false
  }

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "secondary"
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "health_check_id" {
  description = "Route 53 health check ID"
  value       = aws_route53_health_check.api.id
}

output "maintenance_bucket" {
  description = "Maintenance page S3 bucket"
  value       = aws_s3_bucket.maintenance.id
}

output "maintenance_url" {
  description = "Maintenance page URL"
  value       = "http://${aws_s3_bucket_website_configuration.maintenance.website_endpoint}"
}
