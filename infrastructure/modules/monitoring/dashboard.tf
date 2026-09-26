###############################################################################
# Monitoring Module — CloudWatch Dashboard
#
# Provides operational visibility with widgets for:
# - Request volume and latency distribution (p50/p95/p99)
# - Error breakdown (4xx vs 5xx)
# - Database performance metrics (connections, CPU, memory)
# - Lambda concurrent execution tracking
# - Email delivery rate and bounce rate
# - Cost metrics
#
#  10.5
###############################################################################

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-operations"

  dashboard_body = jsonencode({
    widgets = [
      # ─── Row 1: Request Volume and Errors ─────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Request Volume"
          region  = "us-east-1"
          period  = 60
          stat    = "Sum"
          metrics = [
            ["${var.project_name}/${var.environment}", "RequestCount", { label = "Total Requests" }],
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "Error Breakdown"
          region  = "us-east-1"
          period  = 60
          stat    = "Sum"
          metrics = [
            ["${var.project_name}/${var.environment}", "APIErrors", { label = "5xx Errors", color = "#d13212" }],
            ["${var.project_name}/${var.environment}", "API4xxErrors", { label = "4xx Errors", color = "#ff9900" }],
          ]
          view = "timeSeries"
        }
      },

      # ─── Row 2: Latency Distribution ─────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "API Latency Distribution"
          region  = "us-east-1"
          period  = 60
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.api_handler_function_name, { stat = "p50", label = "p50" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.api_handler_function_name, { stat = "p95", label = "p95" }],
            ["AWS/Lambda", "Duration", "FunctionName", var.api_handler_function_name, { stat = "p99", label = "p99" }],
          ]
          view = "timeSeries"
          yAxis = {
            left = { label = "Duration (ms)" }
          }
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Cold Starts & Init Duration"
          region  = "us-east-1"
          period  = 300
          metrics = [
            ["${var.project_name}/${var.environment}", "ColdStarts", { stat = "Sum", label = "Cold Starts" }],
            ["${var.project_name}/${var.environment}", "InitDuration", { stat = "Average", label = "Avg Init Duration (ms)", yAxis = "right" }],
          ]
          view = "timeSeries"
        }
      },

      # ─── Row 3: Database Performance ─────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 8
        height = 6
        properties = {
          title   = "DocumentDB CPU & Memory"
          region  = "us-east-1"
          period  = 300
          metrics = [
            ["AWS/DocDB", "CPUUtilization", "DBClusterIdentifier", var.documentdb_cluster_id, { label = "CPU %" }],
            ["AWS/DocDB", "FreeableMemory", "DBClusterIdentifier", var.documentdb_cluster_id, { label = "Free Memory", yAxis = "right" }],
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 12
        width  = 8
        height = 6
        properties = {
          title   = "DocumentDB Connections"
          region  = "us-east-1"
          period  = 300
          stat    = "Average"
          metrics = [
            ["AWS/DocDB", "DatabaseConnections", "DBClusterIdentifier", var.documentdb_cluster_id, { label = "Active Connections" }],
            ["AWS/DocDB", "DatabaseCursorsTimedOut", "DBClusterIdentifier", var.documentdb_cluster_id, { label = "Cursors Timed Out" }],
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 12
        width  = 8
        height = 6
        properties = {
          title   = "Lambda Concurrent Executions"
          region  = "us-east-1"
          period  = 60
          stat    = "Maximum"
          metrics = [
            ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", var.api_handler_function_name, { label = "API Handler" }],
          ]
          view = "timeSeries"
        }
      },

      # ─── Row 4: Email & SES Metrics ──────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          title   = "Email Delivery"
          region  = "us-east-1"
          period  = 300
          stat    = "Sum"
          metrics = [
            ["AWS/SES", "Send", { label = "Emails Sent" }],
            ["AWS/SES", "Delivery", { label = "Delivered" }],
            ["AWS/SES", "Bounce", { label = "Bounced", color = "#d13212" }],
            ["AWS/SES", "Complaint", { label = "Complaints", color = "#ff9900" }],
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          title   = "SES Reputation"
          region  = "us-east-1"
          period  = 300
          stat    = "Average"
          metrics = [
            ["AWS/SES", "Reputation.BounceRate", { label = "Bounce Rate" }],
            ["AWS/SES", "Reputation.ComplaintRate", { label = "Complaint Rate" }],
          ]
          view = "timeSeries"
          annotations = {
            horizontal = [
              { value = 0.05, label = "5% Threshold", color = "#d13212" }
            ]
          }
        }
      },

      # ─── Row 5: Cost Tracking ─────────────────────────────────────────────
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Invocations (Cost Driver)"
          region  = "us-east-1"
          period  = 3600
          stat    = "Sum"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.api_handler_function_name, { label = "API Handler" }],
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 24
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Duration (Cost Driver)"
          region  = "us-east-1"
          period  = 3600
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", var.api_handler_function_name, { stat = "Sum", label = "Total Duration (ms)" }],
          ]
          view = "timeSeries"
        }
      }
    ]
  })
}
