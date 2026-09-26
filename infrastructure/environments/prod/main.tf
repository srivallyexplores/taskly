module "taskly" {
  source = "../../"

  aws_region   = var.aws_region
  environment  = var.environment
  project_name = var.project_name
  cost_center  = var.cost_center
  owner        = var.owner
}
