# CloudFront Module - CDN Distributions
# : 4.5, 4.8, 5.1, 5.2, 5.3, 5.4, 5.6, 12.6
#
# Creates two CloudFront distributions:
# 1. Frontend Distribution - serves React SPA from S3 with OAC, SPA routing,
#    gzip+Brotli compression, cache behaviors for hashed assets and index.html.
# 2. Uploads Distribution - serves user-uploaded files from S3 with OAC,
#    24-hour cache TTL, and signed URL access restriction.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project}-${var.environment}"
}

# =============================================================================
# FRONTEND DISTRIBUTION
# : 5.1, 5.2, 5.3, 5.4, 5.6, 12.6
# =============================================================================

# -----------------------------------------------------------------------------
# Origin Access Control - Frontend
# Grants CloudFront read access to the private S3 frontend bucket.
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# -----------------------------------------------------------------------------
# Cache Policy - Hashed Assets (1 year, immutable)
# For Vite-built assets with content hashes in filenames.
# : 5.6
# -----------------------------------------------------------------------------

resource "aws_cloudfront_cache_policy" "hashed_assets" {
  name        = "${local.name_prefix}-hashed-assets"
  comment     = "Cache policy for hashed static assets (1 year TTL)"
  default_ttl = 31536000 # 1 year
  max_ttl     = 31536000
  min_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

# -----------------------------------------------------------------------------
# Cache Policy - index.html (no-cache)
# Ensures users always get the latest SPA entry point.
# : 5.6
# -----------------------------------------------------------------------------

resource "aws_cloudfront_cache_policy" "no_cache" {
  name        = "${local.name_prefix}-no-cache"
  comment     = "Cache policy for index.html (no-cache, always revalidate)"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_brotli = false
    enable_accept_encoding_gzip   = false
  }
}

# -----------------------------------------------------------------------------
# Response Headers Policy - Security Headers
# Adds security headers to all frontend responses.
# -----------------------------------------------------------------------------

resource "aws_cloudfront_response_headers_policy" "frontend_security" {
  name    = "${local.name_prefix}-frontend-security-headers"
  comment = "Security headers for frontend distribution"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

# -----------------------------------------------------------------------------
# Frontend CloudFront Distribution
# : 5.1, 5.2, 5.3, 5.4, 5.6, 12.6
# -----------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "frontend" {
  count               = var.enable_distributions ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name_prefix} frontend distribution"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # North America + Europe
  aliases             = length(var.frontend_aliases) > 0 ? var.frontend_aliases : null
  wait_for_deployment = false

  # S3 Origin with OAC
  origin {
    domain_name              = var.frontend_bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Default cache behavior (general static files - 1 hour cache)
  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-frontend"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.no_cache.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.frontend_security.id
  }

  # Ordered cache behavior: hashed assets (/assets/*) - 1 year immutable
  ordered_cache_behavior {
    path_pattern               = "/assets/*"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-frontend"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.hashed_assets.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.frontend_security.id
  }

  # Custom error responses for SPA routing
  # 403 (S3 returns 403 for non-existent keys with OAC) → index.html
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # 404 → index.html for client-side routing
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # HTTPS enforcement
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # TLS configuration
  viewer_certificate {
    # Use custom ACM certificate if aliases are provided, otherwise use default CloudFront cert
    cloudfront_default_certificate = var.acm_certificate_arn == null ? true : false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != null ? "TLSv1.2_2021" : "TLSv1"
  }

  tags = merge(var.tags, {
    Name    = "${local.name_prefix}-frontend-cdn"
    Purpose = "frontend-hosting"
  })
}

# =============================================================================
# UPLOADS DISTRIBUTION
# : 4.5, 4.8
# =============================================================================

# -----------------------------------------------------------------------------
# Origin Access Control - Uploads
# Grants CloudFront read access to the private S3 uploads bucket.
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "uploads" {
  name                              = "${local.name_prefix}-uploads-oac"
  description                       = "OAC for uploads S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# -----------------------------------------------------------------------------
# Cache Policy - Uploads (24 hour TTL)
# : 4.5
# -----------------------------------------------------------------------------

resource "aws_cloudfront_cache_policy" "uploads" {
  name        = "${local.name_prefix}-uploads-cache"
  comment     = "Cache policy for uploaded files (24 hour TTL)"
  default_ttl = 86400 # 24 hours
  max_ttl     = 86400 # 24 hours
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

# -----------------------------------------------------------------------------
# Uploads CloudFront Distribution
# : 4.5, 4.8
# Serves uploaded files (avatars, attachments) with signed URL access control.
# -----------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "uploads" {
  count               = var.enable_distributions ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name_prefix} uploads distribution"
  price_class         = "PriceClass_100" # North America + Europe
  aliases             = length(var.uploads_aliases) > 0 ? var.uploads_aliases : null
  wait_for_deployment = false

  # S3 Origin with OAC
  origin {
    domain_name              = var.uploads_bucket_regional_domain_name
    origin_id                = "s3-uploads"
    origin_access_control_id = aws_cloudfront_origin_access_control.uploads.id
  }

  # Default cache behavior - signed URLs required for access
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-uploads"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.uploads.id

    # Restrict access to signed URLs only
    trusted_key_groups = length(var.cloudfront_trusted_key_group_ids) > 0 ? var.cloudfront_trusted_key_group_ids : null
  }

  # HTTPS enforcement
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # TLS configuration
  viewer_certificate {
    cloudfront_default_certificate = var.acm_certificate_arn == null ? true : false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = var.acm_certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = var.acm_certificate_arn != null ? "TLSv1.2_2021" : "TLSv1"
  }

  tags = merge(var.tags, {
    Name    = "${local.name_prefix}-uploads-cdn"
    Purpose = "file-uploads"
  })
}

# =============================================================================
# S3 BUCKET POLICIES FOR OAC
# These policies allow the CloudFront distributions to read from the S3 buckets.
# =============================================================================

# -----------------------------------------------------------------------------
# Frontend Bucket Policy - Allow CloudFront OAC to read objects
# : 5.1, 5.7
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "frontend_cloudfront" {
  count  = var.enable_distributions ? 1 : 0
  bucket = var.frontend_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOACRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.frontend_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend[0].arn
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Uploads Bucket Policy - Allow CloudFront OAC to read objects
# : 4.8
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "uploads_cloudfront" {
  count  = var.enable_distributions ? 1 : 0
  bucket = var.uploads_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOACRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${var.uploads_bucket_arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.uploads[0].arn
          }
        }
      }
    ]
  })
}
