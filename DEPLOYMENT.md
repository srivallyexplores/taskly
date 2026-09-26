# Deployment guide

Step by step instructions to deploy Taskly to AWS from scratch. Based on actual deployment experience — includes the gotchas.

## Prerequisites

- AWS CLI v2 configured (`aws sts get-caller-identity` should work)
- Terraform 1.7+ installed
- Node.js 20+
- WinRAR or 7-Zip (for creating Lambda deployment packages)
- Python 3 with boto3 (`pip install boto3`) — needed for S3 cleanup during teardown

## Step 1: Create Terraform state backend

One-time setup. These resources persist across deploys.

```powershell
aws s3api create-bucket --bucket taskly-terraform-state-YOUR_ACCOUNT_ID --region us-east-1
aws s3api put-bucket-versioning --bucket taskly-terraform-state-YOUR_ACCOUNT_ID --versioning-configuration Status=Enabled
aws dynamodb create-table --table-name taskly-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST --region us-east-1
```

Update `infrastructure/backend.tf` with your bucket name.

## Step 2: Deploy infrastructure

```powershell
cd infrastructure
terraform init
terraform apply -var="environment=dev" -var="documentdb_master_password=YOUR_STRONG_PASSWORD" -var="jwt_signing_key=YOUR_RANDOM_STRING" -var="ses_domain=yourdomain.com"
```

This creates ~190 resources. Takes 10-15 minutes (DocumentDB is slowest).

If Lambda creation fails with "S3 key does not exist", upload placeholder zips first:

```powershell
# Create a tiny placeholder
echo '{}' > placeholder.js
Compress-Archive -Path placeholder.js -DestinationPath placeholder.zip -Force

# Upload as all 4 Lambda packages
aws s3 cp placeholder.zip s3://YOUR_UPLOADS_BUCKET/deploy/api-handler.zip
aws s3 cp placeholder.zip s3://YOUR_UPLOADS_BUCKET/deploy/achievement-processor.zip
aws s3 cp placeholder.zip s3://YOUR_UPLOADS_BUCKET/deploy/notification-processor.zip
aws s3 cp placeholder.zip s3://YOUR_UPLOADS_BUCKET/deploy/email-processor.zip
```

Then re-run `terraform apply`.

## Step 3: Fix IAM permissions

No longer needed — the Terraform IAM module now includes:
- `AWSLambdaVPCAccessExecutionRole` (managed policy for VPC ENI creation)
- KMS Decrypt permission (for Secrets Manager decryption)

These are applied automatically during `terraform apply`.

## Step 4: Update DocumentDB secret with endpoint

No longer needed — Terraform now passes the DocumentDB endpoint directly to the Secrets module, which populates the host field automatically during `terraform apply`.

## Step 5: Set Lambda environment variables

No longer needed — Terraform now sets all required environment variables automatically, including:
- `NODE_ENV=production` (not `dev`)
- `PORT`, `MONGODB_URI`, `JWT_SECRET`, etc. (set to `skip` for Lambda compatibility)
- `DOCUMENTDB_SECRET_NAME` (set to the secret name, not ARN)
- All AWS service references (SQS URLs, EventBridge bus name, etc.)

## Step 6: Deploy backend code

```powershell
cd backend

# Install production dependencies
npm install --omit=dev

# Download the DocumentDB TLS certificate
# Get it from: https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
# Save as backend/global-bundle.pem

# Create zip (from INSIDE the backend folder, select files at root level)
# Using WinRAR GUI: select index.mjs, server.js, package.json, schemas.js, global-bundle.pem,
# lambda/, config/, controllers/, middleware/, models/, routes/, services/, utils/, node_modules/
# Right-click → Add to archive → ZIP format → OK

# Upload to S3 and deploy
aws s3 cp lambda-deploy.zip s3://YOUR_UPLOADS_BUCKET/deploy/api-handler.zip
aws lambda update-function-code --function-name taskly-dev-api --s3-bucket YOUR_UPLOADS_BUCKET --s3-key deploy/api-handler.zip
```

**Critical:** The zip must have `index.mjs` and `server.js` at the ROOT level, not inside a subfolder. The Lambda handler is set to `index.handler`.

## Step 7: Create API Gateway routes

If routes are missing (you get "Not Found" on all endpoints):

```powershell
cd infrastructure
terraform apply -auto-approve -var="environment=dev" -var="documentdb_master_password=..." -var="jwt_signing_key=..." -var="ses_domain=..." "-target=module.apigateway"
```

## Step 8: Verify

```powershell
curl https://YOUR_API_GATEWAY_URL/api/health
```

Expected response:
```json
{"status":"OK","message":"Taskly API Server is running","timestamp":"...","environment":"production","version":"1.0.0","database":"connected"}
```

## Step 9: Deploy frontend (optional)

