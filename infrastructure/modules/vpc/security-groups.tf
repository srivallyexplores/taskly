# VPC Module - Security Groups
#  11.3 (private subnet isolation), 11.4 (Lambda to DocumentDB via VPC), 2.8 (restrict DB access)
#
# Defines security groups for Lambda functions, DocumentDB, and VPC Interface Endpoints.
# Follows least-privilege: DocumentDB only accepts traffic from Lambda on port 27017.

# -----------------------------------------------------------------------------
# Security Group: Lambda Functions
# -----------------------------------------------------------------------------
# Lambda functions need outbound access to:
# - DocumentDB (port 27017) within the VPC
# - Internet via NAT Gateway (for external API calls)
# - VPC Endpoints (port 443) for AWS service access

resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-sg-lambda"
  description = "Security group for Lambda functions - allows all outbound traffic"
  vpc_id      = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-sg-lambda"
  })
}

resource "aws_vpc_security_group_egress_rule" "lambda_all_outbound" {
  security_group_id = aws_security_group.lambda.id
  description       = "Allow all outbound traffic (NAT, DocumentDB, VPC Endpoints)"

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-lambda-egress-all"
  })
}

# -----------------------------------------------------------------------------
# Security Group: DocumentDB
# -----------------------------------------------------------------------------
# DocumentDB only accepts inbound connections from Lambda functions on port 27017.
# No outbound rules needed (responses use established connections).

resource "aws_security_group" "documentdb" {
  name        = "${local.name_prefix}-sg-documentdb"
  description = "Security group for DocumentDB - inbound only from Lambda on port 27017"
  vpc_id      = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-sg-documentdb"
  })
}

resource "aws_vpc_security_group_ingress_rule" "documentdb_from_lambda" {
  security_group_id = aws_security_group.documentdb.id
  description       = "Allow inbound MongoDB traffic from Lambda functions"

  ip_protocol                  = "tcp"
  from_port                    = 27017
  to_port                      = 27017
  referenced_security_group_id = aws_security_group.lambda.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-documentdb-ingress-lambda"
  })
}

# -----------------------------------------------------------------------------
# Security Group: VPC Interface Endpoints
# -----------------------------------------------------------------------------
# VPC Interface Endpoints accept HTTPS (443) traffic from Lambda functions
# for AWS service access (Secrets Manager, SQS, EventBridge, CloudWatch Logs).

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-sg-vpc-endpoints"
  description = "Security group for VPC Interface Endpoints - inbound HTTPS from Lambda"
  vpc_id      = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-sg-vpc-endpoints"
  })
}

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_from_lambda" {
  security_group_id = aws_security_group.vpc_endpoints.id
  description       = "Allow inbound HTTPS from Lambda functions"

  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  referenced_security_group_id = aws_security_group.lambda.id

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-vpc-endpoints-ingress-lambda"
  })
}
