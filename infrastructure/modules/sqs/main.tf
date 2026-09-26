###############################################################################
# SQS Module — Queues and Dead-Letter Queues
#
# Defines the message queues for asynchronous processing:
# - Email queue: buffered email delivery via SES
# - Notification batch queue: batched notification processing
# - Dead-letter queues: failed message retention for inspection
#
#  7.3, 7.5, 6.3, 6.5
###############################################################################

# ─── Email Queue Dead-Letter Queue ───────────────────────────────────────────

resource "aws_sqs_queue" "email_dlq" {
  name = "${var.project_name}-${var.environment}-email-dlq"

  # DLQ retains messages for 14 days for manual inspection
  message_retention_seconds = 1209600 # 14 days

  # Enable server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-email-dlq"
    Component = "sqs"
    QueueType = "dead-letter"
    Purpose   = "email-failures"
  })
}

# ─── Email Queue ──────────────────────────────────────────────────────────────

resource "aws_sqs_queue" "email" {
  name = "${var.project_name}-${var.environment}-email-queue"

  # Visibility timeout should exceed Lambda processing time (30s for email sender)
  visibility_timeout_seconds = 60

  # Standard message retention (4 days)
  message_retention_seconds = 345600 # 4 days

  # Maximum message size (256KB, sufficient for email payloads)
  max_message_size = 262144

  # Delay delivery (0 = immediate)
  delay_seconds = 0

  # Long polling for efficient message retrieval
  receive_wait_time_seconds = 10

  # Dead-letter queue configuration: retry up to 3 times before DLQ
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.email_dlq.arn
    maxReceiveCount     = 3
  })

  # Enable server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-email-queue"
    Component = "sqs"
    QueueType = "standard"
    Purpose   = "email-delivery"
  })
}

# ─── Notification Batch Queue Dead-Letter Queue ──────────────────────────────

resource "aws_sqs_queue" "notification_dlq" {
  name = "${var.project_name}-${var.environment}-notification-dlq"

  # DLQ retains messages for 14 days for manual inspection
  message_retention_seconds = 1209600 # 14 days

  # Enable server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-notification-dlq"
    Component = "sqs"
    QueueType = "dead-letter"
    Purpose   = "notification-failures"
  })
}

# ─── Notification Batch Queue ─────────────────────────────────────────────────

resource "aws_sqs_queue" "notification" {
  name = "${var.project_name}-${var.environment}-notification-queue"

  # Visibility timeout should exceed Lambda processing time (60s for event processor)
  visibility_timeout_seconds = 90

  # Standard message retention (4 days)
  message_retention_seconds = 345600 # 4 days

  # Maximum message size
  max_message_size = 262144

  # Delay delivery (0 = immediate)
  delay_seconds = 0

  # Long polling
  receive_wait_time_seconds = 10

  # Dead-letter queue configuration: retry up to 3 times before DLQ
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notification_dlq.arn
    maxReceiveCount     = 3
  })

  # Enable server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-notification-queue"
    Component = "sqs"
    QueueType = "standard"
    Purpose   = "notification-batching"
  })
}

# ─── Event Processing Dead-Letter Queue ──────────────────────────────────────

resource "aws_sqs_queue" "event_processing_dlq" {
  name = "${var.project_name}-${var.environment}-event-processing-dlq"

  # DLQ retains messages for 14 days for manual inspection
  message_retention_seconds = 1209600 # 14 days

  # Enable server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-event-processing-dlq"
    Component = "sqs"
    QueueType = "dead-letter"
    Purpose   = "eventbridge-failures"
  })
}

# ─── Queue Policies ───────────────────────────────────────────────────────────

# Allow EventBridge to send messages to the event processing DLQ
resource "aws_sqs_queue_policy" "event_processing_dlq_policy" {
  queue_url = aws_sqs_queue.event_processing_dlq.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeSendMessage"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.event_processing_dlq.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.event_bus_arn
          }
        }
      }
    ]
  })
}

# Allow Lambda execution role to interact with email queue
resource "aws_sqs_queue_policy" "email_queue_policy" {
  queue_url = aws_sqs_queue.email.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaSendReceive"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_execution_role_arn
        }
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.email.arn
      }
    ]
  })
}

# Allow Lambda execution role to interact with notification queue
resource "aws_sqs_queue_policy" "notification_queue_policy" {
  queue_url = aws_sqs_queue.notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaSendReceive"
        Effect = "Allow"
        Principal = {
          AWS = var.lambda_execution_role_arn
        }
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.notification.arn
      }
    ]
  })
}

# ─── Redrive Allow Policies ───────────────────────────────────────────────────

# Allow email queue to use its DLQ
resource "aws_sqs_queue_redrive_allow_policy" "email_dlq_allow" {
  queue_url = aws_sqs_queue.email_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.email.arn]
  })
}

# Allow notification queue to use its DLQ
resource "aws_sqs_queue_redrive_allow_policy" "notification_dlq_allow" {
  queue_url = aws_sqs_queue.notification_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.notification.arn]
  })
}
