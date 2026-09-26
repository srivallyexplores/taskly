###############################################################################
# WAF Module — Web Application Firewall
#
# Attaches a WAF WebACL to the API Gateway with:
# - AWS Managed Rules: Core Rule Set (CRS), Known Bad Inputs, SQL Injection, XSS
# - IP-based rate limiting: 1000 requests per IP per 5-minute window
# - CloudWatch metrics for monitoring rule matches
#
#  11.1, 11.2
###############################################################################

# ─── WAF WebACL ───────────────────────────────────────────────────────────────

resource "aws_wafv2_web_acl" "api" {
  name        = "${var.project_name}-${var.environment}-api-waf"
  description = "WAF WebACL for Taskly API Gateway - ${var.environment}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # ─── Rule 1: AWS Managed Rules — Core Rule Set (CRS) ─────────────────────

  rule {
    name     = "aws-managed-rules-common"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
      metric_name                = "${var.project_name}-${var.environment}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  # ─── Rule 2: AWS Managed Rules — Known Bad Inputs ─────────────────────────

  rule {
    name     = "aws-managed-rules-known-bad-inputs"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
      metric_name                = "${var.project_name}-${var.environment}-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  # ─── Rule 3: AWS Managed Rules — SQL Injection ────────────────────────────

  rule {
    name     = "aws-managed-rules-sqli"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
      metric_name                = "${var.project_name}-${var.environment}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # ─── Rule 4: Rate Limiting — 1000 requests per IP per 5 minutes ──────────

  rule {
    name     = "rate-limit-per-ip"
    priority = 10

    action {
      dynamic "block" {
        for_each = var.rate_limit_action == "block" ? [1] : []
        content {}
      }
      dynamic "count" {
        for_each = var.rate_limit_action == "count" ? [1] : []
        content {}
      }
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
      metric_name                = "${var.project_name}-${var.environment}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = var.cloudwatch_metrics_enabled
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(var.tags, {
    Name      = "${var.project_name}-${var.environment}-api-waf"
    Component = "waf"
  })
}

# ─── WAF Association with API Gateway ─────────────────────────────────────────

# NOTE: WAFv2 regional WebACLs cannot be associated with API Gateway v2 (HTTP API)
# stages. Taskly's API Gateway is an HTTP API, so this association is disabled by
# default (see var.enable_api_gateway_association). The WebACL itself is still created.
resource "aws_wafv2_web_acl_association" "api_gateway" {
  count        = var.enable_api_gateway_association ? 1 : 0
  resource_arn = var.api_gateway_stage_arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}

# ─── WAF Logging Configuration ───────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "waf_logs" {
  name              = "aws-waf-logs-${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = merge(var.tags, {
    Name      = "aws-waf-logs-${var.project_name}-${var.environment}"
    Component = "waf"
  })
}

resource "aws_wafv2_web_acl_logging_configuration" "api" {
  log_destination_configs = [aws_cloudwatch_log_group.waf_logs.arn]
  resource_arn            = aws_wafv2_web_acl.api.arn

  logging_filter {
    default_behavior = "DROP"

    filter {
      behavior    = "KEEP"
      requirement = "MEETS_ANY"

      condition {
        action_condition {
          action = "BLOCK"
        }
      }

      condition {
        action_condition {
          action = "COUNT"
        }
      }
    }
  }
}
