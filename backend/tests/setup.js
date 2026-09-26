const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Increase timeout for database operations
jest.setTimeout(30000);

// Setup in-memory MongoDB for testing
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up database between tests
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Close database connection after tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.createTestUser = () => ({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'user'
});

global.createTestTeam = () => ({
  name: 'Test Team',
  description: 'A test team',
  members: []
});

global.createTestProject = () => ({
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  members: []
});

global.createTestTask = () => ({
  title: 'Test Task',
  description: 'A test task',
  status: 'pending',
  priority: 'medium',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
});