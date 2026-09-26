/**
 * Global test environment bootstrap.
 *
 * Runs via Jest `setupFiles` (before the test framework and before any module
 * under test is imported). Its job is to guarantee that importing `server.js`
 * during tests never triggers the production env-validation `process.exit(1)`
 * guard, which would otherwise crash the Jest worker.
 *
 * These are non-secret, test-only placeholder values. Real credentials are
 * never used or required by the test suite.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '5000';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-at-least-32-characters-long';
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || 'test-session-secret-key-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Cloudinary placeholders — required by envValidation. Individual tests that
// exercise the "not configured" path override these explicitly.
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-secret';
