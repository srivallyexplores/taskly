# SES Module - Email Service Configuration
#  6.2 (verified domain identity with SPF, DKIM, DMARC)
#
# Configures Amazon SES with domain identity verification, DKIM signing,
# SPF records via custom MAIL FROM domain, and sending authorization policy.
# Outputs all DNS records needed for domain verification.

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

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

locals {
  name_prefix      = "${var.project}-${var.environment}"
  mail_from_domain = "${var.mail_from_subdomain}.${var.domain}"
  dmarc_value = var.dmarc_rua_email != "" ? (
    "v=DMARC1; p=${var.dmarc_policy}; rua=mailto:${var.dmarc_rua_email}"
  ) : "v=DMARC1; p=${var.dmarc_policy}"
}

# -----------------------------------------------------------------------------
# SES Domain Identity
# -----------------------------------------------------------------------------

resource "aws_ses_domain_identity" "main" {
  domain = var.domain
}

# -----------------------------------------------------------------------------
# SES Domain DKIM Verification
# Generates 3 CNAME records for DKIM signing (2048-bit keys)
# -----------------------------------------------------------------------------

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# -----------------------------------------------------------------------------
# SES Custom MAIL FROM Domain
# Configures a custom MAIL FROM domain for SPF alignment
# -----------------------------------------------------------------------------

resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = local.mail_from_domain
}

# -----------------------------------------------------------------------------
# SES Configuration Set
# Tracks email delivery metrics (sends, bounces, complaints)
# -----------------------------------------------------------------------------

resource "aws_ses_configuration_set" "main" {
  name = "${local.name_prefix}-email-config"

  delivery_options {
    tls_policy = "Require"
  }

  reputation_metrics_enabled = true
  sending_enabled            = true
}

# -----------------------------------------------------------------------------
# SES Sending Authorization Policy
# Allows specified principals to send email using this domain identity
# -----------------------------------------------------------------------------

resource "aws_ses_identity_policy" "sending_authorization" {
  count = length(var.sending_authorized_principals) > 0 ? 1 : 0

  identity = aws_ses_domain_identity.main.arn
  name     = "${local.name_prefix}-sending-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAuthorizedSending"
        Effect    = "Allow"
        Principal = { AWS = var.sending_authorized_principals }
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail",
          "ses:SendBulkTemplatedEmail"
        ]
        Resource = aws_ses_domain_identity.main.arn
        Condition = {
          StringEquals = {
            "ses:FromAddress" = "*@${var.domain}"
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# SES Event Destination (CloudWatch)
# Publishes email delivery events to CloudWatch for monitoring
# -----------------------------------------------------------------------------

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "${local.name_prefix}-cloudwatch-events"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true

  matching_types = [
    "send",
    "reject",
    "bounce",
    "complaint",
    "delivery",
    "renderingFailure",
  ]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "ses:configuration-set"
    value_source   = "messageTag"
  }
}
