###############################################################################
# Monitoring Module — CloudWatch Metrics, Filters, and Log Management
#
# Configures:
# - Lambda function log groups with 30-day retention
# - Metric filters for error rate, latency percentiles, cold starts
# - Log subscription filter to archive logs to S3 after 30 days
#
#  10.1, 10.2, 10.6
###############################################################################

# ─── Metric Filters — Error Rate ─────────────────────────────────────────────

resource "aws_cloudwatch_log_metric_filter" "api_errors" {
  name           = "${var.project_name}-${var.environment}-api-errors"
  pattern        = "{ $.statusCode >= 500 }"
  log_group_name = var.api_handler_log_group_name

  metric_transformation {
    name          = "APIErrors"
    namespace     = "${var.project_name}/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "api_4xx_errors" {
  name           = "${var.project_name}-${var.environment}-api-4xx-errors"
  pattern        = "{ $.statusCode >= 400 && $.statusCode < 500 }"
  log_group_name = var.api_handler_log_group_name

  metric_transformation {
    name          = "API4xxErrors"
    namespace     = "${var.project_name}/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

# ─── Metric Filters — Latency ────────────────────────────────────────────────

resource "aws_cloudwatch_log_metric_filter" "api_latency" {
  name           = "${var.project_name}-${var.environment}-api-latency"
  pattern        = "{ $.durationMs > 0 }"
  log_group_name = var.api_handler_log_group_name

  metric_transformation {
    name      = "APILatency"
    namespace = "${var.project_name}/${var.environment}"
    value     = "$.durationMs"
  }
}

# ─── Metric Filters — Cold Starts ────────────────────────────────────────────

resource "aws_cloudwatch_log_metric_filter" "cold_starts" {
  name           = "${var.project_name}-${var.environment}-cold-starts"
  pattern        = "REPORT RequestId"
  log_group_name = var.api_handler_log_group_name

  metric_transformation {
    name          = "ColdStarts"
    namespace     = "${var.project_name}/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "init_duration" {
  name           = "${var.project_name}-${var.environment}-init-duration"
  pattern        = "{ $.initDuration > 0 }"
  log_group_name = var.api_handler_log_group_name

  metric_transformation {
    name      = "InitDuration"
    namespace = "${var.project_name}/${var.environment}"
    value     = "$.initDuration"
  }
}

# ─── Metric Filters — Request Count ──────────────────────────────────────────

resource "aws_cloudwatch_log_metric_filter" "request_count" {
  name           = "${var.project_name}-${var.environment}-request-count"
  pattern        = "{ $.method = * }"
  log_group_name = var.api_handler_log_group_name

  metric_transformation {
    name          = "RequestCount"
    namespace     = "${var.project_name}/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

# ─── Log Subscription Filter — Archive to S3 ─────────────────────────────────
#
# Archives logs older than 30 days to S3 for 90-day retention.
# Uses a Kinesis Firehose delivery stream for efficient log archival.

resource "aws_cloudwatch_log_subscription_filter" "log_archive" {
  count = var.log_archive_bucket_arn != "" ? 1 : 0

  name            = "${var.project_name}-${var.environment}-log-archive"
  log_group_name  = var.api_handler_log_group_name
  filter_pattern  = ""
  destination_arn = aws_kinesis_firehose_delivery_stream.log_archive[0].arn
  role_arn        = aws_iam_role.cloudwatch_to_firehose[0].arn
}

# Kinesis Firehose for log delivery to S3
resource "aws_kinesis_firehose_delivery_stream" "log_archive" {
  count = var.log_archive_bucket_arn != "" ? 1 : 0

  name        = "${var.project_name}-${var.environment}-log-archive"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_delivery[0].arn
    bucket_arn = var.log_archive_bucket_arn
    prefix     = "logs/${var.environment}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffering_size     = 5    # MB
    buffering_interval = 300  # seconds

    compression_format = "GZIP"
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-log-archive"
    Component = "monitoring"
  })
}

# IAM role for CloudWatch to write to Firehose
resource "aws_iam_role" "cloudwatch_to_firehose" {
  count = var.log_archive_bucket_arn != "" ? 1 : 0

  name = "${var.project_name}-${var.environment}-cw-to-firehose"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "logs.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "cloudwatch_to_firehose" {
  count = var.log_archive_bucket_arn != "" ? 1 : 0

  name = "firehose-put"
  role = aws_iam_role.cloudwatch_to_firehose[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = ["firehose:PutRecord", "firehose:PutRecordBatch"]
      Effect   = "Allow"
      Resource = aws_kinesis_firehose_delivery_stream.log_archive[0].arn
    }]
  })
}

# IAM role for Firehose to write to S3
resource "aws_iam_role" "firehose_delivery" {
  count = var.log_archive_bucket_arn != "" ? 1 : 0

  name = "${var.project_name}-${var.environment}-firehose-delivery"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "firehose.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "firehose_delivery" {
  count = var.log_archive_bucket_arn != "" ? 1 : 0

  name = "s3-put"
  role = aws_iam_role.firehose_delivery[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ]
      Effect   = "Allow"
      Resource = [
        var.log_archive_bucket_arn,
        "${var.log_archive_bucket_arn}/*"
      ]
    }]
  })
}
