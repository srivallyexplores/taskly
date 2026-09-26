###############################################################################
# Lambda Module — Outputs
###############################################################################

# ─── API Handler ──────────────────────────────────────────────────────────────

output "api_handler_arn" {
  description = "ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.arn
}

output "api_handler_invoke_arn" {
  description = "Invoke ARN of the API handler Lambda function (for API Gateway)"
  value       = aws_lambda_function.api_handler.invoke_arn
}

output "api_handler_function_name" {
  description = "Name of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "api_handler_qualified_arn" {
  description = "Qualified ARN of the API handler Lambda (includes version)"
  value       = aws_lambda_function.api_handler.qualified_arn
}

output "api_handler_log_group_name" {
  description = "Name of the API handler Lambda CloudWatch log group. Sourced from the log group resource so consumers (e.g. the monitoring module's metric filters) build a proper dependency edge and are not created before the log group exists."
  value       = aws_cloudwatch_log_group.api_handler.name
}

# ─── Achievement Processor ────────────────────────────────────────────────────

output "achievement_processor_arn" {
  description = "ARN of the achievement processor Lambda function"
  value       = aws_lambda_function.achievement_processor.arn
}

output "achievement_processor_function_name" {
  description = "Name of the achievement processor Lambda function"
  value       = aws_lambda_function.achievement_processor.function_name
}

# ─── Notification Processor ───────────────────────────────────────────────────

output "notification_processor_arn" {
  description = "ARN of the notification processor Lambda function"
  value       = aws_lambda_function.notification_processor.arn
}

output "notification_processor_function_name" {
  description = "Name of the notification processor Lambda function"
  value       = aws_lambda_function.notification_processor.function_name
}

# ─── Email Processor ──────────────────────────────────────────────────────────

output "email_processor_arn" {
  description = "ARN of the email processor Lambda function"
  value       = aws_lambda_function.email_processor.arn
}

output "email_processor_function_name" {
  description = "Name of the email processor Lambda function"
  value       = aws_lambda_function.email_processor.function_name
}

# ─── Log Groups ───────────────────────────────────────────────────────────────

output "log_group_arns" {
  description = "Map of Lambda function log group ARNs"
  value = {
    api_handler            = aws_cloudwatch_log_group.api_handler.arn
    achievement_processor  = aws_cloudwatch_log_group.achievement_processor.arn
    notification_processor = aws_cloudwatch_log_group.notification_processor.arn
    email_processor        = aws_cloudwatch_log_group.email_processor.arn
  }
}
