###############################################################################
# Monitoring Module — Outputs
###############################################################################

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarms.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for alarm notifications"
  value       = aws_sns_topic.alarms.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "metric_namespace" {
  description = "Custom metric namespace for Taskly metrics"
  value       = "${var.project_name}/${var.environment}"
}

output "alarm_arns" {
  description = "Map of alarm names to their ARNs"
  value = {
    api_error_rate     = aws_cloudwatch_metric_alarm.api_error_rate.arn
    cold_start_latency = aws_cloudwatch_metric_alarm.cold_start_latency.arn
    documentdb_cpu     = aws_cloudwatch_metric_alarm.documentdb_cpu.arn
  }
}
