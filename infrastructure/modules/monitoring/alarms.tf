###############################################################################
# Monitoring Module — CloudWatch Alarms and SNS Notifications
#
# Defines alarms for:
# - API error rate > 5% over 5-minute window
# - Lambda cold start > 3 seconds
# - DocumentDB failover event (critical)
# - Monthly cost exceeds budget threshold
# - SES bounce rate > 5%
#
#  10.3, 10.4, 10.7, 12.3, 6.6
###############################################################################

# ─── SNS Topic for Operations Notifications ───────────────────────────────────

resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-${var.environment}-alarms"

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-alarms"
    Component = "monitoring"
  })
}

# Subscribe email endpoints to the alarm topic
resource "aws_sns_topic_subscription" "alarm_email" {
  count = length(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]
}

# ─── Alarm: API Error Rate > 5% ──────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-api-error-rate"
  alarm_description   = "API 5xx error rate exceeds 5% over 5-minute window"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "Error Rate %"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "APIErrors"
      namespace   = "${var.project_name}/${var.environment}"
      period      = 300
      stat        = "Sum"
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "${var.project_name}/${var.environment}"
      period      = 300
      stat        = "Sum"
    }
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api-error-rate"
    Component = "monitoring"
    Severity  = "critical"
  })
}

# ─── Alarm: Lambda Cold Start > 3 seconds ────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "cold_start_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-cold-start-latency"
  alarm_description   = "Lambda cold start initialization exceeds 3 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "InitDuration"
  namespace           = "${var.project_name}/${var.environment}"
  period              = 300
  statistic           = "Average"
  threshold           = 3000 # 3 seconds in milliseconds
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-cold-start-latency"
    Component = "monitoring"
    Severity  = "warning"
  })
}

# ─── Alarm: DocumentDB CPU Utilization (proxy for failover stress) ────────────

resource "aws_cloudwatch_metric_alarm" "documentdb_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-documentdb-cpu"
  alarm_description   = "DocumentDB CPU utilization exceeds 80% — potential failover risk"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "breaching"

  dimensions = {
    DBClusterIdentifier = var.documentdb_cluster_id
  }

  alarm_actions = [aws_sns_topic.alarms.arn]
  ok_actions    = [aws_sns_topic.alarms.arn]

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-documentdb-cpu"
    Component = "monitoring"
    Severity  = "critical"
  })
}

# ─── Alarm: SES Bounce Rate > 5% ─────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "ses_bounce_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-ses-bounce-rate"
  alarm_description   = "SES bounce rate exceeds 5% — risk of sending suspension"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Reputation.BounceRate"
  namespace           = "AWS/SES"
  period              = 300
  statistic           = "Average"
  threshold           = 0.05 # 5% as decimal
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-ses-bounce-rate"
    Component = "monitoring"
    Severity  = "warning"
  })
}

# ─── Alarm: Monthly Cost Budget ───────────────────────────────────────────────

resource "aws_budgets_budget" "monthly" {
  count = length(var.alarm_email_endpoints) > 0 ? 1 : 0

  name         = "${var.project_name}-${var.environment}-monthly-budget"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_amount)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alarm_email_endpoints
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alarm_email_endpoints
  }

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$${var.project_name}"]
  }
}

# ─── Alarm: Lambda Concurrent Executions ──────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "lambda_concurrent_executions" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-concurrency"
  alarm_description   = "Lambda concurrent executions approaching account limit"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Maximum"
  threshold           = 800 # Alert at 80% of typical 1000 limit
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.api_handler_function_name
  }

  alarm_actions = [aws_sns_topic.alarms.arn]

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-lambda-concurrency"
    Component = "monitoring"
    Severity  = "warning"
  })
}
