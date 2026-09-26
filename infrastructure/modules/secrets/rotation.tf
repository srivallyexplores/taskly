###############################################################################
# Lambda Rotation Function for DocumentDB Password Rotation
#
# This Lambda function handles the automatic rotation of DocumentDB credentials
# following the AWS Secrets Manager rotation protocol (createSecret, setSecret,
# testSecret, finishSecret steps).
#
#  11.5 (automatic rotation every 90 days)
#               11.6 (Lambda retrieves updated secrets without redeployment)
###############################################################################

# -----------------------------------------------------------------------------
# IAM Role for Rotation Lambda
# -----------------------------------------------------------------------------

resource "aws_iam_role" "rotation_lambda" {
  name = "${local.name_prefix}-secret-rotation"

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

# Policy: CloudWatch Logs access
resource "aws_iam_policy" "rotation_lambda_logging" {
  name        = "${local.name_prefix}-rotation-lambda-logging"
  description = "Allow rotation Lambda to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${local.name_prefix}-secret-rotation:*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rotation_lambda_logging" {
  role       = aws_iam_role.rotation_lambda.name
  policy_arn = aws_iam_policy.rotation_lambda_logging.arn
}

# Policy: Secrets Manager access (scoped to DocumentDB credentials only)
resource "aws_iam_policy" "rotation_lambda_secrets" {
  name        = "${local.name_prefix}-rotation-lambda-secrets"
  description = "Allow rotation Lambda to manage DocumentDB credential secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        Resource = aws_secretsmanager_secret.documentdb_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rotation_lambda_secrets" {
  role       = aws_iam_role.rotation_lambda.name
  policy_arn = aws_iam_policy.rotation_lambda_secrets.arn
}

# Policy: KMS access for decrypting/encrypting secrets
resource "aws_iam_policy" "rotation_lambda_kms" {
  name        = "${local.name_prefix}-rotation-lambda-kms"
  description = "Allow rotation Lambda to use KMS key for secret encryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.secrets.arn
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rotation_lambda_kms" {
  role       = aws_iam_role.rotation_lambda.name
  policy_arn = aws_iam_policy.rotation_lambda_kms.arn
}

# Policy: VPC access for connecting to DocumentDB
resource "aws_iam_policy" "rotation_lambda_vpc" {
  name        = "${local.name_prefix}-rotation-lambda-vpc"
  description = "Allow rotation Lambda to manage VPC network interfaces"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rotation_lambda_vpc" {
  role       = aws_iam_role.rotation_lambda.name
  policy_arn = aws_iam_policy.rotation_lambda_vpc.arn
}

# -----------------------------------------------------------------------------
# Lambda Function for Secret Rotation
# -----------------------------------------------------------------------------

data "archive_file" "rotation_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/rotation"
  output_path = "${path.module}/lambda/rotation.zip"
}

resource "aws_lambda_function" "secret_rotation" {
  function_name    = "${local.name_prefix}-secret-rotation"
  description      = "Rotates DocumentDB credentials in Secrets Manager"
  filename         = data.archive_file.rotation_lambda.output_path
  source_code_hash = data.archive_file.rotation_lambda.output_base64sha256
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  architectures    = ["arm64"]
  timeout          = 60
  memory_size      = 256
  role             = aws_iam_role.rotation_lambda.arn

  environment {
    variables = {
      DOCUMENTDB_CLUSTER_IDENTIFIER = var.documentdb_cluster_identifier
      DOCUMENTDB_PORT               = tostring(var.documentdb_port)
      SECRETS_MANAGER_ENDPOINT      = "https://secretsmanager.${local.region}.amazonaws.com"
    }
  }

  dynamic "vpc_config" {
    for_each = var.vpc_id != "" ? [1] : []
    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = [var.lambda_security_group_id]
    }
  }

  tags = var.tags
}

# Allow Secrets Manager to invoke the rotation Lambda
resource "aws_lambda_permission" "secrets_manager_invoke" {
  statement_id  = "AllowSecretsManagerInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
  source_arn    = aws_secretsmanager_secret.documentdb_credentials.arn
}

# CloudWatch Log Group for rotation Lambda
resource "aws_cloudwatch_log_group" "rotation_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.secret_rotation.function_name}"
  retention_in_days = 14

  tags = var.tags
}
