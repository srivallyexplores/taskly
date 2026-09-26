# Secrets Module - Outputs

# -----------------------------------------------------------------------------
# Secret ARNs (for IAM policies and Lambda environment variables)
# -----------------------------------------------------------------------------

output "documentdb_credentials_secret_arn" {
  description = "ARN of the DocumentDB credentials secret"
  value       = aws_secretsmanager_secret.documentdb_credentials.arn
}

output "jwt_signing_key_secret_arn" {
  description = "ARN of the JWT signing key secret"
  value       = aws_secretsmanager_secret.jwt_signing_key.arn
}

output "cognito_client_secret_arn" {
  description = "ARN of the Cognito client secret"
  value       = aws_secretsmanager_secret.cognito_client_secret.arn
}

output "ses_smtp_credentials_secret_arn" {
  description = "ARN of the SES SMTP credentials secret"
  value       = aws_secretsmanager_secret.ses_smtp_credentials.arn
}

# -----------------------------------------------------------------------------
# Secret Names (for application code to reference)
# -----------------------------------------------------------------------------

output "documentdb_credentials_secret_name" {
  description = "Name of the DocumentDB credentials secret"
  value       = aws_secretsmanager_secret.documentdb_credentials.name
}

output "jwt_signing_key_secret_name" {
  description = "Name of the JWT signing key secret"
  value       = aws_secretsmanager_secret.jwt_signing_key.name
}

output "cognito_client_secret_name" {
  description = "Name of the Cognito client secret"
  value       = aws_secretsmanager_secret.cognito_client_secret.name
}

output "ses_smtp_credentials_secret_name" {
  description = "Name of the SES SMTP credentials secret"
  value       = aws_secretsmanager_secret.ses_smtp_credentials.name
}

# -----------------------------------------------------------------------------
# KMS Key
# -----------------------------------------------------------------------------

output "kms_key_arn" {
  description = "ARN of the KMS key used to encrypt secrets"
  value       = aws_kms_key.secrets.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used to encrypt secrets"
  value       = aws_kms_key.secrets.key_id
}

# -----------------------------------------------------------------------------
# Rotation Lambda
# -----------------------------------------------------------------------------

output "rotation_lambda_arn" {
  description = "ARN of the secret rotation Lambda function"
  value       = aws_lambda_function.secret_rotation.arn
}

output "rotation_lambda_role_arn" {
  description = "ARN of the rotation Lambda execution role"
  value       = aws_iam_role.rotation_lambda.arn
}

# -----------------------------------------------------------------------------
# All Secret ARNs (for bulk IAM policy grants)
# -----------------------------------------------------------------------------

output "all_secret_arns" {
  description = "List of all secret ARNs managed by this module"
  value = [
    aws_secretsmanager_secret.documentdb_credentials.arn,
    aws_secretsmanager_secret.jwt_signing_key.arn,
    aws_secretsmanager_secret.cognito_client_secret.arn,
    aws_secretsmanager_secret.ses_smtp_credentials.arn,
  ]
}
