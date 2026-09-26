###############################################################################
# API Gateway Module — Outputs
###############################################################################

output "api_id" {
  description = "ID of the HTTP API"
  value       = aws_apigatewayv2_api.taskly.id
}

output "api_endpoint" {
  description = "The default endpoint URL of the HTTP API"
  value       = aws_apigatewayv2_api.taskly.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the HTTP API (for Lambda permissions)"
  value       = aws_apigatewayv2_api.taskly.execution_arn
}

output "stage_id" {
  description = "ID of the default stage"
  value       = aws_apigatewayv2_stage.default.id
}

output "stage_invoke_url" {
  description = "Invoke URL for the default stage"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "authorizer_id" {
  description = "ID of the Cognito JWT authorizer"
  value       = aws_apigatewayv2_authorizer.cognito.id
}

output "access_log_group_arn" {
  description = "ARN of the CloudWatch log group for API access logs"
  value       = aws_cloudwatch_log_group.api_access_logs.arn
}

output "access_log_group_name" {
  description = "Name of the CloudWatch log group for API access logs"
  value       = aws_cloudwatch_log_group.api_access_logs.name
}

output "stage_arn" {
  description = "ARN of the default stage for WAF association"
  value       = aws_apigatewayv2_stage.default.arn
}
