# VPC Module - Outputs
# All IDs are exported for use by other modules (DocumentDB, Lambda, Security Groups)

# -----------------------------------------------------------------------------
# VPC
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# -----------------------------------------------------------------------------
# Subnets
# -----------------------------------------------------------------------------

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

# -----------------------------------------------------------------------------
# Route Tables
# -----------------------------------------------------------------------------

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs (one per AZ)"
  value       = aws_route_table.private[*].id
}

# -----------------------------------------------------------------------------
# Gateways
# -----------------------------------------------------------------------------

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "List of NAT Gateway Elastic IP addresses"
  value       = aws_eip.nat[*].public_ip
}

# -----------------------------------------------------------------------------
# Availability Zones
# -----------------------------------------------------------------------------

output "availability_zones" {
  description = "List of Availability Zones used by the VPC subnets"
  value       = local.azs
}

# -----------------------------------------------------------------------------
# Security Groups
# -----------------------------------------------------------------------------

output "lambda_security_group_id" {
  description = "ID of the security group for Lambda functions"
  value       = aws_security_group.lambda.id
}

output "documentdb_security_group_id" {
  description = "ID of the security group for DocumentDB cluster"
  value       = aws_security_group.documentdb.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the security group for VPC Interface Endpoints"
  value       = aws_security_group.vpc_endpoints.id
}

# -----------------------------------------------------------------------------
# VPC Endpoints
# -----------------------------------------------------------------------------

output "s3_endpoint_id" {
  description = "ID of the S3 Gateway VPC Endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_endpoint_id" {
  description = "ID of the DynamoDB Gateway VPC Endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "secretsmanager_endpoint_id" {
  description = "ID of the Secrets Manager Interface VPC Endpoint (null if disabled)"
  value       = var.enable_interface_endpoints ? aws_vpc_endpoint.secretsmanager[0].id : null
}

output "sqs_endpoint_id" {
  description = "ID of the SQS Interface VPC Endpoint (null if disabled)"
  value       = var.enable_interface_endpoints ? aws_vpc_endpoint.sqs[0].id : null
}

output "events_endpoint_id" {
  description = "ID of the EventBridge Interface VPC Endpoint (null if disabled)"
  value       = var.enable_interface_endpoints ? aws_vpc_endpoint.events[0].id : null
}

output "logs_endpoint_id" {
  description = "ID of the CloudWatch Logs Interface VPC Endpoint (null if disabled)"
  value       = var.enable_interface_endpoints ? aws_vpc_endpoint.logs[0].id : null
}
