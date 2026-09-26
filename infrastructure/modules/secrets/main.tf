###############################################################################
# Secrets Manager Module
#
# Manages application secrets for the Taskly platform including database
# credentials, JWT signing keys, Cognito client secrets, and SES SMTP
# credentials. Configures automatic rotation for database credentials.
#
#  11.5 (secrets storage with auto-rotation every 90 days)
#               11.6 (Lambda retrieves updated secrets without redeployment)
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

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name
  name_prefix = "${var.project}-${var.environment}"
}

# -----------------------------------------------------------------------------
# KMS Key for Secrets Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "secrets" {
  description             = "KMS key for encrypting ${local.name_prefix} secrets"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowSecretsManagerUse"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:ReEncryptFrom",
          "kms:ReEncryptTo"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${local.name_prefix}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# -----------------------------------------------------------------------------
# Secret: DocumentDB Credentials
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "documentdb_credentials" {
  name        = "${var.project}/${var.environment}/documentdb-credentials"
  description = "DocumentDB master credentials for ${local.name_prefix}"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "documentdb_credentials" {
  secret_id = aws_secretsmanager_secret.documentdb_credentials.id
  secret_string = jsonencode({
    username = var.documentdb_master_username
    password = var.documentdb_master_password
    engine   = "mongo"
    host     = var.documentdb_endpoint
    port     = var.documentdb_port
    dbname   = var.documentdb_database_name
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_rotation" "documentdb_credentials" {
  secret_id           = aws_secretsmanager_secret.documentdb_credentials.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = var.rotation_days
  }

  depends_on = [aws_lambda_permission.secrets_manager_invoke]
}

# -----------------------------------------------------------------------------
# Secret: JWT Signing Key
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "jwt_signing_key" {
  name        = "${var.project}/${var.environment}/jwt-signing-key"
  description = "JWT signing key for legacy token compatibility in ${local.name_prefix}"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_signing_key" {
  secret_id = aws_secretsmanager_secret.jwt_signing_key.id
  secret_string = jsonencode({
    secret = var.jwt_signing_key
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# -----------------------------------------------------------------------------
# Secret: Cognito Client Secret
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "cognito_client_secret" {
  name        = "${var.project}/${var.environment}/cognito-client-secret"
  description = "Cognito app client secret for ${local.name_prefix}"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "cognito_client_secret" {
  secret_id = aws_secretsmanager_secret.cognito_client_secret.id
  secret_string = jsonencode({
    client_id     = var.cognito_client_id
    client_secret = var.cognito_client_secret
    user_pool_id  = var.cognito_user_pool_id
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# -----------------------------------------------------------------------------
# Secret: SES SMTP Credentials
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "ses_smtp_credentials" {
  name        = "${var.project}/${var.environment}/ses-smtp-credentials"
  description = "SES SMTP credentials for email sending in ${local.name_prefix}"
  kms_key_id  = aws_kms_key.secrets.arn

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "ses_smtp_credentials" {
  secret_id = aws_secretsmanager_secret.ses_smtp_credentials.id
  secret_string = jsonencode({
    smtp_username = var.ses_smtp_username
    smtp_password = var.ses_smtp_password
    smtp_endpoint = "email-smtp.${local.region}.amazonaws.com"
    smtp_port     = 587
    sender_email  = var.ses_sender_email
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
