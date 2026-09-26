# Taskly Infrastructure

Terraform-managed AWS infrastructure for the Taskly application. Deploys a serverless architecture with Lambda, API Gateway, DocumentDB, Cognito, and supporting services across three environments.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CloudFront (CDN)                            │
│                    Frontend + Upload distributions                   │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │                                  │
       ┌───────▼───────┐                  ┌───────▼───────┐
       │   S3 Buckets  │                  │  WAF (Shield) │
       │ Frontend/Uploads│                 └───────┬───────┘
       └───────────────┘                          │
                                          ┌───────▼───────┐
                                          │  API Gateway   │
                                          │  (HTTP API)    │
                                          └───────┬───────┘
                                                  │
                              ┌────────────────────┼────────────────────┐
                              │                    │                    │
                      ┌───────▼───────┐    ┌──────▼──────┐    ┌───────▼───────┐
                      │  Lambda (API) │    │  EventBridge │    │    Cognito    │
                      │   Handler     │    │  (Event Bus) │    │  (Auth/JWT)  │
                      └───────┬───────┘    └──────┬──────┘    └──────────────┘
                              │                    │
                    ┌─────────┼─────────┐    ┌────▼────┐
                    │         │         │    │   SQS   │
            ┌───────▼──┐  ┌──▼───┐  ┌──▼──┐ │ Queues  │
            │DocumentDB │  │  S3  │  │ SES │ └────┬────┘
            │ (MongoDB) │  │      │  │     │      │
            └───────────┘  └──────┘  └─────┘ ┌────▼────────┐
                                             │  Lambda      │
                                             │  Processors  │
                                             └─────────────┘
```

**Key design decisions:**
- Serverless-first: Lambda + API Gateway, no EC2/ECS
- DocumentDB in private subnets, Lambda connects via VPC
- Event-driven processing: EventBridge → SQS → Lambda processors
- OIDC for CI/CD auth (no stored AWS credentials)
- S3 + DynamoDB backend for Terraform state with locking

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.7.0
- AWS CLI v2 configured with appropriate credentials
- Access to the target AWS account
- S3 bucket and DynamoDB table for state (see [Bootstrapping State](#bootstrapping-state))

## Project Structure

```
infrastructure/
├── main.tf                  # Root module — wires all child modules together
├── variables.tf             # Root-level input variables
├── outputs.tf               # Root-level outputs
├── providers.tf             # AWS provider configuration
├── backend.tf               # S3 state backend (default config)
├── environments/
│   ├── dev/
│   │   ├── terraform.tfvars # Dev-specific variable values
│   │   └── backend.hcl      # Dev state backend overrides
│   ├── staging/
│   │   ├── terraform.tfvars
│   │   └── backend.hcl
│   └── prod/
│       ├── terraform.tfvars
│       └── backend.hcl
└── modules/
    ├── vpc/                 # VPC, subnets, security groups
    ├── documentdb/          # DocumentDB cluster
    ├── secrets/             # Secrets Manager entries
    ├── cognito/             # User pool, app client
    ├── s3/                  # Storage buckets (frontend, uploads, deploy)
    ├── cloudfront/          # CDN distributions
    ├── iam/                 # IAM roles and policies
    ├── lambda/              # Lambda functions (API handler + processors)
    ├── apigateway/          # HTTP API + routes + authorizer
    ├── ses/                 # Email sending (SES domain/identity)
    ├── eventbridge/         # Custom event bus + rules
    ├── sqs/                 # Queues + DLQs
    ├── waf/                 # Web Application Firewall rules
    ├── monitoring/          # CloudWatch alarms, dashboards, budgets
    ├── disaster-recovery/   # Cross-region replication, DNS failover
    └── tags/                # Tagging policy enforcement
```

## Deploying

### Bootstrapping State

Before the first `terraform init`, create the state backend resources:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket taskly-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket taskly-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name taskly-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Local Deployment

```bash
cd infrastructure

# Initialize with environment-specific backend
terraform init -backend-config="environments/dev/backend.hcl"

