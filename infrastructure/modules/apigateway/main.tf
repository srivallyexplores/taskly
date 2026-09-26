###############################################################################
# API Gateway Module — HTTP API (v2)
#
# Defines an HTTP API (not REST API) for lower latency and cost.
# Configures Cognito JWT authorizer for protected routes and
# route integrations mapping to the Lambda function.
#
# HTTP API advantages over REST API:
# - ~70% lower cost
# - Lower latency (no additional API Gateway processing)
# - Native JWT authorizer support
# - Automatic IAM-based deployments
#
#  1.1, 1.5, 3.6, 3.7
###############################################################################

# ─── HTTP API ─────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "taskly" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"
  description   = "Taskly API Gateway - ${var.environment} environment"

  # CORS configuration matching current frontend origin
  cors_configuration {
    allow_origins     = var.cors_allowed_origins
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    allow_headers     = ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
    expose_headers    = ["X-Correlation-Id"]
    max_age           = 3600
    allow_credentials = true
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api"
    Component = "apigateway"
  })
}

# ─── Cognito JWT Authorizer ───────────────────────────────────────────────────

resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.taskly.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.project_name}-${var.environment}-cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://${var.cognito_user_pool_endpoint}"
  }
}

# ─── Lambda Integration ───────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.taskly.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.lambda_function_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000 # 29 seconds (API Gateway max is 30s)

  description = "Lambda proxy integration for Taskly API"
}

# ─── API Routes ───────────────────────────────────────────────────────────────

# Health check — no authorization required
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.taskly.id
  route_key = "GET /api/health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Auth routes — no authorization required (login/register)
resource "aws_apigatewayv2_route" "auth" {
  api_id    = aws_apigatewayv2_api.taskly.id
  route_key = "ANY /api/auth/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Users routes — JWT authorized
resource "aws_apigatewayv2_route" "users" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/users/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Tasks routes — JWT authorized
resource "aws_apigatewayv2_route" "tasks" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/tasks/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Projects routes — JWT authorized
resource "aws_apigatewayv2_route" "projects" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/projects/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Teams routes — JWT authorized
resource "aws_apigatewayv2_route" "teams" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/teams/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Invitations routes — JWT authorized
resource "aws_apigatewayv2_route" "invitations" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/invitations/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Notifications routes — JWT authorized
resource "aws_apigatewayv2_route" "notifications" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/notifications/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Search routes — JWT authorized
resource "aws_apigatewayv2_route" "search" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/search/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Calendar routes — JWT authorized
resource "aws_apigatewayv2_route" "calendar" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/calendar/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Upload routes — JWT authorized
resource "aws_apigatewayv2_route" "upload" {
  api_id             = aws_apigatewayv2_api.taskly.id
  route_key          = "ANY /api/upload/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# ─── Stage with Access Logging ────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.taskly.id
  name        = "$default"
  auto_deploy = true
  description = "Default stage with auto-deploy"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
      errorMessage   = "$context.error.message"
      authorizerError = "$context.authorizer.error"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api-stage"
    Component = "apigateway"
  })
}

# ─── CloudWatch Log Group for Access Logs ─────────────────────────────────────

resource "aws_cloudwatch_log_group" "api_access_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-api"
  retention_in_days = var.access_log_retention_days

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api-logs"
    Component = "apigateway"
  })
}

# ─── Lambda Permission for API Gateway ────────────────────────────────────────

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.taskly.execution_arn}/*/*"
}
