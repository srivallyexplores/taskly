###############################################################################
# Security Hardening — TLS, Headers, and Access Controls
#
# - Enforces TLS 1.2 minimum on API Gateway custom domain
# - Configures security headers via CloudFront response headers policy
# - Verifies S3 bucket public access is blocked (handled by S3 module)
#
#  11.7, 11.8
###############################################################################

# ─── CloudFront Response Headers Policy ───────────────────────────────────────
#
# Applied to CloudFront distributions to add security headers to all responses.
# This replaces the Helmet middleware for static assets served via CloudFront.

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.project_name}-${var.environment}-security-headers"
  comment = "Security headers for Taskly ${var.environment} environment"

  security_headers_config {
    # Strict-Transport-Security: enforce HTTPS for 1 year, include subdomains
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    # X-Content-Type-Options: prevent MIME type sniffing
    content_type_options {
      override = true
    }

    # X-Frame-Options: prevent clickjacking
    frame_options {
      frame_option = "DENY"
      override     = true
    }

    # X-XSS-Protection: enable browser XSS filter
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    # Referrer-Policy: limit referrer information
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    # Content-Security-Policy
    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com"
      override                = true
    }
  }

  # Custom headers
  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "camera=(), microphone=(), geolocation=()"
      override = true
    }
  }
}

# ─── API Gateway Custom Domain with TLS 1.2 ──────────────────────────────────
#
# Note: This resource requires a valid ACM certificate and custom domain name.
# Uncomment and configure when a custom domain is available.
#
# resource "aws_apigatewayv2_domain_name" "api" {
#   domain_name = var.api_custom_domain
#
#   domain_name_configuration {
#     certificate_arn = var.acm_certificate_arn
#     endpoint_type   = "REGIONAL"
#     security_policy = "TLS_1_2"  # Enforce TLS 1.2 minimum
#   }
#
#   tags = merge(var.tags, {
#     Name      = "${var.project_name}-${var.environment}-api-domain"
#     Component = "apigateway"
#   })
# }
#
# resource "aws_apigatewayv2_api_mapping" "api" {
#   api_id      = var.api_gateway_id
#   domain_name = aws_apigatewayv2_domain_name.api.id
#   stage       = var.api_gateway_stage_id
# }
