#!/usr/bin/env node

/**
 * Migration Validation Script
 *
 * Verifies data integrity post-migration by comparing source and target:
 * - Record counts per collection
 * - Checksum comparison for critical collections (users, tasks, projects)
 * - Index verification
 * - Sample document comparison
 *
 * Usage:
 *   node scripts/migration/validate-migration.js --source <URI> --target <URI>
 *
 *  14.2, 14.4, 14.5
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const COLLECTIONS = ['users', 'tasks', 'projects', 'teams', 'notifications', 'invitations', 'achievements'];
const CRITICAL_COLLECTIONS = ['users', 'tasks', 'projects'];
const SAMPLE_SIZE = 100;

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    source: process.env.SOURCE_MONGODB_URI || '',
    target: process.env.TARGET_DOCUMENTDB_URI || '',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source') config.source = args[++i];
    if (args[i] === '--target') config.target = args[++i];
  }

  if (!config.source || !config.target) {
    console.error('Usage: node validate-migration.js --source <URI> --target <URI>');
    process.exit(1);
  }
  return config;
}

function hashDocument(doc) {
  const normalized = JSON.stringify(doc, Object.keys(doc).sort());
  return crypto.createHash('md5').update(normalized).digest('hex');
}

async function validateCounts(sourceDb, targetDb) {
  console.log('\n─── Record Count Validation ───');
  const results = [];

  for (const col of COLLECTIONS) {
    const sourceCount = await sourceDb.collection(col).countDocuments();
    const targetCount = await targetDb.collection(col).countDocuments();
    const match = sourceCount === targetCount;

    results.push({ collection: col, sourceCount, targetCount, match });
    const icon = match ? '✓' : '✗';
    console.log(`  ${icon} ${col}: source=${sourceCount}, target=${targetCount}`);
  }

  return results;
}

async function validateChecksums(sourceDb, targetDb) {
  console.log('\n─── Checksum Validation (Critical Collections) ───');
  const results = [];

  for (const col of CRITICAL_COLLECTIONS) {
    const sourceDocs = await sourceDb.collection(col)
      .find({})
      .sort({ _id: 1 })
      .limit(SAMPLE_SIZE)
      .toArray();

    let matches = 0;
    let mismatches = 0;

    for (const sourceDoc of sourceDocs) {
      const targetDoc = await targetDb.collection(col).findOne({ _id: sourceDoc._id });

      if (!targetDoc) {
        mismatches++;
        continue;
      }

      const sourceHash = hashDocument(sourceDoc);
      const targetHash = hashDocument(targetDoc);

      if (sourceHash === targetHash) {
        matches++;
      } else {
        mismatches++;
      }
    }

    const pass = mismatches === 0;
    results.push({ collection: col, sampled: sourceDocs.length, matches, mismatches, pass });
    const icon = pass ? '✓' : '✗';
    console.log(`  ${icon} ${col}: ${matches}/${sourceDocs.length} match (${mismatches} mismatches)`);
  }

  return results;
}

async function validateIndexes(sourceDb, targetDb) {
  console.log('\n─── Index Validation ───');
  const results = [];

  for (const col of COLLECTIONS) {
    const sourceIndexes = await sourceDb.collection(col).indexes();
    const targetIndexes = await targetDb.collection(col).indexes();

    const sourceNames = sourceIndexes.map((i) => i.name).sort();
    const targetNames = targetIndexes.map((i) => i.name).sort();

    const missing = sourceNames.filter((n) => !targetNames.includes(n));
    const pass = missing.length === 0;

    results.push({ collection: col, sourceIndexCount: sourceNames.length, targetIndexCount: targetNames.length, missing, pass });
    const icon = pass ? '✓' : '✗';
    console.log(`  ${icon} ${col}: ${targetNames.length}/${sourceNames.length} indexes${missing.length > 0 ? ` (missing: ${missing.join(', ')})` : ''}`);
  }

  return results;
}

async function main() {
  const config = parseArgs();
  let sourceClient, targetClient;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(' Migration Validation');
  console.log('═══════════════════════════════════════════════════════════════');

  try {
    sourceClient = new MongoClient(config.source);
    await sourceClient.connect();
    const sourceDb = sourceClient.db();

    targetClient = new MongoClient(config.target, { tls: true, retryWrites: false });
    await targetClient.connect();
    const targetDb = targetClient.db();

    const countResults = await validateCounts(sourceDb, targetDb);
    const checksumResults = await validateChecksums(sourceDb, targetDb);
    const indexResults = await validateIndexes(sourceDb, targetDb);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(' Validation Summary');
    console.log('═══════════════════════════════════════════════════════════════');

    const countPass = countResults.every((r) => r.match);
    const checksumPass = checksumResults.every((r) => r.pass);
    const indexPass = indexResults.every((r) => r.pass);
    const allPass = countPass && checksumPass && indexPass;

    console.log(`  Record counts: ${countPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Checksums:     ${checksumPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Indexes:       ${indexPass ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`\n  Overall: ${allPass ? '✓ VALIDATION PASSED' : '✗ VALIDATION FAILED'}`);

    process.exit(allPass ? 0 : 1);
  } catch (error) {
    console.error('\n  ✗ Validation error:', error.message);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

main();
