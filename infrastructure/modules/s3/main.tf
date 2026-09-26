# S3 Module - File Storage and Frontend Hosting
#  4.2, 4.3, 4.6, 4.7, 4.8, 5.1, 5.7, 11.7, 12.4
#
# Creates two S3 buckets:
# 1. Uploads bucket - stores user avatars and task attachments with versioning,
#    AES-256 encryption, lifecycle rules, and CORS for pre-signed URL uploads.
# 2. Frontend bucket - stores React SPA static assets with versioning and encryption,
#    served exclusively via CloudFront using Origin Access Control.

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

data "aws_region" "current" {}

locals {
  name_prefix = "${var.project}-${var.environment}"
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name
}

# =============================================================================
# UPLOADS BUCKET
# =============================================================================

# -----------------------------------------------------------------------------
# Uploads Bucket - Core Resource
#  4.2, 4.3, 11.7
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name_prefix}-uploads-${local.account_id}"

  # Prevent accidental deletion of bucket with data
  force_destroy = var.force_destroy

  tags = merge(var.tags, {
    Name    = "${local.name_prefix}-uploads"
    Purpose = "file-uploads"
  })
}

# -----------------------------------------------------------------------------
# Uploads Bucket - Versioning
#  4.8 (durability), 13.4 (11 nines durability)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

# -----------------------------------------------------------------------------
# Uploads Bucket - Server-Side Encryption (AES-256)
#  11.7
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# -----------------------------------------------------------------------------
# Uploads Bucket - Block All Public Access
#  4.8
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# Uploads Bucket - Lifecycle Rules
#  4.6 (transition to IA after 90 days), 4.7 (multipart cleanup 24h)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  # Rule 1: Abort incomplete multipart uploads after 24 hours
  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }

  # Rule 2: Transition attachments to Intelligent-Tiering after 90 days
  rule {
    id     = "transition-to-intelligent-tiering"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 90
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  depends_on = [aws_s3_bucket_versioning.uploads]
}

# -----------------------------------------------------------------------------
# Uploads Bucket - CORS Configuration for Pre-Signed URL Uploads
#  4.1, 4.2, 4.3
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag", "x-amz-request-id"]
    max_age_seconds = 3600
  }
}

# =============================================================================
# FRONTEND BUCKET
# =============================================================================

# -----------------------------------------------------------------------------
# Frontend Bucket - Core Resource
#  5.1, 5.7
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend-${local.account_id}"

  force_destroy = var.force_destroy

  tags = merge(var.tags, {
    Name    = "${local.name_prefix}-frontend"
    Purpose = "frontend-hosting"
  })
}

# -----------------------------------------------------------------------------
# Frontend Bucket - Versioning
#  5.1
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# -----------------------------------------------------------------------------
# Frontend Bucket - Server-Side Encryption (AES-256)
#  11.7
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# -----------------------------------------------------------------------------
# Frontend Bucket - Block All Public Access
#  5.7 (served exclusively via CloudFront)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# NOTE: The S3 bucket policy for CloudFront OAC is managed by the CloudFront module
# (infrastructure/modules/cloudfront/) which has the actual distribution ARN.
# This avoids circular dependencies between S3 and CloudFront modules.
