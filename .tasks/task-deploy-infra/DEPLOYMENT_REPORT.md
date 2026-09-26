# Taskly Dev Infrastructure — Deployment Report

**Task:** task-deploy-infra / FEAT-003
**Date:** 2026-08-30
**Environment:** dev
**AWS Account:** 583168584925
**Region:** us-east-1
**Terraform:** v1.9.8
**Branch:** fix/taskly-deployment-issues

## Result: SUCCESS

`terraform apply` converged for the dev environment. A follow-up apply reports
**"No changes. Your infrastructure matches the configuration."** (idempotent).
`terraform output` resolves all documented outputs.

The API is fully live end to end: **`/api/health` returns HTTP 200 with
`"database":"connected"`**, proving API Gateway -> Lambda (in VPC) -> DocumentDB
connectivity all work.

## Resources created

**219 resources** managed in state (S3 backend:
`taskly-terraform-state-583168584925`, key `environments/dev/terraform.tfstate`,
lock table `taskly-terraform-locks`).

Key resources by type:

| Type | Count | Notes |
|------|-------|-------|
| Lambda functions | 5 | api handler + 3 event processors + secret-rotation |
| API Gateway (HTTP API) | 1 API + 11 routes + stage | `aws_apigatewayv2_*` |
| DocumentDB | 1 cluster + 1 instance (db.t3.medium) | available |
| VPC | 1 VPC, 4 subnets, 6 interface endpoints, NAT GW | |
| SQS queues | 5 | email/notification + DLQs |
| Secrets Manager | 4 secrets (+ rotation) | documentdb creds, jwt, ses smtp |
| Cognito | user pool + app client | |
| WAF | 1 regional WebACL | created; see WAF note below |
| CloudWatch | 7 log groups, 6 metric filters, 5 alarms | |
| S3 | 4 buckets (frontend, uploads, uploads-replica, logs) | + cross-region replication |
| IAM | 10 roles, 16 policies, 29 attachments | |

## Key outputs

| Output | Value |
|--------|-------|
| `api_gateway_url` | `https://bvju0gyni7.execute-api.us-east-1.amazonaws.com` |
| `cognito_user_pool_id` | `us-east-1_l0jRjqILW` |
| `cognito_client_id` | `a1i9m0h2tqf5hu2ddpsq6bcdf` |
| `s3_uploads_bucket` | `taskly-dev-uploads-583168584925` |
| `lambda_function_name` | `taskly-dev-api` |
| `cloudfront_frontend_url` | `""` (CloudFront disabled — see manual prerequisites) |
| `documentdb_endpoint` | sensitive — `taskly-dev-docdb-cluster.cluster-c6psyaugmxvj.us-east-1.docdb.amazonaws.com` (not printed by `terraform output`) |

## Verification evidence

### Lambda (`taskly-dev-api`)
```
aws lambda get-function --function-name taskly-dev-api --region us-east-1 \
  --query 'Configuration.[State,LastUpdateStatus,Runtime,Handler,MemorySize,Timeout]'
=> ["Active", "Successful", "nodejs20.x", "index.handler", 512, 29]
```
All three event processors are also `Active`:
`taskly-dev-achievement-processor`, `taskly-dev-notification-processor`,
`taskly-dev-email-processor`.

### DocumentDB
```
aws docdb describe-db-clusters --db-cluster-identifier taskly-dev-docdb-cluster \
  --region us-east-1 --query 'DBClusters[0].Status'
=> "available"
```

### API Gateway `/api/health`
```
curl -s -w 'HTTP %{http_code}' https://bvju0gyni7.execute-api.us-east-1.amazonaws.com/api/health
=> HTTP 200
{"status":"OK","message":"Taskly API Server is running",
 "timestamp":"2026-08-30T14:44:13.334Z","environment":"production",
 "version":"1.0.0","database":"connected"}
```
This is the ideal outcome: **HTTP 200** with **`database:connected`** confirms the
full request path API Gateway -> Lambda (VPC) -> DocumentDB works, including
`kms:Decrypt` on the secret and `AWSLambdaVPCAccessExecutionRole`.

### DocumentDB credentials secret
```
aws secretsmanager get-secret-value --secret-id taskly/dev/documentdb-credentials \
  --region us-east-1 --query SecretString
=> host  = taskly-dev-docdb-cluster.cluster-c6psyaugmxvj.us-east-1.docdb.amazonaws.com
   port  = 27017, dbname = taskly, engine = mongo, username = taskly_admin
   (password redacted)
```
Host field is correctly populated with the DocumentDB cluster endpoint.

### CloudFront
```
aws cloudfront list-distributions --query "DistributionList.Items[]"
=> None
```
Intentionally not created on this account (see manual prerequisites).

## Fixes applied during this feature (committed on the branch)

