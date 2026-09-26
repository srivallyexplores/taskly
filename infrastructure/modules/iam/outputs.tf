# IAM Module - Outputs
# All role ARNs are exported for use by other modules (compute, messaging, etc.)

# -----------------------------------------------------------------------------
# Lambda Role ARNs
# -----------------------------------------------------------------------------

output "lambda_execution_role_arn" {
  description = "ARN of the base Lambda execution role (CloudWatch, VPC, Secrets Manager)"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Name of the base Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "lambda_auth_role_arn" {
  description = "ARN of the auth Lambda role (base + Cognito access)"
  value       = aws_iam_role.lambda_auth.arn
}

output "lambda_auth_role_name" {
  description = "Name of the auth Lambda role"
  value       = aws_iam_role.lambda_auth.name
}

output "lambda_upload_role_arn" {
  description = "ARN of the upload Lambda role (base + S3 access)"
  value       = aws_iam_role.lambda_upload.arn
}

output "lambda_upload_role_name" {
  description = "Name of the upload Lambda role"
  value       = aws_iam_role.lambda_upload.name
}

output "lambda_event_processor_role_arn" {
  description = "ARN of the event processor Lambda role (base + SQS consume)"
  value       = aws_iam_role.lambda_event_processor.arn
}

output "lambda_event_processor_role_name" {
  description = "Name of the event processor Lambda role"
  value       = aws_iam_role.lambda_event_processor.name
}

output "lambda_email_sender_role_arn" {
  description = "ARN of the email sender Lambda role (SES + SQS)"
  value       = aws_iam_role.lambda_email_sender.arn
}

output "lambda_email_sender_role_name" {
  description = "Name of the email sender Lambda role"
  value       = aws_iam_role.lambda_email_sender.name
}

output "lambda_image_processor_role_arn" {
  description = "ARN of the image processor Lambda role (S3 read/write)"
  value       = aws_iam_role.lambda_image_processor.arn
}

output "lambda_image_processor_role_name" {
  description = "Name of the image processor Lambda role"
  value       = aws_iam_role.lambda_image_processor.name
}

# -----------------------------------------------------------------------------
# API Gateway Role ARN
# -----------------------------------------------------------------------------

output "api_gateway_role_arn" {
  description = "ARN of the API Gateway execution role (invoke Lambda + logging)"
  value       = aws_iam_role.api_gateway.arn
}

output "api_gateway_role_name" {
  description = "Name of the API Gateway execution role"
  value       = aws_iam_role.api_gateway.name
}

# -----------------------------------------------------------------------------
# EventBridge Role ARN
# -----------------------------------------------------------------------------

output "eventbridge_role_arn" {
  description = "ARN of the EventBridge execution role (invoke Lambda + SQS)"
  value       = aws_iam_role.eventbridge.arn
}

output "eventbridge_role_name" {
  description = "Name of the EventBridge execution role"
  value       = aws_iam_role.eventbridge.name
}

# -----------------------------------------------------------------------------
# Policy ARNs (for attaching to additional roles if needed)
# -----------------------------------------------------------------------------

output "policy_lambda_logging_arn" {
  description = "ARN of the Lambda CloudWatch logging policy"
  value       = aws_iam_policy.lambda_logging.arn
}

output "policy_lambda_vpc_access_arn" {
  description = "ARN of the Lambda VPC access policy"
  value       = aws_iam_policy.lambda_vpc_access.arn
}

output "policy_lambda_secrets_read_arn" {
  description = "ARN of the Lambda Secrets Manager read policy"
  value       = aws_iam_policy.lambda_secrets_read.arn
}

output "policy_eventbridge_publish_arn" {
  description = "ARN of the EventBridge publish policy"
  value       = aws_iam_policy.lambda_eventbridge_publish.arn
}
