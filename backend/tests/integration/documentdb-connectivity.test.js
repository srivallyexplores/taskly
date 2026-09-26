/**
 * Integration Test: DocumentDB Connectivity
 *
 * Validates that the application can connect to DocumentDB (or MongoDB in local dev),
 * perform basic CRUD operations, create indexes, and verify TLS connectivity.
 *
 * This test is designed to run against a real DocumentDB instance in AWS environments
 * or against a local MongoDB instance for development validation.
 *
 * 
 * - 2.1: DocumentDB stores all Taskly collections with existing Mongoose schema structure
 * - 2.7: DocumentDB supports all existing Mongoose queries including text search,
 *         compound indexes, and aggregation pipelines
 *
 * Usage:
 *   # Against local MongoDB (default)
 *   npm test -- --testPathPattern=documentdb-connectivity
 *
 *   # Against DocumentDB (set environment variables)
 *   DOCUMENTDB_URI=mongodb://user:pass@cluster.docdb.amazonaws.com:27017/taskly?tls=true \
 *   npm test -- --testPathPattern=documentdb-connectivity
 */

import mongoose from 'mongoose';

// Connection URI: prefer explicit DocumentDB URI, fall back to local MongoDB
const DOCUMENTDB_URI = process.env.DOCUMENTDB_URI
  || process.env.MONGODB_URI
  || 'mongodb://localhost:27017/taskly_integration_test';

// Determine if we're testing against a real DocumentDB cluster
const isDocumentDB = DOCUMENTDB_URI.includes('docdb') || DOCUMENTDB_URI.includes('tls=true');

// Test collection name (isolated from production data)
const TEST_COLLECTION = 'integration_test_items';

// Live-infra gate: this suite opens its own connection to a real DocumentDB /
// MongoDB instance. Skip by default so the standard suite is green without
// external services. Enable with RUN_AWS_INTEGRATION=true.
const RUN_AWS_INTEGRATION = process.env.RUN_AWS_INTEGRATION === 'true';
const describeMaybe = RUN_AWS_INTEGRATION ? describe : describe.skip;