1. **Lambda bundle exceeded 250 MB unzipped limit** (`InvalidParameterValueException:
   Unzipped size must be smaller than 262144000 bytes`). The full production
   `node_modules` was ~310 MB. `scripts/build-lambda.sh` now prunes packages that
   are provided by the Node.js 20 Lambda runtime or unused by the four deployed
   handlers: `@aws-sdk`, `@smithy` (runtime-provided AWS SDK v3), `@img` + `sharp`
   (native image libs used only by `image-processor.js`, which is not deployed),
   and `core-js` (no direct import). Bundle now unzips to ~238 MB. Zips rebuilt and
   re-uploaded to `s3://taskly-dev-uploads-583168584925/deploy/`.

2. **S3 cross-region replication ordering + schema.** Added
   `depends_on = [aws_s3_bucket_versioning.uploads_replica]` (was racing ahead of
   destination versioning) and `delete_marker_replication { status = "Enabled" }`
   (required by the V2 replication schema when a `filter` is present).

3. **WAF association incompatible with HTTP API.** WAFv2 regional WebACLs cannot be
   associated with API Gateway v2 (HTTP API) stages. Added
   `var.enable_api_gateway_association` (default `false`) guarding
   `aws_wafv2_web_acl_association.api_gateway`. The WebACL itself is still created.

4. **CloudFront distributions made optional.** The account is not verified for
   CloudFront (`AccessDenied: Your account must be verified before you can add new
   CloudFront resources`). Added `var.enable_cloudfront` (root) /
   `var.enable_distributions` (cloudfront module), set to `false` for dev. When
   disabled, `cdn_domain` for the API Lambda falls back to the uploads S3 bucket
   regional domain name so all downstream resources deploy and function.

5. **CloudWatch metric-filter / log-group race.** The monitoring module received
   the log group name as an interpolated string, so Terraform did not order it after
   the log group resource (`ResourceNotFoundException: The specified log group does
   not exist`). Added `api_handler_log_group_name` output on the lambda module and
   wired the monitoring module to it, creating a proper dependency edge.

6. **Dev environment outputs.** Added `infrastructure/environments/dev/outputs.tf`
   to re-export the root `module.taskly` outputs (api_gateway_url, cognito ids,
   uploads bucket, lambda name, documentdb endpoint, cloudfront url) so
   `terraform output` works at the dev level.

## Estimated monthly cost (~$130/month, dev)

Per the DEPLOYMENT.md cost reference table:

| Resource | Monthly cost (dev) |
|----------|-------------------|
| DocumentDB (1x db.t3.medium) | ~$60 |
| NAT Gateway | ~$32 |
| VPC Interface Endpoints (4x) | ~$28 |
| Lambda + API Gateway | ~$5 |
| S3 + CloudFront | ~$3 |
| Everything else | ~$5 |
| **Total** | **~$130/month** |

Cost reduction options (from DEPLOYMENT.md): disable VPC interface endpoints in dev
(`enable_interface_endpoints = false`) and keep the single NAT Gateway (default).
Note CloudFront is currently disabled, so the S3+CloudFront line is closer to ~$1.

## Remaining manual prerequisites

1. **CloudFront (account verification).** The AWS account must be verified by AWS
   Support before CloudFront distributions can be created. Once verified, set
   `enable_cloudfront = true` in
   `infrastructure/environments/dev/terraform.tfvars` and re-apply. This will
   create the frontend + uploads distributions and re-point the Lambda
   `CDN_DOMAIN` at the CloudFront domain. Open a case at
   https://console.aws.amazon.com/support/home and reference the error
   "Your account must be verified before you can add new CloudFront resources".

2. **SES domain verification.** The SES identity is created for `taskly.app`, a
   domain the account does not own, so it stays in "pending verification".
   Verification requires publishing the SES DNS records (TXT/CNAME) in the DNS zone
   of a domain you control. Until verified, outbound email is limited to the SES
   sandbox / verified identities.

3. **Route53 DNS failover (disaster recovery).** The DR module's `aws_route53_record`
   resources are guarded by `hosted_zone_id != ""` and are intentionally NOT created
   (the account has no hosted zone). To enable API DNS failover, register a domain,
   create a Route53 hosted zone, then set `hosted_zone_id` and `domain_name` in the
   dev tfvars and re-apply.

4. **WAF protection for the API.** The WebACL exists but is not attached (WAFv2 does
   not support HTTP API v2 stages). To protect the API with WAF, either front the
   HTTP API with CloudFront and attach a `CLOUDFRONT`-scope WebACL, or migrate to an
   API Gateway REST (v1) API and set `enable_api_gateway_association = true`.

## Teardown

To stop all charges, run `terraform destroy` from
`infrastructure/environments/dev` (with the same secret `*.auto.tfvars` present).
See the Teardown section of `DEPLOYMENT.md` for the full procedure. Note the S3
buckets with versioning and the DocumentDB cluster may require emptying / final
snapshot handling.

## Secrets handling

Secret values (`documentdb_master_password`, `jwt_signing_key`) live only in
`infrastructure/environments/dev/secret.auto.tfvars`, which is **gitignored** and
was **NOT committed**. No real secrets appear in the repo or in this report.
