###############################################################################
# EventBridge Module — Custom Event Bus and Rules
#
# Defines the Taskly application event bus and routing rules for
# asynchronous event processing (task completion, team membership,
# project updates, user activity).
#
#  7.1, 7.4
###############################################################################

# ─── Custom Event Bus ─────────────────────────────────────────────────────────

resource "aws_cloudwatch_event_bus" "taskly" {
  name = "${var.project_name}-${var.environment}-events"

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-events"
    Component = "eventbridge"
  })
}

# ─── Event Rules ──────────────────────────────────────────────────────────────

# Rule: task.completed — triggers achievement processing and stats updates
resource "aws_cloudwatch_event_rule" "task_completed" {
  name           = "${var.project_name}-${var.environment}-task-completed"
  description    = "Routes task.completed events to the event processor Lambda"
  event_bus_name = aws_cloudwatch_event_bus.taskly.name

  event_pattern = jsonencode({
    source      = ["taskly.api"]
    detail-type = ["task.completed"]
  })

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-task-completed"
    EventType = "task.completed"
  })
}

# Rule: team.member.added — triggers team stats updates and notifications
resource "aws_cloudwatch_event_rule" "team_member_added" {
  name           = "${var.project_name}-${var.environment}-team-member-added"
  description    = "Routes team.member.added events to the event processor Lambda"
  event_bus_name = aws_cloudwatch_event_bus.taskly.name

  event_pattern = jsonencode({
    source      = ["taskly.api"]
    detail-type = ["team.member.added"]
  })

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-team-member-added"
    EventType = "team.member.added"
  })
}

# Rule: project.updated — triggers watcher notifications
resource "aws_cloudwatch_event_rule" "project_updated" {
  name           = "${var.project_name}-${var.environment}-project-updated"
  description    = "Routes project.updated events to the event processor Lambda"
  event_bus_name = aws_cloudwatch_event_bus.taskly.name

  event_pattern = jsonencode({
    source      = ["taskly.api"]
    detail-type = ["project.updated"]
  })

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-project-updated"
    EventType = "project.updated"
  })
}

# Rule: user.activity — triggers activity logging and analytics
resource "aws_cloudwatch_event_rule" "user_activity" {
  name           = "${var.project_name}-${var.environment}-user-activity"
  description    = "Routes user.activity events to the event processor Lambda"
  event_bus_name = aws_cloudwatch_event_bus.taskly.name

  event_pattern = jsonencode({
    source      = ["taskly.api"]
    detail-type = ["user.activity"]
  })

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-user-activity"
    EventType = "user.activity"
  })
}

# ─── Rule Targets ─────────────────────────────────────────────────────────────

# Target: task.completed → event processor Lambda
resource "aws_cloudwatch_event_target" "task_completed_target" {
  rule           = aws_cloudwatch_event_rule.task_completed.name
  event_bus_name = aws_cloudwatch_event_bus.taskly.name
  target_id      = "event-processor-lambda"
  arn            = var.event_processor_lambda_arn

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }

  dead_letter_config {
    arn = var.event_dlq_arn
  }
}

# Target: team.member.added → notification processor Lambda
resource "aws_cloudwatch_event_target" "team_member_added_target" {
  rule           = aws_cloudwatch_event_rule.team_member_added.name
  event_bus_name = aws_cloudwatch_event_bus.taskly.name
  target_id      = "notification-processor-lambda"
  arn            = var.notification_processor_lambda_arn != "" ? var.notification_processor_lambda_arn : var.event_processor_lambda_arn

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }

  dead_letter_config {
    arn = var.event_dlq_arn
  }
}

# Target: project.updated → notification processor Lambda
resource "aws_cloudwatch_event_target" "project_updated_target" {
  rule           = aws_cloudwatch_event_rule.project_updated.name
  event_bus_name = aws_cloudwatch_event_bus.taskly.name
  target_id      = "notification-processor-lambda"
  arn            = var.notification_processor_lambda_arn != "" ? var.notification_processor_lambda_arn : var.event_processor_lambda_arn

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }

  dead_letter_config {
    arn = var.event_dlq_arn
  }
}

# Target: user.activity → event processor Lambda
resource "aws_cloudwatch_event_target" "user_activity_target" {
  rule           = aws_cloudwatch_event_rule.user_activity.name
  event_bus_name = aws_cloudwatch_event_bus.taskly.name
  target_id      = "event-processor-lambda"
  arn            = var.event_processor_lambda_arn

  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 3
  }

  dead_letter_config {
    arn = var.event_dlq_arn
  }
}

# ─── Lambda Permission for EventBridge ────────────────────────────────────────

resource "aws_lambda_permission" "allow_eventbridge_task_completed" {
  statement_id  = "AllowEventBridgeTaskCompleted"
  action        = "lambda:InvokeFunction"
  function_name = var.event_processor_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.task_completed.arn
}

resource "aws_lambda_permission" "allow_eventbridge_team_member_added" {
  statement_id  = "AllowEventBridgeTeamMemberAdded"
  action        = "lambda:InvokeFunction"
  function_name = var.notification_processor_lambda_name != "" ? var.notification_processor_lambda_name : var.event_processor_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.team_member_added.arn
}

resource "aws_lambda_permission" "allow_eventbridge_project_updated" {
  statement_id  = "AllowEventBridgeProjectUpdated"
  action        = "lambda:InvokeFunction"
  function_name = var.notification_processor_lambda_name != "" ? var.notification_processor_lambda_name : var.event_processor_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.project_updated.arn
}

resource "aws_lambda_permission" "allow_eventbridge_user_activity" {
  statement_id  = "AllowEventBridgeUserActivity"
  action        = "lambda:InvokeFunction"
  function_name = var.event_processor_lambda_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.user_activity.arn
}
