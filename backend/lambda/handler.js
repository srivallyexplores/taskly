import serverlessExpress from '@vendia/serverless-express';
import mongoose from 'mongoose';
import app from '../server.js';
import secrets from '../utils/secrets.js';

const { getDocumentDBUri, withRotationRetry } = secrets;

/**
 * Lambda Handler — wraps the Express app using @vendia/serverless-express.
 *
 * Translates API Gateway HTTP API (v2) events into Express req/res objects,
 * invokes the Express router, and returns the response in API Gateway format.
 *
 * Key behaviors:
 * - Reuses DocumentDB connections across warm Lambda invocations (connection pooling)
 * - Injects Lambda requestId as a correlation ID for structured logging
 * - Handles graceful connection management to avoid connection leaks
 *
 * 
 * - 1.1: API_Gateway routes requests to Lambda within 100ms gateway processing
 * - 1.2: Lambda executes all existing Taskly API routes with functional parity
 * - 1.7: Unhandled exceptions return structured error with correlation ID
 */

// Cached DocumentDB connection — persists across warm invocations
let isDbConnected = false;

/**
 * Establishes or reuses a DocumentDB connection.
 * Uses connection caching to avoid reconnecting on every warm invocation.
 */
async function ensureDatabaseConnection() {
  if (isDbConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const secretName = process.env.DOCUMENTDB_SECRET_NAME || 'taskly/production/documentdb-credentials';

  await withRotationRetry(async () => {
    const uri = await getDocumentDBUri();

    await mongoose.connect(uri, {
      maxPoolSize: 2,               // Low pool size for Lambda concurrency model
      minPoolSize: 1,               // Keep at least one connection ready
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: false,           // DocumentDB limitation
      // TLS is configured in the connection URI from Secrets Manager
    });

    isDbConnected = true;
  }, secretName);
}

// Handle mongoose connection events for observability
mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('[Lambda] DocumentDB connection lost');
});

mongoose.connection.on('error', (err) => {
  isDbConnected = false;
  console.error('[Lambda] DocumentDB connection error:', err.message);
});

/**
 * Create the serverless-express handler instance.
 * This translates API Gateway HTTP API v2 events to Express requests.
 */
const serverlessExpressInstance = serverlessExpress({ app });

/**
 * Lambda entry point.
 *
 * @param {object} event - API Gateway HTTP API v2 event
 * @param {object} context - Lambda context (includes requestId, functionName, etc.)
 * @returns {object} API Gateway-compatible response
 */
export async function handler(event, context) {
  // Prevent Lambda from waiting for the event loop to drain.
  // This keeps the DB connection alive for the next warm invocation.
  context.callbackWaitsForEmptyEventLoop = false;

  // Inject correlation ID from Lambda context into the request headers
  // so downstream middleware/logging can reference it.
  const requestId = context.awsRequestId;
  if (!event.headers) {
    event.headers = {};
  }
  event.headers['x-correlation-id'] = requestId;
  event.headers['x-lambda-request-id'] = requestId;

  try {
    // Ensure DB is connected before handling the request
    await ensureDatabaseConnection();
  } catch (dbError) {
    console.error('[Lambda] Failed to connect to DocumentDB:', {
      error: dbError.message,
      requestId,
      functionName: context.functionName,
    });

    // Return a structured 503 response if DB is unavailable
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': requestId,
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Service temporarily unavailable',
          code: 'DATABASE_UNAVAILABLE',
          correlationId: requestId,
        },
      }),
    };
  }

  // Delegate to serverless-express which handles event translation
  return serverlessExpressInstance(event, context);
}

export default handler;
