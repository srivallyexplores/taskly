---
inclusion: always
---

# Taskly project overview

Taskly is a team task management app. React frontend, Express/Node backend, MongoDB (DocumentDB in production). The codebase is being migrated from a monolithic Docker/PM2 deployment to a serverless AWS architecture.

## Current state

The app is fully functional locally with the original stack (Express + MongoDB + Cloudinary + Resend). The AWS migration is complete in code — all Terraform modules, Lambda handlers, CI/CD pipelines, and migration scripts are written and ready for deployment.

## Architecture (AWS production)

```
CloudFront → S3 (frontend)
CloudFront → S3 (uploads)
Route 53 → API Gateway → Lambda (Express via serverless-express) → DocumentDB
                              ├→ S3 (pre-signed URLs)
                              ├→ EventBridge → Lambda processors
                              ├→ SQS → Lambda (email via SES)
                              └→ Cognito (JWT validation)
WAF protects API Gateway
CloudWatch monitors everything
Secrets Manager stores credentials
```

## Key files

- `backend/server.js` — Express app entry point (exports for Lambda or listens locally)
- `backend/lambda/handler.js` — Lambda wrapper using serverless-express
- `backend/middleware/auth.js` — Cognito JWT + local JWT validation
- `backend/services/eventService.js` — EventBridge event publishing
- `backend/services/emailService.js` — SES email with SQS buffering
- `backend/utils/secrets.js` — Secrets Manager with caching and rotation handling
- `backend/utils/logger.js` — Structured JSON logging
- `infrastructure/main.tf` — Root Terraform module wiring all services together

## Conventions

- Backend is ES modules (`"type": "module"` in package.json)
- Terraform modules follow: `main.tf`, `variables.tf`, `outputs.tf`
- Tests use Jest with babel-jest for ESM transform
- All AWS SDK imports are from `@aws-sdk/client-*` (v3)
- Environment detection: `process.env.AWS_LAMBDA_FUNCTION_NAME` means Lambda, otherwise local
- Cognito detection: `COGNITO_USER_POOL_ID` + `COGNITO_CLIENT_ID` both set means use Cognito auth

## Don't

- Don't add DynamoDB — we use DocumentDB (MongoDB-compatible) for a reason
- Don't switch to TypeScript mid-migration (it's on the wishlist but not now)
- Don't use AWS SDK v2 — everything is v3 with modular imports
- Don't put secrets in environment variables in Terraform — use Secrets Manager
- Don't create REST APIs in API Gateway — we use HTTP APIs (cheaper, faster)
