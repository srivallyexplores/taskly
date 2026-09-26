# DocumentDB Module - Main Configuration
# : 2.1 (MongoDB-compatible storage), 2.2 (multi-AZ HA), 2.3 (failover <30s),
#              2.4 (encryption at rest + in transit), 2.5 (automated backups 7-day retention),
#              2.8 (private subnet isolation), 12.2 (db.t3.medium for dev/staging)
#
# Creates a DocumentDB cluster with configurable instance count and class.
# Encryption at rest (KMS) and in transit (TLS) are enforced.
# Cluster is placed in private subnets with restricted security group access.

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

locals {
  name_prefix = "${var.project}-${var.environment}"
}

# -----------------------------------------------------------------------------
# DocumentDB Subnet Group
# Places the cluster in private subnets across multiple AZs
# -----------------------------------------------------------------------------

resource "aws_docdb_subnet_group" "main" {
  name       = "${local.name_prefix}-docdb-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-docdb-subnet-group"
  })
}

# -----------------------------------------------------------------------------
# DocumentDB Cluster Parameter Group
# Enforces TLS and enables audit logging
# -----------------------------------------------------------------------------

resource "aws_docdb_cluster_parameter_group" "main" {
  family      = "docdb5.0"
  name        = "${local.name_prefix}-docdb-params"
  description = "Custom parameter group for ${local.name_prefix} DocumentDB cluster"

  # TLS enforcement for all connections (Requirement 2.4)
  parameter {
    name  = "tls"
    value = "enabled"
  }

  # Audit logging for compliance and security monitoring (Requirement 10.1)
  parameter {
    name  = "audit_logs"
    value = "enabled"
  }

  # Profiler for slow query analysis and performance monitoring (Requirement 10.1)
  parameter {
    name  = "profiler"
    value = "enabled"
  }

  # Profiler threshold: log queries taking longer than 100ms
  parameter {
    name  = "profiler_threshold_ms"
    value = "100"
  }

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-docdb-params"
  })
}

# -----------------------------------------------------------------------------
# DocumentDB Cluster
# Multi-AZ deployment with encryption at rest (KMS) and in transit (TLS)
# -----------------------------------------------------------------------------

resource "aws_docdb_cluster" "main" {
  cluster_identifier = "${local.name_prefix}-docdb-cluster"

  engine         = "docdb"
  engine_version = var.engine_version

  master_username = var.master_username
  master_password = var.master_password

  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  vpc_security_group_ids          = [var.security_group_id]

  # Encryption at rest (Requirement 2.4)
  storage_encrypted = true
  kms_key_id        = var.kms_key_arn

  # Automated backups with 7-day retention (Requirement 2.5)
  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window

  # Deletion protection for stateful resources (Requirement 9.6)
  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${local.name_prefix}-docdb-final-snapshot"

  # Enable CloudWatch log exports for audit and profiler
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-docdb-cluster"
  })
}

# -----------------------------------------------------------------------------
# DocumentDB Cluster Instances
# Deployed across AZs for high availability (Requirement 2.2)
# Instance class parameterized for environment flexibility (Requirement 12.2)
# -----------------------------------------------------------------------------

resource "aws_docdb_cluster_instance" "instances" {
  count = var.instance_count

  identifier         = "${local.name_prefix}-docdb-instance-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  # Instances are automatically distributed across AZs by the subnet group
  auto_minor_version_upgrade = true

  tags = merge(var.tags, {
    Name = "${local.name_prefix}-docdb-instance-${count.index + 1}"
  })
}