# Preview changes
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply changes
terraform apply -var-file="environments/dev/terraform.tfvars"
```

Replace `dev` with `staging` or `prod` as needed.

### CI/CD Deployment

Infrastructure deploys automatically via GitHub Actions (`.github/workflows/infrastructure-deploy.yml`):

- **Auto-deploy:** Push to `main` with changes in `infrastructure/**` triggers plan + apply for `dev`
- **Manual dispatch:** Select environment and action (plan/apply/destroy) from the Actions tab

Authentication uses OIDC — the workflow assumes an IAM role via `AWS_OIDC_ROLE_ARN` (configured as a GitHub environment variable). No access keys stored in secrets.

### Deploying to Production

Prod deployments require manual workflow dispatch:

1. Go to Actions → Infrastructure Deploy → Run workflow
2. Select `prod` environment and `plan` action
3. Review the plan output
4. Re-run with `apply` action

## Module Descriptions

| Module | Purpose |
|--------|---------|
| **vpc** | VPC with public/private subnets, NAT gateway, security groups for Lambda and DocumentDB |
| **documentdb** | MongoDB-compatible cluster in private subnets. Instance class and count vary by environment |
| **secrets** | AWS Secrets Manager entries for DocumentDB credentials, JWT signing keys |
| **cognito** | User pool with app client for authentication. Handles signup, login, token generation |
| **s3** | Three buckets: frontend hosting, file uploads, deployment artifacts |
| **cloudfront** | CDN distributions for frontend and upload buckets |
| **iam** | Lambda execution role, OIDC provider for CI/CD, cross-service policies |
| **lambda** | API handler function + async processors (email, notifications, achievements, images) |
| **apigateway** | HTTP API with Lambda integration, Cognito JWT authorizer, CORS config |
| **ses** | SES domain identity and sending configuration |
| **eventbridge** | Custom event bus with rules routing to processors and notification handlers |
| **sqs** | Message queues (email, notifications) with dead-letter queues |
| **waf** | Rate limiting, SQL injection protection, managed rule groups. Count mode in dev, block in prod |
| **monitoring** | CloudWatch alarms, log groups, dashboards, budget alerts |
| **disaster-recovery** | Cross-region replication, Route53 health checks, DNS failover |
| **tags** | Consistent tagging policy applied across all resources |

## Environment Configuration

Each environment has a `terraform.tfvars` file that controls resource sizing and behavior:

| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| `documentdb_instance_class` | db.t3.medium | db.r5.large | db.r5.xlarge |
| `documentdb_instance_count` | 1 | 2 | 3 |
| `api_handler_memory` | 256 MB | 512 MB | 1024 MB |
| `reserved_concurrency_api` | 10 | 50 | 200 |
| `waf_rate_limit_action` | count | block | block |
| `log_retention_days` | 7 | 30 | 90 |
| `cloudfront_price_class` | PriceClass_100 | PriceClass_200 | PriceClass_All |

To modify environment settings, edit `infrastructure/environments/{env}/terraform.tfvars`.

## Adding a New Module

1. Create the module directory:
   ```bash
   mkdir infrastructure/modules/my-module
   ```

2. Add standard Terraform files:
   ```
   modules/my-module/
   ├── main.tf        # Resources
   ├── variables.tf   # Input variables
   ├── outputs.tf     # Outputs consumed by other modules
   └── versions.tf    # Required provider versions (optional)
   ```

3. Wire it into `main.tf`:
   ```hcl
   module "my_module" {
     source = "./modules/my-module"

     project_name = var.project_name
     environment  = var.environment
     tags         = local.common_tags
   }
   ```

4. Add any new variables to `variables.tf` and corresponding values to each environment's `terraform.tfvars`.

5. Run `terraform init` to register the new module, then `plan` to verify.

## Common Variables

All modules receive these standard inputs:

| Variable | Description |
|----------|-------------|
| `project_name` | Resource naming prefix (`taskly`) |
| `environment` | Target environment (`dev`, `staging`, `prod`) |
| `tags` | Common tags map applied to all resources |

## Troubleshooting

### State lock stuck

If a previous run crashed and left the state locked:

```bash
terraform force-unlock <LOCK_ID>
```

Get the lock ID from the error message. Only do this if you're sure no other apply is running.

### "Backend configuration changed" on init

If you switch environments, Terraform detects the backend config change. Re-init with `-reconfigure`:

```bash
terraform init -reconfigure -backend-config="environments/staging/backend.hcl"
```

### Module dependency errors

Modules have implicit ordering via their input references. If you see "value depends on resource attributes that cannot be determined until apply," this is expected on first deploy. Run `apply` — Terraform handles the ordering.

### OIDC role assumption fails in CI

Check that:
1. The GitHub environment has `AWS_OIDC_ROLE_ARN` set
2. The IAM role's trust policy allows the correct GitHub repo and branch
3. The workflow has `id-token: write` permission

### DocumentDB connection timeout from Lambda

Lambda must be in the VPC to reach DocumentDB in private subnets. Verify:
- Lambda security group has outbound to DocumentDB SG on port 27017
- DocumentDB SG allows inbound from Lambda SG
- Lambda is attached to the correct private subnets

### Plan shows unexpected destroys

Usually means you're running against the wrong environment state. Confirm you passed the correct `-backend-config` and `-var-file` for your target environment.

### Terraform version mismatch

The CI uses Terraform 1.7.0. Match this locally to avoid state format issues:

```bash
tfenv use 1.7.0
# or
terraform version  # verify before running
```

## Destroying Infrastructure

For non-prod environments:

```bash
terraform destroy -var-file="environments/dev/terraform.tfvars"
```

For prod, use the workflow dispatch with `destroy` action. This requires environment protection rules to be satisfied.

**Warning:** Destroying prod will delete all data including DocumentDB clusters and S3 buckets. Ensure backups exist before proceeding.