```powershell
cd frontend
npm ci
$env:VITE_API_URL = "https://YOUR_API_GATEWAY_URL/api"
npm run build
aws s3 sync dist/ s3://YOUR_FRONTEND_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## Teardown (stop all charges)

```powershell
# 1. Empty versioned S3 buckets (regular delete doesn't work with versioning)
python -c "import boto3; s3=boto3.resource('s3'); s3.Bucket('YOUR_UPLOADS_BUCKET').object_versions.all().delete(); print('done')"
python -c "import boto3; s3=boto3.resource('s3'); s3.Bucket('YOUR_FRONTEND_BUCKET').object_versions.all().delete(); print('done')"

# 2. Disable DocumentDB deletion protection
aws docdb modify-db-cluster --db-cluster-identifier taskly-dev-docdb-cluster --no-deletion-protection

# 3. Destroy everything
cd infrastructure
terraform destroy -auto-approve -var="environment=dev" -var="documentdb_master_password=..." -var="jwt_signing_key=..." -var="ses_domain=..."
```

If S3 buckets still won't delete, go to AWS Console → S3 → select bucket → Empty → then Delete.

---

## Troubleshooting

### "Cannot find module 'handler'" or "Cannot find module 'index'"

Your zip structure is wrong. The Lambda handler is `index.handler`, meaning it looks for `/var/task/index.mjs`. Open your zip and verify `index.mjs` is at the root level, not inside a subfolder.

Fix: re-zip from INSIDE the backend folder, selecting files directly (not the folder itself).

### "Service temporarily unavailable" / DATABASE_UNAVAILABLE

Lambda can't connect to DocumentDB. Check in order:

1. **Secret has correct host:** `aws secretsmanager get-secret-value --secret-id "taskly/dev/documentdb-credentials"` — verify `host` field isn't empty
2. **KMS permission:** Lambda needs `kms:Decrypt` on the secrets KMS key
3. **TLS certificate:** `global-bundle.pem` must be in the zip at root level
4. **Auth mechanism:** Connection string must include `&authMechanism=SCRAM-SHA-1` (DocumentDB doesn't support SCRAM-SHA-256)
5. **Security groups:** Lambda SG must have outbound to DocumentDB SG on port 27017

### "Invalid NODE_ENV: dev"

The environment validation in `server.js` expects `development`, `production`, or `test`. Set `NODE_ENV=production` in Lambda env vars.

### "Missing required environment variable: PORT/MONGODB_URI/etc"

Set all required env vars in Lambda configuration. For Lambda, set dummy values for vars that aren't used (CLOUDINARY, MONGODB_URI) since the validation runs before the Lambda-specific code path.

### "Unsupported mechanism [ -301 ]"

DocumentDB only supports SCRAM-SHA-1. Add `&authMechanism=SCRAM-SHA-1` to the connection string in `utils/secrets.js`.

### "Access to KMS is not allowed"

Lambda role needs KMS decrypt permission. Run:
```powershell
aws iam put-role-policy --role-name taskly-dev-lambda-execution --policy-name kms-decrypt --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"kms:Decrypt\",\"kms:DescribeKey\"],\"Resource\":\"YOUR_KMS_KEY_ARN\"}]}"
```

### "CreateNetworkInterface on EC2" permission error

Lambda needs VPC access policy:
```powershell
aws iam attach-role-policy --role-name taskly-dev-lambda-execution --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

### API Gateway returns "Not Found" for all routes

Routes weren't created (usually because Lambda didn't exist during first Terraform apply). Re-apply the API Gateway module:
```powershell
terraform apply "-target=module.apigateway" -var="environment=dev" ...
```

### S3 bucket won't delete (BucketNotEmpty with versioning)

Regular `aws s3 rm --recursive` doesn't delete version markers. Use:
```powershell
python -c "import boto3; s3=boto3.resource('s3'); s3.Bucket('BUCKET_NAME').object_versions.all().delete(); print('done')"
```

Or delete from AWS Console (S3 → bucket → Empty → Delete).

### DocumentDB won't delete (deletion protection)

```powershell
aws docdb modify-db-cluster --db-cluster-identifier taskly-dev-docdb-cluster --no-deletion-protection
```

Then re-run terraform destroy.

### Connection timeout (zip too large for direct Lambda upload)

Lambda has a 50MB limit for direct zip upload. Upload to S3 first:
```powershell
aws s3 cp lambda-deploy.zip s3://YOUR_BUCKET/deploy/api-handler.zip
aws lambda update-function-code --function-name taskly-dev-api --s3-bucket YOUR_BUCKET --s3-key deploy/api-handler.zip
```

### Terraform state lock stuck

If a previous apply crashed:
```powershell
terraform force-unlock LOCK_ID
```

Get the lock ID from the error message.

---

## Cost reference

| Resource | Monthly cost (dev) |
|----------|-------------------|
| DocumentDB (1x db.t3.medium) | ~$60 |
| NAT Gateway | ~$32 |
| VPC Interface Endpoints (4x) | ~$28 |
| Lambda + API Gateway | ~$5 |
| S3 + CloudFront | ~$3 |
| Everything else | ~$5 |
| **Total** | **~$130/month** |

To reduce costs: disable VPC Interface Endpoints in dev (`enable_interface_endpoints = false` in VPC module), use a single NAT Gateway (already default).

**Stop charges immediately:** Run terraform destroy (see Teardown section above).
