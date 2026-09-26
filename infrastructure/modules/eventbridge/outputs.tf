###############################################################################
# EventBridge Module — Outputs
###############################################################################

output "event_bus_name" {
  description = "Name of the custom EventBridge event bus"
  value       = aws_cloudwatch_event_bus.taskly.name
}

output "event_bus_arn" {
  description = "ARN of the custom EventBridge event bus"
  value       = aws_cloudwatch_event_bus.taskly.arn
}

output "rule_arns" {
  description = "Map of event rule names to their ARNs"
  value = {
    task_completed    = aws_cloudwatch_event_rule.task_completed.arn
    team_member_added = aws_cloudwatch_event_rule.team_member_added.arn
    project_updated   = aws_cloudwatch_event_rule.project_updated.arn
    user_activity     = aws_cloudwatch_event_rule.user_activity.arn
  }
}

output "rule_names" {
  description = "Map of event rule names"
  value = {
    task_completed    = aws_cloudwatch_event_rule.task_completed.name
    team_member_added = aws_cloudwatch_event_rule.team_member_added.name
    project_updated   = aws_cloudwatch_event_rule.project_updated.name
    user_activity     = aws_cloudwatch_event_rule.user_activity.name
  }
}
