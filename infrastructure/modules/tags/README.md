# Tags Module

Provides standard resource tagging and naming conventions for the Taskly AWS infrastructure.

## Purpose

- Ensures all resources are tagged consistently for billing visibility and operational management
- Provides a naming prefix (`taskly-{env}-`) for all resources
- Configures deletion protection for stateful resources (DocumentDB, S3) in staging/production

## Usage

```hcl
module "tags" {
  source      = "../modules/tags"
  environment = var.environment
}

# Use the common tags on any resource
resource "aws_lambda_function" "example" {
  function_name = "${module.tags.name_prefix}example"
  # ...
  tags = module.tags.common_tags
}

# Use deletion protection for stateful resources
resource "aws_docdb_cluster" "main" {
  cluster_identifier  = "${module.tags.name_prefix}docdb"
  deletion_protection = module.tags.deletion_protection_enabled
  tags                = module.tags.common_tags
}

resource "aws_s3_bucket" "uploads" {
  bucket        = "${module.tags.name_prefix}uploads"
  force_destroy = !module.tags.deletion_protection_enabled
  tags          = module.tags.common_tags
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Deployment environment (dev, staging, prod) | string | - | yes |
| project | Project name | string | "taskly" | no |
| cost_center | Cost center for billing | string | "engineering" | no |
| managed_by | IaC tool managing resources | string | "terraform" | no |
| owner | Team owning the resources | string | "platform-team" | no |
| additional_tags | Extra tags to merge | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| common_tags | Standard tag map for all resources |
| name_prefix | Resource naming prefix (`taskly-{env}-`) |
| deletion_protection_enabled | Whether stateful resources should have deletion protection |
| prevent_destroy | Whether lifecycle prevent_destroy applies |
| environment | Current environment name |
| project | Project name |

## Deletion Protection

Stateful resources (DocumentDB clusters, S3 buckets) receive deletion protection in **staging** and **production** environments. In **dev**, deletion protection is disabled to allow easy teardown during development.

| Environment | Deletion Protection | Force Destroy (S3) |
|-------------|--------------------|--------------------|
| dev | disabled | allowed |
| staging | enabled | blocked |
| prod | enabled | blocked |
