#!/bin/bash
###############################################################################
# GitHub Actions OIDC Setup for AWS
#
# This script sets up the OIDC trust between GitHub Actions and AWS.
# Run this ONCE to enable CI/CD deployments.
#
# Prerequisites:
#   - AWS CLI configured with admin access
#   - Replace REPLACE_WITH_YOUR_ACCOUNT_ID in trust-policy.json
#
# Usage:
#   chmod +x setup-oidc.sh
#   ./setup-oidc.sh
###############################################################################

set -e

echo "=========================================="
echo "  GitHub Actions OIDC Setup for Taskly"
echo "=========================================="
echo ""

# Get account ID automatically
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: ${ACCOUNT_ID}"
echo "GitHub Repo: suletetes/taskly"
echo ""

# Update trust policy with actual account ID
sed -i "s/REPLACE_WITH_YOUR_ACCOUNT_ID/${ACCOUNT_ID}/g" trust-policy.json
echo " Updated trust-policy.json with account ID"

# Step 1: Create OIDC Provider
echo ""
echo "Step 1: Creating OIDC Provider..."
aws iam create-open-id-connect-provider \
  --url "https://token.actions.githubusercontent.com" \
  --client-id-list "sts.amazonaws.com" \
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1" \
  --tags Key=Project,Value=taskly 2>/dev/null \
  && echo " OIDC Provider created" \
  || echo "  OIDC Provider already exists (that's fine)"

# Step 2: Create IAM Role
echo ""
echo "Step 2: Creating IAM Role..."
aws iam create-role \
  --role-name github-actions-taskly \
  --assume-role-policy-document file://trust-policy.json \
  --description "GitHub Actions OIDC role for Taskly CI/CD" \
  --tags Key=Project,Value=taskly 2>/dev/null \
  && echo " IAM Role created" \
  || echo "  Role already exists (that's fine)"

# Step 3: Attach Policies
echo ""
echo "Step 3: Attaching policies..."

aws iam attach-role-policy --role-name github-actions-taskly \
  --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess 2>/dev/null \
  && echo "   AWSLambda_FullAccess" \
  || echo "    AWSLambda_FullAccess already attached"

aws iam attach-role-policy --role-name github-actions-taskly \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess 2>/dev/null \
  && echo "   AmazonS3FullAccess" \
  || echo "    AmazonS3FullAccess already attached"

aws iam attach-role-policy --role-name github-actions-taskly \
  --policy-arn arn:aws:iam::aws:policy/CloudFrontFullAccess 2>/dev/null \
  && echo "   CloudFrontFullAccess" \
  || echo "    CloudFrontFullAccess already attached"

aws iam attach-role-policy --role-name github-actions-taskly \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess 2>/dev/null \
  && echo "   CloudWatchReadOnlyAccess" \
  || echo "    CloudWatchReadOnlyAccess already attached"

# Print the Role ARN
echo ""
echo "=========================================="
echo "   SETUP COMPLETE"
echo "=========================================="
echo ""
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/github-actions-taskly"
echo "Role ARN: ${ROLE_ARN}"
echo ""
echo "Now go to GitHub and set these REPOSITORY VARIABLES:"
echo "(Settings → Secrets and variables → Actions → Variables tab)"
echo ""
echo "┌─────────────────────────────────┬──────────────────────────────────────────────────────────┐"
echo "│ Variable Name                   │ Value                                                    │"
echo "├─────────────────────────────────┼──────────────────────────────────────────────────────────┤"
echo "│ AWS_OIDC_ROLE_ARN               │ ${ROLE_ARN}                                              │"
echo "│ LAMBDA_DEPLOY_BUCKET            │ taskly-prod-lambda-deploy-${ACCOUNT_ID}                  │"
echo "│ FRONTEND_BUCKET                 │ taskly-prod-frontend-${ACCOUNT_ID}                       │"
echo "│ CLOUDFRONT_DISTRIBUTION_ID      │ (run: aws cloudfront list-distributions)                 │"
echo "│ API_GATEWAY_URL                 │ https://cssv1h3248.execute-api.us-east-1.amazonaws.com   │"
echo "└─────────────────────────────────┴──────────────────────────────────────────────────────────┘"
echo ""
echo "To find your CloudFront Distribution ID:"
echo "  aws cloudfront list-distributions --query 'DistributionList.Items[*].{Id:Id,Domain:DomainName}' --output table"
echo ""
echo "To find your S3 buckets:"
echo "  aws s3 ls | grep taskly"
echo ""
