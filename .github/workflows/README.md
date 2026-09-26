# CI/CD workflows

Four GitHub Actions workflows that handle testing, building, and deploying Taskly to AWS.

## Workflows

### infrastructure-deploy.yml

Deploys Terraform infrastructure. Runs on push to `main` when files in `infrastructure/` change.

- Uses OIDC for AWS auth (no stored credentials)
- Stages: init → validate → plan → apply
- Stores plan artifacts for 30 days
- Manual dispatch available for staging/prod with environment selection

### backend-deploy.yml

Deploys the backend Lambda function. Runs on push to `main` when files in `backend/` change.

- Stages: lint → test → package → deploy
- Packages Lambda zip with production deps only (excludes tests, seeds, dev files)
- Canary deployment: 10% traffic shift → 5 min monitoring → promote or rollback
- Auto-rollback if error rate exceeds 1%

### frontend-deploy.yml

Deploys the React frontend to S3 + CloudFront. Runs on push to `main` when files in `frontend/` change.

- Stages: lint → test → build → S3 sync → CloudFront invalidation
- Separate cache strategies: hashed assets get 1-year immutable cache, index.html gets no-cache
- Waits for CloudFront invalidation to complete

### pr-validation.yml

Runs on pull requests to `main`. Does not deploy anything.

- Backend: lint + unit tests
- Frontend: lint + tests
- Infrastructure: terraform validate + plan (no apply)
- Posts plan output as a PR comment
- Comments on failure

## Required configuration

### GitHub environment variables

Set these in Settings → Environments → [environment name] → Variables:

| Variable | Description |
|----------|-------------|
| `AWS_OIDC_ROLE_ARN` | IAM role ARN for OIDC authentication |
| `LAMBDA_DEPLOY_BUCKET` | S3 bucket for Lambda deployment packages |
| `FRONTEND_BUCKET` | S3 bucket for frontend static assets |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID for cache invalidation |
| `API_GATEWAY_URL` | API Gateway endpoint URL (used in frontend build) |

### Setting up OIDC

The workflows authenticate to AWS using OpenID Connect. No access keys needed.

1. Create an OIDC identity provider in IAM for `token.actions.githubusercontent.com`
2. Create an IAM role with a trust policy allowing your GitHub repo
3. Attach policies for the services the workflows need (Lambda, S3, CloudFront, Terraform state)
4. Set the role ARN as `AWS_OIDC_ROLE_ARN` in your GitHub environment

### Local testing

Run the same checks locally before pushing:

```bash
# Backend
cd backend && npm run lint && npm test -- --project=unit

# Frontend
cd frontend && npm run lint && npm test -- --run

# Infrastructure
cd infrastructure && terraform validate
```

## Deployment order

On a fresh environment, deploy in this order:

1. Infrastructure (creates all AWS resources)
2. Backend (needs Lambda function to exist)
3. Frontend (needs S3 bucket and CloudFront to exist)

After initial setup, each workflow runs independently based on which files changed.
