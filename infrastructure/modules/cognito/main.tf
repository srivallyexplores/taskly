###############################################################################
# Cognito Module - User Pool and App Client
#
# Provisions an Amazon Cognito User Pool for Taskly authentication with:
# - Email and username sign-in ( 3.1, 3.2)
# - Password policy: minimum 6 characters (Requirement 3.8)
# - Email verification via SES (Requirement 3.1)
# - OAuth 2.0 App Client with authorization code and implicit flows
# - Token expiry: access 1hr, refresh 7 days (Requirement 3.4)
###############################################################################

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

locals {
  name_prefix = "${var.project}-${var.environment}"

  # Use SES for email delivery when an identity ARN is provided, otherwise
  # fall back to Cognito's default email (suitable for dev/low-volume).
  use_ses = var.ses_email_identity_arn != ""
}

# -----------------------------------------------------------------------------
# Cognito User Pool
# -----------------------------------------------------------------------------

resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-user-pool"

  # Sign-in configuration: allow both email and preferred_username as aliases (Req 3.1, 3.2)
  # This allows users to sign in with their email OR a chosen username.
  alias_attributes         = ["email", "preferred_username"]
  auto_verified_attributes = ["email"]

  # Username configuration
  username_configuration {
    case_sensitive = false
  }

  # Password policy - minimum 6 characters to match existing Taskly rules (Req 3.8)
  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = false
    require_numbers                  = false
    require_symbols                  = false
    require_uppercase                = false
    temporary_password_validity_days = 7
  }

  # Email verification configuration
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Taskly - Verify your email"
    email_message        = "Your Taskly verification code is: {####}"
  }

  # Account recovery via email
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration - use SES when available (Req 3.1)
  dynamic "email_configuration" {
    for_each = local.use_ses ? [1] : []
    content {
      email_sending_account  = "DEVELOPER"
      source_arn             = var.ses_email_identity_arn
      from_email_address     = var.ses_from_email
      reply_to_email_address = var.ses_from_email
    }
  }

  dynamic "email_configuration" {
    for_each = local.use_ses ? [] : [1]
    content {
      email_sending_account = "COGNITO_DEFAULT"
    }
  }

  # Schema attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Picture attribute - mapped from Google OAuth profile picture URL (Req 3.3)
  schema {
    name                     = "picture"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  # MFA configuration - optional for future enhancement
  mfa_configuration = "OFF"

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }

  # Post-confirmation Lambda trigger - creates Taskly user record after signup/federation (Req 3.3)
  dynamic "lambda_config" {
    for_each = var.post_confirmation_lambda_arn != "" ? [1] : []
    content {
      post_confirmation = var.post_confirmation_lambda_arn
    }
  }

  # Deletion protection for staging/prod
  deletion_protection = var.environment != "dev" ? "ACTIVE" : "INACTIVE"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-user-pool"
  })
}

# -----------------------------------------------------------------------------
# Cognito User Pool Domain (Hosted UI)
# -----------------------------------------------------------------------------

resource "aws_cognito_user_pool_domain" "main" {
  count = var.enable_user_pool_domain ? 1 : 0

  domain       = var.domain_prefix != "" ? var.domain_prefix : "${var.project}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# -----------------------------------------------------------------------------
# Cognito User Pool App Client
# -----------------------------------------------------------------------------

resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth 2.0 flows: authorization code and implicit (Req 3.4)
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Supported identity providers - include Google when federation is enabled (Req 3.3)
  supported_identity_providers = var.enable_google_idp ? ["COGNITO", "Google"] : ["COGNITO"]

  # Callback and logout URLs
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Token validity configuration (Req 3.4)
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Auth flows enabled
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  # Do not generate a client secret for public SPA clients
  generate_secret = false

  # Prevent user existence errors from leaking information
  prevent_user_existence_errors = "ENABLED"

  # Read and write attributes - include picture for Google OAuth attribute mapping (Req 3.3)
  read_attributes  = ["email", "name", "picture", "preferred_username"]
  write_attributes = ["email", "name", "picture", "preferred_username"]

  # Ensure the Google IdP is created before the client references it
  depends_on = [aws_cognito_identity_provider.google]
}
