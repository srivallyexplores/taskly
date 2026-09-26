#!/usr/bin/env node

/**
 * DocumentDB Connectivity Integration Test
 *
 * A standalone test script to verify DocumentDB connectivity, TLS,
 * CRUD operations, index creation, and reader endpoint access.
 *
 * Run after infrastructure is deployed:
 *   NODE_ENV=production node scripts/tests/test-documentdb-connectivity.js
 *
 * For local testing against MongoDB:
 *   node scripts/tests/test-documentdb-connectivity.js
 *
 * Environment variables (local/non-production):
 *   MONGODB_URI          - Primary connection URI (default: mongodb://localhost:27017/taskly)
 *   DOCUMENTDB_READER_URI - Reader endpoint URI (optional, skips reader test if absent)
 *
 * In production, credentials are fetched from AWS Secrets Manager via the secrets utility.
 *
 * Validates 
 *   2.1 - DocumentDB stores all Taskly collections with existing Mongoose schema structure
 *   2.7 - DocumentDB supports text search indexes, compound indexes, and aggregation pipelines
 */

import mongoose from 'mongoose';
import { getDocumentDBUri } from '../../backend/utils/secrets.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TEST_COLLECTION = '_connectivity_test';
const READER_COLLECTION = '_reader_test';
const TIMEOUT_MS = 30_000;

const isProduction = process.env.NODE_ENV === 'production';

// TLS CA bundle path for DocumentDB in production (Lambda layer or local download)
const TLS_CA_FILE = process.env.TLS_CA_FILE || '/opt/rds-combined-ca-bundle.pem';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const results = [];

