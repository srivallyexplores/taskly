output "common_tags" {
  description = "Standard tag map to apply to all resources"
  value       = local.common_tags
}

output "name_prefix" {
  description = "Naming prefix for resources: taskly-{env}-"
  value       = local.name_prefix
}

output "deletion_protection_enabled" {
  description = "Whether deletion protection should be enabled for stateful resources (DocumentDB, S3)"
  value       = local.deletion_protection_enabled
}

output "prevent_destroy" {
  description = "Whether lifecycle prevent_destroy should be applied to stateful resources"
  value       = local.prevent_destroy
}

output "environment" {
  description = "Current environment name"
  value       = var.environment
}

output "project" {
  description = "Project name"
  value       = var.project
}
