###############################################################################
# Google OAuth Identity Provider Federation
#
# Configures Google as a federated identity provider in the Cognito User Pool.
# When a user authenticates via Google OAuth, Cognito federates the identity
# and maps Google profile attributes to Cognito user attributes.
#
# Requirement 3.3: WHEN a user authenticates via Google OAuth, THE
# Cognito_User_Pool SHALL federate the identity and create or link the
# corresponding Taskly user record.
###############################################################################

# -----------------------------------------------------------------------------
# Google Identity Provider
# -----------------------------------------------------------------------------

resource "aws_cognito_identity_provider" "google" {
  count = var.enable_google_idp ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id                     = var.google_client_id
    client_secret                 = var.google_client_secret
    authorize_scopes              = "email profile openid"
    attributes_url                = "https://people.googleapis.com/v1/people/me?personFields="
    attributes_url_add_attributes = "true"
    authorize_url                 = "https://accounts.google.com/o/oauth2/v2/auth"
    oidc_issuer                   = "https://accounts.google.com"
    token_request_method          = "POST"
    token_url                     = "https://www.googleapis.com/oauth2/v4/token"
  }

  # Attribute mapping: Google profile → Cognito user attributes
  attribute_mapping = {
    email    = "email"
    name     = "name"
    picture  = "picture"
    username = "sub"
  }

  lifecycle {
    ignore_changes = [
      provider_details["client_secret"]
    ]
  }
}

# -----------------------------------------------------------------------------
# Post-Confirmation Lambda Trigger
#
# After a user confirms their account (email verification or Google federation),
# this trigger invokes a Lambda function to create the corresponding Taskly
# user record in DocumentDB.
# -----------------------------------------------------------------------------

resource "aws_lambda_permission" "cognito_post_confirmation" {
  count = var.post_confirmation_lambda_arn != "" ? 1 : 0

  statement_id  = "AllowCognitoInvokePostConfirmation"
  action        = "lambda:InvokeFunction"
  function_name = var.post_confirmation_lambda_arn
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
