# Cognito Module - Outputs
# All IDs and ARNs are exported for use by other modules (API Gateway, Lambda, CI/CD)

# -----------------------------------------------------------------------------
# User Pool
# -----------------------------------------------------------------------------

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool (for JWT issuer validation)"
  value       = aws_cognito_user_pool.main.endpoint
}

# -----------------------------------------------------------------------------
# App Client
# -----------------------------------------------------------------------------

output "app_client_id" {
  description = "ID of the Cognito User Pool App Client"
  value       = aws_cognito_user_pool_client.main.id
}

output "app_client_name" {
  description = "Name of the Cognito User Pool App Client"
  value       = aws_cognito_user_pool_client.main.name
}

# -----------------------------------------------------------------------------
# Domain (Hosted UI)
# -----------------------------------------------------------------------------

output "user_pool_domain" {
  description = "Cognito hosted UI domain (null if disabled)"
  value       = var.enable_user_pool_domain ? aws_cognito_user_pool_domain.main[0].domain : null
}

output "hosted_ui_url" {
  description = "Full URL of the Cognito hosted UI (null if domain disabled)"
  value       = var.enable_user_pool_domain ? "https://${aws_cognito_user_pool_domain.main[0].domain}.auth.${data.aws_region.current.id}.amazoncognito.com" : null
}

# -----------------------------------------------------------------------------
# Token Configuration (for reference by consuming modules)
# -----------------------------------------------------------------------------

output "access_token_validity_hours" {
  description = "Access token validity in hours"
  value       = var.access_token_validity
}

output "refresh_token_validity_days" {
  description = "Refresh token validity in days"
  value       = var.refresh_token_validity
}

# -----------------------------------------------------------------------------
# Google Identity Provider
# -----------------------------------------------------------------------------

output "google_idp_enabled" {
  description = "Whether Google OAuth federation is enabled"
  value       = var.enable_google_idp
}

output "google_idp_name" {
  description = "Name of the Google identity provider (null if disabled)"
  value       = var.enable_google_idp ? aws_cognito_identity_provider.google[0].provider_name : null
}
