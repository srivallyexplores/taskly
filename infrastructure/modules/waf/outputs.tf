###############################################################################
# WAF Module — Outputs
###############################################################################

output "web_acl_id" {
  description = "ID of the WAF WebACL"
  value       = aws_wafv2_web_acl.api.id
}

output "web_acl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.api.arn
}

output "web_acl_capacity" {
  description = "Web ACL capacity units (WCU) used"
  value       = aws_wafv2_web_acl.api.capacity
}

output "log_group_arn" {
  description = "ARN of the WAF CloudWatch log group"
  value       = aws_cloudwatch_log_group.waf_logs.arn
}
