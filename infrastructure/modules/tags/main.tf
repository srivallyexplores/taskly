###############################################################################
# Resource Tagging Module
#
# Provides a standard tag map and naming convention for all Taskly resources.
# All resources should use the outputs from this module to ensure consistent
# tagging and naming across environments.
#
#  9.5 (standard tagging), 9.6 (deletion protection for stateful)
###############################################################################

locals {
  # Standard tag map applied to all resources
  common_tags = merge(
    {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = var.managed_by
      CostCenter  = var.cost_center
      Owner       = var.owner
    },
    var.additional_tags
  )

  # Naming prefix for all resources: taskly-{env}-
  name_prefix = "${var.project}-${var.environment}-"

  # Deletion protection settings based on environment
  # Stateful resources (DocumentDB, S3) get deletion protection in staging/prod
  deletion_protection_enabled = var.environment != "dev"

  # Prevent accidental destruction of stateful resources in staging/prod
  prevent_destroy = var.environment != "dev"
}