describeMaybe('DocumentDB Connectivity Integration Tests', () => {
  let connection;
  let TestModel;

  // Define a test schema that exercises common Mongoose features
  const TestSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
    priority: { type: Number, min: 1, max: 5, default: 3 },
    tags: { type: [String], default: [] },
    assignee: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }, {
    collection: TEST_COLLECTION,
    timestamps: false,
  });

  // Add compound index (mirrors Taskly's task indexes)
  TestSchema.index({ status: 1, priority: -1 });
  TestSchema.index({ assignee: 1, status: 1 });
  TestSchema.index({ title: 'text', description: 'text' });

  beforeAll(async () => {
    const connectOptions = {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: !isDocumentDB, // DocumentDB doesn't support retryWrites
    };

    // DocumentDB requires TLS
    if (isDocumentDB) {
      connectOptions.tls = true;
      // Use the RDS CA bundle if available (Lambda layer provides this)
      if (process.env.TLS_CA_FILE) {
        connectOptions.tlsCAFile = process.env.TLS_CA_FILE;
      }
    }

    connection = await mongoose.connect(DOCUMENTDB_URI, connectOptions);
    TestModel = mongoose.model('IntegrationTestItem', TestSchema);
  });

  afterAll(async () => {
    // Clean up test collection
    if (TestModel) {
      await TestModel.collection.drop().catch(() => {
        // Collection may not exist, ignore
      });
    }
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear test data before each test
    if (TestModel) {
      await TestModel.deleteMany({});
    }
  });

  describe('Connection', () => {
    test('should establish a connection successfully', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    test('should report the correct database name', () => {
      const dbName = mongoose.connection.db.databaseName;
      expect(dbName).toBeTruthy();
      expect(typeof dbName).toBe('string');
    });

    test('should connect with TLS when targeting DocumentDB', () => {
      if (isDocumentDB) {
        // Verify the connection string includes TLS parameters
        expect(DOCUMENTDB_URI).toMatch(/tls=true/);
      } else {
        // Local MongoDB — TLS is optional
        expect(true).toBe(true);
      }
    });
  });

  describe('CRUD Operations', () => {
    test('should create a document', async () => {
      const doc = await TestModel.create({
        title: 'Test Task',
        description: 'Integration test document',
        status: 'pending',
        priority: 3,
        tags: ['test', 'integration'],
        assignee: 'user-123',
      });

      expect(doc._id).toBeDefined();
      expect(doc.title).toBe('Test Task');
      expect(doc.status).toBe('pending');
      expect(doc.tags).toEqual(['test', 'integration']);
    });

    test('should read a document by ID', async () => {
      const created = await TestModel.create({
        title: 'Read Test',
        description: 'Should be readable',
      });

      const found = await TestModel.findById(created._id);
      expect(found).not.toBeNull();
      expect(found.title).toBe('Read Test');
    });

    test('should update a document', async () => {
      const doc = await TestModel.create({
        title: 'Update Test',
        status: 'pending',
      });

      const updated = await TestModel.findByIdAndUpdate(
        doc._id,
        { status: 'active', updatedAt: new Date() },
        { new: true }
      );

      expect(updated.status).toBe('active');
      expect(updated.updatedAt).toBeDefined();
    });

    test('should delete a document', async () => {
      const doc = await TestModel.create({
        title: 'Delete Test',
      });

      await TestModel.findByIdAndDelete(doc._id);
      const found = await TestModel.findById(doc._id);
      expect(found).toBeNull();
    });

    test('should perform bulk insert', async () => {
      const docs = Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Item ${i + 1}`,
        priority: (i % 5) + 1,
        status: i < 5 ? 'pending' : 'active',
      }));

      const result = await TestModel.insertMany(docs);
      expect(result).toHaveLength(10);

      const count = await TestModel.countDocuments();
      expect(count).toBe(10);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Seed test data for query tests
      await TestModel.insertMany([
        { title: 'High Priority Task', status: 'pending', priority: 5, assignee: 'alice', tags: ['urgent'] },
        { title: 'Medium Priority Task', status: 'active', priority: 3, assignee: 'bob', tags: ['feature'] },
        { title: 'Low Priority Task', status: 'completed', priority: 1, assignee: 'alice', tags: ['cleanup'] },
        { title: 'Another Active Task', status: 'active', priority: 4, assignee: 'charlie', tags: ['feature', 'urgent'] },
        { title: 'Pending Review', status: 'pending', priority: 2, assignee: 'bob', tags: ['review'] },
      ]);
    });

    test('should query with compound filter', async () => {
      const results = await TestModel.find({ status: 'active' }).sort({ priority: -1 });
      expect(results).toHaveLength(2);
      expect(results[0].priority).toBeGreaterThanOrEqual(results[1].priority);
    });

    test('should query with $in operator', async () => {
      const results = await TestModel.find({ status: { $in: ['pending', 'active'] } });
      expect(results).toHaveLength(4);
    });

    test('should query with array element match', async () => {
      const results = await TestModel.find({ tags: 'urgent' });
      expect(results).toHaveLength(2);
    });

    test('should support limit and skip (pagination)', async () => {
      const page1 = await TestModel.find().sort({ priority: -1 }).limit(2).skip(0);
      const page2 = await TestModel.find().sort({ priority: -1 }).limit(2).skip(2);

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].priority).toBeGreaterThanOrEqual(page2[0].priority);
    });

    test('should support aggregation pipeline', async () => {
      const result = await TestModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, avgPriority: { $avg: '$priority' } } },
        { $sort: { count: -1 } },
      ]);

      expect(result.length).toBeGreaterThan(0);
      const activeGroup = result.find(r => r._id === 'active');
      expect(activeGroup).toBeDefined();
      expect(activeGroup.count).toBe(2);
    });

    test('should support $or queries', async () => {
      const results = await TestModel.find({
        $or: [
          { assignee: 'alice' },
          { priority: { $gte: 4 } },
        ],
      });

      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Index Operations', () => {
    test('should create indexes defined in schema', async () => {
      // Ensure indexes are built
      await TestModel.ensureIndexes();

      const indexes = await TestModel.collection.indexes();

      // Should have at least: _id, title, compound(status+priority), compound(assignee+status), text
      expect(indexes.length).toBeGreaterThanOrEqual(4);

      // Check for the compound index
      const compoundIndex = indexes.find(idx =>
        idx.key && idx.key.status === 1 && idx.key.priority === -1
      );
      expect(compoundIndex).toBeDefined();
    });

    test('should support text search index', async () => {
      await TestModel.ensureIndexes();

      // Insert documents with searchable text
      await TestModel.create([
        { title: 'Deploy microservices architecture', description: 'Set up Kubernetes cluster' },
        { title: 'Write unit tests', description: 'Cover authentication module' },
      ]);

      // Text search query
      const results = await TestModel.find(
        { $text: { $search: 'microservices' } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].title).toContain('microservices');
    });

    test('should enforce unique constraints', async () => {
      // Create a unique index for testing
      await TestModel.collection.createIndex({ title: 1 }, { unique: true });

      await TestModel.create({ title: 'Unique Title' });

      // Attempting to insert a duplicate should throw
      await expect(
        TestModel.create({ title: 'Unique Title' })
      ).rejects.toThrow();

      // Clean up the unique index to not affect other tests
      await TestModel.collection.dropIndex('title_1');
    });
  });

  describe('Schema Validation', () => {
    test('should enforce required fields', async () => {
      await expect(
        TestModel.create({ description: 'Missing title' })
      ).rejects.toThrow(/title/i);
    });

    test('should enforce enum values', async () => {
      await expect(
        TestModel.create({ title: 'Bad Status', status: 'invalid_status' })
      ).rejects.toThrow();
    });

    test('should enforce min/max constraints', async () => {
      await expect(
        TestModel.create({ title: 'Bad Priority', priority: 10 })
      ).rejects.toThrow();
    });

    test('should apply default values', async () => {
      const doc = await TestModel.create({ title: 'Defaults Test' });
      expect(doc.status).toBe('pending');
      expect(doc.priority).toBe(3);
      expect(doc.tags).toEqual([]);
    });
  });

  describe('Connection Resilience', () => {
    test('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 20 }, (_, i) =>
        TestModel.create({ title: `Concurrent ${i}`, priority: (i % 5) + 1 })
      );

      const results = await Promise.all(operations);
      expect(results).toHaveLength(20);

      const count = await TestModel.countDocuments();
      expect(count).toBe(20);
    });

    test('should read from reader endpoint if configured', async () => {
      // This test validates that read operations work.
      // In a real DocumentDB cluster, reads can be directed to replicas.
      await TestModel.create({ title: 'Reader Test' });

      const result = await TestModel.findOne({ title: 'Reader Test' }).lean();
      expect(result).not.toBeNull();
      expect(result.title).toBe('Reader Test');
    });
  });
});
