#!/usr/bin/env node

/**
 * MongoDB to DocumentDB Migration Script
 *
 * Transfers data collection-by-collection from MongoDB to DocumentDB.
 * Validates record counts, preserves indexes, and logs incompatibilities.
 *
 * Usage:
 *   node scripts/migration/migrate-data.js --source <MONGODB_URI> --target <DOCUMENTDB_URI>
 *
 * Options:
 *   --source    Source MongoDB connection URI
 *   --target    Target DocumentDB connection URI
 *   --dry-run   Validate without writing data
 *   --batch     Batch size for bulk inserts (default: 1000)
 *
 *  14.1, 14.2, 14.3, 14.7
 */

import { MongoClient } from 'mongodb';

// ─── Configuration ───────────────────────────────────────────────────────────

const COLLECTIONS = ['users', 'tasks', 'projects', 'teams', 'notifications', 'invitations', 'achievements'];
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000', 10);

// DocumentDB unsupported features that need transformation
const DOCUMENTDB_INCOMPATIBILITIES = {
  // DocumentDB doesn't support $jsonSchema validation
  jsonSchemaValidation: true,
  // DocumentDB doesn't support retryable writes
  retryWrites: false,
  // DocumentDB text indexes have limitations
  textIndexWeights: true,
};

// ─── Argument Parsing ────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    source: process.env.SOURCE_MONGODB_URI || '',
    target: process.env.TARGET_DOCUMENTDB_URI || '',
    dryRun: false,
    batch: BATCH_SIZE,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--source': config.source = args[++i]; break;
      case '--target': config.target = args[++i]; break;
      case '--dry-run': config.dryRun = true; break;
      case '--batch': config.batch = parseInt(args[++i], 10); break;
    }
  }

  if (!config.source || !config.target) {
    console.error('Error: --source and --target URIs are required');
    console.error('Usage: node migrate-data.js --source <URI> --target <URI> [--dry-run] [--batch 1000]');
    process.exit(1);
  }

  return config;
}

// ─── Migration Logic ─────────────────────────────────────────────────────────

async function migrateCollection(sourceDb, targetDb, collectionName, config) {
  const startTime = Date.now();
  const sourceCol = sourceDb.collection(collectionName);
  const targetCol = targetDb.collection(collectionName);

  // Get source count
  const sourceCount = await sourceCol.countDocuments();
  console.log(`  [${collectionName}] Source documents: ${sourceCount}`);

  if (sourceCount === 0) {
    console.log(`  [${collectionName}] Skipping — empty collection`);
    return { collection: collectionName, sourceCount: 0, targetCount: 0, status: 'skipped' };
  }

  if (config.dryRun) {
    console.log(`  [${collectionName}] Dry run — would migrate ${sourceCount} documents`);
    return { collection: collectionName, sourceCount, targetCount: 0, status: 'dry-run' };
  }

  // Migrate in batches
  let migrated = 0;
  const cursor = sourceCol.find({}).batchSize(config.batch);

  while (await cursor.hasNext()) {
    const batch = [];
    for (let i = 0; i < config.batch && await cursor.hasNext(); i++) {
      const doc = await cursor.next();
      batch.push(doc);
    }

    if (batch.length > 0) {
      try {
        await targetCol.insertMany(batch, { ordered: false });
        migrated += batch.length;
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key — count successful inserts
          migrated += (batch.length - (error.writeErrors?.length || 0));
          console.warn(`  [${collectionName}] ${error.writeErrors?.length || 0} duplicate key errors (skipped)`);
        } else {
          throw error;
        }
      }
    }

    if (migrated % 10000 === 0 && migrated > 0) {
      console.log(`  [${collectionName}] Progress: ${migrated}/${sourceCount}`);
    }
  }

  // Validate count
  const targetCount = await targetCol.countDocuments();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  const status = targetCount === sourceCount ? 'success' : 'count-mismatch';
  console.log(`  [${collectionName}] Migrated: ${targetCount}/${sourceCount} in ${duration}s — ${status}`);

  return { collection: collectionName, sourceCount, targetCount, status, durationSec: duration };
}

