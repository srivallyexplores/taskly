# DocumentDB Module - Outputs
# Exports cluster endpoints and identifiers for use by other modules
# (Lambda functions, Secrets Manager, monitoring)

output "cluster_id" {
  description = "The DocumentDB cluster identifier"
  value       = aws_docdb_cluster.main.id
}

output "cluster_arn" {
  description = "ARN of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.arn
}

output "cluster_endpoint" {
  description = "The primary endpoint for the DocumentDB cluster (read/write)"
  value       = aws_docdb_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "The reader endpoint for the DocumentDB cluster (read-only, load-balanced across replicas)"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "cluster_port" {
  description = "The port on which the DocumentDB cluster accepts connections"
  value       = aws_docdb_cluster.main.port
}

output "cluster_resource_id" {
  description = "The resource ID of the DocumentDB cluster"
  value       = aws_docdb_cluster.main.cluster_resource_id
}

output "instance_identifiers" {
  description = "List of DocumentDB instance identifiers"
  value       = aws_docdb_cluster_instance.instances[*].identifier
}

output "instance_endpoints" {
  description = "List of DocumentDB instance endpoints"
  value       = aws_docdb_cluster_instance.instances[*].endpoint
}

output "connection_string" {
  description = "MongoDB-compatible connection string for the DocumentDB cluster (without credentials)"
  value       = "mongodb://${aws_docdb_cluster.main.endpoint}:${aws_docdb_cluster.main.port}/?tls=true&tlsCAFile=rds-combined-ca-bundle.pem&retryWrites=false"
}

output "subnet_group_name" {
  description = "Name of the DocumentDB subnet group"
  value       = aws_docdb_subnet_group.main.name
}

output "parameter_group_name" {
  description = "Name of the DocumentDB cluster parameter group"
  value       = aws_docdb_cluster_parameter_group.main.name
}
