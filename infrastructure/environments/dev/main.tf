module "taskly" {
  source = "../../"

  aws_region   = var.aws_region
  environment  = var.environment
  project_name = var.project_name
  cost_center  = var.cost_center
  owner        = var.owner

  # Required secrets
  documentdb_master_password = var.documentdb_master_password
  jwt_signing_key            = var.jwt_signing_key

  # DNS / Email
  ses_domain     = var.ses_domain
  hosted_zone_id = var.hosted_zone_id
  domain_name    = var.domain_name

  # Sizing
  documentdb_instance_class = var.documentdb_instance_class
  documentdb_instance_count = var.documentdb_instance_count
  vpc_cidr                  = var.vpc_cidr

  # Feature flags
  enable_cloudfront = var.enable_cloudfront
}
