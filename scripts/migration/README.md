# MongoDB to DocumentDB Migration Runbook

## Overview

This runbook documents the procedure for migrating Taskly's MongoDB database to AWS DocumentDB. The migration is designed to complete within a **2-hour maintenance window** for databases up to 10GB.

## Pre-Migration Checklist

- [ ] DocumentDB cluster is provisioned and accessible from Lambda VPC
- [ ] TLS certificates are configured for DocumentDB connections
- [ ] Source MongoDB is accessible from the migration environment
- [ ] Backup of source MongoDB completed (mongodump)
- [ ] Migration scripts tested against staging environment
- [ ] Team notified of maintenance window
- [ ] Rollback procedure reviewed and tested
- [ ] Monitoring dashboards open for real-time observation
- [ ] DNS TTL reduced to 60 seconds (if applicable)

## Architecture

```
Source: MongoDB (current production)
Target: AWS DocumentDB (new production)

Migration path:
  MongoDB → migrate-data.js → DocumentDB
  
Validation:
  validate-migration.js compares source ↔ target
  
Rollback:
  rollback-migration.js restores MongoDB connection
```

## Execution Steps

### Phase 1: Preparation (30 minutes before window)

1. **Take a final MongoDB backup:**
   ```bash
   mongodump --uri="$SOURCE_MONGODB_URI" --out=./backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **Verify DocumentDB connectivity:**
   ```bash
   node scripts/migration/validate-migration.js \
     --source "$SOURCE_MONGODB_URI" \
     --target "$TARGET_DOCUMENTDB_URI"
   ```

3. **Notify stakeholders:**
   - Post maintenance notice
   - Confirm on-call team availability

### Phase 2: Migration (maintenance window starts)

4. **Enable maintenance mode** (optional — redirect to static page):
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id $HOSTED_ZONE_ID \
     --change-batch file://maintenance-dns-change.json
   ```

5. **Run the migration:**
   ```bash
   node scripts/migration/migrate-data.js \
     --source "$SOURCE_MONGODB_URI" \
     --target "$TARGET_DOCUMENTDB_URI" \
     --batch 1000
   ```

   Expected duration: ~30-60 minutes for 10GB

6. **Validate the migration:**
   ```bash
   node scripts/migration/validate-migration.js \
     --source "$SOURCE_MONGODB_URI" \
     --target "$TARGET_DOCUMENTDB_URI"
   ```

   All checks must pass before proceeding.

### Phase 3: Connection Switchover

7. **Update the connection string** in Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id "taskly/production/documentdb-credentials" \
     --secret-string "{\"uri\":\"$TARGET_DOCUMENTDB_URI\",\"database\":\"taskly\"}"
   ```

8. **Redeploy Lambda** to pick up new secret (or wait for cache TTL — 5 minutes):
   ```bash
   aws lambda update-function-configuration \
     --function-name taskly-prod-api \
     --description "Switched to DocumentDB $(date +%Y%m%d-%H%M%S)"
   ```

9. **Verify application health:**
   ```bash
   curl -s https://api.taskly.app/api/health | jq .
   ```

### Phase 4: Post-Migration Verification

10. **Run smoke tests:**
    - Create a task
    - List tasks
    - Complete a task
    - Upload a file
    - Accept a team invitation

11. **Monitor for 15 minutes:**
    - Check CloudWatch error rate alarm
    - Verify Lambda latency is within bounds
    - Confirm no connection errors in logs

12. **Disable maintenance mode** (if enabled):
    ```bash
    aws route53 change-resource-record-sets \
      --hosted-zone-id $HOSTED_ZONE_ID \
      --change-batch file://production-dns-change.json
    ```

13. **Notify stakeholders** that migration is complete.

## Rollback Procedure

**Target: Complete rollback within 15 minutes**

If issues are detected after switchover:

1. **Run rollback script:**
   ```bash
   node scripts/migration/rollback-migration.js \
     --source "$SOURCE_MONGODB_URI"
   ```

2. **Restore MongoDB connection** in Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id "taskly/production/documentdb-credentials" \
     --secret-string "{\"uri\":\"$SOURCE_MONGODB_URI\",\"database\":\"taskly\"}"
   ```

3. **Force Lambda to refresh secrets:**
   ```bash
   aws lambda update-function-configuration \
     --function-name taskly-prod-api \
     --description "Rolled back to MongoDB $(date +%Y%m%d-%H%M%S)"
   ```

4. **Verify health:**
   ```bash
   curl -s https://api.taskly.app/api/health | jq .
   ```

5. **Post-mortem:** Document what went wrong and plan next attempt.

## Timing Estimates

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Preparation | 30 min | 30 min |
| Migration (10GB) | 60 min | 90 min |
| Validation | 10 min | 100 min |
| Switchover | 5 min | 105 min |
| Verification | 15 min | 120 min |

**Total: ~2 hours** (within maintenance window)

## Troubleshooting

### Connection timeout to DocumentDB
- Verify Lambda security group allows outbound to port 27017
- Check DocumentDB security group allows inbound from Lambda SG
- Ensure TLS is enabled in connection string

### Count mismatch after migration
- Re-run migration for the affected collection
- Check for write operations during migration (should be in maintenance mode)

### Index creation failures
- DocumentDB doesn't support all MongoDB index types
- Check `incompatible` output from migration script
- Create equivalent indexes manually if needed

### High latency after switchover
- DocumentDB may need time to warm up caches
- Monitor for 10-15 minutes before deciding to rollback
- Check if connection pooling is configured correctly (maxPoolSize: 2 for Lambda)
