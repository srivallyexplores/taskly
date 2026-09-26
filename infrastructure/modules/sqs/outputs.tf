###############################################################################
# SQS Module — Outputs
###############################################################################

# ─── Email Queue ──────────────────────────────────────────────────────────────

output "email_queue_url" {
  description = "URL of the email queue"
  value       = aws_sqs_queue.email.url
}

output "email_queue_arn" {
  description = "ARN of the email queue"
  value       = aws_sqs_queue.email.arn
}

output "email_queue_name" {
  description = "Name of the email queue"
  value       = aws_sqs_queue.email.name
}

output "email_dlq_url" {
  description = "URL of the email dead-letter queue"
  value       = aws_sqs_queue.email_dlq.url
}

output "email_dlq_arn" {
  description = "ARN of the email dead-letter queue"
  value       = aws_sqs_queue.email_dlq.arn
}

# ─── Notification Queue ───────────────────────────────────────────────────────

output "notification_queue_url" {
  description = "URL of the notification batch queue"
  value       = aws_sqs_queue.notification.url
}

output "notification_queue_arn" {
  description = "ARN of the notification batch queue"
  value       = aws_sqs_queue.notification.arn
}

output "notification_queue_name" {
  description = "Name of the notification batch queue"
  value       = aws_sqs_queue.notification.name
}

output "notification_dlq_url" {
  description = "URL of the notification dead-letter queue"
  value       = aws_sqs_queue.notification_dlq.url
}

output "notification_dlq_arn" {
  description = "ARN of the notification dead-letter queue"
  value       = aws_sqs_queue.notification_dlq.arn
}

# ─── Event Processing DLQ ─────────────────────────────────────────────────────

output "event_processing_dlq_url" {
  description = "URL of the event processing dead-letter queue"
  value       = aws_sqs_queue.event_processing_dlq.url
}

output "event_processing_dlq_arn" {
  description = "ARN of the event processing dead-letter queue"
  value       = aws_sqs_queue.event_processing_dlq.arn
}

output "event_processing_dlq_name" {
  description = "Name of the event processing dead-letter queue"
  value       = aws_sqs_queue.event_processing_dlq.name
}

# ─── All Queue ARNs (for IAM policies) ───────────────────────────────────────

output "all_queue_arns" {
  description = "List of all queue ARNs for IAM policy attachment"
  value = [
    aws_sqs_queue.email.arn,
    aws_sqs_queue.email_dlq.arn,
    aws_sqs_queue.notification.arn,
    aws_sqs_queue.notification_dlq.arn,
    aws_sqs_queue.event_processing_dlq.arn,
  ]
}
