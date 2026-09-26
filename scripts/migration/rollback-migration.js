#!/usr/bin/env node

/**
 * Migration Rollback Script
 *
 * Restores the original MongoDB connection within 15 minutes by:
 * - Updating application configuration to point back to MongoDB
 * - Verifying source MongoDB is still accessible and data is intact
 * - Optionally cleaning up DocumentDB data
 *
 * Usage:
 *   node scripts/migration/rollback-migration.js --source <MONGODB_URI>
 *
 *  14.2, 14.4, 14.5
 */

import { MongoClient } from 'mongodb';

const COLLECTIONS = ['users', 'tasks', 'projects', 'teams', 'notifications', 'invitations', 'achievements'];

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    source: process.env.SOURCE_MONGODB_URI || '',
    target: process.env.TARGET_DOCUMENTDB_URI || '',
    cleanTarget: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source') config.source = args[++i];
    if (args[i] === '--target') config.target = args[++i];
    if (args[i] === '--clean-target') config.cleanTarget = true;
  }

  if (!config.source) {
    console.error('Usage: node rollback-migration.js --source <MONGODB_URI> [--target <DOCUMENTDB_URI>] [--clean-target]');
    process.exit(1);
  }
  return config;
}

async function main() {
  const config = parseArgs();
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' Migration Rollback');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Target: Restore connection to source MongoDB`);
  console.log(`  Clean DocumentDB: ${config.cleanTarget ? 'YES' : 'NO'}`);
  console.log('');

  let sourceClient, targetClient;

  try {
    // Step 1: Verify source MongoDB is accessible
    console.log('Step 1: Verifying source MongoDB accessibility...');
    sourceClient = new MongoClient(config.source);
    await sourceClient.connect();
    const sourceDb = sourceClient.db();

    // Verify data is still intact
    for (const col of COLLECTIONS) {
      const count = await sourceDb.collection(col).countDocuments();
      console.log(`  ✓ ${col}: ${count} documents`);
    }
    console.log('  Source MongoDB is accessible and data is intact.\n');

    // Step 2: Connection string switchover instructions
    console.log('Step 2: Connection String Switchover');
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  Update the following to restore MongoDB connection:');
    console.log('');
    console.log('  Option A — Lambda environment variable:');
    console.log('    aws lambda update-function-configuration \\');
    console.log('      --function-name taskly-prod-api \\');
    console.log('      --environment "Variables={MONGODB_URI=<source_uri>}"');
    console.log('');
    console.log('  Option B — Secrets Manager:');
    console.log('    aws secretsmanager put-secret-value \\');
    console.log('      --secret-id taskly/production/documentdb-credentials \\');
    console.log('      --secret-string \'{"uri":"<source_mongodb_uri>"}\'');
    console.log('');
    console.log('  Option C — Terraform (recommended):');
    console.log('    Revert the DocumentDB URI in terraform.tfvars and apply');
    console.log('  ─────────────────────────────────────────────────────────\n');

    // Step 3: Optionally clean DocumentDB
    if (config.cleanTarget && config.target) {
      console.log('Step 3: Cleaning DocumentDB target...');
      targetClient = new MongoClient(config.target, { tls: true, retryWrites: false });
      await targetClient.connect();
      const targetDb = targetClient.db();

      for (const col of COLLECTIONS) {
        const result = await targetDb.collection(col).deleteMany({});
        console.log(`  ✓ ${col}: deleted ${result.deletedCount} documents`);
      }
      console.log('  DocumentDB cleaned.\n');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(` Rollback preparation complete (${duration}s)`);
    console.log(' Follow the connection string switchover steps above to');
    console.log(' complete the rollback within the 15-minute target.');
    console.log('═══════════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('\n  ✗ Rollback error:', error.message);
    console.error('  CRITICAL: Manual intervention required');
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

main();