async function migrateIndexes(sourceDb, targetDb, collectionName) {
  const sourceCol = sourceDb.collection(collectionName);
  const targetCol = targetDb.collection(collectionName);

  const indexes = await sourceCol.indexes();
  const incompatible = [];
  let created = 0;

  for (const index of indexes) {
    // Skip the default _id index
    if (index.name === '_id_') continue;

    try {
      const indexSpec = index.key;
      const options = { name: index.name };

      if (index.unique) options.unique = true;
      if (index.sparse) options.sparse = true;
      if (index.expireAfterSeconds) options.expireAfterSeconds = index.expireAfterSeconds;

      // DocumentDB text index compatibility check
      if (Object.values(indexSpec).includes('text')) {
        // DocumentDB supports text indexes but with limitations
        // Remove weights if present (not fully supported)
        if (index.weights) {
          incompatible.push({
            collection: collectionName,
            index: index.name,
            reason: 'Text index weights not supported in DocumentDB — creating without weights',
          });
        }
        options.name = index.name;
      }

      await targetCol.createIndex(indexSpec, options);
      created++;
    } catch (error) {
      incompatible.push({
        collection: collectionName,
        index: index.name,
        reason: error.message,
      });
    }
  }

  console.log(`  [${collectionName}] Indexes: ${created} created, ${incompatible.length} incompatible`);
  return { created, incompatible };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const config = parseArgs();
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' MongoDB → DocumentDB Migration');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  console.log(`  Batch size: ${config.batch}`);
  console.log(`  Collections: ${COLLECTIONS.join(', ')}`);
  console.log('');

  let sourceClient, targetClient;

  try {
    // Connect to source
    console.log('Connecting to source MongoDB...');
    sourceClient = new MongoClient(config.source);
    await sourceClient.connect();
    const sourceDb = sourceClient.db();
    console.log(`  Connected to: ${sourceDb.databaseName}`);

    // Connect to target
    console.log('Connecting to target DocumentDB...');
    targetClient = new MongoClient(config.target, {
      tls: true,
      retryWrites: false, // DocumentDB limitation
    });
    await targetClient.connect();
    const targetDb = targetClient.db();
    console.log(`  Connected to: ${targetDb.databaseName}`);
    console.log('');

    // Migrate each collection
    const results = [];
    const indexResults = [];

    for (const collection of COLLECTIONS) {
      console.log(`─── Migrating: ${collection} ───`);

      // Migrate indexes first
      const indexResult = await migrateIndexes(sourceDb, targetDb, collection);
      indexResults.push({ collection, ...indexResult });

      // Migrate data
      const result = await migrateCollection(sourceDb, targetDb, collection, config);
      results.push(result);
      console.log('');
    }

    // Summary
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(' Migration Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total duration: ${totalDuration}s`);
    console.log('');

    console.log('  Collections:');
    for (const r of results) {
      const icon = r.status === 'success' ? '✓' : r.status === 'dry-run' ? '○' : '✗';
      console.log(`    ${icon} ${r.collection}: ${r.targetCount || 0}/${r.sourceCount} — ${r.status}`);
    }

    console.log('');
    console.log('  Index Incompatibilities:');
    const allIncompat = indexResults.flatMap((r) => r.incompatible);
    if (allIncompat.length === 0) {
      console.log('    None');
    } else {
      for (const i of allIncompat) {
        console.log(`    ⚠ ${i.collection}.${i.index}: ${i.reason}`);
      }
    }

    // Exit with error if any collection failed
    const failures = results.filter((r) => r.status === 'count-mismatch');
    if (failures.length > 0) {
      console.error(`\n  ✗ ${failures.length} collection(s) have count mismatches`);
      process.exit(1);
    }

    console.log('\n  ✓ Migration completed successfully');
  } catch (error) {
    console.error('\n  ✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

main();