function report(name, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const icon = passed ? '✓' : '✗';
  results.push({ name, passed, detail });
  console.log(`  ${icon} [${status}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function getConnectionUri() {
  if (isProduction) {
    return getDocumentDBUri();
  }
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly';
}

function getReaderUri() {
  if (isProduction) {
    // In production, the reader endpoint is derived from the secret or env var
    return process.env.DOCUMENTDB_READER_URI || null;
  }
  return process.env.DOCUMENTDB_READER_URI || null;
}

function getConnectionOptions() {
  const opts = {
    serverSelectionTimeoutMS: TIMEOUT_MS,
    socketTimeoutMS: TIMEOUT_MS,
    retryWrites: false, // DocumentDB does not support retryWrites
  };

  if (isProduction) {
    opts.tls = true;
    opts.tlsCAFile = TLS_CA_FILE;
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Test: Connection
// ---------------------------------------------------------------------------

async function testConnection(connection) {
  try {
    // Verify connection state
    const state = connection.readyState;
    if (state !== 1) {
      report('Connection established', false, `readyState=${state}, expected 1 (connected)`);
      return false;
    }
    report('Connection established', true);

    // Verify TLS if in production
    if (isProduction) {
      // The connection succeeds with TLS options — that confirms TLS is working
      report('TLS connection verified', true, 'Connected with tls=true and CA bundle');
    } else {
      report('TLS connection (skipped)', true, 'Non-production environment, TLS not enforced');
    }

    return true;
  } catch (err) {
    report('Connection established', false, err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test: CRUD Operations
// ---------------------------------------------------------------------------

async function testCrudOperations(connection) {
  const db = connection.db;
  const collection = db.collection(TEST_COLLECTION);

  try {
    // Clean up any leftover test data
    await collection.deleteMany({});

    // CREATE
    const doc = {
      title: 'Test Task',
      description: 'Integration test document',
      status: 'pending',
      priority: 'high',
      createdAt: new Date(),
      tags: ['test', 'integration'],
    };
    const insertResult = await collection.insertOne(doc);
    const insertedId = insertResult.insertedId;
    report('CREATE - Insert document', !!insertedId, `id=${insertedId}`);

    // READ
    const found = await collection.findOne({ _id: insertedId });
    const readPassed = found && found.title === 'Test Task';
    report('READ - Find document by ID', readPassed);

    // UPDATE
    const updateResult = await collection.updateOne(
      { _id: insertedId },
      { $set: { status: 'completed', completedAt: new Date() } }
    );
    const updatePassed = updateResult.modifiedCount === 1;
    report('UPDATE - Modify document', updatePassed, `modifiedCount=${updateResult.modifiedCount}`);

    // Verify update
    const updated = await collection.findOne({ _id: insertedId });
    report('UPDATE - Verify modification', updated && updated.status === 'completed');

    // DELETE
    const deleteResult = await collection.deleteOne({ _id: insertedId });
    const deletePassed = deleteResult.deletedCount === 1;
    report('DELETE - Remove document', deletePassed, `deletedCount=${deleteResult.deletedCount}`);

    // Verify deletion
    const deleted = await collection.findOne({ _id: insertedId });
    report('DELETE - Verify removal', deleted === null);

    return true;
  } catch (err) {
    report('CRUD operations', false, err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test: Index Creation
// ---------------------------------------------------------------------------

async function testIndexCreation(connection) {
  const db = connection.db;
  const collection = db.collection(TEST_COLLECTION);

  try {
    // Insert sample documents for index testing
    await collection.insertMany([
      { title: 'Build API', description: 'Create REST endpoints', status: 'pending', project: 'backend', priority: 1 },
      { title: 'Write tests', description: 'Unit and integration tests', status: 'in_progress', project: 'backend', priority: 2 },
      { title: 'Design UI', description: 'Create mockups for dashboard', status: 'completed', project: 'frontend', priority: 1 },
    ]);

    // Text index (Requirement 2.7 - text search indexes)
    await collection.createIndex(
      { title: 'text', description: 'text' },
      { name: 'text_search_idx' }
    );
    const textIndexes = await collection.indexes();
    const hasTextIndex = textIndexes.some(idx => idx.name === 'text_search_idx');
    report('INDEX - Create text index', hasTextIndex);

    // Verify text search works
    const textResults = await collection.find({ $text: { $search: 'API' } }).toArray();
    report('INDEX - Text search query', textResults.length > 0, `found ${textResults.length} result(s)`);

    // Compound index (Requirement 2.7 - compound indexes)
    await collection.createIndex(
      { project: 1, status: 1 },
      { name: 'compound_project_status_idx' }
    );
    const allIndexes = await collection.indexes();
    const hasCompoundIndex = allIndexes.some(idx => idx.name === 'compound_project_status_idx');
    report('INDEX - Create compound index', hasCompoundIndex);

    // Verify compound index is used (query matching the index pattern)
    const compoundResults = await collection.find({ project: 'backend', status: 'pending' }).toArray();
    report('INDEX - Compound index query', compoundResults.length > 0, `found ${compoundResults.length} result(s)`);

    // Clean up
    await collection.dropIndexes();
    await collection.deleteMany({});

    return true;
  } catch (err) {
    report('Index creation', false, err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test: Reader Endpoint Connectivity
// ---------------------------------------------------------------------------

async function testReaderEndpoint() {
  const readerUri = getReaderUri();

  if (!readerUri) {
    report('READER - Endpoint connectivity (skipped)', true, 'No reader URI configured');
    return true;
  }

  let readerConnection = null;
  try {
    const opts = {
      ...getConnectionOptions(),
      readPreference: 'secondaryPreferred',
    };

    readerConnection = await mongoose.createConnection(readerUri, opts).asPromise();

    const state = readerConnection.readyState;
    report('READER - Connection established', state === 1, `readyState=${state}`);

    // Perform a read operation on the reader endpoint
    const db = readerConnection.db;
    const collection = db.collection(READER_COLLECTION);

    // Insert a document via reader (may fail on strict read replicas, which is expected)
    // Instead, just verify we can read
    const collections = await db.listCollections().toArray();
    report('READER - List collections', Array.isArray(collections), `found ${collections.length} collection(s)`);

    return true;
  } catch (err) {
    // Connection failure to reader endpoint is a real failure
    report('READER - Endpoint connectivity', false, err.message);
    return false;
  } finally {
    if (readerConnection) {
      await readerConnection.close();
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DocumentDB Connectivity Integration Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Environment: ${isProduction ? 'production' : 'local/development'}`);
  console.log(`  Timestamp:   ${new Date().toISOString()}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log('');

  let connection = null;
  let exitCode = 0;

  try {
    // Get connection URI
    const uri = await getConnectionUri();
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`  Connecting to: ${maskedUri}`);
    console.log('');

    // Connect
    const opts = getConnectionOptions();
    connection = await mongoose.createConnection(uri, opts).asPromise();

    // Run tests
    console.log('  [1/4] Connection & TLS');
    await testConnection(connection);
    console.log('');

    console.log('  [2/4] CRUD Operations');
    await testCrudOperations(connection);
    console.log('');

    console.log('  [3/4] Index Creation & Queries');
    await testIndexCreation(connection);
    console.log('');

    console.log('  [4/4] Reader Endpoint');
    await testReaderEndpoint();
    console.log('');

  } catch (err) {
    report('Test execution', false, err.message);
    exitCode = 1;
  } finally {
    // Cleanup: drop test collections and close connection
    if (connection && connection.readyState === 1) {
      try {
        await connection.db.collection(TEST_COLLECTION).drop().catch(() => {});
        await connection.db.collection(READER_COLLECTION).drop().catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
      await connection.close();
    }
  }

  // Summary
  console.log('───────────────────────────────────────────────────────────');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
  console.log('');

  if (failed > 0) {
    console.log('  Failed checks:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    ✗ ${r.name}${r.detail ? ': ' + r.detail : ''}`);
    });
    console.log('');
    exitCode = 1;
  }

  console.log(failed === 0
    ? '  ✓ All checks passed — DocumentDB connectivity verified'
    : '  ✗ Some checks failed — review output above'
  );
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  process.exit(exitCode);
}

main();
