###############################################################################
# Lambda Module — Function Resources
#
# Defines Lambda functions for the Taskly application:
# - API Handler: Main Express app wrapped with serverless-express
# - Achievement Processor: Processes task.completed events
# - Notification Processor: Processes team/project events for notifications
# - Email Processor: Consumes SQS email queue and sends via SES
#
# All functions use ARM64 (Graviton2) architecture for better price/performance.
# Functions are placed in VPC private subnets for DocumentDB access.
#
#  1.3, 1.6, 11.4, 12.1, 12.5
###############################################################################

# ─── API Handler Lambda ───────────────────────────────────────────────────────

resource "aws_lambda_function" "api_handler" {
  function_name = "${var.project_name}-${var.environment}-api"
  description   = "Taskly API handler - Express app via serverless-express"
  role          = var.execution_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"] # Graviton2 for better price/performance
  timeout       = var.api_handler_timeout
  memory_size   = var.api_handler_memory

  s3_bucket = var.api_handler_s3_bucket
  s3_key    = var.api_handler_s3_key

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      NODE_ENV                 = "production"
      DOCUMENTDB_SECRET_NAME   = var.documentdb_secret_arn
      COGNITO_USER_POOL_ID     = var.cognito_user_pool_id
      COGNITO_CLIENT_ID        = var.cognito_client_id
      S3_UPLOAD_BUCKET         = var.s3_upload_bucket
      EVENT_BUS_NAME           = var.event_bus_name
      CDN_DOMAIN               = var.cdn_domain
      EMAIL_QUEUE_URL          = var.email_queue_url
      NOTIFICATION_QUEUE_URL   = var.notification_queue_url
      PORT                     = "5000"
      MONGODB_URI              = "skip"
      JWT_SECRET               = "skip"
      SESSION_SECRET           = "skip"
      CLIENT_URL               = "https://${var.cdn_domain}"
      CLOUDINARY_CLOUD_NAME    = "skip"
      CLOUDINARY_API_KEY       = "skip"
      CLOUDINARY_API_SECRET    = "skip"
    }
  }

  # Reserved concurrency (set to -1 to use unreserved)
  reserved_concurrent_executions = var.reserved_concurrency_api >= 0 ? var.reserved_concurrency_api : null

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api"
    Component = "lambda"
    Purpose   = "api-handler"
  })

  lifecycle {
    ignore_changes = [s3_key] # Managed by CI/CD pipeline
  }
}

# Conditional reserved concurrency for API handler
resource "aws_lambda_function_event_invoke_config" "api_handler" {
  function_name = aws_lambda_function.api_handler.function_name

  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0 # API requests should not be retried by Lambda
}

# ─── Achievement Processor Lambda ─────────────────────────────────────────────

resource "aws_lambda_function" "achievement_processor" {
  function_name = "${var.project_name}-${var.environment}-achievement-processor"
  description   = "Processes task.completed events for achievement evaluation"
  role          = var.execution_role_arn
  handler       = "lambda/processors/achievement-processor.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = var.processor_timeout
  memory_size   = var.processor_memory

  s3_bucket = var.processor_s3_bucket
  s3_key    = var.achievement_processor_s3_key

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      NODE_ENV               = var.environment == "prod" ? "production" : var.environment
      DOCUMENTDB_SECRET_NAME = var.documentdb_secret_arn
    }
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-achievement-processor"
    Component = "lambda"
    Purpose   = "event-processor"
  })

  lifecycle {
    ignore_changes = [s3_key]
  }
}

# ─── Notification Processor Lambda ────────────────────────────────────────────

resource "aws_lambda_function" "notification_processor" {
  function_name = "${var.project_name}-${var.environment}-notification-processor"
  description   = "Processes team/project events for notification creation"
  role          = var.execution_role_arn
  handler       = "lambda/processors/notification-processor.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = var.processor_timeout
  memory_size   = var.processor_memory

  s3_bucket = var.processor_s3_bucket
  s3_key    = var.notification_processor_s3_key

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }

  environment {
    variables = {
      NODE_ENV               = var.environment == "prod" ? "production" : var.environment
      DOCUMENTDB_SECRET_NAME = var.documentdb_secret_arn
      EMAIL_QUEUE_URL        = var.email_queue_url
      NOTIFICATION_QUEUE_URL = var.notification_queue_url
    }
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-notification-processor"
    Component = "lambda"
    Purpose   = "event-processor"
  })

  lifecycle {
    ignore_changes = [s3_key]
  }
}

# ─── Email Processor Lambda ───────────────────────────────────────────────────

resource "aws_lambda_function" "email_processor" {
  function_name = "${var.project_name}-${var.environment}-email-processor"
  description   = "Consumes SQS email queue and sends emails via SES"
  role          = var.execution_role_arn
  handler       = "lambda/processors/email-processor.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  timeout       = 30 # Email sending should complete quickly
  memory_size   = 128 # Minimal memory needed for SES calls

  s3_bucket = var.processor_s3_bucket
  s3_key    = var.email_processor_s3_key

  # Email processor does NOT need VPC access (SES is a public service)
  # Keeping it outside VPC reduces cold start time

  environment {
    variables = {
      NODE_ENV       = var.environment == "prod" ? "production" : var.environment
      SES_FROM_EMAIL = var.ses_from_email
    }
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-email-processor"
    Component = "lambda"
    Purpose   = "email-sender"
  })

  lifecycle {
    ignore_changes = [s3_key]
  }
}

# ─── SQS Event Source Mapping (Email Queue → Email Processor) ─────────────────

resource "aws_lambda_event_source_mapping" "email_queue" {
  event_source_arn                   = var.email_queue_arn
  function_name                      = aws_lambda_function.email_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  enabled                            = true

  function_response_types = ["ReportBatchItemFailures"]
}

# ─── CloudWatch Log Groups ────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "api_handler" {
  name              = "/aws/lambda/${aws_lambda_function.api_handler.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api-logs"
    Component = "lambda"
  })
}

resource "aws_cloudwatch_log_group" "achievement_processor" {
  name              = "/aws/lambda/${aws_lambda_function.achievement_processor.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-achievement-processor-logs"
    Component = "lambda"
  })
}

resource "aws_cloudwatch_log_group" "notification_processor" {
  name              = "/aws/lambda/${aws_lambda_function.notification_processor.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-notification-processor-logs"
    Component = "lambda"
  })
}

resource "aws_cloudwatch_log_group" "email_processor" {
  name              = "/aws/lambda/${aws_lambda_function.email_processor.function_name}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-email-processor-logs"
    Component = "lambda"
  })
}
