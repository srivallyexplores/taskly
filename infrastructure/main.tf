locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    CostCenter  = var.cost_center
    Owner       = var.owner
  }

  name_prefix = "${var.project_name}-${var.environment}"
}

provider "aws" {
  alias  = "dr"
  region = "us-west-2"
}

# ─── Networking ───────────────────────────────────────────────────────────────

module "vpc" {
  source = "./modules/vpc"

  project     = var.project_name
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  tags        = local.common_tags
}

# ─── Storage ──────────────────────────────────────────────────────────────────

module "s3" {
  source = "./modules/s3"

  project     = var.project_name
  environment = var.environment
  tags        = local.common_tags
}

# ─── CDN ──────────────────────────────────────────────────────────────────────

module "cloudfront" {
  source = "./modules/cloudfront"

  project                             = var.project_name
  environment                         = var.environment
  enable_distributions                = var.enable_cloudfront
  frontend_bucket_id                  = module.s3.frontend_bucket_id
  frontend_bucket_arn                 = module.s3.frontend_bucket_arn
  frontend_bucket_regional_domain_name = module.s3.frontend_bucket_regional_domain_name
  uploads_bucket_id                   = module.s3.uploads_bucket_id
  uploads_bucket_arn                  = module.s3.uploads_bucket_arn
  uploads_bucket_regional_domain_name = module.s3.uploads_bucket_regional_domain_name
  tags                                = local.common_tags
}

# ─── IAM ──────────────────────────────────────────────────────────────────────

module "iam" {
  source = "./modules/iam"

  project     = var.project_name
  environment = var.environment
  tags        = local.common_tags
}

# ─── Database ─────────────────────────────────────────────────────────────────

module "documentdb" {
  source = "./modules/documentdb"

  project            = var.project_name
  environment        = var.environment
  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_id  = module.vpc.documentdb_security_group_id
  master_password    = var.documentdb_master_password
  instance_class     = var.documentdb_instance_class
  instance_count     = var.documentdb_instance_count
  kms_key_arn        = null  # Use AWS managed key to avoid circular dependency with secrets module
  tags               = local.common_tags
}

# ─── Secrets ──────────────────────────────────────────────────────────────────

module "secrets" {
  source = "./modules/secrets"

  project                    = var.project_name
  environment                = var.environment
  documentdb_master_password = var.documentdb_master_password
  documentdb_endpoint        = module.documentdb.cluster_endpoint
  jwt_signing_key            = var.jwt_signing_key
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  lambda_security_group_id   = module.vpc.lambda_security_group_id
  tags                       = local.common_tags
}

# ─── Authentication ───────────────────────────────────────────────────────────

module "cognito" {
  source = "./modules/cognito"

  project     = var.project_name
  environment = var.environment
  tags        = local.common_tags
}

# ─── Email ────────────────────────────────────────────────────────────────────

module "ses" {
  source = "./modules/ses"

  project     = var.project_name
  environment = var.environment
  domain      = var.ses_domain
  tags        = local.common_tags
}

# ─── Queues (created before EventBridge since EB needs the DLQ ARN) ───────────

module "sqs" {
  source = "./modules/sqs"

  project_name              = var.project_name
  environment               = var.environment
  lambda_execution_role_arn = module.iam.lambda_execution_role_arn
  tags                      = local.common_tags
}

# ─── Compute ──────────────────────────────────────────────────────────────────

module "lambda" {
  source = "./modules/lambda"

  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  lambda_security_group_id = module.vpc.lambda_security_group_id
  execution_role_arn       = module.iam.lambda_execution_role_arn
  documentdb_secret_arn    = module.secrets.documentdb_credentials_secret_name
  cognito_user_pool_id     = module.cognito.user_pool_id
  cognito_client_id        = module.cognito.app_client_id
  s3_upload_bucket         = module.s3.uploads_bucket_id
  event_bus_name           = "${var.project_name}-${var.environment}-bus"
  email_queue_url          = module.sqs.email_queue_url
  email_queue_arn          = module.sqs.email_queue_arn
  notification_queue_url   = module.sqs.notification_queue_url
  cdn_domain               = module.cloudfront.uploads_distribution_domain_name
  api_handler_s3_bucket    = module.s3.uploads_bucket_id
  api_handler_s3_key       = "deploy/api-handler.zip"
  processor_s3_bucket      = module.s3.uploads_bucket_id
  achievement_processor_s3_key  = "deploy/achievement-processor.zip"
  notification_processor_s3_key = "deploy/notification-processor.zip"
  email_processor_s3_key        = "deploy/email-processor.zip"
  tags                     = local.common_tags
}

# ─── API Gateway ──────────────────────────────────────────────────────────────

module "apigateway" {
  source = "./modules/apigateway"

  project_name                = var.project_name
  environment                 = var.environment
  lambda_function_arn         = module.lambda.api_handler_invoke_arn
  lambda_function_name        = module.lambda.api_handler_function_name
  cognito_user_pool_arn       = module.cognito.user_pool_arn
  cognito_user_pool_client_id = module.cognito.app_client_id
  cognito_user_pool_endpoint  = module.cognito.user_pool_endpoint
  tags                        = local.common_tags
}

# ─── Event Bus ────────────────────────────────────────────────────────────────

module "eventbridge" {
  source = "./modules/eventbridge"

  project_name                       = var.project_name
  environment                        = var.environment
  event_processor_lambda_arn         = module.lambda.achievement_processor_arn
  event_processor_lambda_name        = module.lambda.achievement_processor_function_name
  notification_processor_lambda_arn  = module.lambda.notification_processor_arn
  notification_processor_lambda_name = module.lambda.notification_processor_function_name
  event_dlq_arn                      = module.sqs.event_processing_dlq_arn
  tags                               = local.common_tags
}

# ─── Security ─────────────────────────────────────────────────────────────────

module "waf" {
  source = "./modules/waf"

  project_name          = var.project_name
  environment           = var.environment
  api_gateway_stage_arn = module.apigateway.stage_arn
  tags                  = local.common_tags
}

# ─── Monitoring ───────────────────────────────────────────────────────────────

module "monitoring" {
  source = "./modules/monitoring"

  project_name               = var.project_name
  environment                = var.environment
  api_handler_function_name  = module.lambda.api_handler_function_name
  api_handler_log_group_name = module.lambda.api_handler_log_group_name
  documentdb_cluster_id      = module.documentdb.cluster_id
  tags                       = local.common_tags
}

# ─── Disaster Recovery ────────────────────────────────────────────────────────

module "disaster_recovery" {
  source = "./modules/disaster-recovery"

  providers = {
    aws    = aws
    aws.dr = aws.dr
  }

  project_name           = var.project_name
  environment            = var.environment
  documentdb_cluster_arn = module.documentdb.cluster_arn
  uploads_bucket_arn     = module.s3.uploads_bucket_arn
  uploads_bucket_id      = module.s3.uploads_bucket_id
  api_gateway_endpoint   = module.apigateway.api_endpoint
  hosted_zone_id         = var.hosted_zone_id
  domain_name            = var.domain_name
  tags                   = local.common_tags
}
