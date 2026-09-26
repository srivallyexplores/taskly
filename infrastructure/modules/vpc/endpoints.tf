# VPC Module - VPC Endpoints
#  11.3 (private subnet isolation), 11.4 (Lambda to services via VPC)
#
# Creates VPC Endpoints to allow Lambda functions in private subnets to access
# AWS services without routing through NAT Gateway (reduces cost and latency).
#
# Gateway Endpoints (free, route-table based):
#   - S3: File operations
#   - DynamoDB: Future use
#
# Interface Endpoints (ENI-based, per-AZ pricing):
#   - Secrets Manager: Secret retrieval for DB credentials
#   - SQS: Queue operations for async processing
#   - EventBridge: Event publishing
#   - CloudWatch Logs: Log shipping

# -----------------------------------------------------------------------------
# Gateway Endpoints (free - added to route tables)
# -----------------------------------------------------------------------------

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.s3"

  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpce-s3"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.dynamodb"

  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpce-dynamodb"
  })
}

# -----------------------------------------------------------------------------
# Interface Endpoints (ENI-based)
# -----------------------------------------------------------------------------

resource "aws_vpc_endpoint" "secretsmanager" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.secretsmanager"

  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpce-secretsmanager"
  })
}

resource "aws_vpc_endpoint" "sqs" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.sqs"

  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpce-sqs"
  })
}

resource "aws_vpc_endpoint" "events" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.events"

  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpce-events"
  })
}

resource "aws_vpc_endpoint" "logs" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.id}.logs"

  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpce-logs"
  })
}

# -----------------------------------------------------------------------------
# Data Source: Current AWS Region
# -----------------------------------------------------------------------------

data "aws_region" "current" {}
