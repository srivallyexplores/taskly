# Per-Function IAM Policies (Least Privilege)
# Each Lambda function gets only the permissions it needs for its specific operations.

# -----------------------------------------------------------------------------
# Auth Functions - Cognito access for user management
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_auth" {
  name = "${local.name_prefix}-lambda-auth"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lambda_auth_cognito" {
  name        = "${local.name_prefix}-lambda-auth-cognito"
  description = "Allow auth Lambda to manage Cognito user operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminDisableUser",
          "cognito-idp:AdminEnableUser",
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminRespondToAuthChallenge"
        ]
        Resource = var.cognito_user_pool_arn != "" ? var.cognito_user_pool_arn : "arn:aws:cognito-idp:${local.region}:${local.account_id}:userpool/*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_auth_cognito" {
  role       = aws_iam_role.lambda_auth.name
  policy_arn = aws_iam_policy.lambda_auth_cognito.arn
}

resource "aws_iam_role_policy_attachment" "lambda_auth_logging" {
  role       = aws_iam_role.lambda_auth.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_auth_vpc" {
  role       = aws_iam_role.lambda_auth.name
  policy_arn = aws_iam_policy.lambda_vpc_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_auth_secrets" {
  role       = aws_iam_role.lambda_auth.name
  policy_arn = aws_iam_policy.lambda_secrets_read.arn
}

# -----------------------------------------------------------------------------
# Upload Functions - S3 access for file operations
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_upload" {
  name = "${local.name_prefix}-lambda-upload"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lambda_upload_s3" {
  name        = "${local.name_prefix}-lambda-upload-s3"
  description = "Allow upload Lambda to manage S3 file operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.uploads_bucket_arn != "" ? var.uploads_bucket_arn : "arn:aws:s3:::${local.name_prefix}-uploads",
          var.uploads_bucket_arn != "" ? "${var.uploads_bucket_arn}/*" : "arn:aws:s3:::${local.name_prefix}-uploads/*"
        ]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_upload_s3" {
  role       = aws_iam_role.lambda_upload.name
  policy_arn = aws_iam_policy.lambda_upload_s3.arn
}

resource "aws_iam_role_policy_attachment" "lambda_upload_logging" {
  role       = aws_iam_role.lambda_upload.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_upload_vpc" {
  role       = aws_iam_role.lambda_upload.name
  policy_arn = aws_iam_policy.lambda_vpc_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_upload_secrets" {
  role       = aws_iam_role.lambda_upload.name
  policy_arn = aws_iam_policy.lambda_secrets_read.arn
}

# -----------------------------------------------------------------------------
# Event Processor Functions - EventBridge and SQS access
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_event_processor" {
  name = "${local.name_prefix}-lambda-event-processor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lambda_event_processor_sqs" {
  name        = "${local.name_prefix}-lambda-event-processor-sqs"
  description = "Allow event processor Lambda to consume SQS messages"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = "arn:aws:sqs:${local.region}:${local.account_id}:${local.name_prefix}-*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_event_processor_sqs" {
  role       = aws_iam_role.lambda_event_processor.name
  policy_arn = aws_iam_policy.lambda_event_processor_sqs.arn
}

resource "aws_iam_role_policy_attachment" "lambda_event_processor_logging" {
  role       = aws_iam_role.lambda_event_processor.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_event_processor_vpc" {
  role       = aws_iam_role.lambda_event_processor.name
  policy_arn = aws_iam_policy.lambda_vpc_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_event_processor_secrets" {
  role       = aws_iam_role.lambda_event_processor.name
  policy_arn = aws_iam_policy.lambda_secrets_read.arn
}

# -----------------------------------------------------------------------------
# API Handler Functions - EventBridge publish access (for async events)
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_eventbridge_publish" {
  name        = "${local.name_prefix}-lambda-eventbridge-publish"
  description = "Allow API Lambda functions to publish events to EventBridge"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = var.eventbridge_bus_arn != "" ? var.eventbridge_bus_arn : "arn:aws:events:${local.region}:${local.account_id}:event-bus/${local.name_prefix}-bus"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_execution_eventbridge" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_eventbridge_publish.arn
}

# -----------------------------------------------------------------------------
# Email Sender Function - SES send access
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_email_sender" {
  name = "${local.name_prefix}-lambda-email-sender"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lambda_email_ses" {
  name        = "${local.name_prefix}-lambda-email-ses"
  description = "Allow email sender Lambda to send emails via SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ses:FromAddress" = var.ses_sender_email
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = "arn:aws:sqs:${local.region}:${local.account_id}:${local.name_prefix}-email-queue"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_email_ses" {
  role       = aws_iam_role.lambda_email_sender.name
  policy_arn = aws_iam_policy.lambda_email_ses.arn
}

resource "aws_iam_role_policy_attachment" "lambda_email_logging" {
  role       = aws_iam_role.lambda_email_sender.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "lambda_email_secrets" {
  role       = aws_iam_role.lambda_email_sender.name
  policy_arn = aws_iam_policy.lambda_secrets_read.arn
}

# -----------------------------------------------------------------------------
# Image Processor Function - S3 read/write for image processing
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_image_processor" {
  name = "${local.name_prefix}-lambda-image-processor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "lambda_image_processor_s3" {
  name        = "${local.name_prefix}-lambda-image-processor-s3"
  description = "Allow image processor Lambda to read/write S3 objects"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = var.uploads_bucket_arn != "" ? "${var.uploads_bucket_arn}/avatars/*/original/*" : "arn:aws:s3:::${local.name_prefix}-uploads/avatars/*/original/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = var.uploads_bucket_arn != "" ? "${var.uploads_bucket_arn}/avatars/*/processed/*" : "arn:aws:s3:::${local.name_prefix}-uploads/avatars/*/processed/*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_image_processor_s3" {
  role       = aws_iam_role.lambda_image_processor.name
  policy_arn = aws_iam_policy.lambda_image_processor_s3.arn
}

resource "aws_iam_role_policy_attachment" "lambda_image_processor_logging" {
  role       = aws_iam_role.lambda_image_processor.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

# -----------------------------------------------------------------------------
# API Gateway Execution Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "api_gateway" {
  name = "${local.name_prefix}-api-gateway"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "api_gateway_invoke_lambda" {
  name        = "${local.name_prefix}-apigw-invoke-lambda"
  description = "Allow API Gateway to invoke Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:${local.region}:${local.account_id}:function:${local.name_prefix}-*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_invoke_lambda" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = aws_iam_policy.api_gateway_invoke_lambda.arn
}

resource "aws_iam_policy" "api_gateway_logging" {
  name        = "${local.name_prefix}-apigw-logging"
  description = "Allow API Gateway to write access logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents"
        ]
        Resource = "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/apigateway/${local.name_prefix}-*:*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_logging" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = aws_iam_policy.api_gateway_logging.arn
}

# -----------------------------------------------------------------------------
# EventBridge Execution Role (for invoking Lambda targets)
# -----------------------------------------------------------------------------

resource "aws_iam_role" "eventbridge" {
  name = "${local.name_prefix}-eventbridge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_policy" "eventbridge_invoke_targets" {
  name        = "${local.name_prefix}-eventbridge-invoke-targets"
  description = "Allow EventBridge to invoke Lambda functions and send to SQS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:${local.region}:${local.account_id}:function:${local.name_prefix}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = "arn:aws:sqs:${local.region}:${local.account_id}:${local.name_prefix}-*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "eventbridge_invoke_targets" {
  role       = aws_iam_role.eventbridge.name
  policy_arn = aws_iam_policy.eventbridge_invoke_targets.arn
}
